import type { SavedMix } from '../../domain/mixes';

type MixListProps = Readonly<{
  mixes: readonly SavedMix[];
  onLoad(mix: SavedMix): void;
  onDelete(index: number): void;
}>;

export function MixList({ mixes, onLoad, onDelete }: MixListProps) {
  if (mixes.length === 0) {
    return (
      <div className="mix-empty">No saved mixes yet - turn on a sound (or a few) and save it.</div>
    );
  }

  return (
    <div className="mix-list">
      {mixes.map((mix, index) => (
        <div className="mix-chip" key={`${mix.createdAt}-${mix.name}`}>
          <button className="load" onClick={() => onLoad(mix)}>
            {mix.name}
          </button>
          <button className="del" aria-label="Delete" onClick={() => onDelete(index)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
