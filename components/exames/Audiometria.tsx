import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  dataExame: string;
  horaExame: string;
  localExame: string;
  tipoAudiometro: string;
  metodoAtenuacao: string;
  nivelRuidoAmbiente: string;
  criterioUtilizado: string;
  
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
  
  // Audiometria Tonal - Via Aérea
  viaAereaOD250: string;
  viaAereaOD500: string;
  viaAereaOD1000: string;
  viaAereaOD2000: string;
  viaAereaOD3000: string;
  viaAereaOD4000: string;
  viaAereaOD6000: string;
  viaAereaOD8000: string;
  
  viaAereaOE250: string;
  viaAereaOE500: string;
  viaAereaOE1000: string;
  viaAereaOE2000: string;
  viaAereaOE3000: string;
  viaAereaOE4000: string;
  viaAereaOE6000: string;
  viaAereaOE8000: string;
  
  // Audiometria Tonal - Via Óssea
  viaOsseaOD500: string;
  viaOsseaOD1000: string;
  viaOsseaOD2000: string;
  viaOsseaOD3000: string;
  viaOsseaOD4000: string;
  
  viaOsseaOE500: string;
  viaOsseaOE1000: string;
  viaOsseaOE2000: string;
  viaOsseaOE3000: string;
  viaOsseaOE4000: string;
  
  // Mascaramento por frequência - OD
  mascaramentoOD250: string;
  mascaramentoOD500: string;
  mascaramentoOD1000: string;
  mascaramentoOD2000: string;
  mascaramentoOD3000: string;
  mascaramentoOD4000: string;
  mascaramentoOD6000: string;
  mascaramentoOD8000: string;
  
  // Mascaramento por frequência - OE
  mascaramentoOE250: string;
  mascaramentoOE500: string;
  mascaramentoOE1000: string;
  mascaramentoOE2000: string;
  mascaramentoOE3000: string;
  mascaramentoOE4000: string;
  mascaramentoOE6000: string;
  mascaramentoOE8000: string;
  
  // Índices de Reconhecimento de Fala
  realizarIRF: boolean;
  srtOD: string;
  srtOE: string;
  irfOD: string;
  irfOE: string;
  irfDBOD: string;
  irfDBOE: string;
  resultadoSRTOD: string;
  resultadoSRTOE: string;
  resultadoIRFOD: string;
  resultadoIRFOE: string;
  resultadoIRFMonoauralOD: string;
  resultadoIRFMonoauralOE: string;
  resultadoIRFDissimetrica: string;
  
  // === CRITÉRIOS PAIR NR-7 ===
  entalhe4000HzOD: boolean;
  entalhe4000HzOE: boolean;
  tipoPerdaOD: string;
  tipoPerdaOE: string;
  
  // === TRIAGEM E ENCAMINHAMENTOS ===
  encaminhamentoORL: boolean;
  motivoEncaminhamento: string;
  urgenciaEncaminhamento: string;
  
  // Classificações
  classificacaoOD: string;
  classificacaoOE: string;
  classificacaoGeral: string;
  configuracaoOD: string;
  configuracaoOE: string;
  
  // Laudo e Observações
  conclusao: string;
  observacoes: string;

  
  // Campos calculados
  perdaAuditivaOD: string;
  perdaAuditivaOE: string;
  textoResultado: string;
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

  
  // Refs para os inputs de limiares
  const inputRefsVAOD = useRef<(HTMLInputElement | null)[]>([]);
  const inputRefsVAOE = useRef<(HTMLInputElement | null)[]>([]);
  const inputRefsVOOD = useRef<(HTMLInputElement | null)[]>([]);
  const inputRefsVOOE = useRef<(HTMLInputElement | null)[]>([]);
  const inputRefsMascOD = useRef<(HTMLInputElement | null)[]>([]);
  const inputRefsMascOE = useRef<(HTMLInputElement | null)[]>([]);
  
  const [formData, setFormData] = useState<AudiometriaData>({
    // Dados do Exame
    dataExame: new Date().toISOString().split('T')[0],
    horaExame: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    localExame: 'Clínica',
    tipoAudiometro: 'AVS 500',
    metodoAtenuacao: 'Hughson-Westlake',
    nivelRuidoAmbiente: '< 40 dB NA',
    criterioUtilizado: 'ANSI S3.21-1978',
    
    // Dados técnicos
    dataCalibracao: '09/01/2025',
    repousoAuditivo: 'Sim',
    horasRepouso: 14,
    
    // Anamnese completa
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
    
    // Meatoscopia
    meatoscopiaOD: 'Normal',
    meatoscopiaOE: 'Normal',
    observacoesMeatoscopia: '',
    
    // Via Aérea - OD
    viaAereaOD250: '', viaAereaOD500: '', viaAereaOD1000: '', viaAereaOD2000: '',
    viaAereaOD3000: '', viaAereaOD4000: '', viaAereaOD6000: '', viaAereaOD8000: '',
    
    // Via Aérea - OE
    viaAereaOE250: '', viaAereaOE500: '', viaAereaOE1000: '', viaAereaOE2000: '',
    viaAereaOE3000: '', viaAereaOE4000: '', viaAereaOE6000: '', viaAereaOE8000: '',
    
    // Via Óssea - OD
    viaOsseaOD500: '', viaOsseaOD1000: '', viaOsseaOD2000: '', viaOsseaOD3000: '', viaOsseaOD4000: '',
    
    // Via Óssea - OE
    viaOsseaOE500: '', viaOsseaOE1000: '', viaOsseaOE2000: '', viaOsseaOE3000: '', viaOsseaOE4000: '',
    
    // Mascaramento - OD
    mascaramentoOD250: '', mascaramentoOD500: '', mascaramentoOD1000: '', mascaramentoOD2000: '',
    mascaramentoOD3000: '', mascaramentoOD4000: '', mascaramentoOD6000: '', mascaramentoOD8000: '',
    
    // Mascaramento - OE
    mascaramentoOE250: '', mascaramentoOE500: '', mascaramentoOE1000: '', mascaramentoOE2000: '',
    mascaramentoOE3000: '', mascaramentoOE4000: '', mascaramentoOE6000: '', mascaramentoOE8000: '',
    
    // Índices de Reconhecimento de Fala
    realizarIRF: false,
    srtOD: '', srtOE: '',
    irfOD: '', irfOE: '',
    irfDBOD: '', irfDBOE: '',
    resultadoSRTOD: '', resultadoSRTOE: '',
    resultadoIRFOD: '', resultadoIRFOE: '',
    resultadoIRFMonoauralOD: '', resultadoIRFMonoauralOE: '',
    resultadoIRFDissimetrica: '',
    
    // === CRITÉRIOS PAIR NR-7 ===
    entalhe4000HzOD: false,
    entalhe4000HzOE: false,
    tipoPerdaOD: 'Neurossensorial',
    tipoPerdaOE: 'Neurossensorial',
    
    // === TRIAGEM E ENCAMINHAMENTOS ===
    encaminhamentoORL: false,
    motivoEncaminhamento: '',
    urgenciaEncaminhamento: 'Rotina',
    
    // Classificações
    classificacaoOD: '', classificacaoOE: '', classificacaoGeral: '',
    configuracaoOD: '', configuracaoOE: '',
    
    conclusao: 'Dentro dos padrões da normalidade',
    observacoes: '',
    
    // Campos calculados
    perdaAuditivaOD: '', perdaAuditivaOE: '',
    textoResultado: 'Dentro dos padrões da normalidade',
    frequenciasAlteradasOD: '',
    frequenciasAlteradasOE: '',
    criterioPCD: 'Não se enquadra',
    mediaTonalOD: 0,
    mediaTonalOE: 0
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
    
    if (cleaned.length > 3) {
      cleaned = cleaned.slice(0, 3);
    }
    
    const numericValue = parseInt(cleaned, 10);
    if (!isNaN(numericValue) && numericValue > 120) {
      return '120';
    }
    
    return cleaned;
  }, []);

  // === IDENTIFICAR FREQUÊNCIAS ALTERADAS POR ORELHA ===
  const identificarFrequenciasAlteradas = useCallback(() => {
    const frequenciasConfig = [
      { freq: 250, od: formData.viaAereaOD250, oe: formData.viaAereaOE250 },
      { freq: 500, od: formData.viaAereaOD500, oe: formData.viaAereaOE500 },
      { freq: 1000, od: formData.viaAereaOD1000, oe: formData.viaAereaOE1000 },
      { freq: 2000, od: formData.viaAereaOD2000, oe: formData.viaAereaOE2000 },
      { freq: 3000, od: formData.viaAereaOD3000, oe: formData.viaAereaOE3000 },
      { freq: 4000, od: formData.viaAereaOD4000, oe: formData.viaAereaOE4000 },
      { freq: 6000, od: formData.viaAereaOD6000, oe: formData.viaAereaOE6000 },
      { freq: 8000, od: formData.viaAereaOD8000, oe: formData.viaAereaOE8000 }
    ];

    const frequenciasAlteradasOD = frequenciasConfig
      .filter(({ od }) => {
        const valorOD = parseFloat(od);
        return !isNaN(valorOD) && valorOD > 25;
      })
      .map(({ freq }) => `${freq} Hz`);

    const frequenciasAlteradasOE = frequenciasConfig
      .filter(({ oe }) => {
        const valorOE = parseFloat(oe);
        return !isNaN(valorOE) && valorOE > 25;
      })
      .map(({ freq }) => `${freq} Hz`);

    setFormData(prev => ({ 
      ...prev, 
      frequenciasAlteradasOD: frequenciasAlteradasOD.join(', '),
      frequenciasAlteradasOE: frequenciasAlteradasOE.join(', ')
    }));
  }, [
    formData.viaAereaOD250, formData.viaAereaOD500, formData.viaAereaOD1000, formData.viaAereaOD2000,
    formData.viaAereaOD3000, formData.viaAereaOD4000, formData.viaAereaOD6000, formData.viaAereaOD8000,
    formData.viaAereaOE250, formData.viaAereaOE500, formData.viaAereaOE1000, formData.viaAereaOE2000,
    formData.viaAereaOE3000, formData.viaAereaOE4000, formData.viaAereaOE6000, formData.viaAereaOE8000
  ]);

