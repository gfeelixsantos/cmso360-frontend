import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { NEST_URL } from "@/config/constants";
import { JWT } from "@/lib/jwt/jwt";

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = await req.json();
    const ck = await cookies();
    const authToken = ck.get("auth_token")?.value;
    const refreshToken = ck.get("refresh_token")?.value;
    const tokenToVerify = authToken ?? refreshToken;

    const headers = new Headers({
      "Content-Type": "application/json",
    });

    if (authToken) {
      headers.set("Authorization", `Bearer ${authToken}`);
    }

    let requestBody = body;

    if (tokenToVerify) {
      const payload = await JWT.verifyJwt(tokenToVerify);

      if (payload) {
        const { exp, iat, ...authUser } = payload;

        headers.set("x-auth-user", JSON.stringify(authUser));

        requestBody = {
          ...body,
          user: body?.user ?? authUser,
        };
      }
    }

    const response = await fetch(`${NEST_URL}psc/auth/start`, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    const text = await response.text();

    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (error) {
    console.error("[BFF:psc/auth/start]", error);

    return NextResponse.json(
      { message: "Falha ao iniciar autenticacao via BFF." },
      { status: 500 },
    );
  }
}
