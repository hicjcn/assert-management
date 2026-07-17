import "server-only";

import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
  type Base64URLString,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

import { createSessionForUser, getAuthSigningKey } from "@/server/auth";
import { prisma } from "@/server/db/prisma";

const CHALLENGE_MAX_AGE_SECONDS = 5 * 60;
const CHALLENGE_ISSUER = "asset-management";
const CHALLENGE_AUDIENCE = "passkey-ceremony";

type Ceremony = "registration" | "authentication";

type PasskeyConfig = {
  origin: string;
  rpID: string;
  rpName: string;
};

type ChallengeState = {
  challenge: string;
  ceremony: Ceremony;
  userId?: string;
};

export type PasskeySummary = {
  id: string;
  name: string;
  backedUp: boolean;
  createdAt: Date;
  lastUsedAt: Date | null;
};

export class PasskeyFlowError extends Error {}

function challengeCookieName(ceremony: Ceremony) {
  return `asset_management_passkey_${ceremony}`;
}

function isLocalhost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function getPasskeyConfig(requestUrl: string): PasskeyConfig {
  const requestOrigin = new URL(requestUrl).origin;
  const configuredOrigin =
    process.env.NODE_ENV === "production"
      ? process.env.APP_URL?.trim()
      : undefined;
  const originUrl = new URL(configuredOrigin || requestOrigin);
  const origin = originUrl.origin;
  const rpID = process.env.PASSKEY_RP_ID?.trim() || originUrl.hostname;

  if (
    originUrl.protocol !== "https:" &&
    !isLocalhost(originUrl.hostname)
  ) {
    throw new PasskeyFlowError("通行密钥需要通过 HTTPS 域名使用");
  }

  if (
    originUrl.hostname !== rpID &&
    !originUrl.hostname.endsWith(`.${rpID}`)
  ) {
    throw new PasskeyFlowError("PASSKEY_RP_ID 必须是当前域名或其父域名");
  }

  return {
    origin,
    rpID,
    rpName: process.env.PASSKEY_RP_NAME?.trim() || "资产管家",
  };
}

function parseTransports(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value);

    return Array.isArray(parsed)
      ? (parsed as AuthenticatorTransportFuture[])
      : undefined;
  } catch {
    return undefined;
  }
}

