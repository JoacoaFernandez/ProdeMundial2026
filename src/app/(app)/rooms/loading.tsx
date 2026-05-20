export default function RoomsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-28 bg-muted rounded animate-pulse" />
        <div className="h-9 w-28 bg-muted rounded animate-pulse" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-4 space-y-3 animate-pulse">
            <div className="h-5 w-32 bg-muted rounded" />
            <div className="h-3 w-20 bg-muted rounded" />
            <div className="flex justify-between mt-2">
              <div className="h-3 w-16 bg-muted rounded" />
              <div className="h-3 w-12 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
