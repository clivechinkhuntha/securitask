function Block({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-white/[0.08] ${className}`} />;
}

export function DashboardSkeleton() {
  return <main className="min-h-screen bg-[#050606] text-white lg:grid lg:grid-cols-[176px_1fr]">
    <aside className="border-b border-white/10 bg-[#080a0a] px-3 py-4 lg:min-h-screen lg:border-r lg:border-b-0 lg:px-2 lg:py-3">
      <div className="flex items-center gap-2 px-2"><Block className="h-8 w-8 rounded-md" /><Block className="h-3 w-20" /></div>
      <div className="mt-5 flex gap-1 overflow-hidden lg:flex-col">
        {Array.from({ length: 10 }, (_, index) => <div key={index} className="flex h-9 items-center gap-2 rounded-md px-2.5"><Block className="h-4 w-4" /><Block className={`h-3 ${index % 3 === 0 ? "w-24" : "w-16"}`} /></div>)}
      </div>
    </aside>
    <section className="min-w-0 p-3 sm:p-4 lg:p-4">
      <div className="mx-auto max-w-7xl">
        <header className="flex items-center justify-between gap-4 py-1"><Block className="h-4 w-36" /><div className="flex gap-3"><Block className="h-8 w-40" /><Block className="hidden h-8 w-28 sm:block" /></div></header>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <article key={index} className="rounded-lg border border-white/10 bg-[#141616] p-4"><Block className="h-3 w-24" /><Block className="mt-4 h-6 w-32" /><Block className="mt-3 h-3 w-16" /></article>)}</div>
        <div className="mt-4 grid gap-3 xl:grid-cols-[1.45fr_.85fr]"><article className="rounded-lg border border-white/10 bg-[#141616] p-4"><Block className="h-4 w-32" /><Block className="mt-4 h-44 w-full" /></article><article className="rounded-lg border border-white/10 bg-[#141616] p-4"><Block className="h-4 w-36" /><div className="mt-5 flex items-center gap-6"><Block className="h-28 w-28 rounded-full" /><div className="space-y-3"><Block className="h-3 w-24" /><Block className="h-3 w-20" /><Block className="h-3 w-28" /></div></div></article></div>
      </div>
    </section>
  </main>;
}
