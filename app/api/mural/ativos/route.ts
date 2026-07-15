import { NextResponse } from "next/server";
import { NEST_URL } from "@/config/constants";

export async function GET() {
  try {
    const response = await fetch(`${NEST_URL}mural/ativos`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: "Erro ao buscar murais ativos" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { message: "Erro de conexão com o servidor" },
      { status: 502 },
    );
  }
}
