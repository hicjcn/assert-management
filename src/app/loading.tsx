function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-black/[0.06] ${className}`}
    />
  );
}

export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-label="正在读取数据"
      className="flex-1 space-y-5 px-5 py-6 pb-32"
    >
      <div className="space-y-3 pt-2">
        <SkeletonBlock className="h-9 w-28" />
        <SkeletonBlock className="h-1 w-12 rounded-full" />
      </div>
      <section className="space-y-4">
        <div className="rounded-xl border border-white/70 bg-white/75 p-5 shadow-sm">
          <SkeletonBlock className="h-4 w-20" />
          <SkeletonBlock className="mt-5 h-10 w-44" />
          <SkeletonBlock className="mt-4 h-4 w-32" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/70 bg-white/75 p-4">
            <SkeletonBlock className="h-4 w-16" />
            <SkeletonBlock className="mt-4 h-6 w-24" />
          </div>
          <div className="rounded-xl border border-white/70 bg-white/75 p-4">
            <SkeletonBlock className="h-4 w-16" />
            <SkeletonBlock className="mt-4 h-6 w-24" />
          </div>
        </div>
        <div className="rounded-xl border border-white/70 bg-white/75 p-5">
          <SkeletonBlock className="h-5 w-24" />
          <SkeletonBlock className="mt-5 h-16 w-full" />
          <SkeletonBlock className="mt-3 h-16 w-full" />
        </div>
      </section>
      <span className="sr-only">正在加载，请稍候</span>
    </main>
  );
}
