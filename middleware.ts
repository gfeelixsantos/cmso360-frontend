import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { JWT } from "@/lib/jwt/jwt";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;

  // Se não houver token → redireciona com callback
  if (!token) {
    const url = new URL("/", request.url);

    url.searchParams.set("callbackUrl", request.nextUrl.pathname);

    return NextResponse.redirect(url);
  }

  // Validar token
  try {
    await JWT.verifyJwt(token);
  } catch {
    const url = new URL("/", request.url);

    url.searchParams.set("callbackUrl", request.nextUrl.pathname);

    return NextResponse.redirect(url);
  }

  return NextResponse.next();
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
