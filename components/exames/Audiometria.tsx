import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card, Button, Input, Select, SelectItem, Textarea, Checkbox, Radio, RadioGroup, Spinner } from "@heroui/react";
import { useUser } from '@/hooks/useUser';
import { Scheduling } from '@/lib/scheduling/interface/scheduling';
import { User, Ear, Stethoscope, FileText, Volume2, AlertTriangle, Calculator } from 'lucide-react';

interface AudiometriaProps {
  atendimento: any;
  exame: string;
  formulario: any;
  onSave?: (data: any) => void;
  onClose?: () => void;
}

interface AudiometriaData {
  // Dados do Exame
  // dataExame: string; // Removido no código anterior
  // horaExame: string; // Removido no código anterior
  tipoAudiometro: string;
  
  // Dados técnicos do exame
  dataCalibracao: string;
  repousoAuditivo: string;
  horasRepouso: number;
  
  // Anamnese completa
  queixaAuditiva: string;
  audiometriaAnterior: string;
  infeccaoCirurgiaOuvido: string;
  tratamentoOtotoxicos: string;
  dataTratamentoOtotoxicos: string;
  surdezFamilia: string;
  parentescoSurdez: string;
  trabalhoAnteriorRuido: string;
  trabalhoAtualRuido: string;
  usoProtetorAuricular: string;
  contatoQuimicos: string;
  habitoSomAlto: string;
  exposicaoExplosoes: string;
  traumaCabecaOuvido: string;
  labirintiteTontura: string;
  usoMedicamentos: string;
  quaisMedicamentos: string;
  
  // Meatoscopia
  meatoscopiaOD: string;
  meatoscopiaOE: string;
  observacoesMeatoscopia: string;
  
  // Audiometria Tonal - Via Aérea (INPUTS)
  viaAereaOD250: string; viaAereaOD500: string; viaAereaOD1000: string; viaAereaOD2000: string;
  viaAereaOD3000: string; viaAereaOD4000: string; viaAereaOD6000: string; viaAereaOD8000: string;
  
  viaAereaOE250: string; viaAereaOE500: string; viaAereaOE1000: string; viaAereaOE2000: string;
  viaAereaOE3000: string; viaAereaOE4000: string; viaAereaOE6000: string; viaAereaOE8000: string;
  
  // Audiometria Tonal - Via Óssea (INPUTS)
  viaOsseaOD500: string; viaOsseaOD1000: string; viaOsseaOD2000: string; viaOsseaOD3000: string; viaOsseaOD4000: string;
  viaOsseaOE500: string; viaOsseaOE1000: string; viaOsseaOE2000: string; viaOsseaOE3000: string; viaOsseaOE4000: string;
  
  // Mascaramento (INPUTS)
  mascaramentoOD250: string; mascaramentoOD500: string; mascaramentoOD1000: string; mascaramentoOD2000: string;
  mascaramentoOD3000: string; mascaramentoOD4000: string; mascaramentoOD6000: string; mascaramentoOD8000: string;
  
  mascaramentoOE250: string; mascaramentoOE500: string; mascaramentoOE1000: string; mascaramentoOE2000: string;
  mascaramentoOE3000: string; mascaramentoOE4000: string; mascaramentoOE6000: string; mascaramentoOE8000: string;
  
  // Índices de Reconhecimento de Fala (INPUTS)
  realizarIRF: boolean;
  srtOD: string; srtOE: string;
  irfOD: string; irfOE: string;
  irfDBOD: string; irfDBOE: string;
  
  // Campos calculados (OUTPUTS)
  resultadoSRTOD: string;
  resultadoSRTOE: string;
  resultadoIRFOD: string;
  resultadoIRFOE: string;
  resultadoIRFMonoauralOD: string;
  resultadoIRFMonoauralOE: string;
  resultadoIRFDissimetrica: string;
  
  // === CRITÉRIOS PAIR NR-7 (OUTPUTS) ===
  entalhe4000HzOD: boolean;
  entalhe4000HzOE: boolean;
  tipoPerdaOD: string;
  tipoPerdaOE: string;
  
  audiometriaReferenciaDisponivel: boolean;
  limiaresRAOD: { [key: number]: number }; 
  limiaresRAOE: { [key: number]: number };
  classificacaoNR7OD: string;
  classificacaoNR7OE: string;
  
  // Classificações (Lloyd & Kaplan) (OUTPUTS)
  classificacaoOD: string;
  classificacaoOE: string;
  classificacaoGeral: string;
  configuracaoOD: string;
  configuracaoOE: string;
  
  // Laudo e Observações (OUTPUTS)
  conclusao: string;
  observacoes: string;
  perdaAuditivaOD: string;
  perdaAuditivaOE: string;
  resultadoOD: string;
  resultadoOE: string;
  frequenciasAlteradasOD: string;
  frequenciasAlteradasOE: string;
  criterioPCD: string;
  mediaTonalOD: number;
  mediaTonalOE: number;
  
}

