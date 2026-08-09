import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { JWT } from "@/lib/jwt/jwt";
import { NEST_URL } from "@/config/constants";
import { resolveAuthProxyContextFromTokens } from "../../_authContext.mjs";
import { logAuditEvent } from "@/lib/audit-log/bff-logger";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? undefined;
  const userAgent = req.headers.get("user-agent") ?? undefined;

  try {
    const ck = await cookies();
    const authToken = ck.get("auth_token")?.value;
    const refreshToken = ck.get("refresh_token")?.value;

    const { bearerToken, authUser } = await resolveAuthProxyContextFromTokens({
      authToken,
      refreshToken,
      verifyJwt: JWT.verifyJwt,
    });

    if (!bearerToken || !authUser) {
      return NextResponse.json(
        { message: "Token de autenticacao ausente ou expirado" },
        { status: 401 },
      );
    }

    if (authUser.perfil !== "MASTER") {
      return NextResponse.json(
        { message: "Acesso negado (requer perfil MASTER)" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const empresaCodigo = body?.CODIGO ?? body?.codigo ?? "UNKNOWN";
    const empresaNome = body?.RAZAOSOCIAL ?? body?.nome ?? "";

    const response = await fetch(`${NEST_URL}soc/empresas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearerToken}`,
        "x-auth-user": JSON.stringify(authUser),
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();

    // Registrar auditoria (fire-and-forget) - sucesso ou falha
    if (response.ok) {
      void logAuditEvent("EMPRESA_ATUALIZAR", authUser, { ip, userAgent, recursoId: empresaCodigo });
    } else {
      void logAuditEvent("CONFIGURACAO_ALTERAR", authUser, { ip, userAgent, recursoId: empresaCodigo });
    }

    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (error) {
    console.error("[BFF:soc/empresas/POST]", error);
    return NextResponse.json(
      { message: "Falha ao processar requisicao interna." },
      { status: 500 },
    );
  }
}

