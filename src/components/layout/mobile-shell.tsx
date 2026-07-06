import { BottomNav } from "@/components/layout/bottom-nav";

type MobileShellProps = {
  title: string;
  header?: React.ReactNode;
  children: React.ReactNode;
};

export function MobileShell({ title, header, children }: MobileShellProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#f5f5f7]">
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
