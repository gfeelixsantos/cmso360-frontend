// utils/openHistoricoHTML.ts
import { AudiometriaExportaDados } from "@/lib/soc/interfaces/AudiometriaExportaDados";
import { adaptExportaDadosToAudiometriaData } from "./audiometriaAdapter";
import { generateAudiogramSVG } from "./AudiometriaGraphics";
import { AudiometriaCalculator } from "./AudiometriaOcupacional";


export function openHistoricoHTML(
  audiometrias: AudiometriaExportaDados[], 
  atendimento: any
) {
  const windowWidth = 1400;
  const windowHeight = 900;
  const left = (window.screen.width - windowWidth) / 2;
  const top = (window.screen.height - windowHeight) / 2;

  const newWindow = window.open(
    '',
    '_blank',
    `width=${windowWidth},height=${windowHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`
  );

  if (!newWindow) {
    alert('Não foi possível abrir a janela. Verifique as configurações do seu navegador.');
    return;
  }

  // Ordenar por data (mais recente primeiro)
  const audiometriasOrdenadas = [...audiometrias].sort((a, b) => {
    const dateA = a.DATA_REALIZACAO?.split('/').reverse().join('-');
    const dateB = b.DATA_REALIZACAO?.split('/').reverse().join('-');
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  // Gerar HTML para cada audiometria
  const audiometriasHTML = audiometriasOrdenadas.map(audiometria => {
    // Adaptar os dados para o formato do componente
    const audiometriaData = adaptExportaDadosToAudiometriaData(audiometria, atendimento);
    
    // CALCULAR OS RESULTADOS USANDO O MESMO CALCULATOR DO COMPONENTE
    const resultados = AudiometriaCalculator.calcularTodosResultados(audiometriaData);
    
    // Merge dos dados originais com os resultados calculados
    const dadosCompletos = {
      ...audiometriaData,
      ...resultados
    };
    
    const graficos = generateAudiogramSVG(dadosCompletos);
    
    return `
      <div class="audiometria-card">
        <!-- HEADER DO EXAME -->
        <div class="card-header">
          <div class="card-title">
            <span class="data-exame">${formatDateBR(audiometria.DATA_REALIZACAO)}</span>
            <span class="numero-guia">Guia: ${audiometria.NUMERO_GUIA || 'Não informado'}</span>
          </div>
          <span class="resultado-badge resultado-${getResultadoClass(dadosCompletos.resultadoOD)}">
            ${formatResultado(dadosCompletos.resultadoOD)}
          </span>
        </div>

        <!-- DADOS DO FUNCIONÁRIO E UNIDADE -->
        <div class="info-grid">
          ${createInfoItem('Unidade', audiometria.NOME_UNIDADE)}
          ${createInfoItem('Setor', audiometria.SETOR)}
          ${createInfoItem('Cargo', audiometria.CARGO)}
          ${createInfoItem('Função', audiometria.FUNCAO)}
          ${createInfoItem('Data Nascimento', formatDateBR(atendimento?.DATANASCIMENTO))}
          ${createInfoItem('Tipo Exame', atendimento?.TIPOEXAMENOME)}
          ${createInfoItem('Repouso Auditivo', dadosCompletos.repousoAuditivo === 'Sim' ? `${dadosCompletos.horasRepouso}h` : 'Não')}
          ${createInfoItem('Aparelho', dadosCompletos.tipoAudiometro)}
          ${createInfoItem('Otoscopia OD', formatOtoscopia(dadosCompletos.meatoscopiaOD))}
          ${createInfoItem('Otoscopia OE', formatOtoscopia(dadosCompletos.meatoscopiaOE))}
        </div>

        <!-- GRÁFICOS -->
        <div class="graficos-container">
          <div class="grafico-item">
            <div style="text-align: center; margin-bottom: 5px; color: #B71C1C; font-weight: bold;">OD</div>
            ${graficos.od}
          </div>
          <div class="grafico-item">
            <div style="text-align: center; margin-bottom: 5px; color: #0D47A1; font-weight: bold;">OE</div>
            ${graficos.oe}
          </div>
        </div>

        <!-- RESULTADOS - MESMO PADRÃO DO COMPONENTE -->
        <div class="resultados-container">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Resultado OD -->
            <div class="bg-red-50 p-4 rounded-lg border border-red-200">
              <h3 class="font-bold text-red-800 mb-4 text-center">OD - Ouvido Direito</h3>
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-semibold text-red-700 mb-1">
                    Classificação (Grau Lloyd & Kaplan)
                  </label>
                  <div class="${getClassificationClass(dadosCompletos.classificacaoOD)}">
                    ${formatClassification(dadosCompletos.classificacaoOD)}
                  </div>
                </div>
                
                <div class="grid grid-cols-3 gap-2 text-xs">
                  <div class="text-center">
                    <div class="font-semibold text-red-700">Média Tonal (4f)</div>
                    <div class="font-bold text-gray-800">${dadosCompletos.mediaTonalOD} dB</div>
                  </div>
                  <div class="text-center">
                    <div class="font-semibold text-red-700">Tipo de Perda</div>
                    <div class="font-bold text-gray-800">${dadosCompletos.tipoPerdaOD || '-'}</div>
                  </div>
                  <div class="text-center">
                    <div class="font-semibold text-red-700">Configuração</div>
                    <div class="font-bold text-gray-800">${dadosCompletos.configuracaoOD || '-'}</div>
                  </div>
                </div>
                
                <div class="text-xs text-gray-600 mt-2">
                  <span class="font-semibold">Frequências Alteradas:</span> 
                  ${dadosCompletos.frequenciasAlteradasOD || 'Nenhuma'}
                </div>
                
                ${dadosCompletos.entalhe4000HzOD ? `
                  <div class="mt-2 p-2 bg-orange-100 text-orange-800 rounded text-xs font-semibold">
                    ⚠ Entalhe em 4000Hz detectado
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Resultado OE -->
            <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 class="font-bold text-blue-800 mb-4 text-center">OE - Ouvido Esquerdo</h3>
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-semibold text-blue-700 mb-1">
                    Classificação (Grau Lloyd & Kaplan)
                  </label>
                  <div class="${getClassificationClass(dadosCompletos.classificacaoOE)}">
                    ${formatClassification(dadosCompletos.classificacaoOE)}
                  </div>
                </div>
                
                <div class="grid grid-cols-3 gap-2 text-xs">
                  <div class="text-center">
                    <div class="font-semibold text-blue-700">Média Tonal (4f)</div>
                    <div class="font-bold text-gray-800">${dadosCompletos.mediaTonalOE} dB</div>
                  </div>
                  <div class="text-center">
                    <div class="font-semibold text-blue-700">Tipo de Perda</div>
                    <div class="font-bold text-gray-800">${dadosCompletos.tipoPerdaOE || '-'}</div>
                  </div>
                  <div class="text-center">
                    <div class="font-semibold text-blue-700">Configuração</div>
                    <div class="font-bold text-gray-800">${dadosCompletos.configuracaoOE || '-'}</div>
                  </div>
                </div>
                
                <div class="text-xs text-gray-600 mt-2">
                  <span class="font-semibold">Frequências Alteradas:</span> 
                  ${dadosCompletos.frequenciasAlteradasOE || 'Nenhuma'}
                </div>
                
                ${dadosCompletos.entalhe4000HzOE ? `
                  <div class="mt-2 p-2 bg-orange-100 text-orange-800 rounded text-xs font-semibold">
                    ⚠ Entalhe em 4000Hz detectado
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- Classificação NR-7 -->
          <div class="mt-4 grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
            <div class="text-center">
              <span class="text-xs font-semibold text-gray-700">NR-7 OD:</span>
              <span class="text-xs ml-2 ${getNR7Class(dadosCompletos.classificacaoNR7OD)}">
                ${dadosCompletos.classificacaoNR7OD || 'Não classificado'}
              </span>
            </div>
            <div class="text-center">
              <span class="text-xs font-semibold text-gray-700">NR-7 OE:</span>
              <span class="text-xs ml-2 ${getNR7Class(dadosCompletos.classificacaoNR7OE)}">
                ${dadosCompletos.classificacaoNR7OE || 'Não classificado'}
              </span>
            </div>
          </div>
        </div>

        <!-- TABELA DE VALORES (USANDO DADOS ADAPTADOS) -->
        ${createTabelaValores(dadosCompletos)}
        
        <!-- IRF E SRT -->
        ${createIRFSRT(dadosCompletos)}
        
        <!-- OBSERVAÇÕES -->
        ${dadosCompletos.observacoes ? createObservacao('Geral', dadosCompletos.observacoes) : ''}
        
        <!-- PARECER E CONCLUSÃO -->
        <div class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 class="text-sm font-semibold text-gray-700 mb-2">Conclusão</h4>
          <p class="text-sm text-gray-600">${dadosCompletos.conclusao || 'Não informado'}</p>
          
          <div class="mt-3 p-3 bg-white rounded-lg border ${dadosCompletos.criterioPCD?.includes('Atende') ? 'border-green-300 bg-green-50' : 'border-gray-300'}">
            <h4 class="text-xs font-semibold ${dadosCompletos.criterioPCD?.includes('Atende') ? 'text-green-700' : 'text-gray-700'} mb-1">
              Critério PCD
            </h4>
            <p class="text-xs ${dadosCompletos.criterioPCD?.includes('Atende') ? 'text-green-600' : 'text-gray-600'}">
              ${dadosCompletos.criterioPCD || 'Não avaliado'}
            </p>
          </div>
        </div>
        
        <!-- RODAPÉ -->
        <div class="rodape">
          <span>
            <strong>Examinador(es):</strong> 
            ${audiometria.CONSELHO_CLASSE_EXAMINADOR1 || ''} ${audiometria.NUM_CONSELHO_CLASSE_EXAMINADOR1 || ''}
            ${audiometria.CONSELHO_CLASSE_EXAMINADOR2 ? `, ${audiometria.CONSELHO_CLASSE_EXAMINADOR2} ${audiometria.NUM_CONSELHO_CLASSE_EXAMINADOR2 || ''}` : ''}
          </span>
          <span>
            <strong>CPF(s):</strong> 
            ${formatCPF(audiometria.CPF_FONO) || ''} 
            ${audiometria.CPF_FONO2 ? `/ ${formatCPF(audiometria.CPF_FONO2)}` : ''}
          </span>
        </div>
      </div>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Histórico de Audiometrias - ${atendimento?.NOME || 'Paciente'}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f5f5f5;
          padding: 20px;
        }
        
        .container {
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 25px;
          border-radius: 10px;
          margin-bottom: 30px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header h1 { font-size: 24px; margin-bottom: 10px; }
        .header p { font-size: 16px; opacity: 0.95; margin-bottom: 5px; }
        .total-exames { margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.3); font-weight: 500; }
        
        .audiometria-card {
          background: white;
          border-radius: 12px;
          padding: 25px;
          margin-bottom: 30px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          border: 1px solid #e0e0e0;
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #f0f0f0;
        }
        
        .card-title { display: flex; flex-direction: column; }
        .data-exame { font-size: 20px; font-weight: bold; color: #2c3e50; }
        .numero-guia { font-size: 14px; color: #7f8c8d; margin-top: 5px; }
        
        .resultado-badge {
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
          text-transform: uppercase;
        }
        
        .resultado-normal { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .resultado-alerta { background: #fff3cd; color: #856404; border: 1px solid #ffeeba; }
        .resultado-pair { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .resultado-outros { background: #e2e3e5; color: #383d41; border: 1px solid #d6d8db; }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 15px;
          margin-bottom: 25px;
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
        }
        
        .info-label {
          font-size: 12px;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        
        .info-value {
          font-size: 15px;
          font-weight: 500;
          color: #2c3e50;
        }
        
        .graficos-container {
          display: flex;
          flex-wrap: wrap;
          gap: 30px;
          justify-content: center;
          margin: 25px 0;
          padding: 20px;
          background: white;
          border-radius: 8px;
        }
        
        .grafico-item svg {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        
        .resultados-container {
          margin: 20px 0;
          padding: 20px;
          background: white;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }
        
        .grid {
          display: grid;
        }
        
        .grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
        .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
        .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
        .gap-2 { gap: 0.5rem; }
        .gap-4 { gap: 1rem; }
        .gap-6 { gap: 1.5rem; }
        
        .bg-red-50 { background-color: #fef2f2; }
        .bg-blue-50 { background-color: #eff6ff; }
        .bg-green-50 { background-color: #f0fdf4; }
        .bg-orange-100 { background-color: #fff3cd; }
        .bg-gray-50 { background-color: #f9fafb; }
        .bg-white { background-color: white; }
        
        .border-red-200 { border-color: #fecaca; }
        .border-blue-200 { border-color: #bfdbfe; }
        .border-green-300 { border-color: #86efac; }
        .border-gray-200 { border-color: #e5e7eb; }
        .border-gray-300 { border-color: #d1d5db; }
        
        .text-red-800 { color: #991b1b; }
        .text-blue-800 { color: #1e40af; }
        .text-red-700 { color: #b91c1c; }
        .text-blue-700 { color: #1d4ed8; }
        .text-green-700 { color: #15803d; }
        .text-green-600 { color: #16a34a; }
        .text-orange-800 { color: #9a3412; }
        .text-gray-600 { color: #4b5563; }
        .text-gray-700 { color: #374151; }
        .text-gray-800 { color: #1f2937; }
        
        .font-bold { font-weight: 700; }
        .font-semibold { font-weight: 600; }
        
        .text-center { text-align: center; }
        .text-xs { font-size: 0.75rem; }
        .text-sm { font-size: 0.875rem; }
        
        .p-2 { padding: 0.5rem; }
        .p-3 { padding: 0.75rem; }
        .p-4 { padding: 1rem; }
        
        .mt-2 { margin-top: 0.5rem; }
        .mt-3 { margin-top: 0.75rem; }
        .mt-4 { margin-top: 1rem; }
        .mb-1 { margin-bottom: 0.25rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-4 { margin-bottom: 1rem; }
        
        .rounded { border-radius: 0.25rem; }
        .rounded-lg { border-radius: 0.5rem; }
        
        .border { border-width: 1px; border-style: solid; }
        
        .classificacao-normal {
          background-color: #d4edda;
          color: #155724;
          padding: 0.5rem;
          border-radius: 0.25rem;
          font-weight: 600;
          font-size: 0.875rem;
          text-align: center;
        }
        
        .classificacao-leve {
          background-color: #fff3cd;
          color: #856404;
          padding: 0.5rem;
          border-radius: 0.25rem;
          font-weight: 600;
          font-size: 0.875rem;
          text-align: center;
        }
        
        .classificacao-moderada {
          background-color: #fed7aa;
          color: #9a3412;
          padding: 0.5rem;
          border-radius: 0.25rem;
          font-weight: 600;
          font-size: 0.875rem;
          text-align: center;
        }
        
        .classificacao-severa {
          background-color: #fecaca;
          color: #991b1b;
          padding: 0.5rem;
          border-radius: 0.25rem;
          font-weight: 600;
          font-size: 0.875rem;
          text-align: center;
        }
        
        .classificacao-profunda {
          background-color: #e11d48;
          color: white;
          padding: 0.5rem;
          border-radius: 0.25rem;
          font-weight: 600;
          font-size: 0.875rem;
          text-align: center;
        }
        
        .tabela-valores {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          margin-top: 20px;
          background: white;
        }
        
        .tabela-valores th {
          background: #343a40;
          color: white;
          padding: 10px;
          text-align: center;
          font-size: 12px;
        }
        
        .tabela-valores td {
          padding: 8px;
          text-align: center;
          border: 1px solid #dee2e6;
        }
        
        .tabela-valores tr:nth-child(even) { background: #f8f9fa; }
        .tabela-valores .subcabecalho { background: #e9ecef; font-weight: 600; }
        
        .irf-srt-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 20px;
          padding: 20px;
          background: #e8f4f8;
          border-radius: 8px;
        }
        
        .observacao {
          margin-top: 20px;
          padding: 15px;
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          border-radius: 4px;
        }
        
        .observacao h4 { 
          color: #856404; 
          margin-bottom: 8px;
          font-size: 14px;
        }
        .observacao p { 
          color: #856404; 
          line-height: 1.5;
          font-size: 14px;
        }
        
        .rodape {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          color: #6c757d;
          font-size: 13px;
        }
        
        .sem-resultados {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 12px;
          color: #6c757d;
        }
        
        .btn-print {
          margin-top: 15px;
          padding: 10px 20px;
          background: white;
          color: #667eea;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: bold;
          font-size: 14px;
          transition: all 0.3s;
        }
        
        .btn-print:hover {
          background: #f8f9fa;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .legenda-entalhe {
          display: inline-block;
          padding: 2px 8px;
          background: #ff9800;
          color: white;
          border-radius: 12px;
          font-size: 11px;
          margin-left: 8px;
        }
        
        .nr7-normal { color: #155724; font-weight: 600; }
        .nr7-leve { color: #856404; font-weight: 600; }
        .nr7-moderado { color: #9a3412; font-weight: 600; }
        .nr7-severo { color: #991b1b; font-weight: 600; }
        .nr7-profundo { color: #831843; font-weight: 600; }
        
        @media (min-width: 768px) {
          .md\\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
        }
        
        @media print {
          body { background: white; padding: 10px; }
          .header { background: #f8f9fa; color: black; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .audiometria-card { break-inside: avoid; box-shadow: none; border: 1px solid #ddd; }
          .btn-print { display: none; }
          .resultado-badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .bg-red-50, .bg-blue-50, .bg-green-50, .bg-orange-100 { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Histórico de Audiometrias</h1>
          <p><strong>Paciente:</strong> ${atendimento?.NOME || 'Não informado'}</p>
          <p><strong>CPF:</strong> ${formatCPF(atendimento?.CPFFUNCIONARIO)}</p>
          <p><strong>Matrícula:</strong> ${atendimento?.MATRICULAFUNCIONARIO || 'Não informado'}</p>
          <p><strong>Empresa:</strong> ${atendimento?.NOMEEMPRESA || 'Não informado'}</p>
          <p><strong>CNPJ:</strong> ${formatCNPJ(atendimento?.CNPJEMPRESA)}</p>
          <p class="total-exames">Total de exames encontrados: ${audiometrias.length}</p>
          <button class="btn-print" onclick="window.print()">
            🖨️ Imprimir Histórico
          </button>
        </div>
        
        ${audiometrias.length === 0 
          ? '<div class="sem-resultados"><h2>Nenhuma audiometria encontrada</h2><p>Não há exames anteriores registrados para este paciente.</p></div>'
          : audiometriasHTML
        }
      </div>
    </body>
    </html>
  `;

  newWindow.document.write(htmlContent);
  newWindow.document.close();
}

// ============= FUNÇÕES AUXILIARES ATUALIZADAS =============

function getResultadoClass(resultado: string): string {
  if (resultado.includes('NORMAL')) return 'normal';
  if (resultado.includes('SUGESTIVO')) return 'alerta';
  if (resultado.includes('PAIR') || resultado.includes('INDUZIDA')) return 'pair';
  return 'outros';
}

function formatResultado(resultado: string): string {
  return resultado?.replace(/_/g, ' ') || 'Não informado';
}

function formatDateBR(date?: string): string {
  if (!date) return 'Não informado';
  try {
    // Se já estiver no formato DD/MM/AAAA
    if (date.includes('/')) {
      return date;
    }
    // Se for ISO ou outro formato
    return new Date(date).toLocaleDateString('pt-BR');
  } catch {
    return date;
  }
}

function formatOtoscopia(otoscopia: string): string {
  switch (otoscopia) {
    case 'SEM_OBSTRUCAO': return 'Sem obstrução';
    case 'COM_OBSTRUCAO_PARCIAL': return 'Obstrução parcial';
    case 'COM_OBSTRUCAO_TOTAL': return 'Obstrução total';
    default: return otoscopia || 'Não informado';
  }
}

function formatClassification(classification: string): string {
  if (!classification) return 'Não classificado';
  if (classification.includes('normalidade') || classification === 'Normal' || classification === '-') {
    return 'Dentro dos padrões da normalidade';
  }
  return classification;
}

function getClassificationClass(classification: string): string {
  if (!classification) return 'classificacao-outros';
  if (classification.includes('normalidade') || classification === 'Normal' || classification === '-') {
    return 'classificacao-normal';
  }
  if (classification.includes('Leve')) return 'classificacao-leve';
  if (classification.includes('Moderada')) return 'classificacao-moderada';
  if (classification.includes('Severa')) return 'classificacao-severa';
  if (classification.includes('Profunda')) return 'classificacao-profunda';
  return 'classificacao-outros';
}

function getNR7Class(nr7: string): string {
  if (!nr7) return '';
  if (nr7.includes('Normal')) return 'nr7-normal';
  if (nr7.includes('Leve')) return 'nr7-leve';
  if (nr7.includes('Moderado')) return 'nr7-moderado';
  if (nr7.includes('Severo')) return 'nr7-severo';
  if (nr7.includes('Profundo')) return 'nr7-profundo';
  return '';
}

function createInfoItem(label: string, value: string | undefined): string {
  return `
    <div class="info-item">
      <span class="info-label">${label}</span>
      <span class="info-value">${value || 'Não informado'}</span>
    </div>
  `;
}

function createTabelaValores(data: any): string {
  return `
    <div class="valores-audiometria">
      <h4 style="margin-bottom: 10px; color: #495057; display: flex; align-items: center;">
        Tabela de Valores (dB)
        ${data.entalhe4000HzOD || data.entalhe4000HzOE ? '<span class="legenda-entalhe">Entalhe em 4000Hz</span>' : ''}
      </h4>
      <table class="tabela-valores">
        <thead>
          <tr>
            <th>Freq (Hz)</th>
            <th colspan="2">250</th>
            <th colspan="2">500</th>
            <th colspan="2">1000</th>
            <th colspan="2">2000</th>
            <th colspan="2">3000</th>
            <th colspan="2">4000</th>
            <th colspan="2">6000</th>
            <th colspan="2">8000</th>
          </tr>
          <tr>
            <th></th>
            <th>OD</th><th>OE</th><th>OD</th><th>OE</th><th>OD</th><th>OE</th>
            <th>OD</th><th>OE</th><th>OD</th><th>OE</th><th>OD</th><th>OE</th>
            <th>OD</th><th>OE</th><th>OD</th><th>OE</th>
          </tr>
        </thead>
        <tbody>
          <tr class="subcabecalho"><td colspan="17">Via Aérea</td></tr>
          <tr>
            <td>dB</td>
            <td>${data.viaAereaOD250 || '-'}</td>
            <td>${data.viaAereaOE250 || '-'}</td>
            <td>${data.viaAereaOD500 || '-'}</td>
            <td>${data.viaAereaOE500 || '-'}</td>
            <td>${data.viaAereaOD1000 || '-'}</td>
            <td>${data.viaAereaOE1000 || '-'}</td>
            <td>${data.viaAereaOD2000 || '-'}</td>
            <td>${data.viaAereaOE2000 || '-'}</td>
            <td>${data.viaAereaOD3000 || '-'}</td>
            <td>${data.viaAereaOE3000 || '-'}</td>
            <td>${data.viaAereaOD4000 || '-'}</td>
            <td>${data.viaAereaOE4000 || '-'}</td>
            <td>${data.viaAereaOD6000 || '-'}</td>
            <td>${data.viaAereaOE6000 || '-'}</td>
            <td>${data.viaAereaOD8000 || '-'}</td>
            <td>${data.viaAereaOE8000 || '-'}</td>
          </tr>
          <tr class="subcabecalho"><td colspan="17">Via Óssea</td></tr>
          <tr>
            <td>dB</td>
            <td>-</td><td>-</td>
            <td>${data.viaOsseaOD500 || '-'}</td>
            <td>${data.viaOsseaOE500 || '-'}</td>
            <td>${data.viaOsseaOD1000 || '-'}</td>
            <td>${data.viaOsseaOE1000 || '-'}</td>
            <td>${data.viaOsseaOD2000 || '-'}</td>
            <td>${data.viaOsseaOE2000 || '-'}</td>
            <td>${data.viaOsseaOD3000 || '-'}</td>
            <td>${data.viaOsseaOE3000 || '-'}</td>
            <td>${data.viaOsseaOD4000 || '-'}</td>
            <td>${data.viaOsseaOE4000 || '-'}</td>
            <td>-</td><td>-</td><td>-</td><td>-</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

function createIRFSRT(data: any): string {
  if (!data.srtOD && !data.srtOE && !data.irfOD && !data.irfOE) {
    return '';
  }
  
  return `
    <div class="irf-srt-container">
      <div>
        <h4 style="color: #B71C1C; margin-bottom: 8px;">IRF/SRT - OD</h4>
        <p><strong>SRT:</strong> ${data.srtOD || 'Não realizado'}</p>
        <p><strong>IRF:</strong> ${data.irfOD || 'Não realizado'}</p>
      </div>
      <div>
        <h4 style="color: #0D47A1; margin-bottom: 8px;">IRF/SRT - OE</h4>
        <p><strong>SRT:</strong> ${data.srtOE || 'Não realizado'}</p>
        <p><strong>IRF:</strong> ${data.irfOE || 'Não realizado'}</p>
      </div>
    </div>
  `;
}

function createObservacao(titulo: string, texto: string): string {
  return `
    <div class="observacao">
      <h4>${titulo}</h4>
      <p>${texto}</p>
    </div>
  `;
}

function formatCPF(cpf?: string): string {
  if (!cpf) return 'Não informado';
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return cpf;
}

function formatCNPJ(cnpj?: string): string {
  if (!cnpj) return 'Não informado';
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length === 14) {
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return cnpj;
}