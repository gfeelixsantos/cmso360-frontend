// Geração de relatório
import { Scheduling } from "../interface/scheduling";
import { formatCPF } from "@/lib/utils";

const primaryColor = "#0B3B2A";
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
    if (s.includes("finalizado") || s.includes("concluído") || s.includes("realizado")) return "#28a745";
    if (s.includes("aguardando") || s.includes("pendente")) return "#ffc107";
    if (s.includes("alterado") || s.includes("anormalidade")) return "#dc3545";
    return "#6c757d";
  }

  // Filtra exames que possuem profissional e sala
  const examesFiltrados = employee.EXAMES?.filter(exame =>
    exame.profissional && exame.profissional.trim() !== "" &&
    exame.sala && exame.sala.trim() !== ""
  ) || [];

  // Monta tabela de exames apenas com os filtrados
  let examsTable = "";
  examesFiltrados.forEach((exame) => {
    const examDate = formatExamDate(exame.dataExame);
    const examTime = extractTimeFromDateTime(exame.dataExame);
    const duration = exame.dataExame
      ? computeDuration(horaAgendamento, examTime)
      : "";
    const statusColor = getStatusColor(exame.status);

    examsTable += `
      <tr>
        <td style="padding: 10px 8px; font-weight: 500; color: #1F2937; border-bottom: 1px solid ${borderColor}; font-size: 12px;">${exame.nomeExame}</td>
        <td style="padding: 10px 8px; color: #4B5563; border-bottom: 1px solid ${borderColor}; font-size: 12px;">${exame.sala || "—"}</td>
        <td style="padding: 10px 8px; color: #4B5563; border-bottom: 1px solid ${borderColor}; font-size: 12px;">${exame.profissional || "—"}</td>
        <td style="padding: 10px 8px; color: #4B5563; border-bottom: 1px solid ${borderColor}; font-size: 12px;">${examDate}</td>
        <td style="padding: 10px 8px; color: #4B5563; border-bottom: 1px solid ${borderColor}; font-size: 12px;">${duration || "—"}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid ${borderColor};">
          <span style="background-color: ${statusColor}; color: white; padding: 3px 8px; border-radius: 20px; font-size: 10px; font-weight: 500; display: inline-block; white-space: nowrap;">
            ${exame.status || "Desconhecido"}
          </span>
        </td>
      </tr>
    `;
  });

  const recomendacaoMedica = employee.RECOMENDACAOMEDICA || "";
  const riscos = employee.RISCOSASO || [];
  const observacoes = employee.OBSERVACOES || "";

  // Formatação do documento da empresa
  const empresaDocumento = employee.CNPJEMPRESA
    ? employee.CNPJEMPRESA
    : employee.CPFEMPRESA
      ? formatCPF(employee.CPFEMPRESA)
      : "N/A";

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relatório de Saúde Ocupacional - ${employee.NOME}</title>
      <style>
        * { 
          margin: 0; 
          padding: 0; 
          box-sizing: border-box; 
        }
        
        body { 
          font-family: 'Segoe UI', Roboto, -apple-system, BlinkMacSystemFont, sans-serif; 
          color: #1F2937; 
          background: #f0f2f5; 
          padding: 20px; 
          line-height: 1.4;
        }
        
        .container { 
          width: 210mm; 
          min-height: 297mm;
          margin: 0 auto; 
          background: #fff; 
          box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
          padding: 15mm 20mm; 
          position: relative;
        }
        
        @media print { 
          body { 
            background: none; 
            padding: 0; 
          } 
          .container { 
            box-shadow: none; 
            padding: 15mm 20mm; 
          }
          .no-print {
            display: none !important;
          }
        }
        
        /* Botão de impressão */
        .print-button-container {
          text-align: right;
          margin-bottom: 15px;
        }
        
        .print-button {
          background-color: ${primaryColor};
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: background-color 0.2s;
        }
        
        .print-button:hover {
          background-color: #0a2f1f;
        }
        
        .print-button svg {
          width: 16px;
          height: 16px;
        }
        
        /* Header */
        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start; 
          border-bottom: 2px solid ${primaryColor}; 
          padding-bottom: 12px; 
          margin-bottom: 20px; 
        }
        
        .header-left h1 { 
          font-size: 20px; 
          color: ${primaryColor}; 
          margin-bottom: 6px; 
          font-weight: 600;
          letter-spacing: -0.2px;
        }
        
        .header-info {
          display: flex;
          gap: 20px;
          font-size: 12px;
          color: #6B7280;
          flex-wrap: wrap;
        }
        
        .header-info-item {
          display: flex;
          align-items: center;
        }
        
        .header-info-label {
          font-weight: 600;
          color: #4B5563;
          margin-right: 4px;
        }
        
        .company-logo {
          height: 45px;
          width: auto;
          max-width: 180px;
          object-fit: contain;
        }
        
        /* Sections */
        .section { 
          margin-bottom: 20px; 
        }
        
        .section-title { 
          background: ${lightGray}; 
          padding: 8px 12px; 
          font-weight: 600; 
          font-size: 13px; 
          text-transform: uppercase; 
          color: ${primaryColor}; 
          border-left: 3px solid ${primaryColor}; 
          margin-bottom: 12px; 
          letter-spacing: 0.2px;
        }
        
        /* Grid Layout */
        .grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
        }
        
        .grid-4 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 12px;
        }
        
        .grid-full { 
          grid-column: 1 / -1; 
        }
        
        /* Fields */
        .field { 
          border: 1px solid ${borderColor}; 
          padding: 10px; 
          border-radius: 4px; 
          background: ${lightGray}; 
        }
        
        .field-label { 
          font-size: 10px; 
          font-weight: 600; 
          color: #6B7280; 
          text-transform: uppercase; 
          margin-bottom: 2px; 
          display: block; 
          letter-spacing: 0.2px;
        }
        
        .field-value { 
          font-size: 13px; 
          color: #1F2937; 
          font-weight: 500;
          word-break: break-word; 
        }
        
        /* Risk Tags */
        .risk-tag { 
          display: inline-block; 
          background: ${secondaryColor}; 
          color: #1F2937; 
          padding: 3px 8px; 
          margin: 2px; 
          border-radius: 20px; 
          font-size: 11px; 
          font-weight: 500;
        }
        
        /* Company info line */
        .company-info {
          font-size: 11px;
          color: #6B7280;
          margin-top: 2px;
        }
        
        /* Table */
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 5px; 
          font-size: 12px;
        }
        
        th { 
          background: ${primaryColor}; 
          color: white; 
          padding: 8px 8px; 
          text-align: left; 
          font-weight: 600; 
          font-size: 11px; 
          text-transform: uppercase; 
          letter-spacing: 0.2px;
        }
        
        th:first-child {
          border-top-left-radius: 4px;
        }
        
        th:last-child {
          border-top-right-radius: 4px;
        }
        
        /* Footer */
        .footer { 
          margin-top: 30px; 
          padding-top: 15px; 
          border-top: 1px solid ${borderColor}; 
          font-size: 10px; 
          color: #9CA3AF; 
          text-align: center; 
        }
        
        /* Observations box */
        .observations-box {
          background: ${lightGray};
          border: 1px solid ${borderColor};
          border-radius: 4px;
          padding: 12px;
          font-size: 12px;
          color: #1F2937;
          white-space: pre-line;
        }
        
        /* Alert boxes */
        .alert { 
          padding: 12px; 
          margin: 10px 0; 
          border-radius: 4px; 
          border-left: 3px solid; 
          font-size: 12px;
        }
        
        .alert-info { 
          background: #d1ecf1; 
          border-left-color: #0c5460; 
          color: #0c5460; 
        }
        
        .alert-danger { 
          background: #f8d7da; 
          border-left-color: #dc3545; 
          color: #721c24; 
        }
        
        /* Print optimization */
        @media print {
          tr {
            page-break-inside: avoid;
          }
          
          .section {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <!-- Botão de imprimir (não aparece na impressão) -->
      <div class="print-button-container no-print">
        <button class="print-button" onclick="window.print()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <path d="M6 9V3h12v6"/>
            <path d="M6 15h12v6H6z"/>
          </svg>
          Imprimir / Salvar PDF
        </button>
      </div>

      <div class="container">
        <!-- Header com logo no canto superior direito -->
        <div class="header">
          <div class="header-left">
            <h1>${employee.NOME}</h1>
            <div class="header-info">
              <div class="header-info-item">
                <span class="header-info-label">CPF:</span>
                <span>${employee.CPFFUNCIONARIO ? formatCPF(employee.CPFFUNCIONARIO) : "N/A"}</span>
              </div>
              <div class="header-info-item">
                <span class="header-info-label">Matrícula:</span>
                <span>${employee.MATRICULAFUNCIONARIO || "N/A"}</span>
              </div>
              <div class="header-info-item">
                <span class="header-info-label">Nascimento:</span>
                <span>${employee.DATANASCIMENTO || "N/A"}</span>
              </div>
            </div>
          </div>
          <img src="https://cmsocupacional.com.br/images/logo.png" alt="CMS Ocupacional" class="company-logo" onerror="this.style.display='none'">
        </div>

        <!-- Dados da Empresa com cargo, setor e unidade na mesma linha -->
        <div class="section">
          <div class="section-title">Dados da Empresa</div>
          <div class="field" style="margin-bottom: 12px;">
            <span class="field-label">Empresa</span>
            <span class="field-value" style="font-size: 14px; font-weight: 600;">${employee.NOMEEMPRESA}</span>
            <div class="company-info">${empresaDocumento}</div>
          </div>
          
          <!-- Cargo, Setor e Unidade na mesma linha -->
          <div class="grid-3">
            <div class="field">
              <span class="field-label">Cargo</span>
              <span class="field-value" style="font-size: 12px;">${employee.NOMECARGO}</span>
            </div>
            <div class="field">
              <span class="field-label">Setor</span>
              <span class="field-value" style="font-size: 12px;">${employee.NOMESETOR}</span>
            </div>
            <div class="field">
              <span class="field-label">Unidade</span>
              <span class="field-value" style="font-size: 12px;">${employee.UNIDADEATENDIMENTO}</span>
            </div>
          </div>
        </div>

        <!-- Cronograma (com informação do ticket) -->
        <div class="section">
          <div class="section-title">Cronograma</div>
          <div class="grid-4">
            <div class="field">
              <span class="field-label">Data Agendamento</span>
              <span class="field-value" style="font-size: 12px;">${dataAgendamento}</span>
            </div>
            <div class="field">
              <span class="field-label">Hora</span>
              <span class="field-value" style="font-size: 12px;">${horaAgendamento}</span>
            </div>
            <div class="field">
              <span class="field-label">Tipo Exame</span>
              <span class="field-value" style="font-size: 12px;">${employee.TIPOEXAMENOME}</span>
            </div>
            <div class="field">
              <span class="field-label">Ticket</span>
              <span class="field-value" style="font-size: 12px; font-weight: 600; color: ${primaryColor};">${ticketId}</span>
            </div>
          </div>
          
          <!-- Riscos (se houver) -->
          ${riscos && riscos.length > 0 ? `
          <div style="margin-top: 12px;">
            <div style="margin-bottom: 6px; font-weight: 600; color: ${primaryColor}; font-size: 12px;">Fatores de Risco</div>
            <div>
              ${riscos.map((r) => `<span class="risk-tag">${r.risco}</span>`).join("")}
            </div>
          </div>
          ` : ""}
        </div>

        <!-- Recomendações (se houver) -->
        ${recomendacaoMedica ? `
        <div class="section">
          <div class="section-title">Recomendações Médicas</div>
          <div class="alert ${recomendacaoMedica.toLowerCase().includes("restrição") || recomendacaoMedica.toLowerCase().includes("afastamento") ? "alert-danger" : "alert-info"}">
            ${recomendacaoMedica}
          </div>
        </div>
        ` : ""}

        <!-- Observações (se houver) -->
        ${observacoes ? `
        <div class="section">
          <div class="section-title">Observações</div>
          <div class="observations-box" style="font-size: 12px;">
            ${observacoes.replace(/\n/g, '<br>')}
          </div>
        </div>
        ` : ""}

        <!-- Exames Realizados (apenas com profissional e sala) -->
        <div class="section">
          <div class="section-title">Exames Realizados</div>
          ${examsTable ? `
          <table>
            <thead>
              <tr>
                <th style="padding: 8px;">Exame</th>
                <th style="padding: 8px;">Sala</th>
                <th style="padding: 8px;">Profissional</th>
                <th style="padding: 8px;">Data/Hora</th>
                <th style="padding: 8px;">Duração</th>
                <th style="padding: 8px;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${examsTable}
            </tbody>
          </table>
          ` : `
          <div style="text-align: center; padding: 20px; color: #6B7280; background: ${lightGray}; border-radius: 4px; font-size: 12px;">
            Nenhum exame com profissional e sala designados
          </div>
          `}
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>Relatório gerado em ${new Date().toLocaleString("pt-BR")}</p>
          <p style="margin-top: 3px;">Documento confidencial - Uso exclusivo da empresa</p>
        </div>
      </div>

      <script>
        // Script para garantir que o botão de impressão funcione
        document.querySelector('.print-button')?.addEventListener('click', function() {
          window.print();
        });
      </script>
    </body>
    </html>
  `;
}