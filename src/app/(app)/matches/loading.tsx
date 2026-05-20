export default function MatchesLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="h-4 w-24 bg-muted rounded animate-pulse mt-1" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-24 bg-muted rounded-full animate-pulse" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-4 space-y-3 animate-pulse">
            <div className="flex justify-between">
              <div className="h-3 w-12 bg-muted rounded" />
              <div className="h-3 w-20 bg-muted rounded" />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="w-8 h-8 bg-muted rounded" />
                <div className="h-3 w-8 bg-muted rounded" />
              </div>
              <div className="h-6 w-14 bg-muted rounded" />
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="w-8 h-8 bg-muted rounded" />
                <div className="h-3 w-8 bg-muted rounded" />
              </div>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <div className="h-3 w-24 bg-muted rounded" />
              <div className="h-3 w-12 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
