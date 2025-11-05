import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Button, Input, Select, SelectItem, Textarea, Checkbox, Spinner } from "@heroui/react";
import { useUser } from '@/hooks/useUser';
import { Scheduling } from '@/lib/scheduling/interface/scheduling';
import { User, Ear, Stethoscope, FileText, Volume2, AlertTriangle, Calculator } from 'lucide-react';
import HeaderExame from './HeaderExame';

interface AudiometriaProps {
  atendimento: Scheduling;
  exame: string;
  formulario: any;
  onSave?: (data: any) => void;
  onClose?: () => void;
}

interface AudiometriaData {
  tipoAudiometro: string;
  dataCalibracao: string;
  repousoAuditivo: string;
  horasRepouso: number;
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
  meatoscopiaOD: string;
  meatoscopiaOE: string;
  observacoesMeatoscopia: string;
  
  // Via Aérea
  viaAereaOD250: string; viaAereaOD500: string; viaAereaOD1000: string; viaAereaOD2000: string;
  viaAereaOD3000: string; viaAereaOD4000: string; viaAereaOD6000: string; viaAereaOD8000: string;
  viaAereaOE250: string; viaAereaOE500: string; viaAereaOE1000: string; viaAereaOE2000: string;
  viaAereaOE3000: string; viaAereaOE4000: string; viaAereaOE6000: string; viaAereaOE8000: string;
  
  // Via Óssea
  viaOsseaOD500: string; viaOsseaOD1000: string; viaOsseaOD2000: string; viaOsseaOD3000: string; viaOsseaOD4000: string;
  viaOsseaOE500: string; viaOsseaOE1000: string; viaOsseaOE2000: string; viaOsseaOE3000: string; viaOsseaOE4000: string;
  
  // Mascaramento
  mascaramentoOD250: string; mascaramentoOD500: string; mascaramentoOD1000: string; mascaramentoOD2000: string;
  mascaramentoOD3000: string; mascaramentoOD4000: string; mascaramentoOD6000: string; mascaramentoOD8000: string;
  mascaramentoOE250: string; mascaramentoOE500: string; mascaramentoOE1000: string; mascaramentoOE2000: string;
  mascaramentoOE3000: string; mascaramentoOE4000: string; mascaramentoOE6000: string; mascaramentoOE8000: string;
  
  // IRF
  realizarIRF: boolean;
  srtOD: string; srtOE: string;
  irfOD: string; irfOE: string;
  irfDBOD: string; irfDBOE: string;
  
  // Resultados calculados
  resultadoSRTOD: string;
  resultadoSRTOE: string;
  resultadoIRFOD: string;
  resultadoIRFOE: string;
  resultadoIRFMonoauralOD: string;
  resultadoIRFMonoauralOE: string;
  resultadoIRFDissimetrica: string;
  
  entalhe4000HzOD: boolean;
  entalhe4000HzOE: boolean;
  tipoPerdaOD: string;
  tipoPerdaOE: string;
  audiometriaReferenciaDisponivel: boolean;
  limiaresRAOD: { [key: number]: number }; 
  limiaresRAOE: { [key: number]: number };
  classificacaoNR7OD: string;
  classificacaoNR7OE: string;
  
