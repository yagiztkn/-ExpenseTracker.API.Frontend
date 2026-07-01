import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

export function Skeleton({
  className,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse-subtle rounded-lg', className)}
      style={{ backgroundColor: 'var(--color-graphite)', ...style }}
      {...props}
    />
  );
}
