import type { ButtonHTMLAttributes, ReactNode } from 'react';

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function IconButton({ children, className = '', ...props }: IconButtonProps) {
  return (
    <button className={`icon-btn ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
