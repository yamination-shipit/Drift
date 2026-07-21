import { describe, expect, it } from 'vitest';
import { BASE_SCENES } from '../domain/scenes';
import { DriftAudioEngine } from './DriftAudioEngine';

describe('DriftAudioEngine', () => {
  it('produces output for every scene and for the layered mix', async () => {
    const engine = new DriftAudioEngine();

    for (const scene of BASE_SCENES) {
      engine.toggleScene(scene.id, 0.7);
      engine.setPlaying(true, 0.8);
      await expect
        .poll(() => engine.amplitudeScale(), { interval: 50, timeout: 2_000 })
        .toBeGreaterThan(1.001);
      engine.toggleScene(scene.id, 0.7);
      await new Promise((resolve) => window.setTimeout(resolve, 500));
    }

    BASE_SCENES.forEach((scene) => engine.toggleScene(scene.id, 0.7));
    await expect
      .poll(() => engine.amplitudeScale(), { interval: 50, timeout: 2_000 })
      .toBeGreaterThan(1.001);
    engine.stopAllScenes();
  }, 15_000);

  it('plays a custom audio buffer', async () => {
    const sourceContext = new AudioContext();
    const buffer = sourceContext.createBuffer(
      1,
      sourceContext.sampleRate,
      sourceContext.sampleRate,
    );
    const data = buffer.getChannelData(0);
    data.forEach((_, index) => {
      data[index] = Math.sin((index / sourceContext.sampleRate) * Math.PI * 2 * 440) * 0.2;
    });

    const engine = new DriftAudioEngine();
    engine.addBufferScene('custom-test', buffer);
    engine.toggleScene('custom-test', 0.7);
    engine.setPlaying(true, 0.8);
    await expect
      .poll(() => engine.amplitudeScale(), { interval: 50, timeout: 2_000 })
      .toBeGreaterThan(1.001);
    engine.stopAllScenes();
    await sourceContext.close();
  });
});
