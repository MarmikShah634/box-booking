import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800',
        'before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer',
        'before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent',
        'dark:before:via-white/10',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
