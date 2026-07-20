import type { FocusBand, Scene } from '../../domain/scenes';
import type { CSSProperties } from 'react';

type SceneCardProps = Readonly<{
  scene: Scene;
  active: boolean;
  volume: number;
  focusBeatHz: number;
  focusBands: readonly FocusBand[];
  onToggle(): void;
  onVolume(volume: number): void;
  onFocusBeat(hz: number): void;
}>;

export function SceneCard({
  scene,
  active,
  volume,
  focusBeatHz,
  focusBands,
  onToggle,
  onVolume,
  onFocusBeat,
}: SceneCardProps) {
  return (
    <button
      className={`scene-card ${active ? 'active' : ''}`}
      style={{ '--card-accent': scene.color } as CSSProperties}
      onClick={onToggle}
    >
      <div className="scene-top">
        <span className="scene-icon">{scene.icon}</span>
        <span className="scene-dot" />
      </div>
      <div className="scene-name">{scene.name}</div>
      {scene.sub ? <div className="scene-sub">{scene.sub}</div> : null}
      <input
        type="range"
        className="scene-vol"
        min={0}
        max={100}
        value={Math.round(volume * 100)}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => onVolume(Number(event.target.value) / 100)}
      />
      {scene.type === 'focus' ? (
        <div className="scene-extra">
          <select
            className="focus-band"
            value={focusBeatHz}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => onFocusBeat(Number(event.target.value))}
          >
            {focusBands.map((band) => (
              <option key={band.hz} value={band.hz}>
                {band.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </button>
  );
}
