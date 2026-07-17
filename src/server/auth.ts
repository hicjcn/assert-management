import "server-only";

import { cache } from "react";
import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/server/db/prisma";

const SESSION_COOKIE = "asset_management_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type SessionPayload = {
  userId: string;
  username: string;
};

type SessionUser = {
  id: string;
  username: string;
};

export function getAuthSigningKey() {
  const secret = process.env.SESSION_SECRET ?? process.env.AUTH_SECRET;

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET or SESSION_SECRET is required in production.");
  }

  return new TextEncoder().encode(
    secret ?? "asset-management-local-development-secret",
  );
}

async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getAuthSigningKey());
}

async function verifyToken(token: string | undefined) {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getAuthSigningKey());

    if (
      typeof payload.userId !== "string" ||
      typeof payload.username !== "string"
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      username: payload.username,
    };
  } catch {
    return null;
  }
}

export async function createSessionForUser(user: SessionUser) {
  const token = await signSession({
    userId: user.id,
    username: user.username,
  });

  (await cookies()).set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function login(username: string, password: string) {
  const normalizedUsername = username.trim();

  if (!normalizedUsername || !password) {
    throw new Error("请输入用户名和密码");
  }

  let user = await prisma.user.findUnique({
    where: { username: normalizedUsername },
  });

  if (!user) {
    const userCount = await prisma.user.count();

    if (userCount > 0) {
      throw new Error("用户名或密码不正确");
    }

    user = await prisma.user.create({
      data: {
        username: normalizedUsername,
        passwordHash: await bcrypt.hash(password, 12),
      },
    });
  } else {
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      throw new Error("用户名或密码不正确");
    }
  }

  await createSessionForUser(user);
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
}

export const getSession = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifyToken(token);
});

export const requireSession = cache(async () => {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
});
