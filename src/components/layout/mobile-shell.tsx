import { BottomNav } from "@/components/layout/bottom-nav";

type MobileShellProps = {
  title: string;
  children: React.ReactNode;
};

export function MobileShell({ title, children }: MobileShellProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#f5f5f7]">
      <main className="flex-1 space-y-5 px-5 py-5 pb-24">
        <h1 className="text-xl font-semibold tracking-normal text-[#1d1d1f]">
          {title}
        </h1>
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