// === CLASSIFICAÇÃO LLOYD & KAPLAN AJUSTADA ===
const classificarPerdaLloydKaplan = useCallback((media: number): string => {
  // Ajuste para a faixa de Audição Normal (até 25 dB)
  if (media <= 25) return 'Audição Normal'; 
  
  // Perda Auditiva Leve (26 a 40 dB)
  if (media <= 40) return 'Leve'; 
  
  // Perda Auditiva Moderada (41 a 55 dB)
  if (media <= 55) return 'Moderada'; 
  
  // Perda Auditiva Moderadamente Severa (56 a 70 dB)
  if (media <= 70) return 'Moderadamente Severa';
  
  // Perda Auditiva Severa (71 a 90 dB)
  if (media <= 90) return 'Severa'; 
  
  // Perda Auditiva Profunda (> 90 dB)
  return 'Profunda';
}, []);

  // === CÁLCULO DA MÉDIA TONAL ===
const calcularMediaTonal = useCallback((
  freq500: string, freq1000: string, freq2000: string, freq3000: string // Apenas 4 frequências
): number => {
  const valores = [freq500, freq1000, freq2000, freq3000] // Apenas as 4 frequências
    .map(v => {
      const num = parseFloat(v);
      return isNaN(num) ? null : num;
    })
    .filter(v => v !== null) as number[];
  
  if (valores.length === 0) return 0;
  
  // Média aritmética simples conforme critérios legais/internacionais
  const soma = valores.reduce((acc, val) => acc + val, 0);
  return Math.round(soma / valores.length);
}, []);

