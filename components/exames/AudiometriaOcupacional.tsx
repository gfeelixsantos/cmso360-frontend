// AudiometriaOcupacional.tsx
// Código atualizado com validação de campos e botão para ver audiometria anterior
import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
  Checkbox,
  Spinner,
} from "@heroui/react";
import { FileText, Calculator, Eye } from "lucide-react";

import HeaderExame from "./HeaderExame";

import { useUser } from "@/hooks/useUser";
import { Scheduling } from "@/lib/scheduling/interface/scheduling";
import { NEST_SOC_AUDIOMETRIA_ANTERIOR, NEST_URL, UNIDADES_ATENDIMENTO } from "@/config/constants";

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

  // Via Óssea
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

  // Mascaramento Via Aérea - SEPARADO POR TIPO
  mascaramentoVAOD250: boolean;
  mascaramentoVAOD500: boolean;
  mascaramentoVAOD1000: boolean;
  mascaramentoVAOD2000: boolean;
  mascaramentoVAOD3000: boolean;
  mascaramentoVAOD4000: boolean;
  mascaramentoVAOD6000: boolean;
  mascaramentoVAOD8000: boolean;
  mascaramentoVAOE250: boolean;
  mascaramentoVAOE500: boolean;
  mascaramentoVAOE1000: boolean;
  mascaramentoVAOE2000: boolean;
  mascaramentoVAOE3000: boolean;
  mascaramentoVAOE4000: boolean;
  mascaramentoVAOE6000: boolean;
  mascaramentoVAOE8000: boolean;

  // Mascaramento Via Óssea - SEPARADO POR TIPO
  mascaramentoVOOD500: boolean;
  mascaramentoVOOD1000: boolean;
  mascaramentoVOOD2000: boolean;
  mascaramentoVOOD3000: boolean;
  mascaramentoVOOD4000: boolean;
  mascaramentoVOOE500: boolean;
  mascaramentoVOOE1000: boolean;
  mascaramentoVOOE2000: boolean;
  mascaramentoVOOE3000: boolean;
  mascaramentoVOOE4000: boolean;

  // IRF
  realizarIRF: boolean;
  srtOD: string;
  srtOE: string;
  irfOD: string;
  irfOE: string;
  irfDBOD: string;
  irfDBOE: string;

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

// Constantes otimizadas - ATUALIZADO COM CAMPOS SEPARADOS PARA MASCARAMENTO
const FREQUENCIAS = [
  {
    label: "250 Hz",
    fieldVAOD: "viaAereaOD250",
    fieldVAOE: "viaAereaOE250",
    fieldVOOD: null,
    fieldVOOE: null,
    fieldMascVAOD: "mascaramentoVAOD250",
    fieldMascVAOE: "mascaramentoVAOE250",
    fieldMascVOOD: null,
    fieldMascVOOE: null,
  },
  {
    label: "500 Hz",
    fieldVAOD: "viaAereaOD500",
    fieldVAOE: "viaAereaOE500",
    fieldVOOD: "viaOsseaOD500",
    fieldVOOE: "viaOsseaOE500",
    fieldMascVAOD: "mascaramentoVAOD500",
    fieldMascVAOE: "mascaramentoVAOE500",
    fieldMascVOOD: "mascaramentoVOOD500",
    fieldMascVOOE: "mascaramentoVOOE500",
  },
  {
    label: "1000 Hz",
    fieldVAOD: "viaAereaOD1000",
    fieldVAOE: "viaAereaOE1000",
    fieldVOOD: "viaOsseaOD1000",
    fieldVOOE: "viaOsseaOE1000",
    fieldMascVAOD: "mascaramentoVAOD1000",
    fieldMascVAOE: "mascaramentoVAOE1000",
    fieldMascVOOD: "mascaramentoVOOD1000",
    fieldMascVOOE: "mascaramentoVOOE1000",
  },
  {
    label: "2000 Hz",
    fieldVAOD: "viaAereaOD2000",
    fieldVAOE: "viaAereaOE2000",
    fieldVOOD: "viaOsseaOD2000",
    fieldVOOE: "viaOsseaOE2000",
    fieldMascVAOD: "mascaramentoVAOD2000",
    fieldMascVAOE: "mascaramentoVAOE2000",
    fieldMascVOOD: "mascaramentoVOOD2000",
    fieldMascVOOE: "mascaramentoVOOE2000",
  },
  {
    label: "3000 Hz",
    fieldVAOD: "viaAereaOD3000",
    fieldVAOE: "viaAereaOE3000",
    fieldVOOD: "viaOsseaOD3000",
    fieldVOOE: "viaOsseaOE3000",
    fieldMascVAOD: "mascaramentoVAOD3000",
    fieldMascVAOE: "mascaramentoVAOE3000",
    fieldMascVOOD: "mascaramentoVOOD3000",
    fieldMascVOOE: "mascaramentoVOOE3000",
  },
  {
    label: "4000 Hz",
    fieldVAOD: "viaAereaOD4000",
    fieldVAOE: "viaAereaOE4000",
    fieldVOOD: "viaOsseaOD4000",
    fieldVOOE: "viaOsseaOE4000",
    fieldMascVAOD: "mascaramentoVAOD4000",
    fieldMascVAOE: "mascaramentoVAOE4000",
    fieldMascVOOD: "mascaramentoVOOD4000",
    fieldMascVOOE: "mascaramentoVOOE4000",
  },
  {
    label: "6000 Hz",
    fieldVAOD: "viaAereaOD6000",
    fieldVAOE: "viaAereaOE6000",
    fieldVOOD: null,
    fieldVOOE: null,
    fieldMascVAOD: "mascaramentoVAOD6000",
    fieldMascVAOE: "mascaramentoVAOE6000",
    fieldMascVOOD: null,
    fieldMascVOOE: null,
  },
  {
    label: "8000 Hz",
    fieldVAOD: "viaAereaOD8000",
    fieldVAOE: "viaAereaOE8000",
    fieldVOOD: null,
    fieldVOOE: null,
    fieldMascVAOD: "mascaramentoVAOD8000",
    fieldMascVAOE: "mascaramentoVAOE8000",
    fieldMascVOOD: null,
    fieldMascVOOE: null,
  },
] as const;

const OPCOES_SIM_NAO = ["Sim", "Não"] as const;

