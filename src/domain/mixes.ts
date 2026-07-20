export type SavedMix = Readonly<{
  name: string;
  scenes: Readonly<Record<string, number>>;
  masterVol: number;
  createdAt: number;
}>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isVolume = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;

export const parseSavedMixes = (value: string | null): readonly SavedMix[] => {
  if (!value) return [];

  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed)) return [];

  return parsed.flatMap((item): SavedMix[] => {
    if (!isRecord(item) || typeof item.name !== 'string' || !isRecord(item.scenes)) return [];

    const scenes = Object.fromEntries(
      Object.entries(item.scenes).filter((entry): entry is [string, number] => isVolume(entry[1])),
    );

    if (Object.keys(scenes).length === 0) return [];

    return [
      Object.freeze({
        name: item.name.trim().slice(0, 30) || 'Untitled mix',
        scenes: Object.freeze(scenes),
        masterVol: isVolume(item.masterVol) ? item.masterVol : 0.8,
        createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
      }),
    ];
  });
};

export const serializeSavedMixes = (mixes: readonly SavedMix[]): string => JSON.stringify(mixes);