async function saveChallenge(state: ChallengeState) {
  const token = await new SignJWT(state)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(CHALLENGE_ISSUER)
    .setAudience(CHALLENGE_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${CHALLENGE_MAX_AGE_SECONDS}s`)
    .sign(getAuthSigningKey());

  (await cookies()).set({
    name: challengeCookieName(state.ceremony),
    value: token,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CHALLENGE_MAX_AGE_SECONDS,
  });
}

async function consumeChallenge(ceremony: Ceremony) {
  const cookieStore = await cookies();
  const cookieName = challengeCookieName(ceremony);
  const token = cookieStore.get(cookieName)?.value;

  cookieStore.set({
    name: cookieName,
    value: "",
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  if (!token) {
    throw new PasskeyFlowError("通行密钥请求已过期，请重新开始");
  }

  try {
    const { payload } = await jwtVerify(token, getAuthSigningKey(), {
      issuer: CHALLENGE_ISSUER,
      audience: CHALLENGE_AUDIENCE,
    });

    if (
      payload.ceremony !== ceremony ||
      typeof payload.challenge !== "string" ||
      (payload.userId !== undefined && typeof payload.userId !== "string")
    ) {
      throw new Error("Invalid passkey challenge payload");
    }

    return {
      ceremony,
      challenge: payload.challenge,
      userId: payload.userId,
    } satisfies ChallengeState;
  } catch {
    throw new PasskeyFlowError("通行密钥请求已过期，请重新开始");
  }
}

export async function createPasskeyRegistrationOptions(
  user: { userId: string; username: string },
  config: PasskeyConfig,
) {
  const credentials = await prisma.passkeyCredential.findMany({
    where: { userId: user.userId },
    select: { credentialId: true, transports: true },
  });
  const options = await generateRegistrationOptions({
    rpName: config.rpName,
    rpID: config.rpID,
    userID: new TextEncoder().encode(user.userId),
    userName: user.username,
    userDisplayName: user.username,
    attestationType: "none",
    excludeCredentials: credentials.map((credential) => ({
      id: credential.credentialId as Base64URLString,
      transports: parseTransports(credential.transports),
    })),
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "required",
    },
    preferredAuthenticatorType: "localDevice",
  });

  await saveChallenge({
    ceremony: "registration",
    challenge: options.challenge,
    userId: user.userId,
  });

  return options;
}

export async function finishPasskeyRegistration(
  userId: string,
  response: RegistrationResponseJSON,
  config: PasskeyConfig,
) {
  const state = await consumeChallenge("registration");

  if (state.userId !== userId) {
    throw new PasskeyFlowError("登录状态已变化，请重新绑定通行密钥");
  }

  let verification;

  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: state.challenge,
      expectedOrigin: config.origin,
      expectedRPID: config.rpID,
      requireUserVerification: true,
    });
  } catch {
    throw new PasskeyFlowError("通行密钥验证失败，请重新开始");
  }

  if (!verification.verified || !verification.registrationInfo) {
    throw new PasskeyFlowError("通行密钥验证失败，请重新开始");
  }

  const {
    credential,
    credentialBackedUp,
    credentialDeviceType,
  } = verification.registrationInfo;
  const existing = await prisma.passkeyCredential.findUnique({
    where: { credentialId: credential.id },
    select: { id: true, userId: true },
  });

  if (existing && existing.userId !== userId) {
    throw new PasskeyFlowError("该通行密钥已绑定到其他账号");
  }

  const data = {
    publicKey: Buffer.from(credential.publicKey).toString("base64url"),
    counter: BigInt(credential.counter),
    transports: credential.transports
      ? JSON.stringify(credential.transports)
      : null,
    deviceType: credentialDeviceType,
    backedUp: credentialBackedUp,
    name: credentialBackedUp ? "同步通行密钥" : "设备通行密钥",
  };

  if (existing) {
    await prisma.passkeyCredential.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await prisma.passkeyCredential.create({
      data: {
        ...data,
        userId,
        credentialId: credential.id,
      },
    });
  }
}

export async function createPasskeyAuthenticationOptions(config: PasskeyConfig) {
  const options = await generateAuthenticationOptions({
    rpID: config.rpID,
    userVerification: "required",
  });

  await saveChallenge({
    ceremony: "authentication",
    challenge: options.challenge,
  });

  return options;
}

export async function finishPasskeyAuthentication(
  response: AuthenticationResponseJSON,
  config: PasskeyConfig,
) {
  const state = await consumeChallenge("authentication");
  const storedCredential = await prisma.passkeyCredential.findUnique({
    where: { credentialId: response.id },
    include: {
      user: {
        select: { id: true, username: true },
      },
    },
  });

  if (!storedCredential) {
    throw new PasskeyFlowError("未找到已绑定的通行密钥");
  }

  if (response.response.userHandle) {
    const userHandle = Buffer.from(
      response.response.userHandle,
      "base64url",
    ).toString("utf8");

    if (userHandle !== storedCredential.user.id) {
      throw new PasskeyFlowError("通行密钥与当前账号不匹配");
    }
  }

  let verification;

  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: state.challenge,
      expectedOrigin: config.origin,
      expectedRPID: config.rpID,
      credential: {
        id: storedCredential.credentialId as Base64URLString,
        publicKey: new Uint8Array(
          Buffer.from(storedCredential.publicKey, "base64url"),
        ),
        counter: Number(storedCredential.counter),
        transports: parseTransports(storedCredential.transports),
      },
      requireUserVerification: true,
    });
  } catch {
    throw new PasskeyFlowError("通行密钥验证失败，请重新开始");
  }

  if (!verification.verified) {
    throw new PasskeyFlowError("通行密钥验证失败，请重新开始");
  }

  await prisma.passkeyCredential.update({
    where: { id: storedCredential.id },
    data: {
      counter: BigInt(verification.authenticationInfo.newCounter),
      deviceType: verification.authenticationInfo.credentialDeviceType,
      backedUp: verification.authenticationInfo.credentialBackedUp,
      lastUsedAt: new Date(),
    },
  });
  await createSessionForUser(storedCredential.user);
}

export async function listPasskeys(userId: string): Promise<PasskeySummary[]> {
  return prisma.passkeyCredential.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      backedUp: true,
      createdAt: true,
      lastUsedAt: true,
    },
  });
}

export async function deletePasskey(userId: string, id: string) {
  const result = await prisma.passkeyCredential.deleteMany({
    where: { id, userId },
  });

  if (result.count === 0) {
    throw new PasskeyFlowError("未找到要删除的通行密钥");
  }
}
