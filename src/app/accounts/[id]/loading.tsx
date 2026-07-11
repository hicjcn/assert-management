function DetailSkeleton({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-black/[0.06] ${className}`}
    />
  );
}

export default function AccountDetailLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="正在读取账户详情"
      className="flex-1 space-y-5 px-5 py-6 pb-32"
    >
      <div className="space-y-3 pt-2">
        <DetailSkeleton className="h-9 w-32" />
        <DetailSkeleton className="h-1 w-12 rounded-full" />
      </div>
      <DetailSkeleton className="h-9 w-24" />
      <section className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-white/70 bg-white/80 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-4">
              <DetailSkeleton className="h-12 w-12" />
              <DetailSkeleton className="h-6 w-28" />
              <DetailSkeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="space-y-2">
              <DetailSkeleton className="ml-auto h-4 w-16" />
              <DetailSkeleton className="h-8 w-28" />
            </div>
          </div>
          <DetailSkeleton className="mt-5 h-11 w-full" />
        </div>
        <div className="rounded-xl border border-white/70 bg-white/80 p-4 shadow-sm">
          <DetailSkeleton className="h-5 w-28" />
          <DetailSkeleton className="mt-5 h-16 w-full" />
          <DetailSkeleton className="mt-3 h-16 w-full" />
        </div>
      </section>
      <span className="sr-only">正在加载账户详情，请稍候</span>
    </main>
  );
}
