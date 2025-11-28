import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;

  // Se não houver token, redireciona para login
  if (!token) {
    const loginUrl = request.nextUrl.clone();

    loginUrl.pathname = "/";

    return NextResponse.redirect(loginUrl);
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
