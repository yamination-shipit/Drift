import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { DriftAudioEngine } from '../../audio/DriftAudioEngine';
import { parseSavedMixes, serializeSavedMixes, type SavedMix } from '../../domain/mixes';
import {
  averageSceneColor,
  BASE_SCENES,
  defaultVolumes,
  FOCUS_BANDS,
  type Scene,
} from '../../domain/scenes';
import { durationUntilTime, formatCountdown } from '../../domain/timer';
import { localStoragePort } from '../../platform/storage';
import { PillButton } from '../atoms/PillButton';
import { MixList } from '../organisms/MixList';
import { SoundGrid } from '../organisms/SoundGrid';

const MIX_KEY = 'drift-mixes';
const PRESETS = [15, 30, 45, 60, 90, 120] as const;

export function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const [engine] = useState(() => new DriftAudioEngine());
  const [customScenes, setCustomScenes] = useState<readonly Scene[]>([]);
  const [activeIds, setActiveIds] = useState<readonly string[]>([]);
  const [volumes, setVolumes] = useState<Readonly<Record<string, number>>>(defaultVolumes);
  const [masterTarget, setMasterTarget] = useState(0.8);
  const [playing, setPlayingState] = useState(false);
  const [focusBeatHz, setFocusBeatHz] = useState(6);
  const [savedMixes, setSavedMixes] = useState<readonly SavedMix[]>([]);
  const [mixName, setMixName] = useState('');
  const [status, setStatus] = useState('');
  const [deadline, setDeadline] = useState<number | null>(null);
  const [countdown, setCountdown] = useState('0:00');
  const [fadeStarted, setFadeStarted] = useState(false);
  const [wakeChime, setWakeChime] = useState(false);
  const [selectedTimer, setSelectedTimer] = useState<string | null>(null);
  const [orb, setOrb] = useState({ x: 0, y: 0 });

  const scenes = useMemo(
    () => [...BASE_SCENES, ...customScenes] as readonly Scene[],
    [customScenes],
  );
  const activeScenes = scenes.filter((scene) => activeIds.includes(scene.id));
  const accent = averageSceneColor(activeScenes);
  const nowPlaying =
    activeScenes.length === 0
      ? 'Silence - pick a sound below'
      : activeScenes.map((scene) => scene.name).join(' + ');

  const requestWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator)) return;
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
    } catch {
      // Wake Lock is opportunistic; audio still runs without it.
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    void wakeLockRef.current?.release();
    wakeLockRef.current = null;
  }, []);

  const setPlaying = useCallback(
    (value: boolean) => {
      engine.ensureCtx();
      engine.setPlaying(value, masterTarget);
      setPlayingState(value);
      if (value) void requestWakeLock();
      else releaseWakeLock();
    },
    [engine, masterTarget, releaseWakeLock, requestWakeLock],
  );

  useEffect(() => {
    void localStoragePort.get(MIX_KEY).then((value) => setSavedMixes(parseSavedMixes(value)));
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty(
      '--accent-soft',
      accent.replace('rgb', 'rgba').replace(')', ',0.35)'),
    );
  }, [accent]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
    navigator.mediaSession.metadata =
      activeScenes.length > 0 ? new MediaMetadata({ title: nowPlaying, artist: 'Drift' }) : null;
    navigator.mediaSession.setActionHandler('play', () => setPlaying(true));
    navigator.mediaSession.setActionHandler('pause', () => setPlaying(false));
  }, [activeScenes.length, nowPlaying, playing, setPlaying]);

  useEffect(() => {
    let frame = 0;
    const animate = () => {
      frame = window.requestAnimationFrame(animate);
      const scale = playing ? engine.amplitudeScale() : 1;
      document.getElementById('orbCore')?.style.setProperty('--orb-pulse', scale.toFixed(3));
    };
    animate();
    return () => window.cancelAnimationFrame(frame);
  }, [engine, playing]);

  useEffect(() => {
    if (!deadline) return;
    const interval = window.setInterval(() => {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        window.clearInterval(interval);
        setDeadline(null);
        setSelectedTimer(null);
        setPlaying(false);
        window.setTimeout(() => {
          engine.stopAllScenes();
          setActiveIds([]);
          if (wakeChime) engine.playChime();
        }, 650);
        return;
      }
      if (remaining <= 15_000 && !fadeStarted) {
        setFadeStarted(true);
        setPlaying(false);
      }
      setCountdown(formatCountdown(remaining));
    }, 250);
    return () => window.clearInterval(interval);
  }, [deadline, engine, fadeStarted, setPlaying, wakeChime]);

  const toggleScene = (id: string) => {
    const nextIds = engine.toggleScene(id, volumes[id] ?? 0.7);
    setActiveIds(nextIds);
    if (!playing && !activeIds.includes(id)) setPlaying(true);
  };

  const setSceneVolume = (id: string, volume: number) => {
    setVolumes((current) => ({ ...current, [id]: volume }));
    engine.setSceneVolume(id, volume);
  };

  const setOrbPosition = useCallback(
    (x: number, y: number) => {
      const nextX = Math.max(-1, Math.min(1, x));
      const nextY = Math.max(-1, Math.min(1, y));
      const volume = 0.2 + ((1 - nextY) / 2) * 0.8;
      setOrb({ x: nextX, y: nextY });
      setMasterTarget(volume);
      engine.setDetail(nextX);
      if (playing) engine.setPlaying(true, volume);
    },
    [engine, playing],
  );

  const saveMix = () => {
    if (activeIds.length === 0) {
      setStatus('Turn on a sound first, then save it.');
      return;
    }
    const scenesById = Object.fromEntries(activeIds.map((id) => [id, volumes[id] ?? 0.7]));
    const mix = Object.freeze({
      name: (mixName || 'Untitled mix').trim().slice(0, 30),
      scenes: Object.freeze(scenesById),
      masterVol: masterTarget,
      createdAt: Date.now(),
    });
    const next = [...savedMixes, mix];
    setSavedMixes(next);
    setMixName('');
    void localStoragePort.set(MIX_KEY, serializeSavedMixes(next));
  };

  const loadMix = (mix: SavedMix) => {
    engine.stopAllScenes();
    setActiveIds([]);
    setMasterTarget(mix.masterVol);
    setVolumes((current) => ({ ...current, ...mix.scenes }));
    Object.entries(mix.scenes).forEach(([id, volume]) => {
      if (scenes.some((scene) => scene.id === id)) engine.toggleScene(id, volume);
    });
    setActiveIds(engine.activeIds());
    setPlaying(true);
  };

  const deleteMix = (index: number) => {
    const next = savedMixes.filter((_, i) => i !== index);
    setSavedMixes(next);
    void localStoragePort.set(MIX_KEY, serializeSavedMixes(next));
  };

  const addCustomSound = async (file: File | undefined) => {
    if (!file) return;
    setStatus(`Reading ${file.name}...`);
    try {
      const buffer = await engine.decodeAudioData(file);
      const id = `custom-${Date.now()}`;
      const name = file.name.length > 22 ? `${file.name.slice(0, 19)}...` : file.name;
      engine.addBufferScene(id, buffer);
      const scene: Scene = { id: id as `custom-${number}`, name, icon: '📁', color: '#8C8C9A' };
      setCustomScenes((current) => [...current, scene]);
      setVolumes((current) => ({ ...current, [id]: 0.7 }));
      setStatus(`Added "${name}"`);
      setActiveIds(engine.toggleScene(id, 0.7));
      setPlaying(true);
    } catch {
      setStatus("Couldn't read that audio file.");
    }
  };

  const startTimer = (ms: number, selected: string) => {
    setSelectedTimer(selected);
    setDeadline(Date.now() + ms);
    setFadeStarted(false);
  };

  return (
    <main className="app">
      <div className="eyebrow">Soundscapes</div>
      <h1>Drift</h1>
      <p className="subtitle">
        Layer real-world sound. Play on loop, or set it to fade out and stop on its own.
      </p>

      <section className="orb-wrap" aria-live="polite">
        <div
          className="orb-stage orb-control"
          role="slider"
          tabIndex={0}
          aria-label="Soundscape feel: drag up for louder, right for livelier details"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(masterTarget * 100)}
          aria-valuetext={`${Math.round(masterTarget * 100)}% volume, ${orb.x > 0 ? 'lively' : orb.x < 0 ? 'calm' : 'balanced'}`}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            const rect = event.currentTarget.getBoundingClientRect();
            setOrbPosition(
              ((event.clientX - rect.left) / rect.width) * 2 - 1,
              ((event.clientY - rect.top) / rect.height) * 2 - 1,
            );
          }}
          onPointerMove={(event) => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
            const rect = event.currentTarget.getBoundingClientRect();
            setOrbPosition(
              ((event.clientX - rect.left) / rect.width) * 2 - 1,
              ((event.clientY - rect.top) / rect.height) * 2 - 1,
            );
          }}
          onKeyDown={(event) => {
            const step = event.shiftKey ? 0.2 : 0.1;
            if (event.key === 'ArrowLeft') setOrbPosition(orb.x - step, orb.y);
            else if (event.key === 'ArrowRight') setOrbPosition(orb.x + step, orb.y);
            else if (event.key === 'ArrowUp') setOrbPosition(orb.x, orb.y - step);
            else if (event.key === 'ArrowDown') setOrbPosition(orb.x, orb.y + step);
            else return;
            event.preventDefault();
          }}
        >
          <div className="orb-ring r2" />
          <div className="orb-ring r1" />
          <div
            className="orb-core"
            id="orbCore"
            style={{ '--orb-x': `${orb.x * 38}px`, '--orb-y': `${orb.y * 38}px` } as CSSProperties}
          />
        </div>
        <div className="orb-hint">Drag ↑ louder · → livelier</div>
        <div className="now-playing">
          {activeScenes.length === 0 ? (
            nowPlaying
          ) : (
            <>
              Playing <b>{nowPlaying}</b>
            </>
          )}
        </div>
      </section>

      <div className="section-label">Sounds</div>
      <SoundGrid
        scenes={scenes}
        activeIds={activeIds}
        volumes={volumes}
        focusBeatHz={focusBeatHz}
        focusBands={FOCUS_BANDS}
        onToggle={toggleScene}
        onVolume={setSceneVolume}
        onFocusBeat={(hz) => {
          setFocusBeatHz(hz);
          engine.setFocusBeat(hz);
        }}
        onAddSound={() => fileInputRef.current?.click()}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        hidden
        onChange={(event) => void addCustomSound(event.target.files?.[0])}
      />
      <div className="status-text">{status}</div>

      <div className="section-label">Saved Mixes</div>
      <div className="mix-row">
        <input
          value={mixName}
          onChange={(event) => setMixName(event.target.value)}
          placeholder="Name this mix (e.g. Bedtime)"
          maxLength={30}
        />
        <button onClick={saveMix}>Save</button>
      </div>
      <MixList mixes={savedMixes} onLoad={loadMix} onDelete={deleteMix} />

      <hr className="divider" />

      <div className="section-label">Timer</div>
      <div className="timer-presets">
        {PRESETS.map((min) => (
          <PillButton
            key={min}
            selected={selectedTimer === `${min}`}
            onClick={() => startTimer(min * 60_000, `${min}`)}
          >
            {min >= 60 ? `${min / 60}h` : `${min}m`}
          </PillButton>
        ))}
      </div>
      <div className="until-row">
        <span>or play until</span>
        <input id="untilTime" type="time" />
        <PillButton
          selected={selectedTimer === 'until'}
          onClick={() => {
            const value = (document.getElementById('untilTime') as HTMLInputElement | null)?.value;
            if (value) startTimer(durationUntilTime(new Date(), value), 'until');
          }}
        >
          Set
        </PillButton>
      </div>
      <label className="wake-row">
        <input
          checked={wakeChime}
          type="checkbox"
          onChange={(event) => setWakeChime(event.target.checked)}
        />
        End with a gentle chime instead of silence
      </label>
      {deadline ? (
        <div className="timer-status">
          <div>
            <div className="label">Stopping in</div>
            <div className="value">{countdown}</div>
          </div>
          <button className="link-btn" onClick={() => setDeadline(null)}>
            Cancel
          </button>
        </div>
      ) : null}

      <hr className="divider" />

      <div className="master">
        <button
          className="play-btn"
          aria-label="Play or pause"
          onClick={() => setPlaying(!playing)}
        >
          {playing ? '❚❚' : '▶'}
        </button>
        <div className="master-vol">
          <label htmlFor="masterVol">Master Volume</label>
          <input
            id="masterVol"
            type="range"
            min={0}
            max={100}
            value={Math.round(masterTarget * 100)}
            onChange={(event) => {
              const value = Number(event.target.value) / 100;
              setMasterTarget(value);
              if (playing) engine.setPlaying(true, value);
            }}
          />
        </div>
        <button
          className="stop-all"
          onClick={() => {
            engine.stopAllScenes();
            setActiveIds([]);
            setPlaying(false);
          }}
        >
          Stop&nbsp;all
        </button>
      </div>

      <div className="build-stamp">Drift · build v1.3-react</div>
    </main>
  );
}
