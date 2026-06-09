import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { NEST_URL } from "@/config/constants";
import { JWT } from "@/lib/jwt/jwt";
import { resolveAuthProxyContextFromTokens } from "../../_authContext.mjs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const urlParam = req.nextUrl.searchParams.get("url");
    if (!urlParam || !urlParam.trim()) {
      return NextResponse.json(
        { message: "Parâmetro 'url' é obrigatório" },
        { status: 400 },
      );
    }

    const ck = await cookies();
    const authToken = ck.get("auth_token")?.value;
    const refreshToken = ck.get("refresh_token")?.value;
    const { bearerToken, authUser } = await resolveAuthProxyContextFromTokens({
      authToken,
      refreshToken,
      verifyJwt: JWT.verifyJwt,
    });

    const proxyHeaders = new Headers();
    if (bearerToken) {
      proxyHeaders.set("Authorization", `Bearer ${bearerToken}`);
    }
    if (authUser) {
      proxyHeaders.set("x-auth-user", JSON.stringify(authUser));
    }

    const nestUrl = `${NEST_URL}blob/proxy?url=${encodeURIComponent(urlParam.trim())}`;
    const response = await fetch(nestUrl, {
      headers: proxyHeaders,
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return NextResponse.json(
        { message: text || "Erro ao acessar documento" },
        { status: response.status },
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType =
      response.headers.get("content-type") || "application/octet-stream";

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": response.headers.get("content-disposition") || "inline",
        "Content-Length": String(arrayBuffer.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[BFF:blob:proxy]", error);
    return NextResponse.json(
      { message: "Falha ao acessar documento." },
      { status: 500 },
    );
  }
}
