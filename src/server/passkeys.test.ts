import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const simpleWebAuthnMock = vi.hoisted(() => ({
  generateAuthenticationOptions: vi.fn(),
  generateRegistrationOptions: vi.fn(),
  verifyAuthenticationResponse: vi.fn(),
  verifyRegistrationResponse: vi.fn(),
}));

const cookieStoreMock = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}));

const jwtVerifyMock = vi.hoisted(() => vi.fn());

const authMock = vi.hoisted(() => ({
  createSessionForUser: vi.fn(),
  getAuthSigningKey: vi.fn(() => new TextEncoder().encode("test-secret")),
}));

const prismaMock = vi.hoisted(() => ({
  passkeyCredential: {
    create: vi.fn(),
    deleteMany: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@simplewebauthn/server", () => simpleWebAuthnMock);

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStoreMock),
}));

vi.mock("jose", () => ({
  SignJWT: class {
    setAudience() {
      return this;
    }

    setExpirationTime() {
      return this;
    }

    setIssuedAt() {
      return this;
    }

    setIssuer() {
      return this;
    }

    setProtectedHeader() {
      return this;
    }

    async sign() {
      return "signed-passkey-challenge";
    }
  },
  jwtVerify: jwtVerifyMock,
}));

vi.mock("@/server/auth", () => authMock);

vi.mock("@/server/db/prisma", () => ({
  prisma: prismaMock,
}));

import {
  createPasskeyAuthenticationOptions,
  createPasskeyRegistrationOptions,
  finishPasskeyAuthentication,
  finishPasskeyRegistration,
  getPasskeyConfig,
} from "@/server/passkeys";

describe("passkey service", () => {
  const config = {
    origin: "https://asset.example.com",
    rpID: "asset.example.com",
    rpName: "资产管家",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("PASSKEY_RP_ID", "");
    vi.stubEnv("PASSKEY_RP_NAME", "");
    cookieStoreMock.get.mockReturnValue({ value: "challenge-cookie" });
  });

  it("derives the RP ID from the HTTPS origin", () => {
    expect(getPasskeyConfig("https://asset.example.com/login")).toEqual(config);
  });

  it("requires HTTPS outside localhost", () => {
    expect(() => getPasskeyConfig("http://192.168.1.8:3000/login")).toThrow(
      "通行密钥需要通过 HTTPS 域名使用",
    );
  });

  it("creates a discoverable, user-verified registration challenge", async () => {
    prismaMock.passkeyCredential.findMany.mockResolvedValue([]);
    simpleWebAuthnMock.generateRegistrationOptions.mockResolvedValue({
      challenge: "registration-challenge",
    });

    await createPasskeyRegistrationOptions(
      { userId: "user-1", username: "admin" },
      config,
    );

    expect(simpleWebAuthnMock.generateRegistrationOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        rpID: "asset.example.com",
        userName: "admin",
        authenticatorSelection: {
          residentKey: "required",
          userVerification: "required",
        },
      }),
    );
    expect(cookieStoreMock.set).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "asset_management_passkey_registration",
        httpOnly: true,
        sameSite: "strict",
        secure: false,
      }),
    );
  });

  it("creates a username-free authentication challenge", async () => {
    simpleWebAuthnMock.generateAuthenticationOptions.mockResolvedValue({
      challenge: "authentication-challenge",
    });

    await createPasskeyAuthenticationOptions(config);

    expect(simpleWebAuthnMock.generateAuthenticationOptions).toHaveBeenCalledWith({
      rpID: "asset.example.com",
      userVerification: "required",
    });
    expect(cookieStoreMock.set).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "asset_management_passkey_authentication",
        httpOnly: true,
        sameSite: "strict",
      }),
    );
  });

  it("stores the verified credential public key and counter", async () => {
    jwtVerifyMock.mockResolvedValue({
      payload: {
        ceremony: "registration",
        challenge: "registration-challenge",
        userId: "user-1",
      },
    });
    simpleWebAuthnMock.verifyRegistrationResponse.mockResolvedValue({
      verified: true,
      registrationInfo: {
        credential: {
          id: "credential-1",
          publicKey: new Uint8Array([1, 2]),
          counter: 3,
          transports: ["internal"],
        },
        credentialBackedUp: true,
        credentialDeviceType: "multiDevice",
      },
    });
    prismaMock.passkeyCredential.findUnique.mockResolvedValue(null);

    await finishPasskeyRegistration(
      "user-1",
      {} as RegistrationResponseJSON,
      config,
    );

    expect(prismaMock.passkeyCredential.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        credentialId: "credential-1",
        publicKey: "AQI",
        counter: 3n,
        transports: '["internal"]',
        backedUp: true,
      }),
    });
  });

  it("verifies a passkey, updates its counter, and creates a session", async () => {
    jwtVerifyMock.mockResolvedValue({
      payload: {
        ceremony: "authentication",
        challenge: "authentication-challenge",
      },
    });
    prismaMock.passkeyCredential.findUnique.mockResolvedValue({
      id: "passkey-1",
      credentialId: "credential-1",
      publicKey: "AQI",
      counter: 3n,
      transports: '["internal"]',
      user: { id: "user-1", username: "admin" },
    });
    simpleWebAuthnMock.verifyAuthenticationResponse.mockResolvedValue({
      verified: true,
      authenticationInfo: {
        newCounter: 4,
        credentialDeviceType: "multiDevice",
        credentialBackedUp: true,
      },
    });
    const response = {
      id: "credential-1",
      response: {
        userHandle: Buffer.from("user-1").toString("base64url"),
      },
    } as unknown as AuthenticationResponseJSON;

    await finishPasskeyAuthentication(response, config);

    expect(simpleWebAuthnMock.verifyAuthenticationResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedChallenge: "authentication-challenge",
        expectedOrigin: "https://asset.example.com",
        expectedRPID: "asset.example.com",
        requireUserVerification: true,
      }),
    );
    expect(prismaMock.passkeyCredential.update).toHaveBeenCalledWith({
      where: { id: "passkey-1" },
      data: expect.objectContaining({ counter: 4n, backedUp: true }),
    });
    expect(authMock.createSessionForUser).toHaveBeenCalledWith({
      id: "user-1",
      username: "admin",
    });
  });
});
