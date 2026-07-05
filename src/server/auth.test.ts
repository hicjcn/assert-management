import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieStoreMock = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}));

const redirectMock = vi.hoisted(() => vi.fn());

const prismaMock = vi.hoisted(() => ({
  user: {
    count: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
  },
}));

vi.mock("react", () => ({
  cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStoreMock),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("jose", () => ({
  SignJWT: class {
    setExpirationTime() {
      return this;
    }

    setIssuedAt() {
      return this;
    }

    setProtectedHeader() {
      return this;
    }

    async sign() {
      return "signed-session-token";
    }
  },
  jwtVerify: vi.fn(),
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: prismaMock,
}));

import { login, requireSession } from "@/server/auth";

describe("auth service", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAuthSecret = process.env.AUTH_SECRET;
  const originalSessionSecret = process.env.SESSION_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = "test";
    delete process.env.AUTH_SECRET;
    delete process.env.SESSION_SECRET;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.AUTH_SECRET = originalAuthSecret;
    process.env.SESSION_SECRET = originalSessionSecret;
  });

  it("redirects unauthenticated users away from protected business pages", async () => {
    cookieStoreMock.get.mockReturnValue(undefined);

    await requireSession();

    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("sets the session cookie as httpOnly, SameSite lax, and insecure outside production", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.count.mockResolvedValue(0);
    prismaMock.user.create.mockResolvedValue({
      id: "user-1",
      username: "admin",
      passwordHash: "hashed-password",
    });

    await login(" admin ", "password");

    expect(cookieStoreMock.set).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "asset_management_session",
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/",
      }),
    );
    expect(cookieStoreMock.set.mock.calls[0][0].value).toEqual(
      expect.any(String),
    );
  });

  it("marks the session cookie as secure in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.AUTH_SECRET = "production-secret-at-least-set";
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.count.mockResolvedValue(0);
    prismaMock.user.create.mockResolvedValue({
      id: "user-1",
      username: "admin",
      passwordHash: "hashed-password",
    });

    await login("admin", "password");

    expect(cookieStoreMock.set).toHaveBeenCalledWith(
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        secure: true,
      }),
    );
  });

  it("requires AUTH_SECRET or SESSION_SECRET in production", async () => {
    process.env.NODE_ENV = "production";
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.count.mockResolvedValue(0);
    prismaMock.user.create.mockResolvedValue({
      id: "user-1",
      username: "admin",
      passwordHash: "hashed-password",
    });

    await expect(login("admin", "password")).rejects.toThrow(
      "AUTH_SECRET or SESSION_SECRET is required in production.",
    );
    expect(cookieStoreMock.set).not.toHaveBeenCalled();
  });
});
