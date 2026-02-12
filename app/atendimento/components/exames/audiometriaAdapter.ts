import { AudiometriaExportaDados } from "@/lib/soc/interfaces/AudiometriaExportaDados";
import { AudiometriaData } from "./AudiometriaOcupacional";

/**
 * Adapta os dados exportados do SOC para o formato utilizado no frontend
 * Segue o mesmo padrão de tratamento do componente AudiometriaOcupacional
 */
export function adaptExportaDadosToAudiometriaData(
  exportData: AudiometriaExportaDados,
  atendimento?: any
): AudiometriaData {
  
  // ============= FUNÇÕES AUXILIARES (MESMO PADRÃO DO COMPONENTE) =============
  
  /**
   * Converte valor do SOC para o formato do frontend
   * - Mantém vazio '' para valores não preenchidos
   * - Mantém '--' e '---' para ausência de resposta
   * - Converte 998/999 para '' (não testado/sem resposta)
   */
  const parseSocValue = (value: string | undefined | null): string => {
    if (!value || value === '998' || value === '999' || value === '0') {
      return ''; // Vazio = não preenchido/não testado
    }
    return value;
  };

  /**
   * Converte valor de SRT (998 = Não realizado)
   */
  const parseSrtValue = (value: string | undefined | null): string => {
    if (!value || value === '998') {
      return ''; // Vazio = não realizado
    }
    return value;
  };

  /**
   * Converte boolean do SOC (0/1) para boolean do frontend
   */
  const parseBoolean = (value: string | undefined | null): boolean => {
    return value === '1';
  };

  /**
   * Mapeamento de resultados (mesmo padrão do componente)
   */
  const mapResultado = (codigo: string | undefined | null): string => {
    if (!codigo) return '';
    
    switch (codigo) {
      case '0': return 'NORMAL';
      case '1': return 'SUGESTIVO_PA';
      case '2': return 'PERDA_AUDITIVA_INDUZIDA_POR_RUIDO';
      case '3': return 'PERDA_AUDITIVA_OUTRAS_CAUSAS';
      case '4': return 'PERDA_AUDITIVA_CONDUTIVA';
      case '5': return 'PERDA_AUDITIVA_MISTA';
      default: return codigo;
    }
  };

  /**
   * Mapeamento de otoscopia (mesmo padrão do componente)
   */
  const mapOtoscopia = (codigo: string | undefined | null): string => {
    if (!codigo) return 'SEM_OBSTRUCAO';
    
    switch (codigo) {
      case '1': return 'SEM_OBSTRUCAO';
      case '2': return 'COM_OBSTRUCAO_PARCIAL';
      case '3': return 'COM_OBSTRUCAO_TOTAL';
      default: return 'SEM_OBSTRUCAO';
    }
  };


  // ============= CONSTRUÇÃO DO OBJETO =============
  
  return {
    // ============= DADOS DO FUNCIONÁRIO (do atendimento) =============
    tipoAudiometro: exportData.APARELHO === '001' ? 'AVS 500' : exportData.APARELHO === '002' ? 'AS 60' : exportData.APARELHO || 'AVS 500',
    dataCalibracao: '', // Não disponível no export
    repousoAuditivo: exportData.REPOUSO_AUDITIVO ? 'Sim' : 'Não',
    horasRepouso: exportData.REPOUSO_AUDITIVO ? 
      parseInt(exportData.REPOUSO_AUDITIVO.replace(/\D/g, '')) || 14 : 0,
    
    // ============= ANAMNESE (campos do atendimento) =============
    queixaAuditiva: atendimento?.QUEIXA_AUDITIVA || 'Não',
    audiometriaAnterior: atendimento?.AUDIOMETRIA_ANTERIOR || 'Não',
    infeccaoCirurgiaOuvido: atendimento?.INFECCAO_CIRURGIA_OUVIDO || 'Não',
    tratamentoOtotoxicos: atendimento?.TRATAMENTO_OTOTOXICOS || 'Não',
    dataTratamentoOtotoxicos: atendimento?.DATA_TRATAMENTO_OTOTOXICOS || '',
    surdezFamilia: atendimento?.SURDEZ_FAMILIA || 'Não',
    parentescoSurdez: atendimento?.PARENTESCO_SURDEZ || '',
    trabalhoAnteriorRuido: atendimento?.TRABALHO_ANTERIOR_RUIDO || 'Não',
    trabalhoAtualRuido: atendimento?.TRABALHO_ATUAL_RUIDO || 'Não',
    usoProtetorAuricular: atendimento?.USO_PROTETOR_AURICULAR || 'Não',
    contatoQuimicos: atendimento?.CONTATO_QUIMICOS || 'Não',
    habitoSomAlto: atendimento?.HABITO_SOM_ALTO || 'Não',
    exposicaoExplosoes: atendimento?.EXPOSICAO_EXPLOSOES || 'Não',
    traumaCabecaOuvido: atendimento?.TRAUMA_CABECA_OUVIDO || 'Não',
    labirintiteTontura: atendimento?.LABIRINTITE_TONTURA || 'Não',
    usoMedicamentos: atendimento?.USO_MEDICAMENTOS || 'Não',
    quaisMedicamentos: atendimento?.QUAIS_MEDICAMENTOS || '',
    
    // ============= MEATOSCOPIA =============
    meatoscopiaOD: mapOtoscopia(exportData.OTOSCOPIA_OD),
    meatoscopiaOE: mapOtoscopia(exportData.OTOSCOPIA_OE),
    observacoesMeatoscopia: '',
    orientacaoPlugSilicone: '',

    // ============= VIA AÉREA =============
    viaAereaOD250: parseSocValue(exportData.OD_250_VIA_AEREA),
    viaAereaOD500: parseSocValue(exportData.OD_500_VIA_AEREA),
    viaAereaOD1000: parseSocValue(exportData.OD_1000_VIA_AEREA),
    viaAereaOD2000: parseSocValue(exportData.OD_2000_VIA_AEREA),
    viaAereaOD3000: parseSocValue(exportData.OD_3000_VIA_AEREA),
    viaAereaOD4000: parseSocValue(exportData.OD_4000_VIA_AEREA),
    viaAereaOD6000: parseSocValue(exportData.OD_6000_VIA_AEREA),
    viaAereaOD8000: parseSocValue(exportData.OD_8000_VIA_AEREA),
    
    viaAereaOE250: parseSocValue(exportData.OE_250_VIA_AEREA),
    viaAereaOE500: parseSocValue(exportData.OE_500_VIA_AEREA),
    viaAereaOE1000: parseSocValue(exportData.OE_1000_VIA_AEREA),
    viaAereaOE2000: parseSocValue(exportData.OE_2000_VIA_AEREA),
    viaAereaOE3000: parseSocValue(exportData.OE_3000_VIA_AEREA),
    viaAereaOE4000: parseSocValue(exportData.OE_4000_VIA_AEREA),
    viaAereaOE6000: parseSocValue(exportData.OE_6000_VIA_AEREA),
    viaAereaOE8000: parseSocValue(exportData.OE_8000_VIA_AEREA),

    // ============= VIA ÓSSEA (998 = não testado = vazio) =============
    viaOsseaOD500: parseSocValue(exportData.OD_500_VIA_OSSEA),
    viaOsseaOD1000: parseSocValue(exportData.OD_1000_VIA_OSSEA),
    viaOsseaOD2000: parseSocValue(exportData.OD_2000_VIA_OSSEA),
    viaOsseaOD3000: parseSocValue(exportData.OD_3000_VIA_OSSEA),
    viaOsseaOD4000: parseSocValue(exportData.OD_4000_VIA_OSSEA),
    
    viaOsseaOE500: parseSocValue(exportData.OE_500_VIA_OSSEA),
    viaOsseaOE1000: parseSocValue(exportData.OE_1000_VIA_OSSEA),
    viaOsseaOE2000: parseSocValue(exportData.OE_2000_VIA_OSSEA),
    viaOsseaOE3000: parseSocValue(exportData.OE_3000_VIA_OSSEA),
    viaOsseaOE4000: parseSocValue(exportData.OE_4000_VIA_OSSEA),

    // ============= MASCARAMENTO VIA AÉREA =============
    mascaramentoVAOD250: parseBoolean(exportData.MASCARAMENTO_OD_250_VIA_AEREA),
    mascaramentoVAOD500: parseBoolean(exportData.MASCARAMENTO_OD_500_VIA_AEREA),
    mascaramentoVAOD1000: parseBoolean(exportData.MASCARAMENTO_OD_1000_VIA_AEREA),
    mascaramentoVAOD2000: parseBoolean(exportData.MASCARAMENTO_OD_2000_VIA_AEREA),
    mascaramentoVAOD3000: parseBoolean(exportData.MASCARAMENTO_OD_3000_VIA_AEREA),
    mascaramentoVAOD4000: parseBoolean(exportData.MASCARAMENTO_OD_4000_VIA_AEREA),
    mascaramentoVAOD6000: parseBoolean(exportData.MASCARAMENTO_OD_6000_VIA_AEREA),
    mascaramentoVAOD8000: parseBoolean(exportData.MASCARAMENTO_OD_8000_VIA_AEREA),
    
    mascaramentoVAOE250: parseBoolean(exportData.MASCARAMENTO_OE_250_VIA_AEREA),
    mascaramentoVAOE500: parseBoolean(exportData.MASCARAMENTO_OE_500_VIA_AEREA),
    mascaramentoVAOE1000: parseBoolean(exportData.MASCARAMENTO_OE_1000_VIA_AEREA),
    mascaramentoVAOE2000: parseBoolean(exportData.MASCARAMENTO_OE_2000_VIA_AEREA),
    mascaramentoVAOE3000: parseBoolean(exportData.MASCARAMENTO_OE_3000_VIA_AEREA),
    mascaramentoVAOE4000: parseBoolean(exportData.MASCARAMENTO_OE_4000_VIA_AEREA),
    mascaramentoVAOE6000: parseBoolean(exportData.MASCARAMENTO_OE_6000_VIA_AEREA),
    mascaramentoVAOE8000: parseBoolean(exportData.MASCARAMENTO_OE_8000_VIA_AEREA),

    // ============= MASCARAMENTO VIA ÓSSEA =============
    mascaramentoVOOD500: parseBoolean(exportData.MASCARAMENTO_OD_500_VIA_OSSEA),
    mascaramentoVOOD1000: parseBoolean(exportData.MASCARAMENTO_OD_1000_VIA_OSSEA),
    mascaramentoVOOD2000: parseBoolean(exportData.MASCARAMENTO_OD_2000_VIA_OSSEA),
    mascaramentoVOOD3000: parseBoolean(exportData.MASCARAMENTO_OD_3000_VIA_OSSEA),
    mascaramentoVOOD4000: parseBoolean(exportData.MASCARAMENTO_OD_4000_VIA_OSSEA),
    
    mascaramentoVOOE500: parseBoolean(exportData.MASCARAMENTO_OE_500_VIA_OSSEA),
    mascaramentoVOOE1000: parseBoolean(exportData.MASCARAMENTO_OE_1000_VIA_OSSEA),
    mascaramentoVOOE2000: parseBoolean(exportData.MASCARAMENTO_OE_2000_VIA_OSSEA),
    mascaramentoVOOE3000: parseBoolean(exportData.MASCARAMENTO_OE_3000_VIA_OSSEA),
    mascaramentoVOOE4000: parseBoolean(exportData.MASCARAMENTO_OE_4000_VIA_OSSEA),

    // ============= IRF E SRT =============
    realizarIRF: !!(exportData.OD_IRF || exportData.OE_IRF || exportData.OD_SRT || exportData.OE_SRT),
    srtOD: parseSrtValue(exportData.OD_SRT),
    srtOE: parseSrtValue(exportData.OE_SRT),
    irfOD: exportData.OD_IRF || '',
    irfOE: exportData.OE_IRF || '',
    irfDBOD: '',
    irfDBOE: '',

    // ============= RESULTADOS CALCULADOS =============
    resultadoSRTOD: parseSrtValue(exportData.OD_SRT),
    resultadoSRTOE: parseSrtValue(exportData.OE_SRT),
    resultadoIRFOD: exportData.OD_IRF || '',
    resultadoIRFOE: exportData.OE_IRF || '',
    resultadoIRFMonoauralOD: '',
    resultadoIRFMonoauralOE: '',
    resultadoIRFDissimetrica: '',

    // ============= CLASSIFICAÇÕES (SERÃO RECALCULADAS) =============
    entalhe4000HzOD: false,
    entalhe4000HzOE: false,
    tipoPerdaOD: '',
    tipoPerdaOE: '',
    audiometriaReferenciaDisponivel: false,
    limiaresRAOD: {},
    limiaresRAOE: {},
    classificacaoNR7OD: '',
    classificacaoNR7OE: '',

    classificacaoOD: '',
    classificacaoOE: '',
    classificacaoGeral: mapResultado(exportData.RESULTADO),
    configuracaoOD: '',
    configuracaoOE: '',

    conclusao: exportData.PARECER || '',
    observacoes: [exportData.OBSERVACAO_OD, exportData.OBSERVACAO_OE]
      .filter(Boolean)
      .join(' | '),
    perdaAuditivaOD: '',
    perdaAuditivaOE: '',
    resultadoOD: mapResultado(exportData.RESULTADO),
    resultadoOE: mapResultado(exportData.RESULTADO),
    frequenciasAlteradasOD: '',
    frequenciasAlteradasOE: '',
    criterioPCD: '',
    mediaTonalOD: 0,
    mediaTonalOE: 0,
  };
}

/**
 * Adapta múltiplas audiometrias para exibição no histórico
 */
export function adaptMultiplasAudiometrias(
  exportDataList: AudiometriaExportaDados[],
  atendimento?: any
): AudiometriaData[] {
  return exportDataList
    .filter(audio => audio.DATA_REALIZACAO) // Apenas com data válida
    .sort((a, b) => {
      // Ordenar da mais recente para a mais antiga
      const dateA = new Date(a.DATA_REALIZACAO.split('/').reverse().join('-'));
      const dateB = new Date(b.DATA_REALIZACAO.split('/').reverse().join('-'));
      return dateB.getTime() - dateA.getTime();
    })
    .map(audio => adaptExportaDadosToAudiometriaData(audio, atendimento));
}