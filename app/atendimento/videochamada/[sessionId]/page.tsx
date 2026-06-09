"use client";

import { use } from "react";

import TeleatendimentoWindow from "@/app/teleatendimento/components/TeleatendimentoWindow";

type PageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default function AtendimentoVideochamadaPage({ params }: PageProps) {
  const { sessionId } = use(params);

  return (
    <TeleatendimentoWindow
      role="PROFESSIONAL"
      sessionId={sessionId}
    />
  );
}
