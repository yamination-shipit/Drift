import type { FocusBand, Scene } from '../../domain/scenes';
import { SceneCard } from '../molecules/SceneCard';

type SoundGridProps = Readonly<{
  scenes: readonly Scene[];
  activeIds: readonly string[];
  volumes: Readonly<Record<string, number>>;
  focusBeatHz: number;
  focusBands: readonly FocusBand[];
  onToggle(id: string): void;
  onVolume(id: string, volume: number): void;
  onFocusBeat(hz: number): void;
  onAddSound(): void;
}>;

export function SoundGrid({
  scenes,
  activeIds,
  volumes,
  focusBeatHz,
  focusBands,
  onToggle,
  onVolume,
  onFocusBeat,
  onAddSound,
}: SoundGridProps) {
  return (
    <div className="scenes">
      {scenes.map((scene) => (
        <SceneCard
          key={scene.id}
          scene={scene}
          active={activeIds.includes(scene.id)}
          volume={volumes[scene.id] ?? 0.7}
          focusBeatHz={focusBeatHz}
          focusBands={focusBands}
          onToggle={() => onToggle(scene.id)}
          onVolume={(volume) => onVolume(scene.id, volume)}
          onFocusBeat={onFocusBeat}
        />
      ))}
      <button className="scene-card add-sound" onClick={onAddSound}>
        <span className="scene-icon">＋</span>
        <div className="scene-name">Your Sound</div>
      </button>
    </div>
  );
}
