import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { JWT } from "./lib/jwt/jwt"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ["/", "/registro", "/ticket", "/painel"]

  // Se a rota é pública, permite acesso
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Verifica se o usuário está autenticado
  const token = request.cookies.get("auth_token")?.value


  if (!token) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/"
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/|favicon.ico|images|public).*)",
  ],
}