// === VERIFICAR CRITÉRIO PCD PARA COTA OCUPACIONAL (LEIS FEDERAIS ATUAIS) ===
const verificarCriterioPCD = useCallback(() => {
  // Média Tonal nas frequências 500, 1000, 2000 e 3000 Hz
  const mediaOD = formData.mediaTonalOD; 
  const mediaOE = formData.mediaTonalOE; 
  
  const melhorOrelha = Math.min(mediaOD, mediaOE);
  const piorOrelha = Math.max(mediaOD, mediaOE);
  
  let criterioPCD = 'Não se enquadra (Cota Federal)';
  
  // 1. CRITÉRIO BILATERAL (Decreto 5.296/2004)
  // Requisito: Perda em ambos os ouvidos >= 41 dB NA.
  // Se a melhor orelha tiver >= 41 dB, a pior também terá, satisfazendo a bilateralidade.
  if (melhorOrelha >= 41) { 
    criterioPCD = 'Enquadra-se - Perda bilateral (Lei Federal: >= 41 dB NA)';
  } 
  
  // 2. CRITÉRIO UNILATERAL PROFUNDO (Lei 14.768/2023 e OT SIT/02-2024)
  // Requisito: Surdez unilateral total/profunda. A clínica utiliza >= 95 dB.
  // A melhor orelha deve ter audição normal ou leve (< 41 dB) e a pior deve ser profunda (>= 95 dB).
  // Nota: A Lei 14.768/2023 reconhece a surdez unilateral, e a OT SIT/02-2024 
  // utiliza o critério de 95 dB para considerar perda total.
  else if (piorOrelha >= 95 && melhorOrelha < 41) {
    criterioPCD = 'Enquadra-se - Surdez Unilateral Profunda (Lei 14.768/2023 e OT MTE)';
  }
  
  // 3. CASOS LIMÍTROFES OU LEVES (Apenas para Avaliação Clínica)
  // Perda leve (25-40 dB NA) ou limítrofe, que não enquadra na cota, mas requer atenção.
  else if (melhorOrelha >= 30 && melhorOrelha < 41) {
    criterioPCD = 'Avaliação complementar - Perda limítrofe (30-40 dB NA), não enquadra na cota, mas exige atenção';
  }

  setFormData(prev => ({ ...prev, criterioPCD }));
}, [
  formData.mediaTonalOD,
  formData.mediaTonalOE
]);

  // === GERAR TEXTO DE RESULTADO SIMPLIFICADO ===
  const gerarTextoResultado = useCallback(() => {
    const odAlterado = formData.classificacaoOD !== 'Normal' && formData.classificacaoOD !== 'Limítrofe';
    const oeAlterado = formData.classificacaoOE !== 'Normal' && formData.classificacaoOE !== 'Limítrofe';

    let texto = 'Dentro dos padrões da normalidade';
    
    if (odAlterado || oeAlterado) {
      const partes = [];
      
      if (odAlterado) {
        partes.push(`OD: ${formData.classificacaoOD}`);
      } else if (formData.classificacaoOD === 'Limítrofe') {
        partes.push(`OD: Limítrofe`);
      }
      
      if (oeAlterado) {
        partes.push(`OE: ${formData.classificacaoOE}`);
      } else if (formData.classificacaoOE === 'Limítrofe') {
        partes.push(`OE: Limítrofe`);
      }
      
      texto = partes.join(' | ');
    } else if (formData.classificacaoOD === 'Limítrofe' || formData.classificacaoOE === 'Limítrofe') {
      texto = 'Audição limítrofe - acompanhamento recomendado';
    }

    setFormData(prev => ({ ...prev, textoResultado: texto }));
  }, [
    formData.classificacaoOD, 
    formData.classificacaoOE
  ]);

  // === CÁLCULOS E CLASSIFICAÇÕES PRINCIPAIS - CORRIGIDOS ===
  const calcularClassificacoes = useCallback(() => {

    // Apenas as 4 frequências
    const mediaTonalOD = calcularMediaTonal(
      formData.viaAereaOD500, formData.viaAereaOD1000, formData.viaAereaOD2000,
      formData.viaAereaOD3000 
    );
    
    const mediaTonalOE = calcularMediaTonal(
      formData.viaAereaOE500, formData.viaAereaOE1000, formData.viaAereaOE2000,
      formData.viaAereaOE3000, 
    );

    // Classificação Lloyd & Kaplan corrigida
    const classificacaoOD = classificarPerdaLloydKaplan(mediaTonalOD);
    const classificacaoOE = classificarPerdaLloydKaplan(mediaTonalOE);

    // Configuração audiométrica
    const calcularConfiguracao = (
      freq250: string, freq500: string, freq1000: string, freq2000: string,
      freq4000: string, freq8000: string
    ) => {
      const val250 = parseFloat(freq250) || 0;
      const val500 = parseFloat(freq500) || 0;
      const val1000 = parseFloat(freq1000) || 0;
      const val2000 = parseFloat(freq2000) || 0;
      const val4000 = parseFloat(freq4000) || 0;
      const val8000 = parseFloat(freq8000) || 0;

      const diferencaBaixasAltas = Math.abs(val500 - val4000);
      const diferenca4000_8000 = Math.abs(val4000 - val8000);

      if (diferencaBaixasAltas <= 10) return 'Plana';
      if (val4000 > val500 + 15 && val8000 <= val4000 + 10) return 'Descendente';
      if (val8000 < val4000 - 15) return 'Ascendente';
      if (val4000 > val2000 + 10 && val4000 < val4000 - 10) return 'Em "U"';
      
      return 'Irregular';
    };

    const configuracaoOD = calcularConfiguracao(
      formData.viaAereaOD250, formData.viaAereaOD500, formData.viaAereaOD1000,
      formData.viaAereaOD2000, formData.viaAereaOD4000, formData.viaAereaOD8000
    );

    const configuracaoOE = calcularConfiguracao(
      formData.viaAereaOE250, formData.viaAereaOE500, formData.viaAereaOE1000,
      formData.viaAereaOE2000, formData.viaAereaOE4000, formData.viaAereaOE8000
    );

    // Verificar entalhe em 4000 Hz (critério PAIR)
    const verificarEntalhe4000Hz = (freq2000: string, freq4000: string, freq6000: string) => {
      const val2000 = parseFloat(freq2000) || 0;
      const val4000 = parseFloat(freq4000) || 0;
      const val6000 = parseFloat(freq6000) || 0;
      
      // Critério: diferença ≥ 15 dB entre 2000-4000 Hz e 4000-6000 Hz
      return (val4000 - val2000 >= 15) && (val4000 - val6000 >= 10);
    };

    const entalheOD = verificarEntalhe4000Hz(
      formData.viaAereaOD2000, formData.viaAereaOD4000, formData.viaAereaOD6000
    );
    
    const entalheOE = verificarEntalhe4000Hz(
      formData.viaAereaOE2000, formData.viaAereaOE4000, formData.viaAereaOE6000
    );

    // Determinar tipo de perda (condutiva, neurossensorial, mista)
    const determinarTipoPerda = (va500: string, va1000: string, va2000: string, 
                                vo500: string, vo1000: string, vo2000: string) => {
      const vaValidos = [va500, va1000, va2000]
        .map(v => parseFloat(v))
        .filter(v => !isNaN(v));
      
      const voValidos = [vo500, vo1000, vo2000]
        .map(v => parseFloat(v))
        .filter(v => !isNaN(v));
      
      if (vaValidos.length === 0) return 'Não avaliada';
      if (voValidos.length === 0) return 'Neurossensorial'; // Assumindo se não há VO
      
      // Calcular gap aéreo-ósseo nas frequências disponíveis
      let gaps = [];
      if (va500 && vo500) gaps.push(Math.abs(parseFloat(va500) - parseFloat(vo500)));
      if (va1000 && vo1000) gaps.push(Math.abs(parseFloat(va1000) - parseFloat(vo1000)));
      if (va2000 && vo2000) gaps.push(Math.abs(parseFloat(va2000) - parseFloat(vo2000)));
      
      const gapMedio = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
      
      if (gapMedio <= 10) return 'Neurossensorial';
      if (gapMedio > 10 && gapMedio <= 15) return 'Mista';
      return 'Condutiva';
    };

    const tipoPerdaOD = determinarTipoPerda(
      formData.viaAereaOD500, formData.viaAereaOD1000, formData.viaAereaOD2000,
      formData.viaOsseaOD500, formData.viaOsseaOD1000, formData.viaOsseaOD2000
    );

    const tipoPerdaOE = determinarTipoPerda(
      formData.viaAereaOE500, formData.viaAereaOE1000, formData.viaAereaOE2000,
      formData.viaOsseaOE500, formData.viaOsseaOE1000, formData.viaOsseaOE2000
    );

    // Classificação geral
    let classificacaoGeral = 'Normal';
    if (classificacaoOD !== 'Normal' || classificacaoOE !== 'Normal') {
      if (classificacaoOD.includes('Severa') || classificacaoOD.includes('Profunda') ||
          classificacaoOE.includes('Severa') || classificacaoOE.includes('Profunda')) {
        classificacaoGeral = 'Gravemente Alterado';
      } else if (classificacaoOD.includes('Moderada') || classificacaoOE.includes('Moderada')) {
        classificacaoGeral = 'Moderadamente Alterado';
      } else {
        classificacaoGeral = 'Levemente Alterado';
      }
    }

    setFormData(prev => ({
      ...prev,
      mediaTonalOD,
      mediaTonalOE,
      perdaAuditivaOD: mediaTonalOD > 0 ? `${mediaTonalOD} dB` : '0 dB',
      perdaAuditivaOE: mediaTonalOE > 0 ? `${mediaTonalOE} dB` : '0 dB',
      classificacaoOD,
      classificacaoOE,
      classificacaoGeral,
      configuracaoOD,
      configuracaoOE,
      entalhe4000HzOD: entalheOD,
      entalhe4000HzOE: entalheOE,
      tipoPerdaOD,
      tipoPerdaOE,
      encaminhamentoORL: classificacaoOD.includes('Severa') || classificacaoOD.includes('Profunda') || 
                         classificacaoOE.includes('Severa') || classificacaoOE.includes('Profunda') ? true : prev.encaminhamentoORL
    }));
  }, [formData, calcularMediaTonal, classificarPerdaLloydKaplan]);

  // === CÁLCULO DOS ÍNDICES DE FALA ATUALIZADO ===
  const calcularIndicesFala = useCallback(() => {
    // Cálculo automático do SRT baseado na média das frequências de fala (500, 1000, 2000 Hz)
    const calcularSRT = (freq500: string, freq1000: string, freq2000: string) => {
      const valores = [freq500, freq1000, freq2000]
        .map(v => parseFloat(v))
        .filter(v => !isNaN(v));
      
      if (valores.length === 0) return { srt: 0, resultado: 'Não calculado' };
      
      const media = valores.reduce((sum, val) => sum + val, 0) / valores.length;
      const srtCalculado = Math.round(media);
      
      let resultado = 'Normal';
      if (srtCalculado > 25) resultado = 'Alterado';
      else if (srtCalculado > 20) resultado = 'Limítrofe';
      
      return { srt: srtCalculado, resultado };
    };

    // Cálculo do IRF Monoaural com critérios atualizados
    const calcularIRFMonoaural = (irfPercent: number) => {
      if (isNaN(irfPercent)) return 'Não avaliado';
      
      if (irfPercent >= 90) return 'Normal';
      if (irfPercent >= 80) return 'Limítrofe';
      if (irfPercent >= 70) return 'Alterado Leve';
      if (irfPercent >= 60) return 'Alterado Moderado';
      return 'Alterado Severo';
    };

    // Cálculo do IRF Dissimétrico
    const calcularIRFDissimetrica = (irfOD: number, irfOE: number) => {
      if (isNaN(irfOD) || isNaN(irfOE)) return 'Não avaliado';
      
      const diferenca = Math.abs(irfOD - irfOE);
      if (diferenca <= 8) return 'Simétrica';
      if (diferenca <= 15) return 'Levemente dissimétrica';
      if (diferenca <= 25) return 'Moderadamente dissimétrica';
      return 'Severamente dissimétrica';
    };

    const srtOD = calcularSRT(formData.viaAereaOD500, formData.viaAereaOD1000, formData.viaAereaOD2000);
    const srtOE = calcularSRT(formData.viaAereaOE500, formData.viaAereaOE1000, formData.viaAereaOE2000);

    // Se SRT não foi preenchido manualmente, usar o valor calculado
    if (!formData.srtOD && srtOD.srt > 0) {
      setFormData(prev => ({ 
        ...prev, 
        srtOD: srtOD.srt.toString(),
        resultadoSRTOD: srtOD.resultado
      }));
    }

    if (!formData.srtOE && srtOE.srt > 0) {
      setFormData(prev => ({ 
        ...prev, 
        srtOE: srtOE.srt.toString(),
        resultadoSRTOE: srtOE.resultado
      }));
    }

    // Calcular IRF Monoaural
    const irfOD = parseFloat(formData.irfOD) || 0;
    const irfOE = parseFloat(formData.irfOE) || 0;
    
    const resultadoIRFMonoauralOD = calcularIRFMonoaural(irfOD);
    const resultadoIRFMonoauralOE = calcularIRFMonoaural(irfOE);
    const resultadoIRFDissimetrica = calcularIRFDissimetrica(irfOD, irfOE);

    setFormData(prev => ({
      ...prev,
      resultadoIRFMonoauralOD,
      resultadoIRFMonoauralOE,
      resultadoIRFDissimetrica
    }));

  }, [formData]);

  // === VALIDAÇÕES NR-7 ===
  const validarConformidadeNR7 = useCallback(() => {
    const validacoes = [];
    
    // 1. Repouso acústico mínimo 14h
    if (formData.repousoAuditivo !== 'Sim' || formData.horasRepouso < 14) {
      validacoes.push('Repouso acústico inferior a 14 horas - Não conforme NR-7');
    }
    
    // 2. Calibração do audiômetro (máximo 12 meses)
    if (formData.dataCalibracao) {
      const dataCalibracao = new Date(formData.dataCalibracao);
      const hoje = new Date();
      const diferencaMeses = (hoje.getFullYear() - dataCalibracao.getFullYear()) * 12 + 
                           (hoje.getMonth() - dataCalibracao.getMonth());
      if (diferencaMeses > 12) {
        validacoes.push('Audiômetro fora do prazo de calibração (12 meses) - Não conforme NR-7');
      }
    }
    
    // 3. Nível de ruído ambiental
    if (formData.nivelRuidoAmbiente !== '< 40 dB NA') {
      validacoes.push('Nível de ruído ambiental pode estar acima do recomendado');
    }
    
    return validacoes;
  }, [formData]);


  // Efeito principal para cálculos automáticos
  useEffect(() => {
    calcularClassificacoes();
    if (formData.realizarIRF) {
      calcularIndicesFala();
    }
    validarConformidadeNR7();
    verificarCriterioPCD();
    identificarFrequenciasAlteradas();
    gerarTextoResultado();
  }, [
    // Via Aérea OD
    formData.viaAereaOD250, formData.viaAereaOD500, formData.viaAereaOD1000, 
    formData.viaAereaOD2000, formData.viaAereaOD3000, formData.viaAereaOD4000, 
    formData.viaAereaOD6000, formData.viaAereaOD8000,
    // Via Aérea OE
    formData.viaAereaOE250, formData.viaAereaOE500, formData.viaAereaOE1000,
    formData.viaAereaOE2000, formData.viaAereaOE3000, formData.viaAereaOE4000,
    formData.viaAereaOE6000, formData.viaAereaOE8000,
    // Via Óssea
    formData.viaOsseaOD500, formData.viaOsseaOD1000, formData.viaOsseaOD2000, formData.viaOsseaOD3000, formData.viaOsseaOD4000,
    formData.viaOsseaOE500, formData.viaOsseaOE1000, formData.viaOsseaOE2000, formData.viaOsseaOE3000, formData.viaOsseaOE4000,
    // Dados técnicos
    formData.repousoAuditivo, formData.dataCalibracao, formData.nivelRuidoAmbiente,
    // Índices de fala
    formData.srtOD, formData.srtOE, formData.irfOD, formData.irfOE, formData.irfDBOD, formData.irfDBOE,
    // Flag IRF
    formData.realizarIRF
  ]);

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

  // Configuração das frequências para tabela HORIZONTAL
  const frequencias = [
    { label: '250 Hz', fieldVAOD: 'viaAereaOD250', fieldVAOE: 'viaAereaOE250', fieldVOOD: null, fieldVOOE: null, fieldMascOD: 'mascaramentoOD250', fieldMascOE: 'mascaramentoOE250' },
    { label: '500 Hz', fieldVAOD: 'viaAereaOD500', fieldVAOE: 'viaAereaOE500', fieldVOOD: 'viaOsseaOD500', fieldVOOE: 'viaOsseaOE500', fieldMascOD: 'mascaramentoOD500', fieldMascOE: 'mascaramentoOE500' },
    { label: '1000 Hz', fieldVAOD: 'viaAereaOD1000', fieldVAOE: 'viaAereaOE1000', fieldVOOD: 'viaOsseaOD1000', fieldVOOE: 'viaOsseaOE1000', fieldMascOD: 'mascaramentoOD1000', fieldMascOE: 'mascaramentoOE1000' },
    { label: '2000 Hz', fieldVAOD: 'viaAereaOD2000', fieldVAOE: 'viaAereaOE2000', fieldVOOD: 'viaOsseaOD2000', fieldVOOE: 'viaOsseaOE2000', fieldMascOD: 'mascaramentoOD2000', fieldMascOE: 'mascaramentoOE2000' },
    { label: '3000 Hz', fieldVAOD: 'viaAereaOD3000', fieldVAOE: 'viaAereaOE3000', fieldVOOD: 'viaOsseaOD3000', fieldVOOE: 'viaOsseaOE3000', fieldMascOD: 'mascaramentoOD3000', fieldMascOE: 'mascaramentoOE3000' },
    { label: '4000 Hz', fieldVAOD: 'viaAereaOD4000', fieldVAOE: 'viaAereaOE4000', fieldVOOD: 'viaOsseaOD4000', fieldVOOE: 'viaOsseaOE4000', fieldMascOD: 'mascaramentoOD4000', fieldMascOE: 'mascaramentoOE4000' },
    { label: '6000 Hz', fieldVAOD: 'viaAereaOD6000', fieldVAOE: 'viaAereaOE6000', fieldVOOD: null, fieldVOOE: null, fieldMascOD: 'mascaramentoOD6000', fieldMascOE: 'mascaramentoOE6000' },
    { label: '8000 Hz', fieldVAOD: 'viaAereaOD8000', fieldVAOE: 'viaAereaOE8000', fieldVOOD: null, fieldVOOE: null, fieldMascOD: 'mascaramentoOD8000', fieldMascOE: 'mascaramentoOE8000' }
  ];

  // Funções de navegação por TAB (mantidas as originais)
  const handleKeyDownVAOD = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const nextIndex = index + 1;
      if (nextIndex < inputRefsVAOD.current.length) {
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
      if (nextIndex < inputRefsVAOE.current.length) {
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

  const SectionTitle: React.FC<{ number: string; title: string; icon?: React.ReactNode }> = ({ 
    number, 
    title,
    icon 
  }) => (
    <div className="flex items-start gap-3 mb-4">
      <div className="flex items-center justify-center w-8 h-8 bg-gray-800 rounded-lg text-white font-semibold text-sm">
        {number}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header com status integrado */}
      <Card className="p-6 shadow-lg border border-blue-200 bg-white">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="text-center lg:text-left">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              {exame || 'Exame Ocupacional'}
            </h1>
            <p className="text-gray-600 text-sm lg:text-base">
              Registro de Atendimento
            </p>
          </div>
          
          {/* Status do atendimento */}
          <div className="flex items-center gap-3 bg-green-50 px-4 py-3 rounded-lg border border-green-200 min-w-[280px]">
            <div className="flex-shrink-0">
              <Spinner size="sm" color="success" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-green-800">Em Andamento</span>
              </div>
              <p className="text-xs text-green-700">
                Realizando procedimento
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* 1. Dados do Atendimento / Funcionário */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle 
          number="1" 
          title="Dados do Atendimento e Funcionário" 
          icon={<User className="h-5 w-5 text-gray-600" />}
        />
        
        <div className="space-y-6">
          {/* Dados Pessoais */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Dados Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo:</label>
                <Input
                  value={agendamento?.NOME}
                  isReadOnly
                  className="bg-white border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CPF:</label>
                <Input
                  value={agendamento?.CPFFUNCIONARIO}
                  isReadOnly
                  className="bg-white border-gray-300"
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Nascimento:</label>
                <Input
                  value={agendamento?.DATANASCIMENTO ?? ""}
                  isReadOnly
                  className="bg-white border-gray-300"
                  placeholder="DD/MM/AAAA"
                />
              </div>
            </div>
          </div>

          {/* Dados Profissionais */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Dados Profissionais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cargo:</label>
                <Input
                  value={agendamento?.NOMECARGO}
                  isReadOnly
                  className="bg-white border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Setor:</label>
                <Input
                  value={agendamento?.NOMESETOR}
                  isReadOnly
                  className="bg-white border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Exame:</label>
                <Input
                  value={agendamento?.TIPOEXAMENOME}
                  isReadOnly
                  className="bg-white border-gray-300"
                />
              </div>
            </div>
          </div>

          {/* Dados da Empresa */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Dados da Empresa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Empresa:</label>
                <Input
                  value={agendamento?.NOMEEMPRESA}
                  isReadOnly
                  className="bg-white border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ:</label>
                <Input
                  value={agendamento?.CNPJEMPRESA}
                  isReadOnly
                  className="bg-white border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unidade:</label>
                <Input
                  value={agendamento?.NOMEUNIDADE}
                  isReadOnly
                  className="bg-white border-gray-300"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Anamnese Audiológica */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle 
          number="2" 
          title="Anamnese Audiológica" 
          icon={<Stethoscope className="h-5 w-5 text-gray-600" />}
        />
        
        <div className="space-y-6">
          {/* Histórico Auditivo */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Histórico Auditivo</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Possui alguma queixa auditiva atual?
                  </label>
                  <div className="space-y-2">
                    {['Não', 'Sim — ouvido direito', 'Sim — ouvido esquerdo', 'Sim — ambos'].map((option) => (
                      <Checkbox
                        key={option}
                        isSelected={formData.queixaAuditiva === option}
                        onValueChange={(checked) => checked && handleCheckboxChange('queixaAuditiva', option)}
                        classNames={{
                          base: "w-full max-w-full hover:bg-gray-100 rounded-lg p-2 transition-colors",
                          label: "text-sm text-gray-700"
                        }}
                      >
                        {option}
                      </Checkbox>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Já realizou audiometria anteriormente?
                  </label>
                  <div className="space-y-2">
                    {['Não', 'Sim — resultado normal', 'Sim — resultado alterado'].map((option) => (
                      <Checkbox
                        key={option}
                        isSelected={formData.audiometriaAnterior === option}
                        onValueChange={(checked) => checked && handleCheckboxChange('audiometriaAnterior', option)}
                        classNames={{
                          base: "w-full max-w-full hover:bg-gray-100 rounded-lg p-2 transition-colors",
                          label: "text-sm text-gray-700"
                        }}
                      >
                        {option}
                      </Checkbox>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tratamento antibióticos  e/ou ototóxicos?
                  </label>
                  <div className="flex gap-4 mb-2">
                    <Checkbox
                      isSelected={formData.tratamentoOtotoxicos === 'Sim'}
                      onValueChange={(checked) => handleCheckboxChange('tratamentoOtotoxicos', checked ? 'Sim' : 'Não')}
                      classNames={{
                        label: "text-gray-700"
                      }}
                    >
                      Sim
                    </Checkbox>
                    <Checkbox
                      isSelected={formData.tratamentoOtotoxicos === 'Não'}
                      onValueChange={(checked) => handleCheckboxChange('tratamentoOtotoxicos', checked ? 'Não' : 'Sim')}
                      classNames={{
                        label: "text-gray-700"
                      }}
                    >
                      Não
                    </Checkbox>
                  </div>
                  {formData.tratamentoOtotoxicos === 'Sim' && (
                    <Input
                      type="date"
                      value={formData.dataTratamentoOtotoxicos}
                      onChange={(e) => handleInputChange('dataTratamentoOtotoxicos', e.target.value)}
                      className="border-gray-300 mt-2 bg-white"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Casos de surdez na família?
                  </label>
                  <div className="flex gap-4 mb-2">
                    <Checkbox
                      isSelected={formData.surdezFamilia === 'Sim'}
                      onValueChange={(checked) => handleCheckboxChange('surdezFamilia', checked ? 'Sim' : 'Não')}
                      classNames={{
                        label: "text-gray-700"
                      }}
                    >
                      Sim
                    </Checkbox>
                    <Checkbox
                      isSelected={formData.surdezFamilia === 'Não'}
                      onValueChange={(checked) => handleCheckboxChange('surdezFamilia', checked ? 'Não' : 'Sim')}
                      classNames={{
                        label: "text-gray-700"
                      }}
                    >
                      Não
                    </Checkbox>
                  </div>
                  {formData.surdezFamilia === 'Sim' && (
                    <Input
                      value={formData.parentescoSurdez}
                      onChange={(e) => handleInputChange('parentescoSurdez', e.target.value)}
                      placeholder="Grau de parentesco"
                      className="border-gray-300 mt-2 bg-white"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Exposição Ocupacional */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Exposição Ocupacional</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Já trabalhou em ambiente com ruído intenso?
                  </label>
                  <div className="flex gap-4">
                    <Checkbox
                      isSelected={formData.trabalhoAnteriorRuido === 'Sim'}
                      onValueChange={(checked) => handleCheckboxChange('trabalhoAnteriorRuido', checked ? 'Sim' : 'Não')}
                      classNames={{
                        label: "text-gray-700"
                      }}
                    >
                      Sim
                    </Checkbox>
                    <Checkbox
                      isSelected={formData.trabalhoAnteriorRuido === 'Não'}
                      onValueChange={(checked) => handleCheckboxChange('trabalhoAnteriorRuido', checked ? 'Não' : 'Sim')}
                      classNames={{
                        label: "text-gray-700"
                      }}
                    >
                      Não
                    </Checkbox>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Atualmente trabalha exposto a ruído?
                  </label>
                  <div className="flex gap-4">
                    <Checkbox
                      isSelected={formData.trabalhoAtualRuido === 'Sim'}
                      onValueChange={(checked) => handleCheckboxChange('trabalhoAtualRuido', checked ? 'Sim' : 'Não')}
                      classNames={{
                        label: "text-gray-700"
                      }}
                    >
                      Sim
                    </Checkbox>
                    <Checkbox
                      isSelected={formData.trabalhoAtualRuido === 'Não'}
                      onValueChange={(checked) => handleCheckboxChange('trabalhoAtualRuido', checked ? 'Não' : 'Sim')}
                      classNames={{
                        label: "text-gray-700"
                      }}
                    >
                      Não
                    </Checkbox>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Faz uso regular de protetor auricular?
                  </label>
                  <div className="flex gap-4">
                    <Checkbox
                      isSelected={formData.usoProtetorAuricular === 'Sim'}
                      onValueChange={(checked) => handleCheckboxChange('usoProtetorAuricular', checked ? 'Sim' : 'Não')}
                      classNames={{
                        label: "text-gray-700"
                      }}
                    >
                      Sim
                    </Checkbox>
                    <Checkbox
                      isSelected={formData.usoProtetorAuricular === 'Não'}
                      onValueChange={(checked) => handleCheckboxChange('usoProtetorAuricular', checked ? 'Não' : 'Sim')}
                      classNames={{
                        label: "text-gray-700"
                      }}
                    >
                      Não
                    </Checkbox>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contato com produtos químicos ou solventes?
                  </label>
                  <div className="flex gap-4">
                    <Checkbox
                      isSelected={formData.contatoQuimicos === 'Sim'}
                      onValueChange={(checked) => handleCheckboxChange('contatoQuimicos', checked ? 'Sim' : 'Não')}
                      classNames={{
                        label: "text-gray-700"
                      }}
                    >
                      Sim
                    </Checkbox>
                    <Checkbox
                      isSelected={formData.contatoQuimicos === 'Não'}
                      onValueChange={(checked) => handleCheckboxChange('contatoQuimicos', checked ? 'Não' : 'Sim')}
                      classNames={{
                        label: "text-gray-700"
                      }}
                    >
                      Não
                    </Checkbox>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sintomas e Fatores Agravantes */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Sintomas e Fatores Agravantes</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Costuma ouvir música (caixas, fones, etc)?
                  </label>
                  <div className="flex gap-4">
                    <Checkbox
                      isSelected={formData.habitoSomAlto === 'Sim'}
                      onValueChange={(checked) => handleCheckboxChange('habitoSomAlto', checked ? 'Sim' : 'Não')}
                      classNames={{
                        label: "text-gray-700"
                      }}
                    >
                      Sim
                    </Checkbox>
                    <Checkbox
                      isSelected={formData.habitoSomAlto === 'Não'}
                      onValueChange={(checked) => handleCheckboxChange('habitoSomAlto', checked ? 'Não' : 'Sim')}
                      classNames={{
                        label: "text-gray-700"
                      }}
                    >
                      Não
                    </Checkbox>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Já teve contato com explosões, fogos ou detonações?
                  </label>
                  <div className="flex gap-4">
                    <Checkbox
                      isSelected={formData.exposicaoExplosoes === 'Sim'}
                      onValueChange={(checked) => handleCheckboxChange('exposicaoExplosoes', checked ? 'Sim' : 'Não')}
                      classNames={{
                        label: "text-gray-700"
                      }}
                    >
                      Sim
                    </Checkbox>
                    <Checkbox
                      isSelected={formData.exposicaoExplosoes === 'Não'}
                      onValueChange={(checked) => handleCheckboxChange('exposicaoExplosoes', checked ? 'Não' : 'Sim')}
                      classNames={{
                        label: "text-gray-700"
                      }}
                    >
                      Não
                    </Checkbox>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apresenta ou apresentou labirintite, tontura ou convulsões?
                  </label>
                  <div className="flex gap-4">
                    <Checkbox
                      isSelected={formData.labirintiteTontura === 'Sim'}
                      onValueChange={(checked) => handleCheckboxChange('labirintiteTontura', checked ? 'Sim' : 'Não')}
                      classNames={{
                        label: "text-gray-700"
                      }}
                    >
                      Sim
                    </Checkbox>
                    <Checkbox
                      isSelected={formData.labirintiteTontura === 'Não'}
                      onValueChange={(checked) => handleCheckboxChange('labirintiteTontura', checked ? 'Não' : 'Sim')}
                      classNames={{
                        label: "text-gray-700"
                      }}
                    >
                      Não
                    </Checkbox>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usa algum medicamento atualmente?
                  </label>
                  <div className="flex gap-4 mb-2">
                    <Checkbox
                      isSelected={formData.usoMedicamentos === 'Sim'}
                      onValueChange={(checked) => handleCheckboxChange('usoMedicamentos', checked ? 'Sim' : 'Não')}
                      classNames={{
                        label: "text-gray-700"
                      }}
                    >
                      Sim
                    </Checkbox>
                    <Checkbox
                      isSelected={formData.usoMedicamentos === 'Não'}
                      onValueChange={(checked) => handleCheckboxChange('usoMedicamentos', checked ? 'Não' : 'Sim')}
                      classNames={{
                        label: "text-gray-700"
                      }}
                    >
                      Não
                    </Checkbox>
                  </div>
                  {formData.usoMedicamentos === 'Sim' && (
                    <Input
                      value={formData.quaisMedicamentos}
                      onChange={(e) => handleInputChange('quaisMedicamentos', e.target.value)}
                      placeholder="Quais medicamentos?"
                      className="border-gray-300 mt-2 bg-white"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Dados Técnicos e Meatoscopia */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle 
          number="3" 
          title="Dados Técnicos e Meatoscopia" 
          icon={<Volume2 className="h-5 w-5 text-gray-600" />}
        />
        
        <div className="space-y-6">
          {/* Dados Técnicos */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Dados do Exame - NR-7</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data da Calibração*</label>
                <Input
                  type="text"
                  value={formData.dataCalibracao}
                  readOnly
                  onChange={(e) => handleInputChange('dataCalibracao', e.target.value)}
                  className="border-gray-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Audiômetro</label>
                <Select
                  selectedKeys={[formData.tipoAudiometro]}
                  onChange={(e) => handleInputChange('tipoAudiometro', e.target.value)}
                  classNames={{
                    trigger: "bg-white border-gray-300"
                  }}
                >
                  <SelectItem key="AVS 500">AVS 500</SelectItem>
                  <SelectItem key="AS 60">AS 60</SelectItem>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Repouso Auditivo ≥14h?*</label>
                <div className="flex gap-4">
                  <Checkbox
                    isSelected={formData.repousoAuditivo === 'Sim'}
                    onValueChange={(checked) => handleInputChange('repousoAuditivo', checked ? 'Sim' : 'Não')}
                    classNames={{
                      label: "text-gray-700"
                    }}
                  >
                    Sim
                  </Checkbox>
                  <Checkbox
                    isSelected={formData.repousoAuditivo === 'Não'}
                    onValueChange={(checked) => handleInputChange('repousoAuditivo', checked ? 'Não' : 'Sim')}
                    classNames={{
                      label: "text-gray-700"
                    }}
                  >
                    Não
                  </Checkbox>
                </div>
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

          {/* Meatoscopia */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Meatoscopia</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 className="font-medium text-red-800 mb-3">OD - Ouvido Direito</h4>
                <RadioGroup
                  value={formData.meatoscopiaOD}
                  onValueChange={(value) => handleInputChange('meatoscopiaOD', value)}
                  orientation="horizontal"
                  classNames={{ wrapper: "justify-center gap-6" }}
                >
                  <Radio value="Normal" classNames={{ label: "text-gray-700" }}>Normal</Radio>
                  <Radio value="Alterado" classNames={{ label: "text-gray-700" }}>Alterado</Radio>
                </RadioGroup>
              </div>

              <div className="text-center bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-3">OE - Ouvido Esquerdo</h4>
                <RadioGroup
                  value={formData.meatoscopiaOE}
                  onValueChange={(value) => handleInputChange('meatoscopiaOE', value)}
                  orientation="horizontal"
                  classNames={{ wrapper: "justify-center gap-6" }}
                >
                  <Radio value="Normal" classNames={{ label: "text-gray-700" }}>Normal</Radio>
                  <Radio value="Alterado" classNames={{ label: "text-gray-700" }}>Alterado</Radio>
                </RadioGroup>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Observações da Meatoscopia</label>
              <Textarea
                value={formData.observacoesMeatoscopia}
                onChange={(e) => handleInputChange('observacoesMeatoscopia', e.target.value)}
                placeholder="Ex: cerume impactado, otorreia, etc."
                className="bg-white border-gray-300"
                rows={2}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 4. Audiometria Tonal */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle 
          number="4" 
          title="Audiometria Tonal" 
          icon={<Ear className="h-5 w-5 text-gray-600" />}
        />
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
          <p className="text-sm text-gray-600">
            Limiares auditivos em dB NA - Valores de 0 a 120 | Via Óssea disponível para 500-4000 Hz
          </p>
          <p className="text-xs text-amber-600 mt-1">
            💡 Dica: Use TAB para navegar da esquerda para direita (250 Hz → 8000 Hz)
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th rowSpan={2} className="border border-gray-300 p-2 font-semibold">Orelha</th>
                <th rowSpan={2} className="border border-gray-300 p-2 font-semibold">Tipo</th>
                <th colSpan={frequencias.length} className="border border-gray-300 p-2 font-semibold text-center">
                  Frequências (Hz)
                </th>
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
                <td rowSpan={3} className="border border-gray-300 p-2 text-center font-medium text-red-700 bg-red-50">
                  OD
                </td>
                <td className="border border-gray-300 p-2 text-center font-medium text-sm bg-red-50">
                  VA
                </td>
                {frequencias.map((freq, index) => (
                  <td key={`va-od-${freq.label}`} className="border border-gray-300 p-1">
                    <Input
                      ref={el => { inputRefsVAOD.current[index] = el; }}
                      type="number"
                      value={formData[freq.fieldVAOD as keyof AudiometriaData] as string}
                      onChange={(e) => handleDecibelInputChange(freq.fieldVAOD as keyof AudiometriaData, e.target.value)}
                      onKeyDown={(e) => handleKeyDownVAOD(index, e)}
                      className="text-center border-blue-300 bg-white focus:border-blue-500 h-10 w-full"
                      placeholder="0"
                      min="0"
                      max="120"
                    />
                  </td>
                ))}
              </tr>
              
              {/* OD - Via Óssea */}
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-2 text-center font-medium text-sm bg-red-50">
                  VO
                </td>
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
                <td className="border border-gray-300 p-2 text-center font-medium text-sm bg-red-50">
                  Masc
                </td>
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

              <tr><td className='h-6'></td></tr>

              {/* OE - Via Aérea */}
              <tr className="bg-white">
                <td rowSpan={3} className="border border-gray-300 p-2 text-center font-medium text-blue-700 bg-blue-50">
                  OE
                </td>
                <td className="border border-gray-300 p-2 text-center font-medium text-sm bg-blue-50">
                  VA
                </td>
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
                <td className="border border-gray-300 p-2 text-center font-medium text-sm bg-blue-50">
                  VO
                </td>
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
                <td className="border border-gray-300 p-2 text-center font-medium text-sm bg-blue-50">
                  Masc
                </td>
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

      {/* 5. Índices de Reconhecimento de Fala - OPCIONAL */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle 
          number="5" 
          title="Índices de Reconhecimento de Fala" 
          icon={<Calculator className="h-5 w-5 text-gray-600" />}
        />
        
        {/* Checkbox para habilitar/desabilitar a seção */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <Checkbox
            isSelected={formData.realizarIRF}
            onValueChange={(checked) => handleInputChange('realizarIRF', checked)}
            classNames={{
              base: "w-full max-w-full hover:bg-blue-100 rounded-lg p-3 transition-colors",
              label: "text-blue-800 font-medium text-lg"
            }}
          >
            Realizar Exame de Índices de Reconhecimento de Fala
          </Checkbox>
          <p className="text-sm text-blue-600 mt-2 ml-6">
            Marque esta opção para habilitar os campos de SRT e IRF
          </p>
        </div>
        
        {formData.realizarIRF && (
          <div className="space-y-6">
            {/* SRT - Speech Recognition Threshold */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">SRT - Limiar de Reconhecimento de Fala</h3>
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
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">IRF - Índice de Reconhecimento de Fala</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-medium text-red-800 mb-3">OD - Ouvido Direito</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-red-700 mb-2">IRF (%)</label>
                      <Input
                        type="number"
                        value={formData.irfOD}
                        onChange={(e) => handleInputChange('irfOD', e.target.value)}
                        className="text-center border-red-300 bg-white"
                        placeholder="Percentual"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-red-700 mb-2">IRF (dB)</label>
                      <Input
                        type="number"
                        value={formData.irfDBOD}
                        onChange={(e) => handleDecibelInputChange('irfDBOD', e.target.value)}
                        className="text-center border-red-300 bg-white"
                        placeholder="Decibéis"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-red-700 mb-2">Resultado</label>
                      <Input
                        value={formData.resultadoIRFMonoauralOD}
                        isReadOnly
                        className={`text-center font-bold bg-transparent border-none ${
                          formData.resultadoIRFMonoauralOD === 'Normal' ? 'text-green-600' : 
                          formData.resultadoIRFMonoauralOD === 'Limítrofe' ? 'text-amber-500' : 'text-red-600'
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
                      <Input
                        type="number"
                        value={formData.irfOE}
                        onChange={(e) => handleInputChange('irfOE', e.target.value)}
                        className="text-center border-blue-300 bg-white"
                        placeholder="Percentual"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-2">IRF (dB)</label>
                      <Input
                        type="number"
                        value={formData.irfDBOE}
                        onChange={(e) => handleDecibelInputChange('irfDBOE', e.target.value)}
                        className="text-center border-blue-300 bg-white"
                        placeholder="Decibéis"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-2">Resultado</label>
                      <Input
                        value={formData.resultadoIRFMonoauralOE}
                        isReadOnly
                        className={`text-center font-bold bg-transparent border-none ${
                          formData.resultadoIRFMonoauralOE === 'Normal' ? 'text-green-600' : 
                          formData.resultadoIRFMonoauralOE === 'Limítrofe' ? 'text-amber-500' : 'text-red-600'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Dissimetria */}
              <div className="mt-4 text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">Dissimetria entre Orelhas</label>
                <Input
                  value={formData.resultadoIRFDissimetrica}
                  isReadOnly
                  className={`text-center font-bold bg-transparent border-none text-lg ${
                    formData.resultadoIRFDissimetrica === 'Simétrica' ? 'text-green-600' : 
                    formData.resultadoIRFDissimetrica === 'Levemente dissimétrica' ? 'text-amber-500' : 'text-red-600'
                  }`}
                />
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* 6. Resultados e Conclusão */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle 
          number="6" 
          title="Conclusão / Observações" 
          icon={<FileText className="h-5 w-5 text-gray-600" />}
        />
        
        <div className="space-y-6">
          {/* Resultados por Orelha */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Resultados por Orelha</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Resultado OD */}
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h3 className="font-bold text-red-800 mb-4 text-center">OD - Ouvido Direito</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-red-700 mb-1">Conclusão</label>
                    <div className={`text-center font-bold text-sm p-2 rounded ${
                      formData.classificacaoOD === 'Normal' ? 'bg-green-100 text-green-800' : 
                      formData.classificacaoOD === 'Limítrofe' ? 'bg-amber-100 text-amber-800' : 
                      formData.classificacaoOD.includes('Leve') ? 'bg-amber-100 text-amber-800' : 
                      formData.classificacaoOD.includes('Moderada') ? 'bg-orange-100 text-orange-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      { formData.tipoPerdaOD.includes("Não aval") ? 
                        " - "
                       : `${formData.classificacaoOE} ${formData.tipoPerdaOD} ${formData.configuracaoOE} nas frequências ${formData.frequenciasAlteradasOE || 'dentro da normalidade'}`
                       }
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-semibold text-red-700">Média Tonal</div>
                      <div className="font-bold text-red-800">{formData.mediaTonalOD} dB</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-red-700">Tipo</div>
                      <div className="font-bold text-red-800">{formData.tipoPerdaOD}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-red-700">Configuração</div>
                      <div className="font-bold text-red-800">{formData.configuracaoOD}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resultado OE */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-bold text-blue-800 mb-4 text-center">OE - Ouvido Esquerdo</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-blue-700 mb-1">Conclusão</label>
                    <div className={`text-center font-bold text-sm p-2 rounded ${
                      formData.classificacaoOE === 'Normal' ? 'bg-green-100 text-green-800' : 
                      formData.classificacaoOE === 'Limítrofe' ? 'bg-amber-100 text-amber-800' : 
                      formData.classificacaoOE.includes('Leve') ? 'bg-amber-100 text-amber-800' : 
                      formData.classificacaoOE.includes('Moderada') ? 'bg-orange-100 text-orange-800' : 
                      'bg-blue-100 text-blue-800'
                    }`}>
                      { formData.tipoPerdaOE.includes("Não aval") ? 
                        " - "
                       : `${formData.classificacaoOE} ${formData.tipoPerdaOE} ${formData.configuracaoOE} nas frequências ${formData.frequenciasAlteradasOE || 'dentro da normalidade'}`
                       }
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-semibold text-blue-700">Média Tonal</div>
                      <div className="font-bold text-blue-800">{formData.mediaTonalOE} dB</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-blue-700">Tipo</div>
                      <div className="font-bold text-blue-800">{formData.tipoPerdaOE}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-blue-700">Configuração</div>
                      <div className="font-bold text-blue-800">{formData.configuracaoOE}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Critério PCD */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Critério PCD - Pessoa com Deficiência</h3>
            <div className={`p-4 rounded-lg border-2 ${
              formData.criterioPCD.includes('Enquadra-se') ? 'bg-red-50 border-red-300' :
              formData.criterioPCD.includes('Avaliação') ? 'bg-amber-50 border-amber-300' :
              'bg-green-50 border-green-300'
            }`}>
              <div className="text-center">
                <div className={`text-lg font-bold ${
                  formData.criterioPCD.includes('Enquadra-se') ? 'text-red-700' :
                  formData.criterioPCD.includes('Avaliação') ? 'text-amber-700' :
                  'text-green-700'
                }`}>
                  {formData.criterioPCD}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {formData.criterioPCD.includes('Enquadra-se') 
                    ? 'Encaminhar para avaliação médica especializada e perícia do INSS'
                    : formData.criterioPCD.includes('Avaliação')
                    ? 'Recomenda-se avaliação complementar para confirmação do quadro'
                    : 'Não atende aos critérios legais para enquadramento como PCD'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Conclusão Geral */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Conclusão Geral</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Resultado*</label>
              <Textarea
                value={formData.textoResultado}
                onChange={(e) => handleInputChange('textoResultado', e.target.value)}
                rows={3}
                placeholder="Ex: Dentro dos padrões da normalidade ou OD: Perda Leve | OE: Normal"
                className="bg-white border-gray-300"
                required
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
          isDisabled={!formData.dataCalibracao}
        >
          Salvar / Concluir Exame
        </Button>
      </div>
    </div>
  );
};

export default AudiometriaOcupacional;