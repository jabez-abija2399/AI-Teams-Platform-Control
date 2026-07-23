export default function WorkspaceLoading() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* TopNav skeleton */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b bg-card px-3">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-pulse rounded bg-muted-foreground/20" />
          <div className="h-4 w-36 animate-pulse rounded bg-muted-foreground/20" />
        </div>
        <div className="hidden h-7 w-64 animate-pulse rounded-md border bg-muted sm:block" />
        <div />
      </div>

      {/* Main workspace area skeleton */}
      <div className="flex flex-1 overflow-hidden">
        {/* ActivityBar skeleton */}
        <div className="hidden w-12 flex-col items-center gap-3 border-r bg-card p-3 md:flex">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-5 w-5 animate-pulse rounded bg-muted-foreground/20"
            />
          ))}
        </div>

        {/* SidebarPanel skeleton */}
        <div className="hidden w-60 flex-col gap-3 border-r bg-card p-3 md:flex">
          <div className="h-4 w-24 animate-pulse rounded bg-muted-foreground/20" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-3 w-3 animate-pulse rounded bg-muted-foreground/20" />
              <div
                className="h-3 animate-pulse rounded bg-muted-foreground/20"
                style={{ width: `${60 + Math.random() * 30}%` }}
              />
            </div>
          ))}
        </div>

        {/* Editor + BottomPanel area skeleton */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Tabs bar skeleton */}
          <div className="flex h-9 shrink-0 items-center gap-1 border-b bg-card px-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-6 w-20 animate-pulse rounded-t bg-muted-foreground/10"
              />
            ))}
          </div>
          {/* Editor toolbar skeleton */}
          <div className="flex h-9 shrink-0 items-center gap-2 border-b bg-card px-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-4 w-4 animate-pulse rounded bg-muted-foreground/20"
              />
            ))}
          </div>
          {/* Editor content skeleton */}
          <div className="flex flex-1 flex-col gap-3 bg-[#1e1e1e] p-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-3 animate-pulse rounded bg-neutral-700/50"
                style={{ width: `${40 + Math.random() * 55}%` }}
              />
            ))}
          </div>
          {/* BottomPanel skeleton */}
          <div className="flex h-32 shrink-0 flex-col border-t bg-card">
            <div className="flex h-8 items-center gap-3 border-b px-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-3 w-14 animate-pulse rounded bg-muted-foreground/20"
                />
              ))}
            </div>
            <div className="flex-1 p-3">
              <div className="h-full w-full animate-pulse rounded bg-muted-foreground/10" />
            </div>
          </div>
        </div>

        {/* AIPanel skeleton */}
        <div className="hidden w-80 flex-col border-l bg-card lg:flex">
          <div className="flex h-10 items-center gap-2 border-b px-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-5 w-16 animate-pulse rounded bg-muted-foreground/20"
              />
            ))}
          </div>
          <div className="flex-1 p-3">
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-3 animate-pulse rounded bg-muted-foreground/20"
                  style={{ width: `${50 + Math.random() * 40}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* StatusBar skeleton */}
      <div className="flex h-6 shrink-0 items-center justify-between bg-primary px-3">
        <div className="flex items-center gap-3">
          <div className="h-3 w-16 animate-pulse rounded bg-primary-foreground/20" />
          <div className="h-3 w-20 animate-pulse rounded bg-primary-foreground/20" />
        </div>
        <div className="h-3 w-32 animate-pulse rounded bg-primary-foreground/20" />
      </div>
    </div>
  );
}
