import { describe, expect, it } from 'vitest';
import { parseSavedMixes } from './mixes';
import { BASE_SCENES, averageSceneColor } from './scenes';
import { durationUntilTime, formatCountdown } from './timer';

describe('core domain', () => {
  it('keeps scene ids unique', () => {
    // Arrange
    const ids = BASE_SCENES.map((scene) => scene.id);

    // Act
    const uniqueIds = new Set(ids);

    // Assert
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('averages active scene colors', () => {
    // Arrange
    const scenes = [{ color: '#000000' as const }, { color: '#FFFFFF' as const }];

    // Act
    const color = averageSceneColor(scenes);

    // Assert
    expect(color).toBe('rgb(128,128,128)');
  });

  it('rejects malformed saved mixes at the storage boundary', () => {
    // Arrange
    const stored = JSON.stringify([{ name: 'bad', scenes: { rain: 2 }, masterVol: 0.5 }]);

    // Act
    const mixes = parseSavedMixes(stored);

    // Assert
    expect(mixes).toEqual([]);
  });

  it('parses valid saved mixes', () => {
    // Arrange
    const stored = JSON.stringify([
      { name: 'Rain', scenes: { rain: 0.6 }, masterVol: 0.5, createdAt: 1 },
    ]);

    // Act
    const mixes = parseSavedMixes(stored);

    // Assert
    expect(mixes).toEqual([{ name: 'Rain', scenes: { rain: 0.6 }, masterVol: 0.5, createdAt: 1 }]);
  });

  it('rolls until-time timers into tomorrow when the time has passed today', () => {
    // Arrange
    const now = new Date('2026-07-20T23:30:00.000Z');

    // Act
    const duration = durationUntilTime(now, '23:00');

    // Assert
    expect(duration).toBe(23.5 * 60 * 60 * 1000);
  });

  it('formats countdown values', () => {
    // Arrange
    const oneHourOneMinuteFiveSeconds = 3_665_000;

    // Act
    const formatted = formatCountdown(oneHourOneMinuteFiveSeconds);

    // Assert
    expect(formatted).toBe('1:01:05');
  });
});
