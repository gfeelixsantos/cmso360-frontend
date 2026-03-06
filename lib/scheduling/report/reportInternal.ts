import { Scheduling } from "../interface/scheduling";
import { formatCPF } from "@/lib/utils";

const primaryColor = "#114F36";
const secondaryColor = "#AFCA07";
const lightGray = "#f8f9fa";
const borderColor = "#dee2e6";

export function reportInternal(employee: Scheduling): string {
  // Ticket como ID principal (prefixo + número)
  const ticketId = employee.TICKET
    ? `${employee.TICKET.prefixo || ""}${employee.TICKET.numero || ""}`
    : employee.CODIGO;

  const dataAgendamento = employee.DATAAGENDAMENTO || "N/A";
  const horaAgendamento = employee.HORARIO || "N/A";

  // Funções para extração e cálculo de dados de exame
  function parseDateTime(dateStr: string): Date | null {
    if (!dateStr) return null;
    try {
      return new Date(dateStr);
    } catch {
      return null;
    }
  }

  function formatExamDate(dataExame: string): string {
    const date = parseDateTime(dataExame);
    if (!date) return "Pendente";
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function extractTimeFromDateTime(dateStr: string): string {
    const date = parseDateTime(dateStr);
    if (!date) return "--:--";
    return date.toLocaleString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getTimeFromString(timeStr: string): Date | null {
    if (!timeStr || typeof timeStr !== "string") return null;
    const [h, m] = timeStr.split(":");
    const date = new Date();
    date.setHours(+h || 0, +m || 0);
    return date;
  }

  function computeDuration(start: string, end: string): string {
    const startDate = getTimeFromString(start);
    const endDate = getTimeFromString(end);
    if (!startDate || !endDate) return "";
    const diff = (endDate.getTime() - startDate.getTime()) / 60000;
    return diff >= 0 ? `${Math.round(diff)} min` : "";
  }

  function getStatusColor(status: string): string {
    const s = (status || "").toLowerCase();
    if (s.includes("concluído") || s.includes("realizado")) return "#28a745";
    if (s.includes("aguardando") || s.includes("pendente")) return "#ffc107";
    if (s.includes("alterado") || s.includes("anormalidade")) return "#dc3545";
    return "#6c757d";
  }

  // Monta tabela de exames com dataExame
  let examsTable = "";
  employee.EXAMES.forEach((exame) => {
    const examDate = formatExamDate(exame.dataExame);
    const examTime = extractTimeFromDateTime(exame.dataExame);
    const duration = exame.dataExame
      ? computeDuration(horaAgendamento, examTime)
      : "";
    const statusColor = getStatusColor(exame.status);

    examsTable += `
      <tr>
        <td style="padding:10px;font-weight:600;">${exame.nomeExame}</td>
        <td style="padding:10px;">${exame.sala || "—"}</td>
        <td style="padding:10px;">${exame.profissional || "—"}</td>
        <td style="padding:10px;">${examDate}</td>
        <td style="padding:10px;">${duration || "—"}</td>
        <td style="padding:10px;"><span style="background-color:${statusColor};color:white;padding:3px 8px;border-radius:3px;font-size:12px;">${exame.status || "Desconhecido"}</span></td>
      </tr>
    `;
  });

  const atendimentoStatus = employee.ATENDIMENTOSTATUS || "Processando";
  const asoStatus = employee.ASOSTATUS || "Em andamento";
  const parecerMedico = employee.PARECERMEDICO || "";
  const recomendacaoMedica = employee.RECOMENDACAOMEDICA || "";
  const riscos = employee.RISCOSASO || [];
  const observacoes = employee.OBSERVACOES || "";

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relatório de Atendimento - Saúde Ocupacional</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; background: #f0f2f5; padding: 20px; }
        .container { width: 210mm; margin: 0 auto; background: #fff; box-shadow: 0 0 15px rgba(0,0,0,0.1); padding: 20mm; line-height: 1.6; }
        @media print { body { background: none; padding: 0; } .container { box-shadow: none; padding: 0; } }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid ${primaryColor}; padding-bottom: 15px; margin-bottom: 20px; }
        .header-left h1 { font-size: 26px; color: ${primaryColor}; margin-bottom: 5px; }
        .header-left p { font-size: 13px; color: #666; }
        .ticket-badge { background: ${primaryColor}; color: white; padding: 15px 20px; border-radius: 6px; text-align: center; min-width: 120px; }
        .ticket-badge .label { font-size: 11px; text-transform: uppercase; opacity: 0.9; margin-bottom: 5px; }
        .ticket-badge .value { font-size: 28px; font-weight: bold; }
        .section { margin-bottom: 25px; }
        .section-title { background: ${lightGray}; padding: 10px 15px; font-weight: 700; font-size: 14px; text-transform: uppercase; color: ${primaryColor}; border-left: 4px solid ${primaryColor}; margin-bottom: 12px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
        .grid-full { grid-column: 1 / -1; }
        .field { border: 1px solid ${borderColor}; padding: 10px; border-radius: 4px; background: ${lightGray}; }
        .field-label { font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; margin-bottom: 3px; display: block; }
        .field-value { font-size: 14px; color: #333; word-break: break-word; }
        .status-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .status-ok { background: #d4edda; color: #155724; }
        .status-pending { background: #fff3cd; color: #856404; }
        .status-alert { background: #f8d7da; color: #721c24; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: ${primaryColor}; color: white; padding: 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; }
        td { padding: 10px; border-bottom: 1px solid ${borderColor}; font-size: 13px; }
        tr:hover { background: ${lightGray}; }
        .alert { padding: 12px; margin: 10px 0; border-radius: 4px; border-left: 4px solid; }
        .alert-danger { background: #f8d7da; border-left-color: #dc3545; color: #721c24; }
        .alert-info { background: #d1ecf1; border-left-color: #0c5460; color: #0c5460; }
        .risk-tag { display: inline-block; background: ${secondaryColor}; color: #333; padding: 4px 8px; margin: 2px; border-radius: 3px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-left">
            <h1>${employee.NOME.toUpperCase()}</h1>
            <p>CPF: ${employee.CPFFUNCIONARIO ? formatCPF(employee.CPFFUNCIONARIO) : "N/A"}</p>
            <p>Matrícula: ${employee.MATRICULAFUNCIONARIO || "N/A"}</p>
          </div>
          <div class="ticket-badge">
            <div class="label">Ticket</div>
            <div class="value">${ticketId}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Dados da Empresa e Cargo</div>
          <div class="grid">
            <div class="field"><span class="field-label">Empresa</span><span class="field-value">${employee.NOMEEMPRESA}</span></div>
            <div class="field"><span class="field-label">Código</span><span class="field-value">${employee.CODIGOEMPRESA}</span></div>
            <div class="field"><span class="field-label">Cargo</span><span class="field-value">${employee.NOMECARGO}</span></div>
            <div class="field"><span class="field-label">Setor</span><span class="field-value">${employee.NOMESETOR}</span></div>
            <div class="field grid-full"><span class="field-label">Unidade</span><span class="field-value">${employee.UNIDADEATENDIMENTO}</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Cronograma</div>
          <div class="grid">
            <div class="field"><span class="field-label">Data Agendamento</span><span class="field-value">${dataAgendamento}</span></div>
            <div class="field"><span class="field-label">Hora</span><span class="field-value">${horaAgendamento}</span></div>
            ${
              employee.TICKET?.emissao
                ? `<div class="field"><span class="field-label">Entrada</span><span class="field-value">${new Date(employee.TICKET.emissao).toLocaleString("pt-BR")}</span></div>`
                : ""
            }
            <div class="field"><span class="field-label">Tipo Exame</span><span class="field-value">${employee.TIPOEXAMENOME}</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Status</div>
          <div class="grid">
            <div class="field"><span class="field-label">Atendimento</span><span class="field-value"><span class="status-badge status-${atendimentoStatus.includes("Finalizado") || atendimentoStatus.includes("Concluído") ? "ok" : "pending"}">${atendimentoStatus}</span></span></div>
            <div class="field"><span class="field-label">ASO</span><span class="field-value"><span class="status-badge status-${asoStatus.includes("Liberado") || asoStatus.includes("Aprovado") ? "ok" : asoStatus.includes("Restrição") ? "alert" : "pending"}">${asoStatus}</span></span></div>
          </div>
          ${
            riscos && riscos.length > 0
              ? `<div class="field grid-full"><span class="field-label">Riscos</span><span class="field-value">${riscos.map((r) => `<div class="risk-tag">${r.risco}</div>`).join("")}</span></div>`
              : ""
          }
        </div>

        <div class="section">
          <div class="section-title">Exames Realizados</div>
          <table>
            <thead><tr><th>Exame</th><th>Sala</th><th>Profissional</th><th>Data/Hora</th><th>Duração</th><th>Status</th></tr></thead>
            <tbody>${examsTable || '<tr><td colspan="6" style="text-align:center;padding:20px;">Pendente</td></tr>'}</tbody>
          </table>
        </div>

        ${parecerMedico ? `<div class="section"><div class="section-title">Parecer Médico</div><div class="alert alert-info">${parecerMedico}</div></div>` : ""}
        
        ${
          recomendacaoMedica
            ? `<div class="section"><div class="section-title">Recomendações</div><div class="alert alert-${recomendacaoMedica.includes("Restrição") || recomendacaoMedica.includes("Afastamento") ? "danger" : "info"}">${recomendacaoMedica}</div></div>`
            : ""
        }

        ${observacoes ? `<div class="section"><div class="section-title">Observações</div><div class="field grid-full"><span class="field-value">${observacoes}</span></div></div>` : ""}

        <div style="margin-top: 40px; padding-top: 15px; border-top: 2px solid ${borderColor}; font-size: 12px; color: #666; text-align: center;">
          <p>Relatório gerado em ${new Date().toLocaleString("pt-BR")} | Documento confidencial</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
