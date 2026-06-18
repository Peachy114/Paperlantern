export default function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="rounded-xl overflow-hidden aspect-[2/3] bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-2 flex flex-col gap-1.5">
        <div className="h-3.5 w-3/4 rounded-md bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-3 w-1/2 rounded-md bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  )
}