import { BottomNav } from "@/components/layout/bottom-nav";

type MobileShellProps = {
  title: string;
  children: React.ReactNode;
};

export function MobileShell({ title, children }: MobileShellProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 px-5 py-4 backdrop-blur">
        <h1 className="text-xl font-semibold">{title}</h1>
      </header>
      <main className="flex-1 px-5 py-5 pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