// ATUALIZAÇÃO 1: Inicializar toda tabela de audiometria em branco
const VALOR_INICIAL: AudiometriaData = {
  tipoAudiometro: "AVS 500",
  dataCalibracao: "09/01/2025",
  repousoAuditivo: "Sim",
  horasRepouso: 14,
  queixaAuditiva: "Não",
  audiometriaAnterior: "Não",
  infeccaoCirurgiaOuvido: "Não",
  tratamentoOtotoxicos: "Não",
  dataTratamentoOtotoxicos: "",
  surdezFamilia: "Não",
  parentescoSurdez: "",
  trabalhoAnteriorRuido: "Sim",
  trabalhoAtualRuido: "Não",
  usoProtetorAuricular: "Sim",
  contatoQuimicos: "Não",
  habitoSomAlto: "Não",
  exposicaoExplosoes: "Não",
  traumaCabecaOuvido: "Não",
  labirintiteTontura: "Não",
  usoMedicamentos: "Não",
  quaisMedicamentos: "",
  meatoscopiaOD: "SEM_OBSTRUCAO",
  meatoscopiaOE: "SEM_OBSTRUCAO",
  observacoesMeatoscopia: "",

  // ATUALIZAÇÃO 1: TODOS OS CAMPOS DA TABELA EM BRANCO (VAZIO)
  viaAereaOD250: "",
  viaAereaOD500: "",
  viaAereaOD1000: "",
  viaAereaOD2000: "",
  viaAereaOD3000: "",
  viaAereaOD4000: "",
  viaAereaOD6000: "",
  viaAereaOD8000: "",
  viaAereaOE250: "",
  viaAereaOE500: "",
  viaAereaOE1000: "",
  viaAereaOE2000: "",
  viaAereaOE3000: "",
  viaAereaOE4000: "",
  viaAereaOE6000: "",
  viaAereaOE8000: "",

  viaOsseaOD500: "",
  viaOsseaOD1000: "",
  viaOsseaOD2000: "",
  viaOsseaOD3000: "",
  viaOsseaOD4000: "",
  viaOsseaOE500: "",
  viaOsseaOE1000: "",
  viaOsseaOE2000: "",
  viaOsseaOE3000: "",
  viaOsseaOE4000: "",

  // MASCARAMENTO VIA AÉREA - INICIALMENTE FALSE
  mascaramentoVAOD250: false,
  mascaramentoVAOD500: false,
  mascaramentoVAOD1000: false,
  mascaramentoVAOD2000: false,
  mascaramentoVAOD3000: false,
  mascaramentoVAOD4000: false,
  mascaramentoVAOD6000: false,
  mascaramentoVAOD8000: false,
  mascaramentoVAOE250: false,
  mascaramentoVAOE500: false,
  mascaramentoVAOE1000: false,
  mascaramentoVAOE2000: false,
  mascaramentoVAOE3000: false,
  mascaramentoVAOE4000: false,
  mascaramentoVAOE6000: false,
  mascaramentoVAOE8000: false,

  // MASCARAMENTO VIA ÓSSEA - INICIALMENTE FALSE
  mascaramentoVOOD500: false,
  mascaramentoVOOD1000: false,
  mascaramentoVOOD2000: false,
  mascaramentoVOOD3000: false,
  mascaramentoVOOD4000: false,
  mascaramentoVOOE500: false,
  mascaramentoVOOE1000: false,
  mascaramentoVOOE2000: false,
  mascaramentoVOOE3000: false,
  mascaramentoVOOE4000: false,

  realizarIRF: false,
  srtOD: "",
  srtOE: "",
  irfOD: "",
  irfOE: "",
  irfDBOD: "",
  irfDBOE: "",
  resultadoSRTOD: "",
  resultadoSRTOE: "",
  resultadoIRFOD: "",
  resultadoIRFOE: "",
  resultadoIRFMonoauralOD: "",
  resultadoIRFMonoauralOE: "",
  resultadoIRFDissimetrica: "",

  entalhe4000HzOD: false,
  entalhe4000HzOE: false,
  tipoPerdaOD: "Neurossensorial",
  tipoPerdaOE: "Neurossensorial",
  audiometriaReferenciaDisponivel: false,
  limiaresRAOD: {},
  limiaresRAOE: {},
  classificacaoNR7OD: "Não Classificado (RA Ausente)",
  classificacaoNR7OE: "Não Classificado (RA Ausente)",
  classificacaoOD: "",
  classificacaoOE: "",
  configuracaoOD: "Plana",
  configuracaoOE: "Plana",

  perdaAuditivaOD: "0 dB",
  perdaAuditivaOE: "0 dB",
  frequenciasAlteradasOD: "",
  frequenciasAlteradasOE: "",
  mediaTonalOD: 0,
  mediaTonalOE: 0,
  criterioPCD: "Não se enquadra (Cota Federal)",

  classificacaoGeral: "",
  conclusao: "",
  observacoes: "",
  resultadoOD: "",
  resultadoOE: "",
};

// Funções utilitárias para conversão de datas
const formatarParaInputDate = (data: string): string => {
  if (!data) return "";

  // Se já estiver no formato yyyy-MM-dd, retorna como está
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return data;
  }

  // Converte de dd/MM/yyyy para yyyy-MM-dd
  const partes = data.split("/");

  if (partes.length === 3) {
    const [dia, mes, ano] = partes;

    return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
  }

  return data;
};