  classificacaoOD: string;
  classificacaoOE: string;
  classificacaoGeral: string;
  configuracaoOD: string;
  configuracaoOE: string;
  
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

// Constantes otimizadas
const FREQUENCIAS = [
  { label: '250 Hz', fieldVAOD: 'viaAereaOD250', fieldVAOE: 'viaAereaOE250', fieldVOOD: null, fieldVOOE: null, fieldMascOD: 'mascaramentoOD250', fieldMascOE: 'mascaramentoOE250' },
  { label: '500 Hz', fieldVAOD: 'viaAereaOD500', fieldVAOE: 'viaAereaOE500', fieldVOOD: 'viaOsseaOD500', fieldVOOE: 'viaOsseaOE500', fieldMascOD: 'mascaramentoOD500', fieldMascOE: 'mascaramentoOE500' },
  { label: '1000 Hz', fieldVAOD: 'viaAereaOD1000', fieldVAOE: 'viaAereaOE1000', fieldVOOD: 'viaOsseaOD1000', fieldVOOE: 'viaOsseaOE1000', fieldMascOD: 'mascaramentoOD1000', fieldMascOE: 'mascaramentoOE1000' },
  { label: '2000 Hz', fieldVAOD: 'viaAereaOD2000', fieldVAOE: 'viaAereaOE2000', fieldVOOD: 'viaOsseaOD2000', fieldVOOE: 'viaOsseaOE2000', fieldMascOD: 'mascaramentoOD2000', fieldMascOE: 'mascaramentoOE2000' },
  { label: '3000 Hz', fieldVAOD: 'viaAereaOD3000', fieldVAOE: 'viaAereaOE3000', fieldVOOD: 'viaOsseaOD3000', fieldVOOE: 'viaOsseaOE3000', fieldMascOD: 'mascaramentoOD3000', fieldMascOE: 'mascaramentoOE3000' },
  { label: '4000 Hz', fieldVAOD: 'viaAereaOD4000', fieldVAOE: 'viaAereaOE4000', fieldVOOD: 'viaOsseaOD4000', fieldVOOE: 'viaOsseaOE4000', fieldMascOD: 'mascaramentoOD4000', fieldMascOE: 'mascaramentoOE4000' },
  { label: '6000 Hz', fieldVAOD: 'viaAereaOD6000', fieldVAOE: 'viaAereaOE6000', fieldVOOD: null, fieldVOOE: null, fieldMascOD: 'mascaramentoOD6000', fieldMascOE: 'mascaramentoOE6000' },
  { label: '8000 Hz', fieldVAOD: 'viaAereaOD8000', fieldVAOE: 'viaAereaOE8000', fieldVOOD: null, fieldVOOE: null, fieldMascOD: 'mascaramentoOD8000', fieldMascOE: 'mascaramentoOE8000' },
] as const;

const OPCOES_SIM_NAO = ['Sim', 'Não'] as const;

const VALOR_INICIAL: AudiometriaData = {
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
  meatoscopiaOD: 'SEM_OBSTRUCAO',
  meatoscopiaOE: 'SEM_OBSTRUCAO',
  observacoesMeatoscopia: '',
  
  viaAereaOD250: '', viaAereaOD500: '', viaAereaOD1000: '', viaAereaOD2000: '',
  viaAereaOD3000: '', viaAereaOD4000: '', viaAereaOD6000: '', viaAereaOD8000: '',
  viaAereaOE250: '', viaAereaOE500: '', viaAereaOE1000: '', viaAereaOE2000: '',
  viaAereaOE3000: '', viaAereaOE4000: '', viaAereaOE6000: '', viaAereaOE8000: '',
  
  viaOsseaOD500: '', viaOsseaOD1000: '', viaOsseaOD2000: '', viaOsseaOD3000: '', viaOsseaOD4000: '',
  viaOsseaOE500: '', viaOsseaOE1000: '', viaOsseaOE2000: '', viaOsseaOE3000: '', viaOsseaOE4000: '',
  mascaramentoOD250: '', mascaramentoOD500: '', mascaramentoOD1000: '', mascaramentoOD2000: '',
  mascaramentoOD3000: '', mascaramentoOD4000: '', mascaramentoOD6000: '', mascaramentoOD8000: '',
  mascaramentoOE250: '', mascaramentoOE500: '', mascaramentoOE1000: '', mascaramentoOE2000: '',
  mascaramentoOE3000: '', mascaramentoOE4000: '', mascaramentoOE6000: '', mascaramentoOE8000: '',
  
  realizarIRF: false,
  srtOD: '', srtOE: '', irfOD: '', irfOE: '', irfDBOD: '', irfDBOE: '',
  resultadoSRTOD: '', resultadoSRTOE: '', resultadoIRFOD: '', resultadoIRFOE: '',
  resultadoIRFMonoauralOD: '', resultadoIRFMonoauralOE: '', resultadoIRFDissimetrica: '',
  
  entalhe4000HzOD: false, entalhe4000HzOE: false,
  tipoPerdaOD: 'Neurossensorial', tipoPerdaOE: 'Neurossensorial',
  audiometriaReferenciaDisponivel: false,
  limiaresRAOD: {}, limiaresRAOE: {},
  classificacaoNR7OD: 'Não Classificado (RA Ausente)', classificacaoNR7OE: 'Não Classificado (RA Ausente)',
  classificacaoOD: 'Dentro dos padrões da normalidade', 
  classificacaoOE: 'Dentro dos padrões da normalidade', 
  configuracaoOD: 'Plana', configuracaoOE: 'Plana',
  
  perdaAuditivaOD: '0 dB', perdaAuditivaOE: '0 dB',
  frequenciasAlteradasOD: '', frequenciasAlteradasOE: '',
  mediaTonalOD: 0, mediaTonalOE: 0,
  criterioPCD: 'Não se enquadra (Cota Federal)',
  
  classificacaoGeral: 'Limiares auditivos dentro dos padrões da normalidade.',
  conclusao: 'Limiares auditivos dentro dos padrões da normalidade.',
  observacoes: '',
  resultadoOD: 'Dentro dos padrões da normalidade.',
  resultadoOE: 'Dentro dos padrões da normalidade.',
};

// Componente de input ultra-leve para decibéis
const DecibelInput = React.memo(({ 
  value, 
  onChange,
  placeholder = "0",
  className = ""
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Permite apenas números e limita a 3 dígitos
    const numericValue = inputValue.replace(/[^\d]/g, '').slice(0, 3);
    const finalValue = numericValue === '' ? '' : Math.min(parseInt(numericValue), 120).toString();
    onChange(finalValue);
  }, [onChange]);

  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={`h-8 w-full text-center border border-gray-300 rounded-md px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
    />
  );
});

// Componente de seção
const SectionTitle: React.FC<{ number: string; title: string; icon?: React.ReactNode }> = 
React.memo(({ number, title, icon }) => (
  <div className="flex items-start gap-3 mb-4">
    <div className="flex-1">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-xl font-bold text-gray-800">
          {title}
        </h2>
      </div>
    </div>
  </div>
));

// Serviço de cálculos (separado do componente)
class AudiometriaCalculator {
  static calcularMediaTonal(freqs: string[]): number {
    const valores = freqs
      .map(v => parseFloat(v))
      .filter(v => !isNaN(v));
    
    if (valores.length === 0) return 0;
    return Math.round(valores.reduce((acc, val) => acc + val, 0) / valores.length);
  }

  static classificarPerdaLloydKaplan(media: number): string {
    if (media <= 25) return 'Limiares auditivos dentro dos padrões da normalidade';
    if (media <= 40) return 'Perda Auditiva Leve';
    if (media <= 70) return 'Perda Auditiva Moderada';
    if (media <= 90) return 'Perda Auditiva Severa';
    return 'Perda Auditiva Profunda';
  }

  static identificarFrequenciasAlteradas(vaLimiares: { [key: number]: string }): string {
    return Object.keys(vaLimiares)
      .map(Number)
      .filter(freq => {
        const valor = parseFloat(vaLimiares[freq]);
        return !isNaN(valor) && valor > 25;
      })
      .map(freq => `${freq} Hz`)
      .join(', ');
  }

  static verificarCriterioPCD(mediaOD: number, mediaOE: number): string {
    const melhorOrelha = Math.min(mediaOD, mediaOE);
    const piorOrelha = Math.max(mediaOD, mediaOE);
    
    if (melhorOrelha >= 41) {
      return `POSSIBILIDADE DE COTA PCD - Critério: Perda Auditiva Bilateral (Média Tonal na Melhor Orelha >= 41 dB NA). Ref: Decreto 5.296/2004.`;
    } else if (piorOrelha >= 95 && melhorOrelha < 41) {
      return `POSSIBILIDADE DE COTA PCD - Critério: Surdez Unilateral Total/Profunda (Média Tonal na Pior Orelha >= 95 dB NA e Melhor Orelha < 41 dB NA). Ref: Lei 14.768/2023.`;
    }
    
    return 'NÃO SE ENQUADRA. Limiares auditivos abaixo dos critérios federais (Média Tonal na Melhor Orelha < 41 dB NA).';
  }

  static calcularConfiguracao(vaLimiares: { [key: number]: string }): string {
    const val500 = parseFloat(vaLimiares[500]) || 0;
    const val4000 = parseFloat(vaLimiares[4000]) || 0;
    if (Math.abs(val500 - val4000) <= 10) return 'Plana';
    if (val4000 > val500 + 15) return 'Descendente';
    return 'Irregular';
  }

  static calcularTodosResultados(formData: AudiometriaData): Partial<AudiometriaData> {
    const vaLimiaresOD = {
      250: formData.viaAereaOD250, 500: formData.viaAereaOD500, 1000: formData.viaAereaOD1000, 
      2000: formData.viaAereaOD2000, 3000: formData.viaAereaOD3000, 4000: formData.viaAereaOD4000, 
      6000: formData.viaAereaOD6000, 8000: formData.viaAereaOD8000
    };

    const vaLimiaresOE = {
      250: formData.viaAereaOE250, 500: formData.viaAereaOE500, 1000: formData.viaAereaOE1000, 
      2000: formData.viaAereaOE2000, 3000: formData.viaAereaOE3000, 4000: formData.viaAereaOE4000, 
      6000: formData.viaAereaOE6000, 8000: formData.viaAereaOE8000
    };

    const mediaTonalOD = this.calcularMediaTonal([
      formData.viaAereaOD500, formData.viaAereaOD1000, formData.viaAereaOD2000, formData.viaAereaOD3000
    ]);
    const mediaTonalOE = this.calcularMediaTonal([
      formData.viaAereaOE500, formData.viaAereaOE1000, formData.viaAereaOE2000, formData.viaAereaOE3000
    ]);

    const classificacaoOD = this.classificarPerdaLloydKaplan(mediaTonalOD);
    const classificacaoOE = this.classificarPerdaLloydKaplan(mediaTonalOE);

    const frequenciasAlteradasOD = this.identificarFrequenciasAlteradas(vaLimiaresOD);
    const frequenciasAlteradasOE = this.identificarFrequenciasAlteradas(vaLimiaresOE);

    const configuracaoOD = this.calcularConfiguracao(vaLimiaresOD);
    const configuracaoOE = this.calcularConfiguracao(vaLimiaresOE);

    const resultadoOD = classificacaoOD.includes('normalidade') 
      ? 'Limiares auditivos dentro dos padrões da normalidade'
      : `${classificacaoOD} Neurossensorial ${configuracaoOD} nas frequências ${frequenciasAlteradasOD || '250 a 8000 Hz'}`;
    
    const resultadoOE = classificacaoOE.includes('normalidade')
      ? 'Limiares auditivos dentro dos padrões da normalidade'
      : `${classificacaoOE} Neurossensorial ${configuracaoOE} nas frequências ${frequenciasAlteradasOE || '250 a 8000 Hz'}`;

    return {
      mediaTonalOD,
      mediaTonalOE,
      perdaAuditivaOD: mediaTonalOD > 0 ? `${mediaTonalOD} dB` : '0 dB',
      perdaAuditivaOE: mediaTonalOE > 0 ? `${mediaTonalOE} dB` : '0 dB',
      classificacaoOD,
      classificacaoOE,
      criterioPCD: this.verificarCriterioPCD(mediaTonalOD, mediaTonalOE),
      frequenciasAlteradasOD,
      frequenciasAlteradasOE,
      configuracaoOD,
      configuracaoOE,
      tipoPerdaOD: 'Neurossensorial',
      tipoPerdaOE: 'Neurossensorial',
      resultadoOD,
      resultadoOE,
      conclusao: (classificacaoOD.includes('normalidade') && classificacaoOE.includes('normalidade')) 
        ? 'Limiares auditivos dentro dos padrões da normalidade.' 
        : 'Alteração Auditiva Detectada',
      classificacaoNR7OD: formData.audiometriaAnterior === 'Não' 
        ? (classificacaoOD.includes('normalidade') ? 'RA - Normal' : 'RA - Alterada')
        : 'Alteração Não Ocupacional',
    };
  }
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
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [formData, setFormData] = useState<AudiometriaData>(VALOR_INICIAL);
  const [resultadosCalculados, setResultadosCalculados] = useState(false);

  // Efeito de inicialização simples
  useEffect(() => {
    if (atendimento) {
      setAgendamento(atendimento);
    }
    if (formulario) {
      setFormData(prev => ({ ...prev, ...formulario }));
    }
  }, [atendimento, formulario]);

  // Handler ultra-simples para inputs
  const handleInputChange = useCallback((field: keyof AudiometriaData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Marcar que os resultados precisam ser recalculados
    if (field.startsWith('viaAerea') || field.startsWith('viaOssea')) {
      setResultadosCalculados(false);
    }
  }, []);

  // Handler para campos de decibéis
  const handleDecibelInputChange = useCallback((field: keyof AudiometriaData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setResultadosCalculados(false);
  }, []);

  const handleCheckboxChange = useCallback((field: keyof AudiometriaData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Função para calcular resultados
  const calcularResultados = useCallback(async () => {
    setIsCalculating(true);
    
    // Simular um pequeno delay para feedback visual
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      const updates = AudiometriaCalculator.calcularTodosResultados(formData);
      setFormData(prev => ({ ...prev, ...updates }));
      setResultadosCalculados(true);
    } catch (error) {
      console.error('Erro ao calcular resultados:', error);
    } finally {
      setIsCalculating(false);
    }
  }, [formData]);

  const handleSave = useCallback(async () => {
    if (!resultadosCalculados) {
      // Se não calculou ainda, calcular antes de salvar
      await calcularResultados();
    }
    
    setIsLoading(true);
    try {
      await onSave?.(formData);
    } finally {
      setIsLoading(false);
    }
  }, [formData, onSave, resultadosCalculados, calcularResultados]);

  // Componente de checkbox Sim/Não reutilizável
  const SimNaoCheckbox = useCallback(({ field, label }: { field: keyof AudiometriaData; label: string }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex gap-4">
        {OPCOES_SIM_NAO.map((option) => (
          <Checkbox
            color="success"
            key={option}
            isSelected={formData[field] === option}
            onValueChange={(checked) => checked && handleCheckboxChange(field, option)}
            classNames={{ label: "text-sm text-gray-700" }}
          >
            {option}
          </Checkbox>
        ))}
      </div>
    </div>
  ), [formData, handleCheckboxChange]);

  return (
    <div className="space-y-8 p-4 md:p-8 min-h-screen">
      <HeaderExame 
        agendamento={agendamento}
        exame={exame}
      />
      
      {/* 1. Anamnese Auditiva */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle number="1" title="Anamnese Auditiva" />
        
        <div className="space-y-6">
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              <SimNaoCheckbox field="queixaAuditiva" label="Queixa ou sintoma auditivo atual?" />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Audiometria Anterior?*</label>
                <div className="flex gap-4">
                  {OPCOES_SIM_NAO.map((option) => (
                    <Checkbox
                        color='success'
                        key={option}
                        isSelected={formData.audiometriaAnterior === option}
                        onValueChange={(checked) => checked && handleCheckboxChange('audiometriaAnterior', option)}
                        classNames={{ label: "text-sm text-gray-700" }}
                    >
                      {option}
                    </Checkbox>
                  ))}
                </div>
                {formData.audiometriaAnterior === 'Sim' && (
                  <p className="text-xs text-amber-600 mt-1">*Exame Sequencial.</p>
                )}
                {formData.audiometriaAnterior === 'Não' && (
                  <p className="text-xs text-green-600 mt-1">*Primeiro exame. Este será a Audiometria de Referência (RA).</p>
                )}
              </div>

              <SimNaoCheckbox field="infeccaoCirurgiaOuvido" label="Infecção ou Cirurgia no Ouvido?" />

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tratamento antibióticos e/ou ototóxicos?</label>
                  <div className="flex gap-4 mb-2">
                    {OPCOES_SIM_NAO.map((option) => (
                      <Checkbox
                        color='success'
                        key={option}
                        isSelected={formData.tratamentoOtotoxicos === option}
                        onValueChange={(checked) => checked && handleCheckboxChange('tratamentoOtotoxicos', option)}
                        classNames={{ label: "text-gray-700" }}
                      >
                        {option}
                      </Checkbox>
                    ))}
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
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Casos de surdez na família?</label>
                  <div className="flex gap-4 mb-2">
                    {OPCOES_SIM_NAO.map((option) => (
                      <Checkbox
                        color='success'
                        key={option}
                        isSelected={formData.surdezFamilia === option}
                        onValueChange={(checked) => checked && handleCheckboxChange('surdezFamilia', option)}
                        classNames={{ label: "text-gray-700" }}
                      >
                        {option}
                      </Checkbox>
                    ))}
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

              <SimNaoCheckbox field="trabalhoAnteriorRuido" label="Já trabalhou em ambiente ruidoso?" />
              <SimNaoCheckbox field="trabalhoAtualRuido" label="Trabalha atualmente em ambiente ruidoso?" />
              <SimNaoCheckbox field="usoProtetorAuricular" label="Usa Protetor Auricular?" />
              <SimNaoCheckbox field="contatoQuimicos" label="Contato com produtos químicos ou solventes?" />
              <SimNaoCheckbox field="habitoSomAlto" label="Costuma ouvir música (caixas, fones, etc)?" />
              <SimNaoCheckbox field="exposicaoExplosoes" label="Já teve contato com explosões?" />
              <SimNaoCheckbox field="traumaCabecaOuvido" label="Trauma na Cabeça ou Ouvido?" />
              <SimNaoCheckbox field="labirintiteTontura" label="Labirintite ou Tontura?" />

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Uso de Medicamentos Atuais?</label>
                <div className="flex gap-4 mb-2">
                  {OPCOES_SIM_NAO.map((option) => (
                    <Checkbox
                        color='success'
                        key={option}
                        isSelected={formData.usoMedicamentos === option}
                        onValueChange={(checked) => checked && handleCheckboxChange('usoMedicamentos', option)}
                        classNames={{ label: "text-gray-700" }}
                    >
                      {option}
                    </Checkbox>
                  ))}
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
      </Card>

      {/* 2. Dados do Exame */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle number="2" title="Dados do Exame e Protocolo" />
        <div className="space-y-6">
          <div className="p-4">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Dados Técnicos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <Select 
                variant='bordered'
                  selectedKeys={[formData.tipoAudiometro]} 
                  onChange={(e) => handleInputChange('tipoAudiometro', e.target.value)}
                  classNames={{ trigger: "bg-white border-gray-300" }}
                >
                  <SelectItem key="AVS 500">AVS 500</SelectItem>
                  <SelectItem key="AS 60">AS 60</SelectItem>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Repouso Auditivo ≥14h?*</label>
                <div className="flex gap-6">
                  <Checkbox 
                  color='success'
                    isSelected={formData.repousoAuditivo === 'Sim'} 
                    onValueChange={(checked) => handleInputChange('repousoAuditivo', checked ? 'Sim' : 'Não')} 
                    classNames={{ label: "text-gray-700" }}
                  >
                    Sim
                  </Checkbox>
                  <Checkbox 
                    isSelected={formData.repousoAuditivo === 'Não'} 
                    onValueChange={(checked) => handleInputChange('repousoAuditivo', checked ? 'Não' : 'Sim')} 
                    classNames={{ label: "text-gray-700" }}
                  >
                    Não
                  </Checkbox>
                  {formData.repousoAuditivo === 'Sim' && (
                    <Input 
                      type="number" 
                      value={formData.horasRepouso.toString()} 
                      onChange={(e) => handleInputChange('horasRepouso', parseInt(e.target.value) || 0)} 
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
          <div className="p-4">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Meatoscopia</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">OD</label>
                <Select 
                variant='bordered'
                  selectedKeys={[formData.meatoscopiaOD]} 
                  onChange={(e) => handleInputChange('meatoscopiaOD', e.target.value)}
                  classNames={{ trigger: "bg-white border-gray-300" }}
                >
                  <SelectItem key="SEM_OBSTRUCAO">Sem obstrução</SelectItem>
                  <SelectItem key="COM_OBSTRUCAO_PARCIAL">Obstrução parcial</SelectItem>
                  <SelectItem key="COM_OBSTRUCAO_TOTAL">Obstrução total</SelectItem>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">OE</label>
                <Select 
                variant='bordered'
                  selectedKeys={[formData.meatoscopiaOE]} 
                  onChange={(e) => handleInputChange('meatoscopiaOE', e.target.value)}
                  classNames={{ trigger: "bg-white border-gray-300" }}
                >
                  <SelectItem key="SEM_OBSTRUCAO">Sem obstrução</SelectItem>
                  <SelectItem key="COM_OBSTRUCAO_PARCIAL">Obstrução parcial</SelectItem>
                  <SelectItem key="COM_OBSTRUCAO_TOTAL">Obstrução total</SelectItem>
                </Select>
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Observações da Meatoscopia</label>
                <Input 
                  value={formData.observacoesMeatoscopia} 
                  onChange={(e) => handleInputChange('observacoesMeatoscopia', e.target.value)} 
                  className="border-gray-300 bg-white" 
                  placeholder="-" 
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Limiares Auditivos - MÁXIMA PERFORMANCE */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle number="3" title="Audiometria Tonal (Limiares Auditivos)" />
        
        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {resultadosCalculados ? '✅ Resultados calculados' : '⚠️ Clique em "Calcular Resultados" após preencher os limiares'}
          </p>
          <Button
            color="primary"
            onPress={calcularResultados}
            isDisabled={isCalculating}
            startContent={isCalculating ? <Spinner size="sm" /> : <Calculator className="h-4 w-4" />}
            className="bg-green-600 text-white"
          >
            {isCalculating ? 'Calculando...' : 'Calcular Resultados'}
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th rowSpan={2} className="border border-gray-300 p-2 font-semibold">Orelha</th>
                <th rowSpan={2} className="border border-gray-300 p-2 font-semibold">Tipo</th>
                <th colSpan={FREQUENCIAS.length} className="border border-gray-300 p-2 font-semibold text-center">Frequências (Hz)</th>
              </tr>
              <tr className="bg-gray-50">
                {FREQUENCIAS.map((freq) => (
                  <th key={freq.label} className="border border-gray-300 p-1 font-medium text-xs text-center">
                    {freq.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* OD - Via Aérea */}
              <tr className="bg-white">
                <td rowSpan={3} className="border border-gray-300 p-1 text-center font-medium text-red-700 bg-red-50 text-xs">OD</td>
                <td className="border border-gray-300 p-1 text-center font-medium text-xs bg-red-50">VA</td>
                {FREQUENCIAS.map((freq) => (
                  <td key={`va-od-${freq.label}`} className="border border-gray-300 p-1">
                    <DecibelInput
                      value={formData[freq.fieldVAOD as keyof AudiometriaData] as string}
                      onChange={(value) => handleDecibelInputChange(freq.fieldVAOD as keyof AudiometriaData, value)}
                    />
                  </td>
                ))}
              </tr>
              
              {/* OD - Via Óssea */}
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-1 text-center font-medium text-xs bg-red-50">VO</td>
                {FREQUENCIAS.map((freq) => (
                  <td key={`vo-od-${freq.label}`} className="border border-gray-300 p-1">
                    {freq.fieldVOOD ? (
                      <DecibelInput
                        value={formData[freq.fieldVOOD as keyof AudiometriaData] as string}
                        onChange={(value) => handleDecibelInputChange(freq.fieldVOOD as keyof AudiometriaData, value)}
                      />
                    ) : (
                      <div className="text-center text-gray-400 py-2 text-xs">-</div>
                    )}
                  </td>
                ))}
              </tr>
              
              {/* OD - Mascaramento */}
              <tr className="bg-white">
                <td className="border border-gray-300 p-1 text-center font-medium text-xs bg-red-50">Masc</td>
                {FREQUENCIAS.map((freq) => (
                  <td key={`masc-od-${freq.label}`} className="border border-gray-300 p-1">
                    <DecibelInput
                      value={formData[freq.fieldMascOD as keyof AudiometriaData] as string}
                      onChange={(value) => handleDecibelInputChange(freq.fieldMascOD as keyof AudiometriaData, value)}
                    />
                  </td>
                ))}
              </tr>
              
              {/* OE - Via Aérea */}
              <tr className="bg-white">
                <td rowSpan={3} className="border border-gray-300 p-1 text-center font-medium text-blue-700 bg-blue-50 text-xs">OE</td>
                <td className="border border-gray-300 p-1 text-center font-medium text-xs bg-blue-50">VA</td>
                {FREQUENCIAS.map((freq) => (
                  <td key={`va-oe-${freq.label}`} className="border border-gray-300 p-1">
                    <DecibelInput
                      value={formData[freq.fieldVAOE as keyof AudiometriaData] as string}
                      onChange={(value) => handleDecibelInputChange(freq.fieldVAOE as keyof AudiometriaData, value)}
                    />
                  </td>
                ))}
              </tr>
              
              {/* OE - Via Óssea */}
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-1 text-center font-medium text-xs bg-blue-50">VO</td>
                {FREQUENCIAS.map((freq) => (
                  <td key={`vo-oe-${freq.label}`} className="border border-gray-300 p-1">
                    {freq.fieldVOOE ? (
                      <DecibelInput
                        value={formData[freq.fieldVOOE as keyof AudiometriaData] as string}
                        onChange={(value) => handleDecibelInputChange(freq.fieldVOOE as keyof AudiometriaData, value)}
                      />
                    ) : (
                      <div className="text-center text-gray-400 py-2 text-xs">-</div>
                    )}
                  </td>
                ))}
              </tr>
              
              {/* OE - Mascaramento */}
              <tr className="bg-white">
                <td className="border border-gray-300 p-1 text-center font-medium text-xs bg-blue-50">Masc</td>
                {FREQUENCIAS.map((freq) => (
                  <td key={`masc-oe-${freq.label}`} className="border border-gray-300 p-1">
                    <DecibelInput
                      value={formData[freq.fieldMascOE as keyof AudiometriaData] as string}
                      onChange={(value) => handleDecibelInputChange(freq.fieldMascOE as keyof AudiometriaData, value)}
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* 4. Conclusão e Laudo Final - SÓ APARECE APÓS CÁLCULO */}
      {resultadosCalculados && (
        <Card className="p-6 shadow-sm border border-gray-200 bg-white">
          <SectionTitle number="4" title="Conclusão e Laudo Final" />
          
          <div className="space-y-6">
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

            {/* Conclusão Geral */}
            <div className="p-4">
              <div className="mb-6 p-3 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sugestão de enquadramento PCD</label>
                <Textarea 
                  value={formData.criterioPCD}
                  isReadOnly
                  rows={2}
                  className={`text-sm font-semibold ${formData.criterioPCD.includes('POSSIBILIDADE') ? 'text-green-700 border-green-300' : 'text-gray-700 border-gray-300'}`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm text-center font-medium text-red-700 mb-2">Ouvido Direito</label>
                  <Textarea 
                    value={formData.resultadoOD}
                    onChange={(e) => handleInputChange('resultadoOD', e.target.value)}
                    rows={4}
                    className="bg-white border-red-300 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-center font-medium text-blue-700 mb-2">Ouvido Esquerdo</label>
                  <Textarea 
                    value={formData.resultadoOE}
                    onChange={(e) => handleInputChange('resultadoOE', e.target.value)}
                    rows={4}
                    className="bg-white border-blue-300 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observações do avaliador</label>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  rows={3}
                  className="bg-white border-gray-300"
                  placeholder="Ex: orientado quanto ao uso contínuo do protetor auricular..."
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 bg-white p-4 rounded-lg">
        <Button
          variant="flat"
          onPress={onClose}
          className="px-8 border border-gray-300 text-gray-700 hover:bg-gray-50"
          isDisabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          color="primary"
          onPress={handleSave}
          className="px-8 bg-gray-800 text-white shadow-sm hover:bg-gray-700 transition-colors"
          startContent={isLoading ? <Spinner size="sm" /> : <FileText className="h-4 w-4" />}
          isDisabled={!formData.resultadoOD || !formData.resultadoOE || isLoading}
        >
          {isLoading ? 'Salvando...' : 'Concluir exame'}
        </Button>
      </div>
    </div>
  );
};

export default React.memo(AudiometriaOcupacional);