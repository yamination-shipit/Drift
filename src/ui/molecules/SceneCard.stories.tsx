import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { BASE_SCENES, FOCUS_BANDS } from '../../domain/scenes';
import { SceneCard } from './SceneCard';

const meta = {
  component: SceneCard,
  args: {
    scene: BASE_SCENES[0],
    active: false,
    volume: 0.7,
    focusBeatHz: 6,
    focusBands: FOCUS_BANDS,
    onToggle: () => {},
    onVolume: () => {},
    onFocusBeat: () => {},
  },
} satisfies Meta<typeof SceneCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {};

export const Active: Story = {
  args: { active: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Ocean Waves')).toBeInTheDocument();
    await userEvent.tab();
  },
};
