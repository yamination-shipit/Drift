import type { ButtonHTMLAttributes, ReactNode } from 'react';

type PillButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  children: ReactNode;
};

export function PillButton({
  selected = false,
  className = '',
  children,
  ...props
}: PillButtonProps) {
  return (
    <button className={`pill ${selected ? 'selected' : ''} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
