"use client";
import React from "react";
import { Ticket } from "@/lib/ticket/ticket";

interface Props {
  tickets: Ticket[];
}

const GROUPS = [
  { id: "preferencial", label: "Pref", color: "bg-red-500", textColor: "text-red-600" },
  { id: "prioridade", label: "Prio", color: "bg-blue-500", textColor: "text-blue-600" },
  { id: "atendimento", label: "Geral", color: "bg-gray-500", textColor: "text-gray-600" },
];

const TicketGroupFloatingBar = ({ tickets }: Props) => {
  const preparacao = tickets.filter(
    (t) => t.status === "EM PREPARAÇÃO" || t.status === "ENCAMINHADO RAIO-X",
  );

  const sorted = [...tickets].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));

  const preferenciais = sorted.filter(
    (s) => s.preferencial && preparacao.every((p) => p.id !== s.id),
  );
  const comPrefixo = sorted.filter(
    (s) => s.prefixo && !s.preferencial && preparacao.every((p) => p.id !== s.id),
  );
  const normais = sorted.filter(
    (s) => !s.preferencial && !s.prefixo && preparacao.every((p) => p.id !== s.id),
  );

  const counts: Record<string, number> = {
    preferencial: preferenciais.length,
    prioridade: comPrefixo.length,
    atendimento: normais.length,
  };

  const scrollToSection = (sectionId: string) => {
    const targetEl = document.getElementById(`ticket-group-${sectionId}`);
    targetEl?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (tickets.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-200 px-4 py-3">
      {GROUPS.map((group) => (
        <button
          key={group.id}
          onClick={() => scrollToSection(group.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          title={`Ir para ${group.label}`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${group.color}`} />
          <span className="text-xs text-gray-500 font-medium">{group.label}</span>
          <span className={`text-sm font-bold ${group.textColor}`}>
            {counts[group.id]}
          </span>
        </button>
      ))}
    </div>
  );
};

export default TicketGroupFloatingBar;
