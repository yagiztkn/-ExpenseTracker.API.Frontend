import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        'inline-flex h-10 items-center justify-start rounded-lg p-1 gap-1',
        className,
      )}
      style={{
        backgroundColor: 'var(--color-graphite)',
        border: '1px solid var(--border-subtle)',
      }}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-all',
        'text-[var(--color-text-secondary)]',
        'hover:text-[var(--color-text-primary)]',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[state=active]:text-[var(--color-text-primary)] data-[state=active]:shadow-sm',
        className,
      )}
      style={
        {
          '--tw-shadow': '0 1px 6px rgba(0,0,0,0.4)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        'mt-1 outline-none ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