// Componente de input ultra-leve para decibéis
const DecibelInput = React.memo(
  ({
    value,
    onChange,
    placeholder = "",
    className = "",
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
  }) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;

        // Permite apenas números e limita a 3 dígitos
       const filteredValue = inputValue.replace(/[^\d\-]/g, "").slice(0, 3);

        onChange(filteredValue);
      },
      [onChange],
    );

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        // Quando perde o foco, se estiver vazio, mantém vazio
        // Se quiser voltar a colocar "--" quando vazio, troque para onChange("--")
        if (e.target.value === "") {
          onChange("");
        }
      },
      [onChange],
    );

    return (
      <input
        className={`h-8 w-full text-center border border-gray-300 rounded-md px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
        inputMode="numeric"
        placeholder={placeholder}
        type="text"
        value={value}
        onBlur={handleBlur}
        onChange={handleChange}
      />
    );
  },
);

// Componente de input para data com formatação dd/MM/yyyy
const DateInput = React.memo(
  ({
    value,
    onChange,
    placeholder = "dd/mm/aaaa",
    className = "",
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
  }) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;

        // Para input type="date", o valor já vem no formato yyyy-MM-dd
        // Convertemos para dd/MM/yyyy para armazenamento
        if (inputValue) {
          const [ano, mes, dia] = inputValue.split("-");
          const dataFormatada = `${dia}/${mes}/${ano}`;

          onChange(dataFormatada);
        } else {
          onChange("");
        }
      },
      [onChange],
    );

    // Valor para o input type="date" (formato yyyy-MM-dd)
    const valorInputDate = formatarParaInputDate(value);

    return (
      <Input
        className={`border-gray-300 bg-white ${className}`}
        placeholder={placeholder}
        type="date"
        value={valorInputDate}
        onChange={handleChange}
      />
    );
  },
);

// Componente de seção
const SectionTitle: React.FC<{
  number: string;
  title: string;
  icon?: React.ReactNode;
}> = React.memo(({ number, title, icon }) => (
  <div className="flex items-start gap-3 mb-4">
    <div className="flex-1">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      </div>
    </div>
  </div>
));

// Serviço de cálculos (versão NR-7 + ajustes clínicos)
// Observações:
// - Textos padronizados para laudo ocupacional (NR-7).
// - Quando "Audição dentro dos padrões de normalidade", o tipo/grau aparecem como '-'.
// - Configuração da curva refinada: compara médias de baixas vs altas frequências.
class AudiometriaCalculator {
  static parseValor(v: string | null | undefined): number | null {
    if (
      v === null ||
      v === undefined ||
      v === "" ||
      v === "-" ||
      v === "--" ||
      v === "---"
    ) {
      return null;
    }

    const n = parseFloat(String(v).replace(",", "."));
    return isNaN(n) ? null : n;
  }


  // === MÉDIA TONAL (500, 1000, 2000, 3000 Hz) ===
  static calcularMediaTonal(freqs: string[]): number {
  const valores = freqs
    .map((v) => this.parseValor(v))
    .filter((v): v is number => v !== null);

  if (valores.length === 0) return 0;

  return Math.round(valores.reduce((acc, v) => acc + v, 0) / valores.length);
}


  // === CLASSIFICAÇÃO (Lloyd & Kaplan) ===
  static classificarPerdaLloydKaplan(limiares: { [key: number]: string }): string {

  const freqCriticas = [1000, 2000, 3000];

  // Se qualquer frequência crítica estiver ausente => PROFUNDA
  for (const f of freqCriticas) {
    const v = this.parseValor(limiares[f]);
    if (v === null) return "Perda Auditiva Profunda";
  }

  // Caso contrário usa o cálculo tonal normal
  const media = this.calcularMediaTonal([
    limiares[500],
    limiares[1000],
    limiares[2000],
    limiares[4000],
  ]);

  if (media >= 91) return "Perda Auditiva Profunda";
  if (media >= 71) return "Perda Auditiva Severa";
  if (media >= 56) return "Perda Auditiva Moderada Severa";
  if (media >= 41) return "Perda Auditiva Moderada";
  if (media >= 26) return "Perda Auditiva Leve";
  return "Normal";
}


  // === IDENTIFICAR FREQUÊNCIAS ALTERADAS (> 25 dB) ===
  static identificarFrequenciasAlteradas(
    vaLimiares: { [key: number]: string }
  ): string {
    const alteradas = Object.keys(vaLimiares)
      .map(Number)
      .filter((freq) => {
        const valor = this.parseValor(vaLimiares[freq]);
        return valor !== null && valor > 25;
      })
      .sort((a, b) => a - b)
      .map((freq) => `${freq} Hz`);

    return alteradas.length > 0 ? alteradas.join(", ") : "sem alterações significativas";
  }


  // === CRITÉRIO PCD (Decreto 5.296/2004 e Lei 14.768/2023) ===
  static verificarCriterioPCD(mediaOD: number, mediaOE: number): string {
    const melhorOrelha = Math.min(mediaOD, mediaOE);
    const piorOrelha = Math.max(mediaOD, mediaOE);

    if (melhorOrelha >= 41) {
      return `Atende aos critérios legais de deficiência auditiva (perda bilateral; média tonal na melhor orelha ≥ 41 dB NA), conforme Decreto 5.296/2004.`;
    } else if (piorOrelha >= 95 && melhorOrelha < 41) {
      return `Atende aos critérios legais de deficiência auditiva unilateral (pior orelha ≥ 95 dB NA e melhor orelha < 41 dB NA), conforme Lei 14.768/2023.`;
    }

    return `Não atende aos critérios legais de deficiência auditiva (média tonal na melhor orelha < 41 dB NA).`;
  }

  // === CONFIGURAÇÃO DA CURVA (refinada) ===
  // Compara média de baixas (500+1000) e média de altas (3000+4000+6000) para decidir:
  // - Plana: diferenças pequenas
  // - Descendente: altas ~ pior (indicando perda em altas freq)
  // - Ascendente: baixas ~ pior (raro, mas possível)
  // - Irregular: variação sem padrão definido
  static calcularConfiguracao(vaLimiares: { [key: number]: string }): string {
  const get = (f: number): number | null => this.parseValor(vaLimiares[f]);

  const baixas = [500, 1000].map(get).filter((v): v is number => v !== null);
  const altas = [3000, 4000, 6000].map(get).filter((v): v is number => v !== null);

  if (baixas.length === 0 || altas.length === 0) {
    const v500 = get(500) ?? 0;
    const v4000 = get(4000) ?? 0;

    if (Math.abs(v500 - v4000) <= 10) return "Plana";
    if (v4000 > v500 + 15) return "Descendente";
    if (v500 > v4000 + 15) return "Ascendente";
    return "Irregular";
  }

  const mediaBaixas = Math.round(baixas.reduce((a, b) => a + b, 0) / baixas.length);
  const mediaAltas = Math.round(altas.reduce((a, b) => a + b, 0) / altas.length);

  if (Math.abs(mediaBaixas - mediaAltas) <= 10) return "Plana";
  if (mediaAltas > mediaBaixas + 15) return "Descendente";
  if (mediaBaixas > mediaAltas + 15) return "Ascendente";

  return "Irregular";
}


  // CÁLCULO MÉDIA ÓSSEA
  static calcularMediaOssea(freqs: (string | null | undefined)[]): number | null {
  const valores = freqs
    .map((v) => this.parseValor(v))
    .filter((v): v is number => v !== null);

  if (valores.length === 0) return null;

  return Math.round(valores.reduce((acc, v) => acc + v, 0) / valores.length);
}


  // CÁLCULO DETERMINAR TIPO DE PERDA
  static determinarTipoPerda(mediaVA: number, mediaVO: number | null): string {
    // 1. Se audição é normal (<= 25), não há tipo de perda
    if (mediaVA <= 25) return "-";

    // 2. Se não tem Via Óssea registrada, assume Neurossensorial (padrão conservador/ocupacional)
    // ou você pode retornar "A esclarecer" se preferir forçar a VO.
    if (mediaVO === null) return "Neurossensorial";

    // 3. Cálculo do GAP Aéreo-Ósseo
    const gap = mediaVA - mediaVO;

    // Lógica Clássica de Classificação:

    // CONDUTIVA: VO Normal (<=25) e VA Alterada (>25) com GAP >= 15 (ou simplesmente existente)
    if (mediaVO <= 25) {
      return "Condutiva";
    }

    // MISTA: VO Alterada (>25) e VA Alterada (>25) com GAP significativo (>= 15 dB)
    if (mediaVO > 25 && gap >= 15) {
      return "Mista";
    }

    // NEUROSSENSORIAL: VO Alterada (>25) e VA Alterada (>25) com curvas acopladas (GAP < 15 dB)
    return "Neurossensorial";
  }

  // === CÁLCULO GERAL E MONTAGEM DE LAUDO ===
  static calcularTodosResultados(
    formData: AudiometriaData,
  ): Partial<AudiometriaData> {
    const vaLimiaresOD = {
      250: formData.viaAereaOD250,
      500: formData.viaAereaOD500,
      1000: formData.viaAereaOD1000,
      2000: formData.viaAereaOD2000,
      3000: formData.viaAereaOD3000,
      4000: formData.viaAereaOD4000,
      6000: formData.viaAereaOD6000,
      8000: formData.viaAereaOD8000,
    };

    const vaLimiaresOE = {
      250: formData.viaAereaOE250,
      500: formData.viaAereaOE500,
      1000: formData.viaAereaOE1000,
      2000: formData.viaAereaOE2000,
      3000: formData.viaAereaOE3000,
      4000: formData.viaAereaOE4000,
      6000: formData.viaAereaOE6000,
      8000: formData.viaAereaOE8000,
    };

    const mediaTonalOD = this.calcularMediaTonal([
      formData.viaAereaOD500,
      formData.viaAereaOD1000,
      formData.viaAereaOD2000,
      formData.viaAereaOD3000,
    ]);
    const mediaTonalOE = this.calcularMediaTonal([
      formData.viaAereaOE500,
      formData.viaAereaOE1000,
      formData.viaAereaOE2000,
      formData.viaAereaOE3000,
    ]);

    // Calcular Médias de Via Óssea (Geralmente 500, 1k, 2k, 3k ou 4k)
    const mediaOsseaOD = this.calcularMediaOssea([
      formData.viaOsseaOD500,
      formData.viaOsseaOD1000,
      formData.viaOsseaOD2000,
      formData.viaOsseaOD3000,
    ]);
    const mediaOsseaOE = this.calcularMediaOssea([
      formData.viaOsseaOE500,
      formData.viaOsseaOE1000,
      formData.viaOsseaOE2000,
      formData.viaOsseaOE3000,
    ]);

    const classificacaoOD = this.classificarPerdaLloydKaplan(vaLimiaresOD);
    const classificacaoOE = this.classificarPerdaLloydKaplan(vaLimiaresOE);

    const frequenciasAlteradasOD =
      this.identificarFrequenciasAlteradas(vaLimiaresOD);
    const frequenciasAlteradasOE =
      this.identificarFrequenciasAlteradas(vaLimiaresOE);

    const configuracaoOD = this.calcularConfiguracao(vaLimiaresOD);
    const configuracaoOE = this.calcularConfiguracao(vaLimiaresOE);

    // Tipo/grau: '-' quando dentro da normalidade (profissionais pediram esse comportamento)
    const isNormalOD = classificacaoOD.includes("normalidade");
    const isNormalOE = classificacaoOE.includes("normalidade");

    const tipoPerdaOD = this.determinarTipoPerda(mediaTonalOD, mediaOsseaOD);
    const tipoPerdaOE = this.determinarTipoPerda(mediaTonalOE, mediaOsseaOE);

    const grauPerdaOD = isNormalOD ? "-" : classificacaoOD;
    const grauPerdaOE = isNormalOE ? "-" : classificacaoOE;

    // Resultados textuais:
    const resultadoOD = isNormalOD
      ? "Limiares auditivos dentro dos padrões de normalidade."
      : `${grauPerdaOD} ${tipoPerdaOD} ${configuracaoOD} nas frequências ${frequenciasAlteradasOD}.`;

    const resultadoOE = isNormalOE
      ? "Limiares auditivos dentro dos padrões de normalidade."
      : `${grauPerdaOE} ${tipoPerdaOE} ${configuracaoOE} nas frequências ${frequenciasAlteradasOE}.`;

    const conclusaoGeral =
      isNormalOD && isNormalOE
        ? "Limiares auditivos dentro dos padrões de normalidade bilateralmente."
        : "Alterações auditivas detectadas conforme descrição acima.";

    // Classificação NR-7 para registro (RA = Resultado Audiométrico / quando não há comparativo anterior)
    const classificacaoNR7OD =
      formData.audiometriaAnterior === "Não"
        ? isNormalOD
          ? "RA - Normal"
          : "RA - Alterada"
        : "Alteração Não Ocupacional";

    const classificacaoNR7OE =
      formData.audiometriaAnterior === "Não"
        ? isNormalOE
          ? "RA - Normal"
          : "RA - Alterada"
        : "Alteração Não Ocupacional";

    return {
      // === Dados numéricos ===
      mediaTonalOD,
      mediaTonalOE,
      perdaAuditivaOD: `${mediaTonalOD} dB`,
      perdaAuditivaOE: `${mediaTonalOE} dB`,

      // === Classificação / Tipo ===
      classificacaoOD: isNormalOD ? "Normal" : classificacaoOD,
      classificacaoOE: isNormalOE ? "Normal" : classificacaoOE,
      tipoPerdaOD,
      tipoPerdaOE,

      // === Configuração e Frequências ===
      configuracaoOD,
      configuracaoOE,
      frequenciasAlteradasOD,
      frequenciasAlteradasOE,

      // === Resultados textuais para o laudo ===
      resultadoOD,
      resultadoOE,
      conclusao: conclusaoGeral,
      classificacaoGeral: conclusaoGeral,

      // === Critérios legais e NR-7 ===
      criterioPCD: this.verificarCriterioPCD(mediaTonalOD, mediaTonalOE),
      classificacaoNR7OD,
      classificacaoNR7OE,
    };
  }
}

// ATUALIZAÇÃO 1 e 2: Função para validar se todos os campos da tabela estão preenchidos
const validarCamposTabela = (formData: AudiometriaData): boolean => {
  const camposViaAerea = [
    "viaAereaOD250",
    "viaAereaOD500",
    "viaAereaOD1000",
    "viaAereaOD2000",
    "viaAereaOD3000",
    "viaAereaOD4000",
    "viaAereaOD6000",
    "viaAereaOD8000",
    "viaAereaOE250",
    "viaAereaOE500",
    "viaAereaOE1000",
    "viaAereaOE2000",
    "viaAereaOE3000",
    "viaAereaOE4000",
    "viaAereaOE6000",
    "viaAereaOE8000",
  ];

  // Verificar campos via aérea
  for (const campo of camposViaAerea) {
    if (formData[campo as keyof AudiometriaData] === "") {
      return false;
    }
  }

  // Verificar campos via óssea (podem ser opcionais dependendo do protocolo)
  // Se quiser tornar obrigatório, descomente abaixo:
  /*
  for (const campo of camposViaOssea) {
    if (formData[campo as keyof AudiometriaData] === "") {
      return false;
    }
  }
  */

  return true;
};

const AudiometriaOcupacional: React.FC<AudiometriaProps> = ({
  atendimento,
  exame,
  formulario,
  onSave,
  onClose,
}) => {

  const [agendamento, setAgendamento] = useState<Scheduling>();
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [formData, setFormData] = useState<AudiometriaData>(VALOR_INICIAL);
  const [resultadosCalculados, setResultadosCalculados] = useState(false);
  const [carregandoAudiometriaAnterior, setCarregandoAudiometriaAnterior] = useState(false);

  // Efeito de inicialização simples
  useEffect(() => {
    if (atendimento) {
      setAgendamento(atendimento);

      if (atendimento.UNIDADEATENDIMENTO === UNIDADES_ATENDIMENTO[1]) {
        formData.dataCalibracao = "06/11/2025";
        formData.tipoAudiometro = "AS 60";
      }
    }
    if (formulario) {
      setFormData((prev) => ({ ...prev, ...formulario }));
      // Se já existem dados do formulário, considerar que os resultados foram calculados
      if (formulario.resultadoOD && formulario.resultadoOE) {
        setResultadosCalculados(true);
      }
    }
  }, [atendimento, formulario]);

  // Handler ultra-simples para inputs
  const handleInputChange = useCallback(
    (field: keyof AudiometriaData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Marcar que os resultados precisam ser recalculados
      if (field.startsWith("viaAerea") || field.startsWith("viaOssea")) {
        setResultadosCalculados(false);
      }
    },
    [],
  );

  // Handler para campos de decibéis
  const handleDecibelInputChange = useCallback(
    (field: keyof AudiometriaData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setResultadosCalculados(false);
    },
    [],
  );

  // Handler para campos booleanos (checkbox) - AGORA PARA MASCARAMENTO
  const handleBooleanChange = useCallback(
    (field: keyof AudiometriaData, value: boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleCheckboxChange = useCallback(
    (field: keyof AudiometriaData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );


const verAudiometriaAnterior = useCallback(async () => {
  try {
    // ATUALIZAÇÃO 3: Requisição para o backend buscar audiometria anterior
    const empresa = atendimento?.CODIGOEMPRESA;
    const cpf = atendimento?.CPFFUNCIONARIO;

    // Verificar se temos os dados necessários
    if (!empresa || !cpf) {
      alert('Dados insuficientes para buscar audiometria anterior. Verifique se o paciente e empresa estão cadastrados.');
      return;
    }

    // Construir URL com query parameters
    const url = new URL(NEST_SOC_AUDIOMETRIA_ANTERIOR);
    url.searchParams.append('empresa', empresa);
    url.searchParams.append('cpf', cpf);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();

      // Verificar se a resposta contém uma URL válida
      if (data && data.url && typeof data.url === 'string') {
        // Abrir a URL do PDF em uma nova aba
        window.open(`${NEST_URL}${data.url}`, '_blank', 'noopener,noreferrer');
        
      } else {
        console.warn('Resposta da API não contém URL válida:', data);
        alert('Audiometria anterior encontrada, mas não foi possível abrir o PDF.');
      }
    } else if (response.status === 400) {
      alert('Não foi encontrada audiometria anterior para este paciente.');
    } else {
      const errorText = await response.text();
      console.error('Erro na resposta:', response.status, errorText);
      alert(`Erro ao buscar audiometria anterior: ${response.status}`);
    }
  } catch (error) {
    console.error('Erro ao buscar audiometria anterior:', error);
  }
}, [atendimento]);

  // Função para calcular resultados com validação
  const calcularResultados = useCallback(async () => {
    // ATUALIZAÇÃO 2: Validar se todos os campos estão preenchidos
    const camposPreenchidos = validarCamposTabela(formData);
    
    if (!camposPreenchidos) {
      alert('Por favor, preencha todos os campos da tabela de audiometria antes de calcular os resultados.');
      return;
    }

    setIsCalculating(true);

    // Simular um pequeno delay para feedback visual
    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      const updates = AudiometriaCalculator.calcularTodosResultados(formData);

      setFormData((prev) => ({ ...prev, ...updates }));
      setResultadosCalculados(true);
    } catch (error) {
      console.error("Erro ao calcular resultados:", error);
      alert('Erro ao calcular resultados. Verifique os valores inseridos.');
    } finally {
      setIsCalculating(false);
    }
  }, [formData]);

  const handleSave = useCallback(async () => {
    // ATUALIZAÇÃO 2: Verificar se os resultados foram calculados antes de permitir salvar
    if (!resultadosCalculados) {
      alert("É necessário calcular os resultados antes de finalizar o exame.");
      return;
    }

    setIsLoading(true);
    try {
      onSave?.(formData);
    } finally {
      setIsLoading(false);
    }
  }, [formData, onSave, resultadosCalculados]);

  // Componente de checkbox Sim/Não reutilizável
  const SimNaoCheckbox = useCallback(
    ({ field, label }: { field: keyof AudiometriaData; label: string }) => (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <div className="flex gap-4">
          {OPCOES_SIM_NAO.map((option) => (
            <Checkbox
              key={option}
              classNames={{ label: "text-sm text-gray-700" }}
              color="success"
              isSelected={formData[field] === option}
              onValueChange={(checked) =>
                checked && handleCheckboxChange(field, option)
              }
            >
              {option}
            </Checkbox>
          ))}
        </div>
      </div>
    ),
    [formData, handleCheckboxChange],
  );

  // Componente de checkbox para mascaramento
  const MascaramentoCheckbox = useCallback(
    ({
      field,
      className = "",
    }: {
      field: keyof AudiometriaData;
      className?: string;
    }) => (
      <div className={`flex justify-center ${className}`}>
        <Checkbox
          classNames={{
            base: "m-0",
            wrapper: "w-5 h-5",
          }}
          isSelected={formData[field] as boolean}
          onValueChange={(checked) => handleBooleanChange(field, checked)}
        />
      </div>
    ),
    [formData, handleBooleanChange],
  );

  return (
    <div className="space-y-8 p-4 md:p-8 min-h-screen">
      <HeaderExame agendamento={agendamento} exame={exame} />

      {/* 1. Anamnese Auditiva */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle number="1" title="Anamnese Auditiva" />

        <div className="space-y-6">
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              <SimNaoCheckbox
                field="queixaAuditiva"
                label="Queixa ou sintoma auditivo atual?"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Audiometria Anterior?*
                </label>
                <div className="flex gap-4">
                  {OPCOES_SIM_NAO.map((option) => (
                    <Checkbox
                      key={option}
                      classNames={{ label: "text-sm text-gray-700" }}
                      color="success"
                      isSelected={formData.audiometriaAnterior === option}
                      onValueChange={(checked) =>
                        checked &&
                        handleCheckboxChange("audiometriaAnterior", option)
                      }
                    >
                      {option}
                    </Checkbox>
                  ))}
                </div>
                {formData.audiometriaAnterior === "Sim" && (
                  <>
                    <p className="text-xs text-amber-600 mt-1">
                      *Exame Sequencial.
                    </p>
                  </>
                )}
                {formData.audiometriaAnterior === "Não" && (
                  <p className="text-xs text-green-600 mt-1">
                    *Primeiro exame. Este será a Audiometria de Referência (RA).
                  </p>
                )}
              </div>

              <SimNaoCheckbox
                field="infeccaoCirurgiaOuvido"
                label="Infecção ou Cirurgia no Ouvido?"
              />

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tratamento antibióticos e/ou ototóxicos?
                  </label>
                  <div className="flex gap-4 mb-2">
                    {OPCOES_SIM_NAO.map((option) => (
                      <Checkbox
                        key={option}
                        classNames={{ label: "text-gray-700" }}
                        color="success"
                        isSelected={formData.tratamentoOtotoxicos === option}
                        onValueChange={(checked) =>
                          checked &&
                          handleCheckboxChange("tratamentoOtotoxicos", option)
                        }
                      >
                        {option}
                      </Checkbox>
                    ))}
                  </div>
                  {formData.tratamentoOtotoxicos === "Sim" && (
                    <DateInput
                      className="border-gray-300 mt-2"
                      value={formData.dataTratamentoOtotoxicos}
                      onChange={(value) =>
                        handleInputChange("dataTratamentoOtotoxicos", value)
                      }
                    />
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Casos de surdez na família?
                  </label>
                  <div className="flex gap-4 mb-2">
                    {OPCOES_SIM_NAO.map((option) => (
                      <Checkbox
                        key={option}
                        classNames={{ label: "text-gray-700" }}
                        color="success"
                        isSelected={formData.surdezFamilia === option}
                        onValueChange={(checked) =>
                          checked &&
                          handleCheckboxChange("surdezFamilia", option)
                        }
                      >
                        {option}
                    </Checkbox>
                    ))}
                  </div>
                  {formData.surdezFamilia === "Sim" && (
                    <Input
                      className="border-gray-300 mt-2 bg-white"
                      placeholder="Grau de parentesco"
                      value={formData.parentescoSurdez}
                      onChange={(e) =>
                        handleInputChange("parentescoSurdez", e.target.value)
                      }
                    />
                  )}
                </div>
              </div>

              <SimNaoCheckbox
                field="trabalhoAnteriorRuido"
                label="Já trabalhou em ambiente ruidoso?"
              />
              <SimNaoCheckbox
                field="trabalhoAtualRuido"
                label="Trabalha atualmente em ambiente ruidoso?"
              />
              <SimNaoCheckbox
                field="usoProtetorAuricular"
                label="Usa Protetor Auricular?"
              />
              <SimNaoCheckbox
                field="contatoQuimicos"
                label="Contato com produtos químicos ou solventes?"
              />
              <SimNaoCheckbox
                field="habitoSomAlto"
                label="Costuma ouvir música (caixas, fones, etc)?"
              />
              <SimNaoCheckbox
                field="exposicaoExplosoes"
                label="Já teve contato com explosões?"
              />
              <SimNaoCheckbox
                field="traumaCabecaOuvido"
                label="Trauma na Cabeça ou Ouvido?"
              />
              <SimNaoCheckbox
                field="labirintiteTontura"
                label="Labirintite ou Tontura?"
              />

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Uso de Medicamentos Atuais?
                </label>
                <div className="flex gap-4 mb-2">
                  {OPCOES_SIM_NAO.map((option) => (
                    <Checkbox
                      key={option}
                      classNames={{ label: "text-gray-700" }}
                      color="success"
                      isSelected={formData.usoMedicamentos === option}
                      onValueChange={(checked) =>
                        checked &&
                        handleCheckboxChange("usoMedicamentos", option)
                      }
                    >
                      {option}
                    </Checkbox>
                  ))}
                </div>
                {formData.usoMedicamentos === "Sim" && (
                  <Input
                    className="border-gray-300 mt-2 bg-white"
                    placeholder="Quais medicamentos?"
                    value={formData.quaisMedicamentos}
                    onChange={(e) =>
                      handleInputChange("quaisMedicamentos", e.target.value)
                    }
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
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">
              Dados Técnicos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data da Calibração*
                </label>
                <DateInput
                  className="border-gray-300"
                  value={formData.dataCalibracao}
                  onChange={(value) =>
                    handleInputChange("dataCalibracao", value)
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formato: dd/mm/aaaa
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Audiômetro
                </label>
                <Select
                  classNames={{ trigger: "bg-white border-gray-300" }}
                  selectedKeys={[formData.tipoAudiometro]}
                  variant="bordered"
                  onChange={(e) =>
                    handleInputChange("tipoAudiometro", e.target.value)
                  }
                >
                  <SelectItem key="AVS 500">AVS 500</SelectItem>
                  <SelectItem key="AS 60">AS 60</SelectItem>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Repouso Auditivo ≥14h?*
                </label>
                <div className="flex gap-6">
                  <Checkbox
                    classNames={{ label: "text-gray-700" }}
                    color="success"
                    isSelected={formData.repousoAuditivo === "Sim"}
                    onValueChange={(checked) =>
                      handleInputChange(
                        "repousoAuditivo",
                        checked ? "Sim" : "Não",
                      )
                    }
                  >
                    Sim
                  </Checkbox>
                  <Checkbox
                    classNames={{ label: "text-gray-700" }}
                    isSelected={formData.repousoAuditivo === "Não"}
                    onValueChange={(checked) =>
                      handleInputChange(
                        "repousoAuditivo",
                        checked ? "Não" : "Sim",
                      )
                    }
                  >
                    Não
                  </Checkbox>
                  {formData.repousoAuditivo === "Sim" && (
                    <Input
                      className="border-gray-300 mt-2 bg-white"
                      min="14"
                      placeholder="Horas de repouso"
                      type="number"
                      value={formData.horasRepouso.toString()}
                      onChange={(e) =>
                        handleInputChange(
                          "horasRepouso",
                          parseInt(e.target.value) || 0,
                        )
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Meatoscopia */}
          <div className="p-4">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">
              Meatoscopia
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OD
                </label>
                <Select
                  classNames={{ trigger: "bg-white border-gray-300" }}
                  selectedKeys={[formData.meatoscopiaOD]}
                  variant="bordered"
                  onChange={(e) =>
                    handleInputChange("meatoscopiaOD", e.target.value)
                  }
                >
                  <SelectItem key="SEM_OBSTRUCAO">Sem obstrução</SelectItem>
                  <SelectItem key="COM_OBSTRUCAO_PARCIAL">
                    Obstrução parcial
                  </SelectItem>
                  <SelectItem key="COM_OBSTRUCAO_TOTAL">
                    Obstrução total
                  </SelectItem>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OE
                </label>
                <Select
                  classNames={{ trigger: "bg-white border-gray-300" }}
                  selectedKeys={[formData.meatoscopiaOE]}
                  variant="bordered"
                  onChange={(e) =>
                    handleInputChange("meatoscopiaOE", e.target.value)
                  }
                >
                  <SelectItem key="SEM_OBSTRUCAO">Sem obstrução</SelectItem>
                  <SelectItem key="COM_OBSTRUCAO_PARCIAL">
                    Obstrução parcial
                  </SelectItem>
                  <SelectItem key="COM_OBSTRUCAO_TOTAL">
                    Obstrução total
                  </SelectItem>
                </Select>
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações da Meatoscopia
                </label>
                <Input
                  className="border-gray-300 bg-white"
                  placeholder="-"
                  value={formData.observacoesMeatoscopia}
                  onChange={(e) =>
                    handleInputChange("observacoesMeatoscopia", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Limiares Auditivos - MÁXIMA PERFORMANCE */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle
          number="3"
          title="Audiometria Tonal (Limiares Auditivos)"
        />

        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <p className="mb-1">
              {resultadosCalculados
                ? "✅ Resultados calculados"
                : '⚠️ Preencha todos os campos da tabela antes de calcular'}
            </p>
            <p className="text-xs text-amber-600">
              💡 Todos os campos são obrigatórios para cálculo dos resultados.
            </p>
          </div>
          <div className="flex gap-2">
            {/* ATUALIZAÇÃO 3: Botão para ver audiometria anterior ao lado do calcular */}
            {formData.audiometriaAnterior === "Sim" && (
              <Button
                className="bg-blue-600 text-white"
                isDisabled={carregandoAudiometriaAnterior}
                startContent={
                  carregandoAudiometriaAnterior ? (
                    <Spinner size="sm" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )
                }
                onPress={verAudiometriaAnterior}
              >
                {carregandoAudiometriaAnterior ? 'Buscando...' : 'Ver Anterior'}
              </Button>
            )}
            <Button
              className="bg-green-600 text-white"
              color="primary"
              isDisabled={isCalculating}
              startContent={
                isCalculating ? (
                  <Spinner size="sm" />
                ) : (
                  <Calculator className="h-4 w-4" />
                )
              }
              onPress={calcularResultados}
            >
              {isCalculating ? "Calculando..." : "Calcular Resultados"}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th
                  className="border border-gray-300 p-2 font-semibold"
                  rowSpan={2}
                >
                  Orelha
                </th>
                <th
                  className="border border-gray-300 p-2 font-semibold"
                  rowSpan={2}
                >
                  Tipo
                </th>
                <th
                  className="border border-gray-300 p-2 font-semibold text-center"
                  colSpan={FREQUENCIAS.length}
                >
                  Frequências (Hz)
                </th>
              </tr>
              <tr className="bg-gray-50">
                {FREQUENCIAS.map((freq) => (
                  <th
                    key={freq.label}
                    className="border border-gray-300 p-1 font-medium text-xs text-center"
                  >
                    {freq.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* OD - Via Aérea */}
              <tr className="bg-white">
                <td
                  className="border border-gray-300 p-1 text-center font-medium text-red-700 bg-red-50 text-xs"
                  rowSpan={4}
                >
                  OD
                </td>
                <td className="border border-gray-300 p-1 text-center font-medium text-xs bg-red-50">
                  VA
                </td>
                {FREQUENCIAS.map((freq) => (
                  <td
                    key={`va-od-${freq.label}`}
                    className="border border-gray-300 p-1"
                  >
                    <DecibelInput
                      placeholder=""
                      value={
                        formData[
                          freq.fieldVAOD as keyof AudiometriaData
                        ] as string
                      }
                      onChange={(value) =>
                        handleDecibelInputChange(
                          freq.fieldVAOD as keyof AudiometriaData,
                          value,
                        )
                      }
                    />
                  </td>
                ))}
              </tr>

              {/* OD - Mascaramento Via Aérea */}
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-1 text-center font-medium text-xs bg-red-50">
                  Masc VA
                </td>
                {FREQUENCIAS.map((freq) => (
                  <td
                    key={`masc-va-od-${freq.label}`}
                    className="border border-gray-300 p-1"
                  >
                    <MascaramentoCheckbox
                      field={freq.fieldMascVAOD as keyof AudiometriaData}
                    />
                  </td>
                ))}
              </tr>

              {/* OD - Via Óssea */}
              <tr className="bg-white">
                <td className="border border-gray-300 p-1 text-center font-medium text-xs bg-red-50">
                  VO
                </td>
                {FREQUENCIAS.map((freq) => (
                  <td
                    key={`vo-od-${freq.label}`}
                    className="border border-gray-300 p-1"
                  >
                    {freq.fieldVOOD ? (
                      <DecibelInput
                        placeholder=""
                        value={
                          formData[
                            freq.fieldVOOD as keyof AudiometriaData
                          ] as string
                        }
                        onChange={(value) =>
                          handleDecibelInputChange(
                            freq.fieldVOOD as keyof AudiometriaData,
                            value,
                          )
                        }
                      />
                    ) : (
                      <div className="text-center text-gray-400 py-2 text-xs">
                        -
                      </div>
                    )}
                  </td>
                ))}
              </tr>

              {/* OD - Mascaramento Via Óssea */}
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-1 text-center font-medium text-xs bg-red-50">
                  Masc VO
                </td>
                {FREQUENCIAS.map((freq) => (
                  <td
                    key={`masc-vo-od-${freq.label}`}
                    className="border border-gray-300 p-1"
                  >
                    {freq.fieldMascVOOD ? (
                      <MascaramentoCheckbox
                        field={freq.fieldMascVOOD as keyof AudiometriaData}
                      />
                    ) : (
                      <div className="text-center text-gray-400 py-2 text-xs">
                        -
                      </div>
                    )}
                  </td>
                ))}
              </tr>

              {/* OE - Via Aérea */}
              <tr className="bg-white">
                <td
                  className="border border-gray-300 p-1 text-center font-medium text-blue-700 bg-blue-50 text-xs"
                  rowSpan={4}
                >
                  OE
                </td>
                <td className="border border-gray-300 p-1 text-center font-medium text-xs bg-blue-50">
                  VA
                </td>
                {FREQUENCIAS.map((freq) => (
                  <td
                    key={`va-oe-${freq.label}`}
                    className="border border-gray-300 p-1"
                  >
                    <DecibelInput
                      placeholder=""
                      value={
                        formData[
                          freq.fieldVAOE as keyof AudiometriaData
                        ] as string
                      }
                      onChange={(value) =>
                        handleDecibelInputChange(
                          freq.fieldVAOE as keyof AudiometriaData,
                          value,
                        )
                      }
                    />
                  </td>
                ))}
              </tr>

              {/* OE - Mascaramento Via Aérea */}
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-1 text-center font-medium text-xs bg-blue-50">
                  Masc VA
                </td>
                {FREQUENCIAS.map((freq) => (
                  <td
                    key={`masc-va-oe-${freq.label}`}
                    className="border border-gray-300 p-1"
                  >
                    <MascaramentoCheckbox
                      field={freq.fieldMascVAOE as keyof AudiometriaData}
                    />
                  </td>
                ))}
              </tr>

              {/* OE - Via Óssea */}
              <tr className="bg-white">
                <td className="border border-gray-300 p-1 text-center font-medium text-xs bg-blue-50">
                  VO
                </td>
                {FREQUENCIAS.map((freq) => (
                  <td
                    key={`vo-oe-${freq.label}`}
                    className="border border-gray-300 p-1"
                  >
                    {freq.fieldVOOE ? (
                      <DecibelInput
                        placeholder=""
                        value={
                          formData[
                            freq.fieldVOOE as keyof AudiometriaData
                          ] as string
                        }
                        onChange={(value) =>
                          handleDecibelInputChange(
                            freq.fieldVOOE as keyof AudiometriaData,
                            value,
                          )
                        }
                      />
                    ) : (
                      <div className="text-center text-gray-400 py-2 text-xs">
                        -
                      </div>
                    )}
                  </td>
                ))}
              </tr>

              {/* OE - Mascaramento Via Óssea */}
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-1 text-center font-medium text-xs bg-blue-50">
                  Masc VO
                </td>
                {FREQUENCIAS.map((freq) => (
                  <td
                    key={`masc-vo-oe-${freq.label}`}
                    className="border border-gray-300 p-1"
                  >
                    {freq.fieldMascVOOE ? (
                      <MascaramentoCheckbox
                        field={freq.fieldMascVOOE as keyof AudiometriaData}
                      />
                    ) : (
                      <div className="text-center text-gray-400 py-2 text-xs">
                        -
                      </div>
                    )}
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
                <h3 className="font-bold text-red-800 mb-4 text-center">
                  OD - Ouvido Direito
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-red-700 mb-1">
                      Classificação (Grau Lloyd & Kaplan)
                    </label>
                    <div
                      className={`text-center font-bold text-sm p-2 rounded ${
                        formData.classificacaoOD.includes("normalidade") ||
                        formData.classificacaoOD === "-"
                          ? "bg-green-100 text-green-800"
                          : formData.classificacaoOD.includes("Leve")
                            ? "bg-amber-100 text-amber-800"
                            : formData.classificacaoOD.includes("Moderada")
                              ? "bg-orange-100 text-orange-800"
                              : "bg-red-100 text-red-800"
                      }`}
                    >
                      {formData.classificacaoOD === "-"
                        ? "Dentro dos padrões da normalidade"
                        : formData.classificacaoOD}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-semibold text-red-700">
                        Média Tonal (4f)
                      </div>
                      <div className="font-bold text-gray-800">
                        {formData.mediaTonalOD} dB
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-red-700">
                        Tipo de Perda
                      </div>
                      <div className="font-bold text-gray-800">
                        {formData.tipoPerdaOD}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-red-700">
                        Configuração
                      </div>
                      <div className="font-bold text-gray-800">
                        {formData.configuracaoOD}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Frequências Alteradas:{" "}
                    <span className="font-semibold">
                      {formData.frequenciasAlteradasOD || "Nenhuma"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Resultado OE */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-bold text-blue-800 mb-4 text-center">
                  OE - Ouvido Esquerdo
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-blue-700 mb-1">
                      Classificação (Grau Lloyd & Kaplan)
                    </label>
                    <div
                      className={`text-center font-bold text-sm p-2 rounded ${
                        formData.classificacaoOE.includes("normalidade") ||
                        formData.classificacaoOE === "-"
                          ? "bg-green-100 text-green-800"
                          : formData.classificacaoOE.includes("Leve")
                            ? "bg-amber-100 text-amber-800"
                            : formData.classificacaoOE.includes("Moderada")
                              ? "bg-orange-100 text-orange-800"
                              : "bg-red-100 text-red-800"
                      }`}
                    >
                      {formData.classificacaoOE === "-"
                        ? "Dentro dos padrões da normalidade"
                        : formData.classificacaoOE}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-semibold text-blue-700">
                        Média Tonal (4f)
                      </div>
                      <div className="font-bold text-gray-800">
                        {formData.mediaTonalOE} dB
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-blue-700">
                        Tipo de Perda
                      </div>
                      <div className="font-bold text-gray-800">
                        {formData.tipoPerdaOE}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-blue-700">
                        Configuração
                      </div>
                      <div className="font-bold text-gray-800">
                        {formData.configuracaoOE}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Frequências Alteradas:{" "}
                    <span className="font-semibold">
                      {formData.frequenciasAlteradasOE || "Nenhuma"}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Conclusão Geral */}
            <div className="p-4">
              <div className="mb-6 p-3 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sugestão de enquadramento PCD
                </label>
                <Textarea
                  isReadOnly
                  className={`text-sm font-semibold ${formData.criterioPCD.includes("POSSIBILIDADE") ? "text-green-700 border-green-300" : "text-gray-700 border-gray-300"}`}
                  rows={2}
                  value={formData.criterioPCD}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm text-center font-medium text-red-700 mb-2">
                    Ouvido Direito
                  </label>
                  <Textarea
                    required
                    className="bg-white border-red-300 text-sm"
                    rows={4}
                    value={formData.resultadoOD}
                    onChange={(e) =>
                      handleInputChange("resultadoOD", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-center font-medium text-blue-700 mb-2">
                    Ouvido Esquerdo
                  </label>
                  <Textarea
                    required
                    className="bg-white border-blue-300 text-sm"
                    rows={4}
                    value={formData.resultadoOE}
                    onChange={(e) =>
                      handleInputChange("resultadoOE", e.target.value)
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações do avaliador
                </label>
                <Textarea
                  className="bg-white border-gray-300"
                  placeholder="Ex: orientado quanto ao uso contínuo do protetor auricular..."
                  rows={3}
                  value={formData.observacoes}
                  onChange={(e) =>
                    handleInputChange("observacoes", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 bg-white p-4 rounded-lg">
        <Button
          className="px-8 border border-gray-300 text-gray-700 hover:bg-gray-50"
          isDisabled={isLoading}
          variant="flat"
          onPress={onClose}
        >
          Cancelar
        </Button>
        <Button
          className="px-8 bg-gray-800 text-white shadow-sm hover:bg-gray-700 transition-colors"
          color="primary"
          onPress={handleSave}
          startContent={isLoading ? <Spinner size="sm" /> : <FileText className="h-4 w-4" />}
          // ATUALIZAÇÃO 2: Desabilitar o botão se os resultados não foram calculados
          isDisabled={!formData.resultadoOD || !formData.resultadoOE || isLoading || !resultadosCalculados}
        >
          {isLoading ? "Salvando..." : "Concluir exame"}
        </Button>
      </div>
    </div>
  );
};

export default React.memo(AudiometriaOcupacional);