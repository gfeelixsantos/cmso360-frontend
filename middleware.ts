import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { JWT } from "@/lib/jwt/jwt";

const RENEW_THRESHOLD = 10 * 60; // renovar faltando 10 min

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    return redirectToLogin(request);
  }

  try {
    // Decodifica sem validar assinatura (somente payload)
    const payload = await JWT.decodeJwt(token);

    const now = Math.floor(Date.now() / 1000);
    const expiresIn = payload.exp! - now;

    let response = NextResponse.next();

    // Se estiver perto de expirar → RENOVA
    if (expiresIn < RENEW_THRESHOLD) {
      const newToken = await JWT.signJwt(payload);

      response.cookies.set("auth_token", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60, // 1 hora
      });
    }

    return response;
  } catch {
    return redirectToLogin(request);
  }
}

function redirectToLogin(request: NextRequest) {
  const url = new URL("/", request.url);

  url.searchParams.set("callbackUrl", request.nextUrl.pathname);

  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/atendimento/:path*",
    "/dashboard/:path*",
    "/prontuarios/:path*",
    "/recepcao/:path*",
    "/relatorio/:path*",
  ],
};
