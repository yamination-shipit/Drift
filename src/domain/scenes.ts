export type BaseSceneId = 'ocean' | 'rain' | 'forest' | 'cafe' | 'fire' | 'fan' | 'focus';
export type SceneId = BaseSceneId | `custom-${number}`;

export type Scene = Readonly<{
  id: SceneId;
  name: string;
  icon: string;
  color: `#${string}`;
  type?: 'focus';
  sub?: string;
}>;

export type FocusBand = Readonly<{
  hz: number;
  label: string;
}>;

export const BASE_SCENES = Object.freeze([
  { id: 'ocean', name: 'Ocean Waves', icon: '🌊', color: '#4FA8C9' },
  { id: 'rain', name: 'Rainfall', icon: '🌧️', color: '#6C93B3' },
  { id: 'forest', name: 'Forest', icon: '🌲', color: '#6FA37A' },
  { id: 'cafe', name: 'Coffee Shop', icon: '☕', color: '#C9975B' },
  { id: 'fire', name: 'Fireplace', icon: '🔥', color: '#D97757' },
  { id: 'fan', name: 'White Noise', icon: '🌀', color: '#9AA5B1' },
  {
    id: 'focus',
    name: 'Focus Tone',
    icon: '🎧',
    color: '#9B8AC4',
    type: 'focus',
    sub: 'binaural · headphones',
  },
] as const satisfies readonly Scene[]);

export const FOCUS_BANDS = Object.freeze([
  { hz: 2, label: 'Delta · 2Hz (deep rest)' },
  { hz: 6, label: 'Theta · 6Hz (relax)' },
  { hz: 10, label: 'Alpha · 10Hz (calm focus)' },
  { hz: 18, label: 'Beta · 18Hz (alertness)' },
] as const satisfies readonly FocusBand[]);

export const defaultVolumes = (): Readonly<Record<SceneId, number>> =>
  Object.freeze(
    Object.fromEntries(BASE_SCENES.map((scene) => [scene.id, 0.7])) as Record<SceneId, number>,
  );

export const averageSceneColor = (scenes: readonly Pick<Scene, 'color'>[]): string => {
  if (scenes.length === 0) return '#4FA8C9';

  const totals = scenes.reduce(
    (acc, scene) => {
      const n = Number.parseInt(scene.color.slice(1), 16);
      return {
        r: acc.r + ((n >> 16) & 255),
        g: acc.g + ((n >> 8) & 255),
        b: acc.b + (n & 255),
      };
    },
    { r: 0, g: 0, b: 0 },
  );

  return `rgb(${Math.round(totals.r / scenes.length)},${Math.round(
    totals.g / scenes.length,
  )},${Math.round(totals.b / scenes.length)})`;
};
