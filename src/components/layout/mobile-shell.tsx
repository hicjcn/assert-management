import { BottomNav } from "@/components/layout/bottom-nav";

type MobileShellProps = {
  title: string;
  header?: React.ReactNode;
  children: React.ReactNode;
};

export function MobileShell({ title, header, children }: MobileShellProps) {
  return (
    <div className="relative isolate mx-auto flex min-h-screen w-full max-w-md flex-col overflow-x-hidden bg-[#f5f5f7]">
      <div
        aria-hidden="true"
        className="fixed left-1/2 top-0 -z-20 h-screen w-full max-w-md -translate-x-1/2 bg-[url('/ui/asset-background-portrait.jpg')] bg-cover bg-center"
      />
      <div
        aria-hidden="true"
        className="fixed left-1/2 top-0 -z-10 h-screen w-full max-w-md -translate-x-1/2 bg-[linear-gradient(180deg,rgba(255,255,255,0.54)_0%,rgba(245,245,247,0.70)_42%,rgba(245,245,247,0.86)_100%)]"
      />
      <main className="flex-1 space-y-5 px-5 py-6 pb-32">
        {header ?? (
          <div className="pt-2">
            <h1 className="text-3xl font-semibold tracking-normal text-[#1d1d1f] drop-shadow-[0_1px_0_rgba(255,255,255,0.72)]">
              {title}
            </h1>
            <div className="mt-3 h-1 w-12 rounded-full bg-[#007aff]" />
          </div>
        )}
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
