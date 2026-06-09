"use client";

import { useId, useState } from "react";

import { AuditLogRecord } from "@/lib/audit-log/types";

import {
  buildAuditExpandedDetails,
  hasExpandedAuditDetails,
} from "./presentation.mjs";

interface DetalhesColapsavelProps {
  record: AuditLogRecord;
}

function renderValue(value: unknown) {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

export function DetalhesColapsavel({ record }: DetalhesColapsavelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const contentId = useId();

  if (!hasExpandedAuditDetails(record)) {
    return <span className="text-xs text-gray-400">Sem detalhes</span>;
  }

  const details = buildAuditExpandedDetails(record);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="text-xs text-blue-600 hover:text-blue-800"
      >
        {isOpen ? "Ocultar detalhes" : "Ver detalhes"}
      </button>

      {isOpen && (
        <div
          id={contentId}
          className="space-y-3 rounded border border-gray-200 bg-gray-50 p-3"
        >
          <div className="grid gap-2 text-xs text-gray-700 md:grid-cols-2">
            <div>
              <span className="font-semibold">Perfil:</span>{" "}
              {renderValue(details.perfil)}
            </div>
            <div>
              <span className="font-semibold">Unidade:</span>{" "}
              {renderValue(details.unidade)}
            </div>
            <div>
              <span className="font-semibold">Funcionário:</span>{" "}
              {details.paciente_nome || details.paciente_codigo
                ? `${renderValue(details.paciente_nome)}${details.paciente_nome && details.paciente_codigo ? " (" : ""}${renderValue(details.paciente_codigo)}${details.paciente_nome && details.paciente_codigo ? ")" : ""}`
                : "—"}
            </div>
            <div>
              <span className="font-semibold">Tipo de recurso:</span>{" "}
              {renderValue(details.recurso_tipo)}
            </div>
            <div>
              <span className="font-semibold">Recurso ID:</span>{" "}
              {renderValue(details.recurso_id)}
            </div>
            <div>
              <span className="font-semibold">IP:</span> {renderValue(details.ip)}
            </div>
            <div className="md:col-span-2">
              <span className="font-semibold">User-Agent:</span>{" "}
              {renderValue(details.user_agent)}
            </div>
            <div className="md:col-span-2">
              <span className="font-semibold">Código de rastreio:</span>{" "}
              {renderValue(details.request_id)}
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-gray-700">
              Detalhes sanitizados
            </div>
            <pre className="max-h-56 overflow-auto rounded bg-white p-2 text-xs text-gray-800">
              {renderValue(details.detalhes)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