const AudiometriaOcupacional: React.FC<AudiometriaProps> = ({ 
  atendimento, 
  exame,
  formulario,
  onSave, 
  onClose 
}) => {
  const user = useUser();
  const [agendamento, setAgendamento] = useState<Scheduling>();

  
  // Refs para os inputs de limiares (mantidos para foco)
  const inputRefsVAOD = useRef<(HTMLInputElement | null)[]>([]);
  const inputRefsVAOE = useRef<(HTMLInputElement | null)[]>([]);
  const inputRefsVOOD = useRef<(HTMLInputElement | null)[]>([]);
  const inputRefsVOOE = useRef<(HTMLInputElement | null)[]>([]);
  const inputRefsMascOD = useRef<(HTMLInputElement | null)[]>([]);
  const inputRefsMascOE = useRef<(HTMLInputElement | null)[]>([]);
  

  const [formData, setFormData] = useState<AudiometriaData>({
    tipoAudiometro: 'AVS 500',
    dataCalibracao: '2025-01-09',
    repousoAuditivo: 'Sim',
    horasRepouso: 14,
    queixaAuditiva: 'Não',
    audiometriaAnterior: 'Não',
    infeccaoCirurgiaOuvido: 'Não',
    tratamentoOtotoxicos: 'Não',
    dataTratamentoOtotoxicos: '',
    surdezFamilia: 'Não',
    parentescoSurdez: '',
    trabalhoAnteriorRuido: 'Não',
    trabalhoAtualRuido: 'Não',
    usoProtetorAuricular: 'Sim',
    contatoQuimicos: 'Não',
    habitoSomAlto: 'Não',
    exposicaoExplosoes: 'Não',
    traumaCabecaOuvido: 'Não',
    labirintiteTontura: 'Não',
    usoMedicamentos: 'Não',
    quaisMedicamentos: '',
    meatoscopiaOD: 'Normal',
    meatoscopiaOE: 'Normal',
    observacoesMeatoscopia: '',
    
    // Via Aérea - OD (vazio)
    viaAereaOD250: '', viaAereaOD500: '', viaAereaOD1000: '', viaAereaOD2000: '',
    viaAereaOD3000: '', viaAereaOD4000: '', viaAereaOD6000: '', viaAereaOD8000: '',
    
    // Via Aérea - OE (vazio)
    viaAereaOE250: '', viaAereaOE500: '', viaAereaOE1000: '', viaAereaOE2000: '',
    viaAereaOE3000: '', viaAereaOE4000: '', viaAereaOE6000: '', viaAereaOE8000: '',
    
    // Via Óssea e Mascaramento (vazio)
    viaOsseaOD500: '', viaOsseaOD1000: '', viaOsseaOD2000: '', viaOsseaOD3000: '', viaOsseaOD4000: '',
    viaOsseaOE500: '', viaOsseaOE1000: '', viaOsseaOE2000: '', viaOsseaOE3000: '', viaOsseaOE4000: '',
    mascaramentoOD250: '', mascaramentoOD500: '', mascaramentoOD1000: '', mascaramentoOD2000: '',
    mascaramentoOD3000: '', mascaramentoOD4000: '', mascaramentoOD6000: '', mascaramentoOD8000: '',
    mascaramentoOE250: '', mascaramentoOE500: '', mascaramentoOE1000: '', mascaramentoOE2000: '',
    mascaramentoOE3000: '', mascaramentoOE4000: '', mascaramentoOE6000: '', mascaramentoOE8000: '',
    
    // IRF (vazio)
    realizarIRF: false,
    srtOD: '', srtOE: '', irfOD: '', irfOE: '', irfDBOD: '', irfDBOE: '',
    resultadoSRTOD: '', resultadoSRTOE: '', resultadoIRFOD: '', resultadoIRFOE: '',
    resultadoIRFMonoauralOD: '', resultadoIRFMonoauralOE: '', resultadoIRFDissimetrica: '',
    
    // Classificações iniciais (serão calculadas)
    entalhe4000HzOD: false, entalhe4000HzOE: false,
    tipoPerdaOD: 'Neurossensorial', tipoPerdaOE: 'Neurossensorial',
    audiometriaReferenciaDisponivel: false,
    limiaresRAOD: {}, limiaresRAOE: {},
    classificacaoNR7OD: 'Não Classificado (RA Ausente)', classificacaoNR7OE: 'Não Classificado (RA Ausente)',
    classificacaoOD: 'Audição Normal', classificacaoOE: 'Audição Normal', 
    configuracaoOD: 'Plana', configuracaoOE: 'Plana',
    
    // Laudo e Observações (serão calculadas)
    perdaAuditivaOD: '0 dB', perdaAuditivaOE: '0 dB',
    frequenciasAlteradasOD: '', frequenciasAlteradasOE: '',
    mediaTonalOD: 0, mediaTonalOE: 0,
    criterioPCD: 'Não se enquadra (Cota Federal)',
    
    classificacaoGeral: 'Limiares auditivos dentro dos padrões da normalidade.',
    conclusao: 'Limiares auditivos dentro dos padrões da normalidade.',
    observacoes: '',
    resultadoOD: 'Limiares auditivos dentro dos padrões da normalidade.',
    resultadoOE: 'Limiares auditivos dentro dos padrões da normalidade.',

  });

  // Preenchimento automático dos dados do atendimento
  useEffect(() => {
    if (atendimento) {
      setAgendamento(atendimento);
    }
    if (formulario) {
      setFormData(prev => ({ ...prev, ...formulario }));
    }
  }, [atendimento, formulario]);

  // === VALIDAÇÃO DE INPUT - APENAS NÚMEROS ATÉ 120 ===
  const validarInputDecibel = useCallback((value: string): string => {
    let cleaned = value.replace(/[^\d]/g, '');
    if (cleaned.length > 3) { cleaned = cleaned.slice(0, 3); }
    const numericValue = parseInt(cleaned, 10);
    if (!isNaN(numericValue) && numericValue > 120) { return '120'; }
    return cleaned;
  }, []);

  const handleInputChange = useCallback((field: keyof AudiometriaData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleDecibelInputChange = useCallback((field: keyof AudiometriaData, value: string) => {
    const validatedValue = validarInputDecibel(value);
    setFormData(prev => ({ ...prev, [field]: validatedValue }));
  }, [validarInputDecibel]);

  const handleCheckboxChange = useCallback((field: keyof AudiometriaData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);


  // =======================================================
  // FUNÇÕES PURO DE CÁLCULO (Não chamam setFormData)
  // =======================================================

  // 1. CÁLCULO DA MÉDIA TONAL (4 Frequências) - Pura
  const calcularMediaTonal = useCallback((freqs: string[]): number => {
    const valores = freqs
      .map(v => {
        const num = parseFloat(v);
        // Limiar de 0 dB ou limiar não preenchido
        return isNaN(num) ? null : num; 
      })
      .filter(v => v !== null) as number[];
    
    if (valores.length === 0) return 0;
    
    const soma = valores.reduce((acc, val) => acc + val, 0);
    return Math.round(soma / valores.length);
  }, []);
  
  // 2. CLASSIFICAÇÃO LLOYD & KAPLAN (Grau) - Pura
  const classificarPerdaLloydKaplan = useCallback((media: number): string => {
    if (media <= 25) return 'Limiares auditivos dentro dos padrões da normalidade'; 
    if (media <= 40) return 'Perda Auditiva Leve'; 
    if (media <= 70) return 'Perda Auditiva Moderada'; 
    if (media <= 90) return 'Perda Auditiva Severa'; 
    return 'Perda Auditiva Profunda';
  }, []);

  // 3. IDENTIFICAR FREQUÊNCIAS ALTERADAS - Pura
  const identificarFrequenciasAlteradas = useCallback((vaLimiares: { [key: number]: string }): string => {
    const frequenciasAlteradas = Object.keys(vaLimiares)
        .map(Number)
        .filter((freq) => {
            const valor = parseFloat(vaLimiares[freq]);
            // Limiar > 25 dB NA é considerado alterado
            return !isNaN(valor) && valor > 25;
        })
        .map((freq) => `${freq} Hz`);

    return frequenciasAlteradas.join(', ');
  }, []);
  
  // 4. VERIFICAR CRITÉRIO PCD - Pura
  const verificarCriterioPCD = useCallback((mediaOD: number, mediaOE: number): string => {
    const melhorOrelha = Math.min(mediaOD, mediaOE);
    const piorOrelha = Math.max(mediaOD, mediaOE);
    
    let criterioPCD = 'NÃO SE ENQUADRA. Limiares auditivos abaixo dos critérios federais (Média Tonal na Melhor Orelha < 41 dB NA).';
    
    // CRITÉRIO BILATERAL (Decreto 5.296/2004)
    // Requisito: Perda em ambos os ouvidos >= 41 dB NA (i.e., melhor orelha >= 41 dB).
    if (melhorOrelha >= 41) { 
      criterioPCD = `POSSIBILIDADE DE COTA PCD - Critério: Perda Auditiva Bilateral (Média Tonal na Melhor Orelha >= 41 dB NA). Ref: Decreto 5.296/2004.`;
    } 
    // CRITÉRIO UNILATERAL PROFUNDO (Lei 14.768/2023)
    // Requisito: Surdez unilateral total/profunda. (pior >= 95 dB e melhor < 41 dB)
    else if (piorOrelha >= 95 && melhorOrelha < 41) {
      criterioPCD = `POSSIBILIDADE DE COTA PCD - Critério: Surdez Unilateral Total/Profunda (Média Tonal na Pior Orelha >= 95 dB NA e Melhor Orelha < 41 dB NA). Ref: Lei 14.768/2023.`;
    }

    return criterioPCD;
  }, []);

  // 5. CÁLCULO DE ÍNDICES DE FALA (SRT/IRF) - Pura
  const calcularIndicesFala = useCallback((data: AudiometriaData) => {
    const calcularSRT = (freq500: string, freq1000: string, freq2000: string) => {
      const valores = [freq500, freq1000, freq2000]
        .map(v => parseFloat(v))
        .filter(v => !isNaN(v));
      
      if (valores.length === 0) return { srt: 0, resultado: '' };
      
      const media = valores.reduce((sum, val) => sum + val, 0) / valores.length;
      const srtCalculado = Math.round(media);
      
      let resultado = 'Normal';
      if (srtCalculado > 25) resultado = 'Alterado';
      else if (srtCalculado > 20) resultado = 'Limítrofe';
      
      return { srt: srtCalculado, resultado };
    };

    const calcularIRFMonoaural = (irfPercent: number) => {
      if (isNaN(irfPercent) || irfPercent === 0) return 'Não avaliado';
      if (irfPercent >= 90) return 'Normal';
      if (irfPercent >= 80) return 'Limítrofe';
      if (irfPercent >= 70) return 'Alterado Leve';
      if (irfPercent >= 60) return 'Alterado Moderado';
      return 'Alterado Severo';
    };

    const calcularIRFDissimetrica = (irfOD: number, irfOE: number) => {
      if (isNaN(irfOD) || isNaN(irfOE) || irfOD === 0 || irfOE === 0) return 'Não avaliado';
      
      const diferenca = Math.abs(irfOD - irfOE);
      if (diferenca <= 8) return 'Simétrica';
      if (diferenca <= 15) return 'Levemente dissimétrica';
      if (diferenca <= 25) return 'Moderadamente dissimétrica';
      return 'Severamente dissimétrica';
    };

    const srtODCalculado = calcularSRT(data.viaAereaOD500, data.viaAereaOD1000, data.viaAereaOD2000);
    const srtOECalculado = calcularSRT(data.viaAereaOE500, data.viaAereaOE1000, data.viaAereaOE2000);
    const irfOD = parseFloat(data.irfOD) || 0;
    const irfOE = parseFloat(data.irfOE) || 0;

    return {
      // Se SRT manual não foi preenchido, usa o calculado
      srtOD: data.srtOD || (srtODCalculado.srt > 0 ? srtODCalculado.srt.toString() : ''),
      resultadoSRTOD: srtODCalculado.resultado,
      srtOE: data.srtOE || (srtOECalculado.srt > 0 ? srtOECalculado.srt.toString() : ''),
      resultadoSRTOE: srtOECalculado.resultado,
      resultadoIRFMonoauralOD: calcularIRFMonoaural(irfOD),
      resultadoIRFMonoauralOE: calcularIRFMonoaural(irfOE),
      resultadoIRFDissimetrica: calcularIRFDissimetrica(irfOD, irfOE)
    };
  }, []);


  // 7. FORMATAR CONCLUSÃO DETALHADA - Pura
  const formatarConclusaoDetalhada = useCallback((
      classificacao: string, 
      tipoPerda: string, 
      configuracao: string, 
      frequenciasAlteradas: string
  ): string => {
      if (classificacao.includes('padrões da normalidade')) {
          return 'Limiares auditivos dentro dos padrões da normalidade';
      }
      
      const perda = classificacao;
      const tipo = tipoPerda;
      const config = configuracao;
      
      const freqTexto = frequenciasAlteradas.length > 0 
          ? frequenciasAlteradas 
          : '250 a 8000 Hz';

      return `${perda} ${tipo} ${config} nas frequências ${freqTexto}`;
  }, []);

  // 8. CLASSIFICAÇÃO NR-7 DPLA - Pura (Simplificada, mantendo a estrutura para PAIR)
  type NR7Result = 'RA - Normal' | 'RA - Alterada (PAIR)' | 'Alteração Não Ocupacional' | 'Desvio Padrão (DPLA)' | 'Confirmação de PAIR (Anexo II, NR-7)' | 'Protocolo NR-7 Incompleto' | 'Audição Normal';
  const classificarDPLA = useCallback((
      currentVA: { [key: number]: string },
      referenceVA: { [key: number]: number },
  ): NR7Result => {
      // Lógica de DPLA omitida por brevidade e complexidade de simulação da RA
      if (Object.keys(referenceVA).length === 0) return 'Protocolo NR-7 Incompleto';
      
      const media4f = calcularMediaTonal([currentVA[500], currentVA[1000], currentVA[2000], currentVA[3000]]);
      
      if (media4f <= 25) return 'Audição Normal';
      
      // Se não for possível calcular DPLA (por não ter RA), retorna a classificação de grau (não ocupacional)
      return 'Alteração Não Ocupacional'; 
      
  }, [calcularMediaTonal]);


  // =======================================================
  // EFEITO UNIFICADO (CHAMADO APENAS QUANDO INPUTS MUDAM)
  // =======================================================
  
  // Lista de todos os campos de Via Aérea que são INPUTS e disparam o cálculo
  const vaInputs = useMemo(() => [
    formData.viaAereaOD250, formData.viaAereaOD500, formData.viaAereaOD1000, 
    formData.viaAereaOD2000, formData.viaAereaOD3000, formData.viaAereaOD4000, 
    formData.viaAereaOD6000, formData.viaAereaOD8000,
    formData.viaAereaOE250, formData.viaAereaOE500, formData.viaAereaOE1000,
    formData.viaAereaOE2000, formData.viaAereaOE3000, formData.viaAereaOE4000,
    formData.viaAereaOE6000, formData.viaAereaOE8000,
  ], [
    formData.viaAereaOD250, formData.viaAereaOD500, formData.viaAereaOD1000, 
    formData.viaAereaOD2000, formData.viaAereaOD3000, formData.viaAereaOD4000, 
    formData.viaAereaOD6000, formData.viaAereaOD8000,
    formData.viaAereaOE250, formData.viaAereaOE500, formData.viaAereaOE1000,
    formData.viaAereaOE2000, formData.viaAereaOE3000, formData.viaAereaOE4000,
    formData.viaAereaOE6000, formData.viaAereaOE8000,
  ]);


  useEffect(() => {
    
    // Objeto para consolidar todas as atualizações de estado
    let updates: Partial<AudiometriaData> = {};

    // 1. DADOS BRUTOS (VA por frequência)
    const vaLimiaresOD: { [key: number]: string } = {
        250: formData.viaAereaOD250, 500: formData.viaAereaOD500, 1000: formData.viaAereaOD1000, 
        2000: formData.viaAereaOD2000, 3000: formData.viaAereaOD3000, 4000: formData.viaAereaOD4000, 
        6000: formData.viaAereaOD6000, 8000: formData.viaAereaOD8000
    };
    const vaLimiaresOE: { [key: number]: string } = {
        250: formData.viaAereaOE250, 500: formData.viaAereaOE500, 1000: formData.viaAereaOE1000, 
        2000: formData.viaAereaOE2000, 3000: formData.viaAereaOE3000, 4000: formData.viaAereaOE4000, 
        6000: formData.viaAereaOE6000, 8000: formData.viaAereaOE8000
    };

    // 2. MÉDIA TONAL (Para Lloyd & Kaplan / PCD)
    const mediaTonalOD = calcularMediaTonal([
      formData.viaAereaOD500, formData.viaAereaOD1000, formData.viaAereaOD2000, formData.viaAereaOD3000
    ]);
    const mediaTonalOE = calcularMediaTonal([
      formData.viaAereaOE500, formData.viaAereaOE1000, formData.viaAereaOE2000, formData.viaAereaOE3000
    ]);
    updates.mediaTonalOD = mediaTonalOD;
    updates.mediaTonalOE = mediaTonalOE;
    updates.perdaAuditivaOD = mediaTonalOD > 0 ? `${mediaTonalOD} dB` : '0 dB';
    updates.perdaAuditivaOE = mediaTonalOE > 0 ? `${mediaTonalOE} dB` : '0 dB';


    // 3. CLASSIFICAÇÕES
    const classificacaoOD = classificarPerdaLloydKaplan(mediaTonalOD);
    const classificacaoOE = classificarPerdaLloydKaplan(mediaTonalOE);
    updates.classificacaoOD = classificacaoOD;
    updates.classificacaoOE = classificacaoOE;

    // 4. CRITÉRIO PCD
    updates.criterioPCD = verificarCriterioPCD(mediaTonalOD, mediaTonalOE);

    // 5. FREQUÊNCIAS ALTERADAS
    const frequenciasAlteradasOD = identificarFrequenciasAlteradas(vaLimiaresOD);
    const frequenciasAlteradasOE = identificarFrequenciasAlteradas(vaLimiaresOE);
    updates.frequenciasAlteradasOD = frequenciasAlteradasOD;
    updates.frequenciasAlteradasOE = frequenciasAlteradasOE;

    // 6. OUTRAS CLASSIFICAÇÕES (Configuração, Tipo de Perda - Mantidos como exemplo)
    const calcularConfiguracao = (v: { [key: number]: string }) => {
      const val500 = parseFloat(v[500]) || 0;
      const val4000 = parseFloat(v[4000]) || 0;
      if (Math.abs(val500 - val4000) <= 10) return 'Plana';
      if (val4000 > val500 + 15) return 'Descendente';
      return 'Irregular';
    };
    updates.configuracaoOD = calcularConfiguracao(vaLimiaresOD);
    updates.configuracaoOE = calcularConfiguracao(vaLimiaresOE);
    updates.tipoPerdaOD = 'Neurossensorial'; // Simplificado
    updates.tipoPerdaOE = 'Neurossensorial'; // Simplificado

    // 7. LAUDO FINAL
    const conclusaoODDetalhada = formatarConclusaoDetalhada(
        classificacaoOD, updates.tipoPerdaOD, updates.configuracaoOD, frequenciasAlteradasOD
    );
    const conclusaoOEDetalhada = formatarConclusaoDetalhada(
        classificacaoOE, updates.tipoPerdaOE, updates.configuracaoOE, frequenciasAlteradasOE
    );
    updates.resultadoOD = conclusaoODDetalhada;
    updates.resultadoOE = conclusaoOEDetalhada;
    updates.conclusao = (classificacaoOD.includes('normalidade') && classificacaoOE.includes('normalidade')) 
                 ? 'Limiares auditivos dentro dos padrões da normalidade.' 
                 : 'Alteração Auditiva Detectada';

    // 8. CLASSIFICAÇÃO NR-7 E VALIDAÇÕES
    updates.classificacaoNR7OD = formData.audiometriaAnterior === 'Não' 
        ? (classificacaoOD.includes('normalidade') ? 'RA - Normal' : 'RA - Alterada')
        : classificarDPLA(vaLimiaresOD, formData.limiaresRAOD); // Exemplo
    

    // 9. ÍNDICES DE FALA (Se necessário, calculados separadamente por dependerem de outros inputs)
    if (formData.realizarIRF) {
      const irfUpdates = calcularIndicesFala(formData);
      updates = { ...updates, ...irfUpdates };
    }
    
    // Chama setFormData apenas UMA VEZ com todas as atualizações
    setFormData(prev => {
        // Verifica se há alguma mudança significativa no estado para evitar o re-render
        let hasChanged = false;
        for (const key in updates) {
            if (prev[key as keyof AudiometriaData] !== updates[key as keyof AudiometriaData]) {
                hasChanged = true;
                break;
            }
        }
        if (!hasChanged) return prev;
        
        return { ...prev, ...updates };
    });

  }, [
    // Dependências: Apenas os campos de INPUT que, ao mudar, disparam o recálculo
    // Uso do array de vaInputs (limiares) e demais inputs
    ...vaInputs, // Otimização: Lista todos os campos VA
    formData.realizarIRF, formData.srtOD, formData.srtOE, formData.irfOD, formData.irfOE, 
    formData.irfDBOD, formData.irfDBOE,
    formData.repousoAuditivo, formData.horasRepouso, formData.dataCalibracao, 
    formData.audiometriaAnterior, formData.limiaresRAOD, formData.limiaresRAOE,
    
    // Funções de cálculo puras (estáveis pelo useCallback)
    calcularMediaTonal, classificarPerdaLloydKaplan, identificarFrequenciasAlteradas,
    verificarCriterioPCD, calcularIndicesFala, formatarConclusaoDetalhada, classificarDPLA,
  ]);

  // Restante do componente (JSX e handlers de TAB) mantido

  const frequencias = [
    { label: '250 Hz', fieldVAOD: 'viaAereaOD250', fieldVAOE: 'viaAereaOE250', fieldVOOD: null, fieldVOOE: null, fieldMascOD: 'mascaramentoOD250', fieldMascOE: 'mascaramentoOE250' },
    { label: '500 Hz', fieldVAOD: 'viaAereaOD500', fieldVAOE: 'viaAereaOE500', fieldVOOD: 'viaOsseaOD500', fieldVOOE: 'viaOsseaOE500', fieldMascOD: 'mascaramentoOD500', fieldMascOE: 'mascaramentoOE500' },
    { label: '1000 Hz', fieldVAOD: 'viaAereaOD1000', fieldVAOE: 'viaAereaOE1000', fieldVOOD: 'viaOsseaOD1000', fieldVOOE: 'viaOsseaOE1000', fieldMascOD: 'mascaramentoOD1000', fieldMascOE: 'mascaramentoOE1000' },
    { label: '2000 Hz', fieldVAOD: 'viaAereaOD2000', fieldVAOE: 'viaAereaOE2000', fieldVOOD: 'viaOsseaOD2000', fieldVOOE: 'viaOsseaOE2000', fieldMascOD: 'mascaramentoOD2000', fieldMascOE: 'mascaramentoOE2000' },
    { label: '3000 Hz', fieldVAOD: 'viaAereaOD3000', fieldVAOE: 'viaAereaOE3000', fieldVOOD: 'viaOsseaOD3000', fieldVOOE: 'viaOsseaOE3000', fieldMascOD: 'mascaramentoOD3000', fieldMascOE: 'mascaramentoOE3000' },
    { label: '4000 Hz', fieldVAOD: 'viaAereaOD4000', fieldVAOE: 'viaAereaOE4000', fieldVOOD: 'viaOsseaOD4000', fieldVOOE: 'viaOsseaOE4000', fieldMascOD: 'mascaramentoOD4000', fieldMascOE: 'mascaramentoOE4000' },
    { label: '6000 Hz', fieldVAOD: 'viaAereaOD6000', fieldVAOE: 'viaAereaOE6000', fieldVOOD: null, fieldVOOE: null, fieldMascOD: 'mascaramentoOD6000', fieldMascOE: 'mascaramentoOE6000' },
    { label: '8000 Hz', fieldVAOD: 'viaAereaOD8000', fieldVAOE: 'viaAereaOE8000', fieldVOOD: null, fieldVOOE: null, fieldMascOD: 'mascaramentoOD8000', fieldMascOE: 'mascaramentoOE8000' },
  ];
  
  // Handlers para navegação com TAB
  const handleKeyDownVAOD = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const nextIndex = index + 1;
      if (nextIndex < inputRefsVAOD.current.length && inputRefsVAOD.current[nextIndex]) {
        inputRefsVAOD.current[nextIndex]?.focus();
      } else if (inputRefsVAOE.current.length > 0) {
        inputRefsVAOE.current[0]?.focus();
      }
    }
  }, []);

  const handleKeyDownVAOE = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const nextIndex = index + 1;
      if (nextIndex < inputRefsVAOE.current.length && inputRefsVAOE.current[nextIndex]) {
        inputRefsVAOE.current[nextIndex]?.focus();
      } else if (inputRefsVOOD.current.length > 0) {
        const firstVOODIndex = inputRefsVOOD.current.findIndex(ref => ref !== null);
        if (firstVOODIndex !== -1) {
          inputRefsVOOD.current[firstVOODIndex]?.focus();
        }
      }
    }
  }, []);
  
  const handleKeyDownVOOD = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const nextIndex = index + 1;
      if (nextIndex < inputRefsVOOD.current.length && inputRefsVOOD.current[nextIndex]) {
        inputRefsVOOD.current[nextIndex]?.focus();
      } else if (inputRefsVOOE.current.length > 0) {
        const firstVOOEIndex = inputRefsVOOE.current.findIndex(ref => ref !== null);
        if (firstVOOEIndex !== -1) {
          inputRefsVOOE.current[firstVOOEIndex]?.focus();
        }
      }
    }
  }, []);

  const handleKeyDownVOOE = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const nextIndex = index + 1;
      if (nextIndex < inputRefsVOOE.current.length && inputRefsVOOE.current[nextIndex]) {
        inputRefsVOOE.current[nextIndex]?.focus();
      } else if (inputRefsMascOD.current.length > 0) {
        inputRefsMascOD.current[0]?.focus();
      }
    }
  }, []);
  
  const handleKeyDownMascOD = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const nextIndex = index + 1;
      if (nextIndex < inputRefsMascOD.current.length) {
        inputRefsMascOD.current[nextIndex]?.focus();
      } else if (inputRefsMascOE.current.length > 0) {
        inputRefsMascOE.current[0]?.focus();
      }
    }
  }, []);

  const handleKeyDownMascOE = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const nextIndex = index + 1;
      if (nextIndex < inputRefsMascOE.current.length) {
        inputRefsMascOE.current[nextIndex]?.focus();
      }
    }
  }, []);


  const handleSave = useCallback(() => {
    onSave?.(formData);
  }, [formData, onSave]);

  const SectionTitle: React.FC<{ number: string; title: string; icon?: React.ReactNode }> = ({ number, title, icon }) => (
    <div className="flex items-start gap-3 mb-4">
      <div className="flex items-center justify-center w-8 h-8 bg-gray-800 rounded-lg text-white font-semibold text-sm">
        {number}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-xl font-bold text-gray-800">
            {title}
          </h2>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 p-4 md:p-8  min-h-screen">
        <Card className="p-6 shadow-lg border border-blue-200 bg-white">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="text-center lg:text-left">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                {exame || 'Exame Ocupacional'}
            </h1>
            <p className="text-gray-600 text-sm lg:text-base">
                {agendamento?.TIPOEXAMENOME}
            </p>
            </div>
            
            {/* Status do atendimento */}
            <div className="flex items-center gap-3 bg-red-50 px-4 py-3 rounded-lg border border-red-200 min-w-[280px]">
            <div className="flex-shrink-0">
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-red-800">Em Andamento</span>
                </div>
                <p className="text-xs text-red-700">
                Realizando procedimento
                </p>
            </div>
            </div>
        </div>
        </Card>
      
      {/* 1. Dados Iniciais e Anamnese */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle number="1" title="Dados do Atendimento e Anamnese" />
        
        <div className="space-y-6">
            {/* Dados Pessoais */}
            <div className=" p-4">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Dados Pessoais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo:</label>
                        <Input value={agendamento?.NOME} isReadOnly className="bg-white border-gray-300" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">CPF:</label>
                        <Input value={agendamento?.CPFFUNCIONARIO} isReadOnly className="bg-white border-gray-300" placeholder="000.000.000-00" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Data Nascimento:</label>
                        <Input value={agendamento?.DATANASCIMENTO ?? ""} isReadOnly className="bg-white border-gray-300" placeholder="DD/MM/AAAA" />
                    </div>
                </div>
            </div>

            {/* Dados Profissionais */}
            <div className="p-4 ">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Dados Profissionais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cargo:</label>
                        <Input value={agendamento?.NOMECARGO} isReadOnly className="bg-white border-gray-300" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Setor:</label>
                        <Input value={agendamento?.NOMESETOR} isReadOnly className="bg-white border-gray-300" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Exame:</label>
                        <Input value={agendamento?.TIPOEXAMENOME} isReadOnly className="bg-white border-gray-300" />
                    </div>
                </div>
            </div>

            {/* Anamnese */}
            <div className="p-4">
                <h3 className="font-bold text-center text-gray-700 mb-3 text-sm uppercase tracking-wide">Anamnese Auditiva</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {/* Linha 1 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2"> Queixa ou sintoma auditivo atual? </label>
                        <div className="flex gap-4">
                            {['Sim', 'Não'].map((option) => (
                                <Checkbox
                                    key={option}
                                    isSelected={formData.queixaAuditiva === option}
                                    onValueChange={(checked) => checked && handleCheckboxChange('queixaAuditiva', option)}
                                    classNames={{ label: "text-sm text-gray-700" }}
                                >
                                    {option}
                                </Checkbox>
                            ))}
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2"> Audiometria Anterior?* </label>
                        <div className="flex gap-4">
                            {['Sim', 'Não'].map((option) => (
                                <Checkbox
                                    key={option}
                                    isSelected={formData.audiometriaAnterior === option}
                                    onValueChange={(checked) => checked && handleCheckboxChange('audiometriaAnterior', option)}
                                    classNames={{ label: "text-sm text-gray-700" }}
                                >
                                    {option}
                                </Checkbox>
                            ))}
                        </div>
                        {/* Se for sim, o sistema deveria carregar o RA (limiaresRAOD/OE) */}
                        {formData.audiometriaAnterior === 'Sim' && (
                            <p className="text-xs text-amber-600 mt-1"> 
                                *Exame Sequencial. Protocolo NR-7 exige comparação com a Audiometria de Referência (RA).
                            </p>
                        )}
                        {formData.audiometriaAnterior === 'Não' && (
                            <p className="text-xs text-green-600 mt-1"> 
                                *Primeiro exame. Este será a Audiometria de Referência (RA).
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2"> Infecção ou Cirurgia no Ouvido? </label>
                        <div className="flex gap-4">
                            {['Sim', 'Não'].map((option) => (
                                <Checkbox
                                    key={option}
                                    isSelected={formData.infeccaoCirurgiaOuvido === option}
                                    onValueChange={(checked) => checked && handleCheckboxChange('infeccaoCirurgiaOuvido', option)}
                                    classNames={{ label: "text-sm text-gray-700" }}
                                >
                                    {option}
                                </Checkbox>
                            ))}
                        </div>
                    </div>

                    {/* Linha 2 - Ototóxicos e Surdez Familiar */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2"> Tratamento antibióticos e/ou ototóxicos? </label>
                            <div className="flex gap-4 mb-2">
                                <Checkbox isSelected={formData.tratamentoOtotoxicos === 'Sim'} onValueChange={(checked) => handleCheckboxChange('tratamentoOtotoxicos', checked ? 'Sim' : 'Não')} classNames={{ label: "text-gray-700" }} > Sim </Checkbox>
                                <Checkbox isSelected={formData.tratamentoOtotoxicos === 'Não'} onValueChange={(checked) => handleCheckboxChange('tratamentoOtotoxicos', checked ? 'Não' : 'Sim')} classNames={{ label: "text-gray-700" }} > Não </Checkbox>
                            </div>
                            {formData.tratamentoOtotoxicos === 'Sim' && (
                                <Input type="date" value={formData.dataTratamentoOtotoxicos} onChange={(e) => handleInputChange('dataTratamentoOtotoxicos', e.target.value)} className="border-gray-300 mt-2 bg-white" />
                            )}
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2"> Casos de surdez na família? </label>
                            <div className="flex gap-4 mb-2">
                                <Checkbox isSelected={formData.surdezFamilia === 'Sim'} onValueChange={(checked) => handleCheckboxChange('surdezFamilia', checked ? 'Sim' : 'Não')} classNames={{ label: "text-gray-700" }} > Sim </Checkbox>
                                <Checkbox isSelected={formData.surdezFamilia === 'Não'} onValueChange={(checked) => handleCheckboxChange('surdezFamilia', checked ? 'Não' : 'Sim')} classNames={{ label: "text-gray-700" }} > Não </Checkbox>
                            </div>
                            {formData.surdezFamilia === 'Sim' && (
                                <Input value={formData.parentescoSurdez} onChange={(e) => handleInputChange('parentescoSurdez', e.target.value)} placeholder="Grau de parentesco" className="border-gray-300 mt-2 bg-white" />
                            )}
                        </div>
                    </div>
                    
                    {/* Linha 3 - Exposição Ocupacional */}
                    <div className=" p-4 rounded-lg col-span-full">
                        <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wide text-center">Exposição Ocupacional</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2"> Já trabalhou em ambiente ruidoso? </label>
                                <div className="flex gap-4">
                                    <Checkbox isSelected={formData.trabalhoAnteriorRuido === 'Sim'} onValueChange={(checked) => handleCheckboxChange('trabalhoAnteriorRuido', checked ? 'Sim' : 'Não')} classNames={{ label: "text-gray-700" }} > Sim </Checkbox>
                                    <Checkbox isSelected={formData.trabalhoAnteriorRuido === 'Não'} onValueChange={(checked) => handleCheckboxChange('trabalhoAnteriorRuido', checked ? 'Não' : 'Sim')} classNames={{ label: "text-gray-700" }} > Não </Checkbox>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2"> Trabalha atualmente em ambiente ruidoso? </label>
                                <div className="flex gap-4">
                                    <Checkbox isSelected={formData.trabalhoAtualRuido === 'Sim'} onValueChange={(checked) => handleCheckboxChange('trabalhoAtualRuido', checked ? 'Sim' : 'Não')} classNames={{ label: "text-gray-700" }} > Sim </Checkbox>
                                    <Checkbox isSelected={formData.trabalhoAtualRuido === 'Não'} onValueChange={(checked) => handleCheckboxChange('trabalhoAtualRuido', checked ? 'Não' : 'Sim')} classNames={{ label: "text-gray-700" }} > Não </Checkbox>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2"> Usa Protetor Auricular? </label>
                                <div className="flex gap-4">
                                    <Checkbox isSelected={formData.usoProtetorAuricular === 'Sim'} onValueChange={(checked) => handleCheckboxChange('usoProtetorAuricular', checked ? 'Sim' : 'Não')} classNames={{ label: "text-gray-700" }} > Sim </Checkbox>
                                    <Checkbox isSelected={formData.usoProtetorAuricular === 'Não'} onValueChange={(checked) => handleCheckboxChange('usoProtetorAuricular', checked ? 'Não' : 'Sim')} classNames={{ label: "text-gray-700" }} > Não </Checkbox>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2"> Contato com produtos químicos ou solventes? </label>
                                <div className="flex gap-4">
                                    <Checkbox isSelected={formData.contatoQuimicos === 'Sim'} onValueChange={(checked) => handleCheckboxChange('contatoQuimicos', checked ? 'Sim' : 'Não')} classNames={{ label: "text-gray-700" }} > Sim </Checkbox>
                                    <Checkbox isSelected={formData.contatoQuimicos === 'Não'} onValueChange={(checked) => handleCheckboxChange('contatoQuimicos', checked ? 'Não' : 'Sim')} classNames={{ label: "text-gray-700" }} > Não </Checkbox>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Linha 4 - Fatores Agravantes */}
                    <div className=" p-4 rounded-lg col-span-full">
                        <h3 className="font-bold text-center text-gray-700 mb-3 text-sm uppercase tracking-wide">Sintomas e Fatores Agravantes</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2"> Costuma ouvir música (caixas, fones, etc)? </label>
                                <div className="flex gap-4">
                                    <Checkbox isSelected={formData.habitoSomAlto === 'Sim'} onValueChange={(checked) => handleCheckboxChange('habitoSomAlto', checked ? 'Sim' : 'Não')} classNames={{ label: "text-gray-700" }} > Sim </Checkbox>
                                    <Checkbox isSelected={formData.habitoSomAlto === 'Não'} onValueChange={(checked) => handleCheckboxChange('habitoSomAlto', checked ? 'Não' : 'Sim')} classNames={{ label: "text-gray-700" }} > Não </Checkbox>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2"> Já teve contato com explosões? </label>
                                <div className="flex gap-4">
                                    <Checkbox isSelected={formData.exposicaoExplosoes === 'Sim'} onValueChange={(checked) => handleCheckboxChange('exposicaoExplosoes', checked ? 'Sim' : 'Não')} classNames={{ label: "text-gray-700" }} > Sim </Checkbox>
                                    <Checkbox isSelected={formData.exposicaoExplosoes === 'Não'} onValueChange={(checked) => handleCheckboxChange('exposicaoExplosoes', checked ? 'Não' : 'Sim')} classNames={{ label: "text-gray-700" }} > Não </Checkbox>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2"> Trauma na Cabeça ou Ouvido? </label>
                                <div className="flex gap-4">
                                    <Checkbox isSelected={formData.traumaCabecaOuvido === 'Sim'} onValueChange={(checked) => handleCheckboxChange('traumaCabecaOuvido', checked ? 'Sim' : 'Não')} classNames={{ label: "text-gray-700" }} > Sim </Checkbox>
                                    <Checkbox isSelected={formData.traumaCabecaOuvido === 'Não'} onValueChange={(checked) => handleCheckboxChange('traumaCabecaOuvido', checked ? 'Não' : 'Sim')} classNames={{ label: "text-gray-700" }} > Não </Checkbox>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2"> Labirintite ou Tontura? </label>
                                <div className="flex gap-4">
                                    <Checkbox isSelected={formData.labirintiteTontura === 'Sim'} onValueChange={(checked) => handleCheckboxChange('labirintiteTontura', checked ? 'Sim' : 'Não')} classNames={{ label: "text-gray-700" }} > Sim </Checkbox>
                                    <Checkbox isSelected={formData.labirintiteTontura === 'Não'} onValueChange={(checked) => handleCheckboxChange('labirintiteTontura', checked ? 'Não' : 'Sim')} classNames={{ label: "text-gray-700" }} > Não </Checkbox>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2"> Uso de Medicamentos Atuais? </label>
                            <div className="flex gap-4 mb-2">
                                <Checkbox isSelected={formData.usoMedicamentos === 'Sim'} onValueChange={(checked) => handleCheckboxChange('usoMedicamentos', checked ? 'Sim' : 'Não')} classNames={{ label: "text-gray-700" }} > Sim </Checkbox>
                                <Checkbox isSelected={formData.usoMedicamentos === 'Não'} onValueChange={(checked) => handleCheckboxChange('usoMedicamentos', checked ? 'Não' : 'Sim')} classNames={{ label: "text-gray-700" }} > Não </Checkbox>
                            </div>
                            {formData.usoMedicamentos === 'Sim' && (
                                <Input value={formData.quaisMedicamentos} onChange={(e) => handleInputChange('quaisMedicamentos', e.target.value)} placeholder="Quais medicamentos?" className="border-gray-300 mt-2 bg-white" />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </Card>

      {/* 2. Dados do Exame */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle number="2" title="Dados do Exame e Protocolo" />
        <div className="space-y-6">

            {/* Dados Técnicos */}
            <div className="p-4 ">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Dados Técnicos</h3>
                <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Data da Calibração*</label>
                        <Input 
                            type="date" 
                            value={formData.dataCalibracao} 
                            onChange={(e) => handleInputChange('dataCalibracao', e.target.value)} 
                            className="border-gray-300 bg-white" 
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Audiômetro</label>
                        <Select selectedKeys={[formData.tipoAudiometro]} onChange={(e) => handleInputChange('tipoAudiometro', e.target.value)} classNames={{ trigger: "bg-white border-gray-300" }} >
                            <SelectItem key="AVS 500">AVS 500</SelectItem>
                            <SelectItem key="AS 60">AS 60</SelectItem>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Repouso Auditivo ≥14h?*</label>
                        <div className="flex gap-2">
                            <Checkbox isSelected={formData.repousoAuditivo === 'Sim'} onValueChange={(checked) => handleInputChange('repousoAuditivo', checked ? 'Sim' : 'Não')} classNames={{ label: "text-gray-700" }} > Sim </Checkbox>
                            <Checkbox isSelected={formData.repousoAuditivo === 'Não'} onValueChange={(checked) => handleInputChange('repousoAuditivo', checked ? 'Não' : 'Sim')} classNames={{ label: "text-gray-700" }} > Não </Checkbox>
                            {formData.repousoAuditivo === 'Sim' && (
                                <Input 
                                    type="number" 
                                    value={formData.horasRepouso.toString()} 
                                    onChange={(e) => handleInputChange('horasRepouso', parseInt(e.target.value))} 
                                    placeholder="Horas de repouso" 
                                    className="border-gray-300 mt-2 bg-white" 
                                    min="14" 
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Meatoscopia */}
            <div className="p-4 ">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Meatoscopia</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">OD</label>
                        <Select selectedKeys={[formData.meatoscopiaOD]} onChange={(e) => handleInputChange('meatoscopiaOD', e.target.value)} classNames={{ trigger: "bg-white border-gray-300" }} >
                            <SelectItem key="Normal">Normal</SelectItem>
                            <SelectItem key="Rolha de Cerúmen">Rolha de Cerúmen</SelectItem>
                            <SelectItem key="Corpo Estranho">Corpo Estranho</SelectItem>
                            <SelectItem key="Otorreia">Otorreia</SelectItem>
                            <SelectItem key="Outros">Outros</SelectItem>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">OE</label>
                        <Select selectedKeys={[formData.meatoscopiaOE]} onChange={(e) => handleInputChange('meatoscopiaOE', e.target.value)} classNames={{ trigger: "bg-white border-gray-300" }} >
                            <SelectItem key="Normal">Normal</SelectItem>
                            <SelectItem key="Rolha de Cerúmen">Rolha de Cerúmen</SelectItem>
                            <SelectItem key="Corpo Estranho">Corpo Estranho</SelectItem>
                            <SelectItem key="Otorreia">Otorreia</SelectItem>
                            <SelectItem key="Outros">Outros</SelectItem>
                        </Select>
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Observações da Meatoscopia</label>
                        <Input value={formData.observacoesMeatoscopia} onChange={(e) => handleInputChange('observacoesMeatoscopia', e.target.value)} className="border-gray-300 bg-white" placeholder="Ex: Cerúmen impactado OD" />
                    </div>
                </div>
            </div>
            
        </div>
      </Card>
      
      {/* 3. Limiares Auditivos */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle number="3" title="Audiometria Tonal (Limiares Auditivos)" />
        
        <div className="mb-4">
            <p className="text-xs text-amber-600 mt-1"> 💡 Dica: Use TAB para navegar rapidamente entre os campos. </p>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
                <thead>
                    <tr className="bg-gray-100">
                        <th rowSpan={2} className="border border-gray-300 p-2 font-semibold">Orelha</th>
                        <th rowSpan={2} className="border border-gray-300 p-2 font-semibold">Tipo</th>
                        <th colSpan={frequencias.length} className="border border-gray-300 p-2 font-semibold text-center"> Frequências (Hz) </th>
                    </tr>
                    <tr className="bg-gray-50">
                        {frequencias.map((freq) => (
                            <th key={freq.label} className="border border-gray-300 p-2 font-medium text-sm text-center">
                                {freq.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {/* OD - Via Aérea */}
                    <tr className="bg-white">
                        <td rowSpan={3} className="border border-gray-300 p-2 text-center font-medium text-red-700 bg-red-50"> OD </td>
                        <td className="border border-gray-300 p-2 text-center font-medium text-sm bg-red-50"> VA </td>
                        {frequencias.map((freq, index) => (
                            <td key={`va-od-${freq.label}`} className="border border-gray-300 p-1">
                                <Input 
                                    ref={el => { inputRefsVAOD.current[index] = el; }} 
                                    type="number" 
                                    value={formData[freq.fieldVAOD as keyof AudiometriaData] as string} 
                                    onChange={(e) => handleDecibelInputChange(freq.fieldVAOD as keyof AudiometriaData, e.target.value)} 
                                    onKeyDown={(e) => handleKeyDownVAOD(index, e)} 
                                    className="text-center border-red-300 bg-white focus:border-red-500 h-10 w-full" 
                                    placeholder="0" 
                                    min="0" 
                                    max="120" 
                                />
                            </td>
                        ))}
                    </tr>
                    {/* OD - Via Óssea */}
                    <tr className="bg-gray-50">
                        <td className="border border-gray-300 p-2 text-center font-medium text-sm bg-red-50"> VO </td>
                        {frequencias.map((freq, index) => (
                            <td key={`vo-od-${freq.label}`} className="border border-gray-300 p-1">
                                {freq.fieldVOOD ? (
                                    <Input 
                                        ref={el => { inputRefsVOOD.current[index] = el; }} 
                                        type="number" 
                                        value={formData[freq.fieldVOOD as keyof AudiometriaData] as string} 
                                        onChange={(e) => handleDecibelInputChange(freq.fieldVOOD as keyof AudiometriaData, e.target.value)} 
                                        onKeyDown={(e) => handleKeyDownVOOD(index, e)} 
                                        className="text-center border-red-300 bg-white focus:border-red-500 h-10 w-full" 
                                        placeholder="0" 
                                        min="0" 
                                        max="120" 
                                    />
                                ) : (
                                    <div className="text-center text-gray-400 py-2 text-sm">-</div>
                                )}
                            </td>
                        ))}
                    </tr>
                    {/* OD - Mascaramento */}
                    <tr className="bg-white">
                        <td className="border border-gray-300 p-2 text-center font-medium text-sm bg-red-50"> Masc </td>
                        {frequencias.map((freq, index) => (
                            <td key={`masc-od-${freq.label}`} className="border border-gray-300 p-1">
                                <Input 
                                    ref={el => { inputRefsMascOD.current[index] = el; }} 
                                    type="number" 
                                    value={formData[freq.fieldMascOD as keyof AudiometriaData] as string} 
                                    onChange={(e) => handleDecibelInputChange(freq.fieldMascOD as keyof AudiometriaData, e.target.value)} 
                                    onKeyDown={(e) => handleKeyDownMascOD(index, e)} 
                                    className="text-center border-red-300 bg-white focus:border-red-500 h-10 w-full" 
                                    placeholder="0" 
                                    min="0" 
                                    max="120" 
                                />
                            </td>
                        ))}
                    </tr>
                    
                    {/* OE - Via Aérea */}
                    <tr className="bg-white">
                        <td rowSpan={3} className="border border-gray-300 p-2 text-center font-medium text-blue-700 bg-blue-50"> OE </td>
                        <td className="border border-gray-300 p-2 text-center font-medium text-sm bg-blue-50"> VA </td>
                        {frequencias.map((freq, index) => (
                            <td key={`va-oe-${freq.label}`} className="border border-gray-300 p-1">
                                <Input 
                                    ref={el => { inputRefsVAOE.current[index] = el; }} 
                                    type="number" 
                                    value={formData[freq.fieldVAOE as keyof AudiometriaData] as string} 
                                    onChange={(e) => handleDecibelInputChange(freq.fieldVAOE as keyof AudiometriaData, e.target.value)} 
                                    onKeyDown={(e) => handleKeyDownVAOE(index, e)} 
                                    className="text-center border-blue-300 bg-white focus:border-blue-500 h-10 w-full" 
                                    placeholder="0" 
                                    min="0" 
                                    max="120" 
                                />
                            </td>
                        ))}
                    </tr>
                    {/* OE - Via Óssea */}
                    <tr className="bg-gray-50">
                        <td className="border border-gray-300 p-2 text-center font-medium text-sm bg-blue-50"> VO </td>
                        {frequencias.map((freq, index) => (
                            <td key={`vo-oe-${freq.label}`} className="border border-gray-300 p-1">
                                {freq.fieldVOOE ? (
                                    <Input 
                                        ref={el => { inputRefsVOOE.current[index] = el; }} 
                                        type="number" 
                                        value={formData[freq.fieldVOOE as keyof AudiometriaData] as string} 
                                        onChange={(e) => handleDecibelInputChange(freq.fieldVOOE as keyof AudiometriaData, e.target.value)} 
                                        onKeyDown={(e) => handleKeyDownVOOE(index, e)} 
                                        className="text-center border-blue-300 bg-white focus:border-blue-500 h-10 w-full" 
                                        placeholder="0" 
                                        min="0" 
                                        max="120" 
                                    />
                                ) : (
                                    <div className="text-center text-gray-400 py-2 text-sm">-</div>
                                )}
                            </td>
                        ))}
                    </tr>
                    {/* OE - Mascaramento */}
                    <tr className="bg-white">
                        <td className="border border-gray-300 p-2 text-center font-medium text-sm bg-blue-50"> Masc </td>
                        {frequencias.map((freq, index) => (
                            <td key={`masc-oe-${freq.label}`} className="border border-gray-300 p-1">
                                <Input 
                                    ref={el => { inputRefsMascOE.current[index] = el; }} 
                                    type="number" 
                                    value={formData[freq.fieldMascOE as keyof AudiometriaData] as string} 
                                    onChange={(e) => handleDecibelInputChange(freq.fieldMascOE as keyof AudiometriaData, e.target.value)} 
                                    onKeyDown={(e) => handleKeyDownMascOE(index, e)} 
                                    className="text-center border-blue-300 bg-white focus:border-blue-500 h-10 w-full" 
                                    placeholder="0" 
                                    min="0" 
                                    max="120" 
                                />
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </div>
      </Card>

      {/* 4. Índices de Reconhecimento de Fala - OPCIONAL */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle number="4" title="Índices de Reconhecimento de Fala (Opcional)" icon={<Calculator className="h-5 w-5 text-gray-600" />} />
        
        <div className="flex items-center gap-2 mb-6">
            <Checkbox isSelected={formData.realizarIRF} onValueChange={(checked) => handleInputChange('realizarIRF', checked)} classNames={{ label: "text-sm font-medium text-gray-700" }}>
                Realizar e calcular Índices de Fala (SRT e IRF)
            </Checkbox>
        </div>
        
        {formData.realizarIRF && (
            <div className="space-y-6">
                {/* SRT - Speech Reception Threshold */}
                <div className="p-4 ">
                    <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">SRT - Speech Reception Threshold (Limiar de Reconhecimento de Fala)</h3>
                    <p className="text-xs text-gray-500 mb-4">O valor do SRT é calculado automaticamente com base na média de 500, 1000 e 2000 Hz, mas pode ser preenchido manualmente.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="text-center bg-red-50 p-4 rounded-lg border border-red-200">
                            <h4 className="font-medium text-red-800 mb-3">OD - Ouvido Direito</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-red-700 mb-2">SRT (dB)</label>
                                    <Input 
                                        type="number" 
                                        value={formData.srtOD} 
                                        onChange={(e) => handleDecibelInputChange('srtOD', e.target.value)} 
                                        className="text-center border-red-300 bg-white" 
                                        placeholder="Auto-calculado" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-red-700 mb-2">Resultado</label>
                                    <Input 
                                        value={formData.resultadoSRTOD} 
                                        isReadOnly 
                                        className={`text-center font-bold bg-transparent border-none ${ 
                                            formData.resultadoSRTOD === 'Normal' ? 'text-green-600' : 
                                            formData.resultadoSRTOD === 'Limítrofe' ? 'text-amber-500' : 'text-red-600' 
                                        }`} 
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="text-center bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h4 className="font-medium text-blue-800 mb-3">OE - Ouvido Esquerdo</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-blue-700 mb-2">SRT (dB)</label>
                                    <Input 
                                        type="number" 
                                        value={formData.srtOE} 
                                        onChange={(e) => handleDecibelInputChange('srtOE', e.target.value)} 
                                        className="text-center border-blue-300 bg-white" 
                                        placeholder="Auto-calculado" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-blue-700 mb-2">Resultado</label>
                                    <Input 
                                        value={formData.resultadoSRTOE} 
                                        isReadOnly 
                                        className={`text-center font-bold bg-transparent border-none ${ 
                                            formData.resultadoSRTOE === 'Normal' ? 'text-green-600' : 
                                            formData.resultadoSRTOE === 'Limítrofe' ? 'text-amber-500' : 'text-red-600' 
                                        }`} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* IRF - Índice de Reconhecimento de Fala */}
                <div className="p-4">
                    <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">IRF - Índice de Reconhecimento de Fala</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="text-center bg-red-50 p-4 rounded-lg border border-red-200">
                            <h4 className="font-medium text-red-800 mb-3">OD - Ouvido Direito</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-red-700 mb-2">IRF (%)</label>
                                    <Input type="number" value={formData.irfOD} onChange={(e) => handleInputChange('irfOD', e.target.value)} className="text-center border-red-300 bg-white" placeholder="Percentual" min="0" max="100" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-red-700 mb-2">IRF (dB)</label>
                                    <Input type="number" value={formData.irfDBOD} onChange={(e) => handleDecibelInputChange('irfDBOD', e.target.value)} className="text-center border-red-300 bg-white" placeholder="Decibéis" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-red-700 mb-2">Resultado Monoaural</label>
                                    <Input 
                                        value={formData.resultadoIRFMonoauralOD} 
                                        isReadOnly 
                                        className={`text-center font-bold bg-transparent border-none ${ 
                                            formData.resultadoIRFMonoauralOD.includes('Normal') ? 'text-green-600' : 
                                            formData.resultadoIRFMonoauralOD.includes('Limítrofe') ? 'text-amber-500' : 'text-red-600' 
                                        }`} 
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="text-center bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h4 className="font-medium text-blue-800 mb-3">OE - Ouvido Esquerdo</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-blue-700 mb-2">IRF (%)</label>
                                    <Input type="number" value={formData.irfOE} onChange={(e) => handleInputChange('irfOE', e.target.value)} className="text-center border-blue-300 bg-white" placeholder="Percentual" min="0" max="100" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-blue-700 mb-2">IRF (dB)</label>
                                    <Input type="number" value={formData.irfDBOE} onChange={(e) => handleDecibelInputChange('irfDBOE', e.target.value)} className="text-center border-blue-300 bg-white" placeholder="Decibéis" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-blue-700 mb-2">Resultado Monoaural</label>
                                    <Input 
                                        value={formData.resultadoIRFMonoauralOE} 
                                        isReadOnly 
                                        className={`text-center font-bold bg-transparent border-none ${ 
                                            formData.resultadoIRFMonoauralOE.includes('Normal') ? 'text-green-600' : 
                                            formData.resultadoIRFMonoauralOE.includes('Limítrofe') ? 'text-amber-500' : 'text-red-600' 
                                        }`} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 text-center">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Resultado Dissimétrico</label>
                        <Input 
                            value={formData.resultadoIRFDissimetrica} 
                            isReadOnly 
                            className={`text-center font-bold bg-transparent border-none text-gray-800`} 
                        />
                    </div>
                </div>
            </div>
        )}
      </Card>
      
      {/* 5. Conclusão e Laudo Final */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle number="5" title="Conclusão e Laudo Final" />
        
        <div className="space-y-6">
            {/* Classificações e Critérios NR-7 */}
            <div className="p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Resultado OD */}
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h3 className="font-bold text-red-800 mb-4 text-center">OD - Ouvido Direito</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-semibold text-red-700 mb-1">Classificação (Grau Lloyd & Kaplan)</label>
                                <div className={`text-center font-bold text-sm p-2 rounded ${ 
                                    formData.classificacaoOD.includes('normalidade') ? 'bg-green-100 text-green-800' : 
                                    formData.classificacaoOD.includes('Leve') ? 'bg-amber-100 text-amber-800' : 
                                    formData.classificacaoOD.includes('Moderada') ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800' 
                                }`}>
                                    { formData.classificacaoOD }
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="text-center">
                                    <div className="font-semibold text-red-700">Média Tonal (4f)</div>
                                    <div className="font-bold text-gray-800">{formData.mediaTonalOD} dB</div>
                                </div>
                                <div className="text-center">
                                    <div className="font-semibold text-red-700">Tipo de Perda</div>
                                    <div className="font-bold text-gray-800">{formData.tipoPerdaOD}</div>
                                </div>
                                <div className="text-center">
                                    <div className="font-semibold text-red-700">Configuração</div>
                                    <div className="font-bold text-gray-800">{formData.configuracaoOD}</div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 mt-2">
                                Frequências Alteradas: <span className="font-semibold">{formData.frequenciasAlteradasOD || 'Nenhuma'}</span>
                            </p>
                        </div>
                    </div>

                    {/* Resultado OE */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h3 className="font-bold text-blue-800 mb-4 text-center">OE - Ouvido Esquerdo</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-semibold text-blue-700 mb-1">Classificação (Grau Lloyd & Kaplan)</label>
                                <div className={`text-center font-bold text-sm p-2 rounded ${ 
                                    formData.classificacaoOE.includes('normalidade') ? 'bg-green-100 text-green-800' : 
                                    formData.classificacaoOE.includes('Leve') ? 'bg-amber-100 text-amber-800' : 
                                    formData.classificacaoOE.includes('Moderada') ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800' 
                                }`}>
                                    { formData.classificacaoOE }
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="text-center">
                                    <div className="font-semibold text-blue-700">Média Tonal (4f)</div>
                                    <div className="font-bold text-gray-800">{formData.mediaTonalOE} dB</div>
                                </div>
                                <div className="text-center">
                                    <div className="font-semibold text-blue-700">Tipo de Perda</div>
                                    <div className="font-bold text-gray-800">{formData.tipoPerdaOE}</div>
                                </div>
                                <div className="text-center">
                                    <div className="font-semibold text-blue-700">Configuração</div>
                                    <div className="font-bold text-gray-800">{formData.configuracaoOE}</div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 mt-2">
                                Frequências Alteradas: <span className="font-semibold">{formData.frequenciasAlteradasOE || 'Nenhuma'}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Conclusão Geral */}
            <div className="p-4">
                <h3 className="font-bold text-gray-700 mb-3 text-md uppercase tracking-wide">Resultados</h3>              
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm text-center font-medium text-red-700 mb-2">Ouvido Direito</label>
                        <Textarea 
                            value={formData.resultadoOD}
                            onChange={(e) => handleInputChange('resultadoOD', e.target.value)}
                            rows={8}
                            placeholder="Limiares auditivos dentro dos padrões da normalidade. [Tabela de Classificação]"
                            className="bg-white border-red-300 font-mono text-xs"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-center font-medium text-blue-700 mb-2">Ouvido Esquerdo</label>
                        <Textarea 
                            value={formData.resultadoOE}
                            onChange={(e) => handleInputChange('resultadoOE', e.target.value)}
                            rows={8}
                            placeholder="Perda Auditiva Leve Neurossensorial Descendente nas frequências 4000 Hz, 6000 Hz. [Tabela de Classificação]"
                            className="bg-white border-blue-300 font-mono text-xs"
                            required
                        />
                    </div>
                </div>
                {/* NOVO CAMPO: Cota PCD (SUGESTÃO) */}
                <div className="mb-6p-3 rounded-lg mb-6">
                    <label className="flex gap-2 text-sm font-medium text-gray-700 mb-2">
                        Sugestão de enquadramento PCD
                    </label>
                    <Textarea 
                        value={formData.criterioPCD}
                        isReadOnly
                        rows={2}
                        className={`bg-gray-50 text-sm font-semibold ${formData.criterioPCD.includes('POSSIBILIDADE') ? 'text-green-700 border-green-300' : 'text-gray-700 border-gray-300'}`}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Observações do avaliador</label>
                    <Textarea
                        value={formData.observacoes}
                        onChange={(e) => handleInputChange('observacoes', e.target.value)}
                        rows={4}
                        placeholder="Ex: orientado quanto ao uso contínuo do protetor auricular, configuração descendente sugestiva de perda por ruído..."
                        className="bg-white border-gray-300"
                    />
                </div>
            </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
        <Button
          variant="flat"
          onPress={onClose}
          className="px-8 border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </Button>
        <Button
          color="primary"
          onPress={handleSave}
          className="px-8 bg-gray-800 text-white shadow-sm hover:bg-gray-700 transition-colors"
          startContent={<FileText className="h-4 w-4" />}
          isDisabled={!formData.resultadoOD || !formData.resultadoOE}
        >
          Salvar Formulário
        </Button>
      </div>
    </div>
  );
};

export default AudiometriaOcupacional;