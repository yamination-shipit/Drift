import type { SceneId } from '../domain/scenes';

type AudioContextCtor = typeof AudioContext;

declare global {
  interface Window {
    webkitAudioContext?: AudioContextCtor;
  }
}

type Handle = {
  stop(): void;
  setBeat?(hz: number): void;
};

type ActiveScene = {
  sceneGain: GainNode;
  handle: Handle;
};

export class DriftAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private analyserData: Uint8Array<ArrayBuffer> | null = null;
  private readonly active: Partial<Record<string, ActiveScene>> = {};
  private focusBeatHz = 6;

  ensureCtx(): void {
    if (!this.ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0;
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyserData = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  toggleScene(id: string, volume: number): readonly string[] {
    this.ensureCtx();
    if (this.active[id]) {
      this.stopScene(id);
      return this.activeIds();
    }

    const builder = this.builders[id as SceneId];
    if (!builder || !this.ctx || !this.masterGain) return this.activeIds();

    const sceneGain = this.ctx.createGain();
    sceneGain.gain.value = 0;
    sceneGain.connect(this.masterGain);
    const handle = builder(sceneGain);
    sceneGain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.8);
    this.active[id] = { sceneGain, handle };

    return this.activeIds();
  }

  setSceneVolume(id: string, volume: number): void {
    if (!this.ctx || !this.active[id]) return;
    this.active[id].sceneGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.05);
  }

  setFocusBeat(hz: number): void {
    this.focusBeatHz = hz;
    this.active.focus?.handle.setBeat?.(hz);
  }

  addBufferScene(id: string, buffer: AudioBuffer): void {
    this.builders[id] = (out) => {
      const src = this.ctx!.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      src.connect(out);
      src.start();
      return { stop: () => this.tryStop(src) };
    };
  }

  async decodeAudioData(file: File): Promise<AudioBuffer> {
    this.ensureCtx();
    return this.ctx!.decodeAudioData(await file.arrayBuffer());
  }

  setPlaying(playing: boolean, masterTarget: number): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(playing ? masterTarget : 0, now + 0.6);
  }

  stopAllScenes(): void {
    this.activeIds().forEach((id) => this.stopScene(id));
  }

  playChime(): void {
    this.ensureCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 987.77].forEach((f, i) => {
      const t = now + i * 0.9;
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(t);
      osc.stop(t + 1.5);
    });
  }

  amplitudeScale(): number {
    if (!this.analyser || !this.analyserData) return 1;
    this.analyser.getByteFrequencyData(this.analyserData);
    const avg =
      this.analyserData.reduce((sum, value) => sum + value, 0) / this.analyserData.length / 255;
    return 1 + Math.min(avg * 0.9, 0.35);
  }

  activeIds(): readonly string[] {
    return Object.keys(this.active);
  }

  private stopScene(id: string): void {
    if (!this.ctx || !this.active[id]) return;
    const { sceneGain, handle } = this.active[id];
    const now = this.ctx.currentTime;
    sceneGain.gain.cancelScheduledValues(now);
    sceneGain.gain.setValueAtTime(sceneGain.gain.value, now);
    sceneGain.gain.linearRampToValueAtTime(0, now + 0.4);
    window.setTimeout(() => {
      handle.stop();
      sceneGain.disconnect();
    }, 450);
    delete this.active[id];
  }

  private createNoiseBuffer(seconds: number, type: 'white' | 'pink' | 'brown'): AudioBuffer {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
    } else if (type === 'pink') {
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      let b3 = 0;
      let b4 = 0;
      let b5 = 0;
      let b6 = 0;
      for (let i = 0; i < len; i += 1) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856;
        b4 = 0.55 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.016898;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      }
    } else {
      let last = 0;
      for (let i = 0; i < len; i += 1) {
        const w = Math.random() * 2 - 1;
        const sample = ((last + 0.02 * w) / 1.02) * 3.5;
        data[i] = sample;
        last = sample;
      }
    }
    return buffer;
  }

  private noiseSource(type: 'white' | 'pink' | 'brown'): AudioBufferSourceNode {
    const src = this.ctx!.createBufferSource();
    src.buffer = this.createNoiseBuffer(4, type);
    src.loop = true;
    return src;
  }

  private playPercussive(
    dest: AudioNode,
    opts: Partial<Record<'freqMin' | 'freqMax' | 'q' | 'peak' | 'dur', number>>,
  ): void {
    const o = { freqMin: 1500, freqMax: 4000, q: 8, peak: 0.25, dur: 0.15, ...opts };
    const now = this.ctx!.currentTime;
    const src = this.ctx!.createBufferSource();
    src.buffer = this.createNoiseBuffer(o.dur, 'white');
    const bp = this.ctx!.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = o.freqMin + Math.random() * (o.freqMax - o.freqMin);
    bp.Q.value = o.q;
    const gain = this.ctx!.createGain();
    gain.gain.setValueAtTime(o.peak, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + o.dur);
    src.connect(bp);
    bp.connect(gain);
    gain.connect(dest);
    src.start(now);
    src.stop(now + o.dur + 0.02);
  }

  private playChirp(dest: AudioNode): void {
    const now = this.ctx!.currentTime;
    const osc = this.ctx!.createOscillator();
    osc.type = 'sine';
    const f0 = 2000 + Math.random() * 1500;
    osc.frequency.setValueAtTime(f0, now);
    osc.frequency.exponentialRampToValueAtTime(f0 * 1.4, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(f0 * 0.8, now + 0.18);
    const gain = this.ctx!.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  private timedLoop(stepFn: () => number, firstDelayMs: number): Handle {
    let stopped = false;
    let handle = 0;
    const scheduleNext = (delayMs: number) => {
      handle = window.setTimeout(() => {
        if (stopped) return;
        scheduleNext(stepFn());
      }, delayMs);
    };
    scheduleNext(firstDelayMs);
    return {
      stop() {
        stopped = true;
        window.clearTimeout(handle);
      },
    };
  }

  private readonly builders: Record<string, (out: AudioNode) => Handle> = {
    ocean: (out) => {
      const src = this.noiseSource('brown');
      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 700;
      filter.Q.value = 0.7;
      const gain = this.ctx!.createGain();
      gain.gain.value = 0;
      const lfo1 = this.ctx!.createOscillator();
      lfo1.frequency.value = 0.08;
      const lfo1Gain = this.ctx!.createGain();
      lfo1Gain.gain.value = 350;
      lfo1.connect(lfo1Gain).connect(filter.frequency);
      const lfo2 = this.ctx!.createOscillator();
      lfo2.frequency.value = 0.06;
      const lfo2Gain = this.ctx!.createGain();
      lfo2Gain.gain.value = 0.28;
      const base = this.ctx!.createConstantSource();
      base.offset.value = 0.6;
      lfo2.connect(lfo2Gain).connect(gain.gain);
      base.connect(gain.gain);
      src.connect(filter).connect(gain).connect(out);
      [src, lfo1, lfo2, base].forEach((node) => node.start());
      return { stop: () => [src, lfo1, lfo2, base].forEach((node) => this.tryStop(node)) };
    },
    rain: (out) => {
      const src = this.noiseSource('white');
      const hp = this.ctx!.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 1100;
      const peak = this.ctx!.createBiquadFilter();
      peak.type = 'peaking';
      peak.frequency.value = 4500;
      peak.Q.value = 0.9;
      peak.gain.value = 6;
      const gain = this.ctx!.createGain();
      gain.gain.value = 0.35;
      src.connect(hp).connect(peak).connect(gain).connect(out);
      src.start();
      const loop = this.timedLoop(() => {
        this.playPercussive(out, { freqMin: 1800, freqMax: 3500, q: 12, peak: 0.1, dur: 0.1 });
        return 400 + Math.random() * 1400;
      }, 500);
      return { stop: () => (this.tryStop(src), loop.stop()) };
    },
    forest: (out) => {
      const src = this.noiseSource('pink');
      const lp = this.ctx!.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1800;
      const gain = this.ctx!.createGain();
      gain.gain.value = 0.22;
      src.connect(lp).connect(gain).connect(out);
      src.start();
      const loop = this.timedLoop(() => {
        this.playChirp(out);
        if (Math.random() < 0.4)
          window.setTimeout(() => this.playChirp(out), 150 + Math.random() * 250);
        return 3500 + Math.random() * 8500;
      }, 2500);
      return { stop: () => (this.tryStop(src), loop.stop()) };
    },
    cafe: (out) => {
      const src = this.noiseSource('pink');
      const bp = this.ctx!.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 900;
      bp.Q.value = 0.5;
      const gain = this.ctx!.createGain();
      gain.gain.value = 0.3;
      src.connect(bp).connect(gain).connect(out);
      src.start();
      const loop = this.timedLoop(() => {
        this.playPercussive(out, { freqMin: 2500, freqMax: 6000, q: 10, peak: 0.16, dur: 0.12 });
        return 1500 + Math.random() * 4000;
      }, 1200);
      return { stop: () => (this.tryStop(src), loop.stop()) };
    },
    fire: (out) => {
      const src = this.noiseSource('brown');
      const lp = this.ctx!.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 400;
      const gain = this.ctx!.createGain();
      gain.gain.value = 0.35;
      src.connect(lp).connect(gain).connect(out);
      src.start();
      const loop = this.timedLoop(() => {
        this.playPercussive(out, { freqMin: 600, freqMax: 3200, q: 9, peak: 0.2, dur: 0.07 });
        return 150 + Math.random() * 500;
      }, 300);
      return { stop: () => (this.tryStop(src), loop.stop()) };
    },
    fan: (out) => {
      const src = this.noiseSource('white');
      const lp = this.ctx!.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 3500;
      const gain = this.ctx!.createGain();
      gain.gain.value = 0;
      const lfo = this.ctx!.createOscillator();
      lfo.frequency.value = 3.2;
      const lfoGain = this.ctx!.createGain();
      lfoGain.gain.value = 0.03;
      const base = this.ctx!.createConstantSource();
      base.offset.value = 0.22;
      lfo.connect(lfoGain).connect(gain.gain);
      base.connect(gain.gain);
      src.connect(lp).connect(gain).connect(out);
      [src, lfo, base].forEach((node) => node.start());
      return { stop: () => [src, lfo, base].forEach((node) => this.tryStop(node)) };
    },
    focus: (out) => {
      const carrier = 200;
      const oscL = this.ctx!.createOscillator();
      oscL.type = 'sine';
      oscL.frequency.value = carrier;
      const oscR = this.ctx!.createOscillator();
      oscR.type = 'sine';
      oscR.frequency.value = carrier + this.focusBeatHz;
      const panL = this.ctx!.createStereoPanner();
      panL.pan.value = -1;
      const panR = this.ctx!.createStereoPanner();
      panR.pan.value = 1;
      const gL = this.ctx!.createGain();
      gL.gain.value = 0.18;
      const gR = this.ctx!.createGain();
      gR.gain.value = 0.18;
      oscL.connect(gL).connect(panL).connect(out);
      oscR.connect(gR).connect(panR).connect(out);
      oscL.start();
      oscR.start();
      return {
        stop: () => {
          this.tryStop(oscL);
          this.tryStop(oscR);
        },
        setBeat: (hz) => oscR.frequency.setTargetAtTime(carrier + hz, this.ctx!.currentTime, 0.3),
      };
    },
  };

  private tryStop(node: AudioScheduledSourceNode): void {
    try {
      node.stop();
    } catch {
      // Already stopped.
    }
  }
}
