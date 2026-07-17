import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  back: vi.fn(),
  pathname: "/",
  prefetch: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMocks.pathname,
  useRouter: () => ({
    back: navigationMocks.back,
    prefetch: navigationMocks.prefetch,
    push: navigationMocks.push,
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    onClick,
    prefetch,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    children: React.ReactNode;
    prefetch?: boolean;
  }) => (
    <a
      data-prefetch={prefetch ? "true" : "false"}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </a>
  ),
}));

import { AccountDetailLink } from "@/components/accounts/account-detail-link";
import { BackToAccountsButton } from "@/components/accounts/back-to-accounts-button";
import { BottomNav } from "@/components/layout/bottom-nav";

describe("instant navigation feedback", () => {
  beforeEach(() => {
    navigationMocks.pathname = "/";
    sessionStorage.clear();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("switches the active tab as soon as the pointer goes down", () => {
    render(<BottomNav />);
    const home = screen.getByRole("link", { name: "首页" });
    const accounts = screen.getByRole("link", { name: "账户" });

    expect(screen.queryByRole("link", { name: "记录" })).not.toBeInTheDocument();
    expect(home).toHaveAttribute("aria-current", "page");
    expect(accounts).not.toHaveAttribute("aria-current");

    fireEvent.pointerDown(accounts);

    expect(home).not.toHaveAttribute("aria-current");
    expect(accounts).toHaveAttribute("aria-current", "page");
  });

  it("keeps records under the home tab", () => {
    navigationMocks.pathname = "/records";
    render(<BottomNav />);

    expect(screen.getByRole("link", { name: "首页" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.queryByRole("link", { name: "记录" })).not.toBeInTheDocument();
  });

  it("warms common tabs before the charts route", () => {
    vi.useFakeTimers();
    render(<BottomNav />);
    const accounts = screen.getByRole("link", { name: "账户" });
    const charts = screen.getByRole("link", { name: "图表" });

    expect(accounts).toHaveAttribute("data-prefetch", "false");
    expect(charts).toHaveAttribute("data-prefetch", "false");

    act(() => vi.advanceTimersByTime(250));

    expect(accounts).toHaveAttribute("data-prefetch", "true");
    expect(charts).toHaveAttribute("data-prefetch", "false");

    act(() => vi.advanceTimersByTime(1000));

    expect(charts).toHaveAttribute("data-prefetch", "true");
  });

  it("records the account list as the detail return target", () => {
    navigationMocks.pathname = "/accounts";
    render(
      <AccountDetailLink href="/accounts/account-1">
        工资卡
      </AccountDetailLink>,
    );

    fireEvent.click(screen.getByRole("link", { name: "工资卡" }));

    expect(
      JSON.parse(
        sessionStorage.getItem("asset-management:account-return") ?? "null",
      ),
    ).toMatchObject({
      from: "/accounts",
      to: "/accounts/account-1",
    });
  });

  it("restores the cached account list when returning from a detail page", () => {
    navigationMocks.pathname = "/accounts/account-1";
    sessionStorage.setItem(
      "asset-management:account-return",
      JSON.stringify({
        at: Date.now(),
        from: "/accounts",
        to: "/accounts/account-1",
      }),
    );
    render(<BackToAccountsButton />);

    fireEvent.click(screen.getByRole("button", { name: "返回账户" }));

    expect(navigationMocks.back).toHaveBeenCalledOnce();
    expect(navigationMocks.push).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "返回账户" })).not.toHaveAttribute(
      "aria-busy",
    );
  });

  it("falls back to the account route without a restorable history entry", () => {
    navigationMocks.pathname = "/accounts/account-1";
    render(<BackToAccountsButton />);

    fireEvent.click(screen.getByRole("button", { name: "返回账户" }));

    expect(navigationMocks.push).toHaveBeenCalledWith("/accounts");
    expect(navigationMocks.back).not.toHaveBeenCalled();
  });
});
