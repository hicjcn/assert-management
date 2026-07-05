import { BottomNav } from "@/components/layout/bottom-nav";

type MobileShellProps = {
  title: string;
  children: React.ReactNode;
};

export function MobileShell({ title, children }: MobileShellProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#f5f5f7]">
      <header className="sticky top-0 z-10 border-b border-white/70 bg-white/75 px-5 py-4 shadow-sm shadow-black/[0.03] backdrop-blur-xl">
        <h1 className="text-xl font-semibold tracking-normal text-[#1d1d1f]">
          {title}
        </h1>
      </header>
      <main className="flex-1 px-5 py-5 pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
