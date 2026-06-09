"use client";

import { AuditLogRecord } from "@/lib/audit-log/types";
import { getAcaoLabel } from "@/lib/audit-log/action-labels";
import CmsoCircularLoading from "@/components/shared/CmsoCircularLoading";

import { DetalhesColapsavel } from "./DetalhesColapsavel";
import { AUDIT_PRIMARY_COLUMNS } from "./presentation.mjs";

interface AuditLogsTableProps {
  records: AuditLogRecord[];
  isLoading: boolean;
}

function formatFuncionario(record: AuditLogRecord) {
  if (record.paciente_nome && record.paciente_codigo) {
    return `${record.paciente_nome} (${record.paciente_codigo})`;
  }

  return record.paciente_nome ?? record.paciente_codigo ?? "—";
}

function formatRastreio(requestId: string | null) {
  if (!requestId) return "—";
  return requestId.length > 24 ? `${requestId.slice(0, 24)}...` : requestId;
}

export function AuditLogsTable({ records, isLoading }: AuditLogsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
          <tr>
            {AUDIT_PRIMARY_COLUMNS.map((col) => (
              <th
                key={col}
                className="px-3 py-2 text-left font-medium whitespace-nowrap"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td
                colSpan={AUDIT_PRIMARY_COLUMNS.length}
                className="px-3 py-6"
              >
                <CmsoCircularLoading
                  title="Carregando auditoria..."
                  description="Aguarde um momento"
                  iconSize={40}
                  fullHeight={false}
                />
              </td>
            </tr>
          )}

          {!isLoading && records.length === 0 && (
            <tr>
              <td
                colSpan={AUDIT_PRIMARY_COLUMNS.length}
                className="px-3 py-6 text-center text-gray-500"
              >
                Nenhum registro encontrado para os filtros aplicados.
              </td>
            </tr>
          )}

          {!isLoading &&
            records.map((record, index) => (
              <tr
                key={record.id}
                className={index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
              >
                <td className="px-3 py-2 border-t border-gray-100 whitespace-nowrap">
                  {new Date(record.created_at).toLocaleString("pt-BR")}
                </td>
                <td className="px-3 py-2 border-t border-gray-100">
                  {record.user_nome ?? record.user_codigo ?? "—"}
                </td>
                <td
                  className="px-3 py-2 border-t border-gray-100 whitespace-nowrap"
                  title={record.acao}
                >
                  {getAcaoLabel(record.acao)}
                </td>
                <td className="px-3 py-2 border-t border-gray-100">
                  {record.unidade ?? "—"}
                </td>
                <td className="px-3 py-2 border-t border-gray-100">
                  {formatFuncionario(record)}
                </td>
                <td className="px-3 py-2 border-t border-gray-100">
                  <DetalhesColapsavel record={record} />
                </td>
                <td
                  className="px-3 py-2 border-t border-gray-100 font-mono text-xs"
                  title={record.request_id ?? undefined}
                >
                  {formatRastreio(record.request_id)}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
