import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { JWT } from "@/lib/jwt/jwt";
import { NEST_URL } from "@/config/constants";
async function resolveAuthContext(): Promise<{
  authToken?: string;
  authUser?: Record<string, unknown>;
}> {
  const ck = await cookies();
  const authToken = ck.get("auth_token")?.value;
  const refreshToken = ck.get("refresh_token")?.value;

  if (!authToken && !refreshToken) {
    return {};
  }

  const tokenToVerify = authToken ?? refreshToken;

  if (!tokenToVerify) {
    return {};
  }

  const payload = await JWT.verifyJwt(tokenToVerify);

  if (!payload) {
    return { authToken };
  }

  const { exp, iat, ...authUser } = payload;

  return {
    authToken,
    authUser,
  };
}

export async function proxySchedulingRequest(
  req: Request,
  endpoint: string,
): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { authToken, authUser } = await resolveAuthContext();

    const headers = new Headers({
      "Content-Type": "application/json",
    });

    if (authToken) {
      headers.set("Authorization", `Bearer ${authToken}`);
    }

    if (authUser) {
      headers.set("x-auth-user", JSON.stringify(authUser));
    }

    const response = await fetch(`${NEST_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const text = await response.text();

    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (error) {
    console.error(`[BFF:${endpoint}]`, error);

    return NextResponse.json(
      { message: "Falha ao processar requisicao interna." },
      { status: 500 },
    );
  }
}
