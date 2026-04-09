import { Scheduling } from "../interface/scheduling";

import { formatCPF } from "@/lib/utils";

const primaryColor = "#1f5f46";
const accentColor = "#9bc53d";
const borderColor = "#E5E7EB";
const subtleText = "#6B7280";

export function reportInternal(employee: Scheduling): string {
  const dataAgendamento = employee.DATAAGENDAMENTO || "N/A";
  const horaAgendamento = employee.HORARIO || "N/A";

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

  const examesFiltrados =
    employee.EXAMES?.filter(
      (exame) =>
        exame.profissional &&
        exame.profissional.trim() !== "" &&
        exame.sala &&
        exame.sala.trim() !== "",
    ) || [];

  let examsTable = "";

  examesFiltrados.forEach((exame) => {
    const examDate = formatExamDate(exame.dataExame);

    examsTable += `
      <tr>
        <td class="td">${exame.nomeExame}</td>
        <td class="td">${exame.sala || "â€”"}</td>
        <td class="td">${exame.profissional || "â€”"}</td>
        <td class="td">${examDate}</td>
      </tr>
    `;
  });

  const recomendacaoMedica = employee.RECOMENDACAOMEDICA || "";
  const riscos = employee.RISCOSASO || [];
  const observacoes = employee.OBSERVACOES || "";

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

<title>RelatÃ³rio - ${employee.NOME}</title>

<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

<style>

*{
margin:0;
padding:0;
box-sizing:border-box;
}

body{
font-family:'Inter',system-ui;
background:#f3f4f6;
color:#111827;
padding:20px;
}

.container{
width:210mm;
min-height:297mm;
margin:auto;
background:white;
padding:16mm;
box-shadow:0 4px 18px rgba(0,0,0,0.08);
border-top:4px solid ${primaryColor};
}

@media print{
body{
background:none;
padding:0;
}
.container{
box-shadow:none;
}
}

.header{
display:flex;
justify-content:space-between;
align-items:center;
border-bottom:1px solid ${borderColor};
padding-bottom:8px;
margin-bottom:14px;
}

.employee-name{
font-size:18px;
font-weight:600;
color:${primaryColor};
}

.employee-meta{
font-size:11px;
color:${subtleText};
margin-top:3px;
}

.ticket{
font-weight:600;
font-size:11px;
margin-top:3px;
}

.logo{
height:36px;
}

.section{
margin-bottom:14px;
}

.section-title{
font-size:10px;
text-transform:uppercase;
letter-spacing:.08em;
color:${primaryColor};
margin-bottom:6px;
font-weight:600;
}

.info-grid{
display:grid;
grid-template-columns:1fr 1fr;
gap:14px;
}

.meta-table{
width:100%;
border-collapse:collapse;
font-size:11px;
}

.meta-table tr{
border-bottom:1px solid ${borderColor};
}

.meta-table td{
padding:4px 6px;
}

.meta-label{
width:140px;
color:${subtleText};
font-weight:500;
}

.risk-tag{
display:inline-block;
border:1px solid ${accentColor};
border-radius:14px;
padding:2px 7px;
font-size:9px;
margin:2px;
color:#1f2937;
}

table{
width:100%;
border-collapse:collapse;
font-size:11px;
}

th{
text-align:left;
font-size:10px;
text-transform:uppercase;
color:${subtleText};
padding:6px;
border-bottom:2px solid ${primaryColor};
}

.td{
padding:6px;
border-bottom:1px solid ${borderColor};
}

.observations{
border:1px solid ${borderColor};
padding:8px;
font-size:11px;
white-space:pre-line;
}

.footer{
margin-top:18px;
border-top:1px solid ${borderColor};
padding-top:6px;
font-size:9px;
color:${subtleText};
text-align:center;
}

</style>
</head>

<body>

<div class="container">

<div class="header">

<div>

<div class="employee-name">${employee.NOME}</div>

<div class="employee-meta">
CPF: ${employee.CPFFUNCIONARIO ? formatCPF(employee.CPFFUNCIONARIO) : "N/A"} â€¢ 
MatrÃ­cula: ${employee.MATRICULAFUNCIONARIO || "N/A"}
</div>

<div class="employee-meta">
<span>Empresa: </span>
<span>${employee.NOMEEMPRESA}</span>
</div>

</div>

<img src="https://cmsocupacional.com.br/images/logo.png" class="logo">

</div>

<div class="section">

<div class="section-title">InformaÃ§Ãµes Gerais</div>

<div class="info-grid">



<div>

<table class="meta-table">

<tr>
<td class="meta-label">CNPJ</td>
<td>${empresaDocumento}</td>
</tr>

<tr>
<td class="meta-label">Cargo</td>
<td>${employee.NOMECARGO}</td>
</tr>

<tr>
<td class="meta-label">Setor</td>
<td>${employee.NOMESETOR}</td>
</tr>

<tr>
<td class="meta-label">Unidade</td>
<td>${employee.NOMEUNIDADE}</td>
</tr>

</table>

</div>

<div>

<table class="meta-table">

<tr>
<td class="meta-label">Data e hora</td>
<td>${dataAgendamento} Ã s ${horaAgendamento}</td>
</tr>

<tr>
<td class="meta-label">Unidade atendimento</td>
<td>${employee.UNIDADEATENDIMENTO}</td>
</tr>

<tr>
<td class="meta-label">Tipo Exame</td>
<td>${employee.TIPOEXAMENOME}</td>
</tr>

<tr>
<td class="meta-label">Senha</td>
<td style="font-weight:600">${employee.TICKET.prefixo}${employee.TICKET.numero}</td>
</tr>

</table>

</div>

</div>

${
  riscos && riscos.length > 0
    ? `
<div style="margin-top:6px">
${riscos.map((r) => `<span class="risk-tag">${r.risco}</span>`).join("")}
</div>`
    : ""
}

</div>

${
  recomendacaoMedica
    ? `
<div class="section">
<div class="section-title">RecomendaÃ§Ã£o MÃ©dica</div>
<div class="observations">${recomendacaoMedica}</div>
</div>`
    : ""
}

${
  observacoes
    ? `
<div class="section">
<div class="section-title">ObservaÃ§Ãµes</div>
<div class="observations">${observacoes.replace(/\\n/g, "<br>")}</div>
</div>`
    : ""
}

<div class="section">

<div class="section-title">Exames Realizados</div>

${
  examsTable
    ? `
<table>

<thead>
<tr>
<th>Exame</th>
<th>Sala</th>
<th>Profissional</th>
<th>Data/Hora</th>
</tr>
</thead>

<tbody>
${examsTable}
</tbody>

</table>
`
    : `
<div class="observations" style="text-align:center">
Nenhum exame com profissional e sala designados
</div>
`
}

</div>

<div class="footer">
RelatÃ³rio gerado em ${new Date().toLocaleString("pt-BR")} <br>
Documento confidencial
</div>

</div>

</body>
</html>
`;
}
