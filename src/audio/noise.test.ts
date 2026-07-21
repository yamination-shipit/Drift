import { describe, expect, it } from 'vitest';
import { fillNoise, type NoiseType } from './noise';

const seededRandom = (initial: number): (() => number) => {
  let seed = initial;
  return () => (seed = (Math.imul(seed, 1_664_525) + 1_013_904_223) >>> 0) / 2 ** 32;
};

const samples = (type: NoiseType, seed: number): Float32Array => {
  const data = new Float32Array(48_000);
  fillNoise(data, type, seededRandom(seed));
  return data;
};

const correlation = (left: Float32Array, right: Float32Array): number => {
  const leftMean = left.reduce((sum, value) => sum + value, 0) / left.length;
  const rightMean = right.reduce((sum, value) => sum + value, 0) / right.length;
  let product = 0;
  let leftSquare = 0;
  let rightSquare = 0;
  for (let i = 0; i < left.length; i += 1) {
    const a = left[i]! - leftMean;
    const b = right[i]! - rightMean;
    product += a * b;
    leftSquare += a * a;
    rightSquare += b * b;
  }
  return product / Math.sqrt(leftSquare * rightSquare);
};

describe('noise generation', () => {
  it.each<NoiseType>(['white', 'pink', 'brown'])('produces valid audible %s noise', (type) => {
    const data = samples(type, 1);
    const peak = data.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
    const rms = Math.sqrt(data.reduce((sum, value) => sum + value * value, 0) / data.length);

    expect(data.every(Number.isFinite)).toBe(true);
    expect(peak).toBeLessThanOrEqual(1);
    expect(rms).toBeGreaterThan(0.01);
  });

  it.each<NoiseType>(['white', 'pink', 'brown'])('decorrelates independent %s tracks', (type) => {
    expect(Math.abs(correlation(samples(type, 1), samples(type, 2)))).toBeLessThan(0.1);
  });
});
