"use client";

import { use } from "react";

import TeleatendimentoWindow from "@/app/teleatendimento/components/TeleatendimentoWindow";

type PageProps = {
  params: Promise<{
    inviteToken: string;
  }>;
};

export default function TeleatendimentoInvitePage({ params }: PageProps) {
  const { inviteToken } = use(params);

  return <TeleatendimentoWindow role="EMPLOYEE" inviteToken={inviteToken} />;
}
