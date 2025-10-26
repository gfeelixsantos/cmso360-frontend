import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Input, Select, SelectItem, Textarea, RadioGroup, Radio, Spinner } from "@heroui/react";
import { useUser } from '@/hooks/useUser';
import { Scheduling } from '@/lib/scheduling/interface/scheduling';
import { User, Eye, Palette, Gauge, FileText, Plus, Minus, AlertTriangle } from 'lucide-react';

interface AcuidadeVisualProps {
  atendimento: any;
  exame: string;
  formulario: any;
  onSave?: (data: any) => void;
  onClose?: () => void;
}

interface AcuidadeVisualData {
  // Dados do exame
  exameComLenteCorretiva: string;
  profissional: string;
  
  // Acuidade Visual - Longe
  longeOD: string;
  longeOE: string;
  longeBinocular: string;
  
  // Acuidade Visual - Perto
  pertoOD: string;
  pertoOE: string;
  pertoBinocular: string;
  
  // Teste de Ishihara
  ishiharaPlaca1: string;
  ishiharaResultado1: string;
  ishiharaPlaca2: string;
  ishiharaResultado2: string;
  ishiharaPlaca3: string;
  ishiharaResultado3: string;
  ishiharaPlaca4: string;
  ishiharaResultado4: string;
  ishiharaPlaca5: string;
  ishiharaResultado5: string;
  ishiharaPlaca6: string;
  ishiharaResultado6: string;
  ishiharaPlaca7: string;
  ishiharaResultado7: string;
  ishiharaPlaca8: string;
  ishiharaResultado8: string;
  ishiharaPlaca9: string;
  ishiharaResultado9: string;
  ishiharaPlaca10: string;
  ishiharaResultado10: string;
  
  // Conclusão Ishihara
  conclusaoIshihara: string;
  
  // Teste de Estereopsia
  estereopsiaResultado: string;
  estereopsiaObservacao: string;
  
  // Conclusão Geral
  resultado: string;
  observacoesFinais: string;
}

interface ResultadoInvestigacao {
  sugereInvestigacao: boolean;
  criterio: string;
  detalhes: string;
}

const AcuidadeVisual: React.FC<AcuidadeVisualProps> = ({ 
  atendimento, 
  exame,
  formulario,
  onSave, 
  onClose 
}) => {
  const user = useUser();
  const [agendamento, setAgendamento] = useState<Scheduling>();
  const [showIshihara, setShowIshihara] = useState(false);
  const [showEstereopsia, setShowEstereopsia] = useState(false);
  const [resultadoInvestigacao, setResultadoInvestigacao] = useState<ResultadoInvestigacao>({
    sugereInvestigacao: false,
    criterio: '',
    detalhes: ''
  });
  
  const [formData, setFormData] = useState<AcuidadeVisualData>({
    // Dados do exame
    exameComLenteCorretiva: 'Não',
    profissional: '',
    
    // Acuidade Visual
    longeOD: '', longeOE: '', longeBinocular: '',
    pertoOD: '', pertoOE: '', pertoBinocular: '',
    
    // Teste de Ishihara
    ishiharaPlaca1: '', ishiharaResultado1: 'Normal',
    ishiharaPlaca2: '', ishiharaResultado2: 'Normal',
    ishiharaPlaca3: '', ishiharaResultado3: 'Normal',
    ishiharaPlaca4: '', ishiharaResultado4: 'Normal',
    ishiharaPlaca5: '', ishiharaResultado5: 'Normal',
    ishiharaPlaca6: '', ishiharaResultado6: 'Normal',
    ishiharaPlaca7: '', ishiharaResultado7: 'Normal',
    ishiharaPlaca8: '', ishiharaResultado8: 'Normal',
    ishiharaPlaca9: '', ishiharaResultado9: 'Normal',
    ishiharaPlaca10: '', ishiharaResultado10: 'Normal',
    
    conclusaoIshihara: 'Visão normal para cores',
    
    // Teste de Estereopsia
    estereopsiaResultado: '',
    estereopsiaObservacao: '',
    
    // Conclusão Geral
    resultado: 'Visão Normal',
    observacoesFinais: ''
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

  // Preencher profissional responsável automaticamente
  useEffect(() => {
    if (user?.nome && !formData.profissional) {
      setFormData(prev => ({ 
        ...prev, 
        profissional: user.nome 
      }));
    }
  }, [user, formData.profissional]);

  // Calcular resultado automático da acuidade visual baseado na NR-7 e tabela de Snellen (Lloyd & Kaplan)
  // e verificar se sugere investigação oftalmológica para PCD
  useEffect(() => {
    
    // Função para converter valores de acuidade para análise numérica (retorna o DENOMINADOR 'X' de 20/X)
    // Valores maiores representam pior acuidade. Retorna 0 se não for reconhecido.
    const parseAcuidade = (valor: string): number => {
      if (!valor) return 0;
      
      const limpo = valor.trim().toLowerCase();
      
      // 1. Converte frações Snellen como "20/20", "20/40", etc.
      const match = limpo.match(/20\/(\d+)/);
      if (match) {
        return parseInt(match[1]);
      }
      
      // 2. Converte notação decimal (0.1, 0.5, 1.0) para 20/X. (1.0 = 20, 0.5 = 40, 0.1 = 200)
      const decimalMatch = limpo.match(/^(\d+\.?\d*)$/);
      if (decimalMatch) {
        const decimalValue = parseFloat(decimalMatch[1]);
        if (decimalValue > 0) {
          // Fórmula: X = 20 / decimal
          const snellenDenominator = Math.round(20 / decimalValue);
          // Limitamos para evitar números excessivamente grandes se decimal for muito pequeno
          return snellenDenominator > 400 ? 400 : snellenDenominator; 
        }
      }
      
      // 3. Converte valores Snellen aproximados (para casos sem barra ou decimais)
      if (limpo.includes('20/20') || limpo.includes('1.0') || limpo.includes('normal')) return 20;
      if (limpo.includes('20/25') || limpo.includes('0.8')) return 25;
      if (limpo.includes('20/30') || limpo.includes('0.6')) return 30; // Usado 0.6 para 20/30 (aprox 0.67)
      if (limpo.includes('20/40') || limpo.includes('0.5')) return 40;
      if (limpo.includes('20/50') || limpo.includes('0.4')) return 50;
      if (limpo.includes('20/70') || limpo.includes('0.3')) return 70;
      if (limpo.includes('20/100') || limpo.includes('0.2')) return 100;
      if (limpo.includes('20/200') || limpo.includes('0.1')) return 200;
      if (limpo.includes('20/400') || limpo.includes('0.05')) return 400;
      
      // 4. Para valores de perto (Jaeger) - conversão APIMPROXIMADA para Snellen
      if (limpo.includes('jaeger 1') || limpo.includes('j1')) return 20;
      if (limpo.includes('jaeger 2') || limpo.includes('j2')) return 25;
      if (limpo.includes('jaeger 3') || limpo.includes('j3')) return 30;
      if (limpo.includes('jaeger 4') || limpo.includes('j4')) return 40;
      if (limpo.includes('jaeger 5') || limpo.includes('j5')) return 50;
      if (limpo.includes('jaeger 6') || limpo.includes('j6')) return 70;
      if (limpo.includes('jaeger 7') || limpo.includes('j7')) return 100;
      
      return 0;
    };
    
    const calcularResultadoSnellen = (): { resultado: string; valores: any } => {
      const { longeOD, longeOE, pertoOD, pertoOE } = formData;
      
      const longeODValue = parseAcuidade(longeOD);
      const longeOEValue = parseAcuidade(longeOE);
      const pertoODValue = parseAcuidade(pertoOD);
      const pertoOEValue = parseAcuidade(pertoOE);

      // Determinar o PIOR valor de acuidade (maior número) entre os dois olhos para longe e perto
      const piorLonge = Math.max(longeODValue, longeOEValue);
      const piorPerto = Math.max(pertoODValue, pertoOEValue);
      
      // Determinar o MELHOR valor de acuidade (menor número) para fins de classificação mais estrita
      // É crucial para o critério PCD.
      const melhorLonge = Math.min(longeODValue, longeOEValue);
      const melhorPerto = Math.min(pertoODValue, pertoOEValue);
      
      // Se um dos olhos não tiver dados, o cálculo se baseia no outro. Se ambos forem 0, assume-se normal (20).
      const finalLongeValue = (melhorLonge === 0 && (longeODValue > 0 || longeOEValue > 0)) ? piorLonge : melhorLonge || 20;
      const finalPertoValue = (melhorPerto === 0 && (pertoODValue > 0 || pertoOEValue > 0)) ? piorPerto : melhorPerto || 20;

      // Classificação (usando o MELHOR OLHO, pois a classificação de deficiência visual é feita pelo melhor olho)
      // Usamos finalLongeValue para classificação (melhor olho), exceto se for 0 e um dos outros for > 0.
      
      // Se a visão é 20/20 ou melhor
      if (finalLongeValue <= 20 && finalPertoValue <= 20) {
        return { 
          resultado: 'Visão Normal',
          valores: { finalLongeValue, finalPertoValue, longeODValue, longeOEValue }
        };
      } 
      // Deficiência Visual Leve (Melhor olho 20/25)
      else if (finalLongeValue <= 25 && finalPertoValue <= 25) {
        return { 
          resultado: 'Deficiência Visual Leve',
          valores: { finalLongeValue, finalPertoValue, longeODValue, longeOEValue }
        };
      } 
      // Deficiência Visual Moderada (Melhor olho até 20/40)
      else if (finalLongeValue <= 40 && finalPertoValue <= 40) {
        return { 
          resultado: 'Deficiência Visual Moderada',
          valores: { finalLongeValue, finalPertoValue, longeODValue, longeOEValue }
        };
      } 
      // Baixa Visão (Limite de Baixa Visão 20/60 no melhor olho)
      else if (finalLongeValue <= 60 && finalPertoValue <= 60) {
        return { 
          resultado: 'Baixa Visão',
          valores: { finalLongeValue, finalPertoValue, longeODValue, longeOEValue }
        };
      } 
      // Deficiência Visual Grave (Melhor olho até 20/100)
      else if (finalLongeValue <= 100 && finalPertoValue <= 100) {
        return { 
          resultado: 'Deficiência Visual Grave',
          valores: { finalLongeValue, finalPertoValue, longeODValue, longeOEValue }
        };
      } 
      // Cegueira Legal (20/400 ou pior no melhor olho)
      else if (finalLongeValue >= 200 || finalPertoValue >= 200) {
        return { 
          resultado: 'Cegueira Legal',
          valores: { finalLongeValue, finalPertoValue, longeODValue, longeOEValue }
        };
      } else {
        return { 
          resultado: 'Visão Normal', // Retorna normal se houver dados não classificados nos demais
          valores: { finalLongeValue, finalPertoValue, longeODValue, longeOEValue }
        };
      }
    };

    // Verificar se sugere investigação oftalmológica para PCD com base na legislação brasileira
    const verificarInvestigacaoOftalmologica = (valores: any): ResultadoInvestigacao => {
      const { longeODValue, longeOEValue } = valores;
      
      // Encontrar o MELHOR olho (menor valor = melhor visão)
      const melhorOlhoLonge = Math.min(longeODValue, longeOEValue);
      
      // O critério legal para Baixa Visão (Deficiência Visual) é acuidade visual entre 0,3 (20/60) 
      // e 0,05 (20/400) no melhor olho, com a melhor correção óptica.
      // Se melhorOlhoLonge for 0 (ausência de dados), não sugere a investigação.
      
      // Ponto de corte: 20/60 ou pior (valor >= 60) no melhor olho
      if (melhorOlhoLonge >= 60 && melhorOlhoLonge > 0) {
        
        // Determinar o valor mais próximo de 20/X para o melhor olho
        let acuidadeMelhorOlho = "";
        if (melhorOlhoLonge <= 60) acuidadeMelhorOlho = "20/60";
        else if (melhorOlhoLonge <= 70) acuidadeMelhorOlho = "20/70";
        else if (melhorOlhoLonge <= 100) acuidadeMelhorOlho = "20/100";
        else if (melhorOlhoLonge <= 200) acuidadeMelhorOlho = "20/200";
        else acuidadeMelhorOlho = "20/400 ou pior";
        
        // Identificar qual é o melhor olho para exibir no detalhe
        const olhoP = longeODValue < longeOEValue ? 'OD' : longeOEValue < longeODValue ? 'OE' : 'OD/OE';
        
        return {
          sugereInvestigacao: true,
          criterio: `Acuidade visual no melhor olho (${olhoP}) é de ${acuidadeMelhorOlho} ou pior.`,
          detalhes: `Critério Legal (Decreto/LBI): Baixa Visão é acuidade entre 20/60 (0,3) e 20/400 (0,05) no melhor olho, com a melhor correção óptica. O candidato se enquadra no limiar de Baixa Visão (20/60).`
        };
      }
      
      // Critério adicional: Visão monocular (não analisada por acuidade, mas importante considerar na anamnese)
      // A Lei 14.126/21 classifica a visão monocular como deficiência visual.
      // A acuidade em um olho é normal/boa e no outro é 20/200 ou pior.
      const acuidadePiorOlho = Math.max(longeODValue, longeOEValue);
      if (melhorOlhoLonge <= 25 && acuidadePiorOlho >= 200 && longeODValue > 0 && longeOEValue > 0) {
           return {
              sugereInvestigacao: true,
              criterio: `Suspeita de Visão Monocular (Melhor olho normal/perto do normal e pior olho 20/200 ou pior).`,
              detalhes: `Lei 14.126/21 classifica visão monocular como Deficiência Visual (PCD).`
           };
      }
      
      // Casos que NÃO sugerem investigação imediata para PCD
      return {
        sugereInvestigacao: false,
        criterio: '',
        detalhes: ''
      };
    };

    // Só calcula automaticamente se o usuário não tiver definido manualmente
    // e se há dados de acuidade preenchidos
    if (formData.longeOD || formData.longeOE || formData.pertoOD || formData.pertoOE) {
      const { resultado: resultadoCalculado, valores } = calcularResultadoSnellen();
      const investigacao = verificarInvestigacaoOftalmologica(valores);
      
      setResultadoInvestigacao(investigacao);
      
      // Atualiza o resultado apenas se houver uma mudança no resultado calculado ou se o resultado anterior era vazio
      if (resultadoCalculado !== formData.resultado || !formData.resultado) {
        setFormData(prev => ({ 
          ...prev, 
          resultado: resultadoCalculado 
        }));
      }
    }
  }, [formData.longeOD, formData.longeOE, formData.pertoOD, formData.pertoOE, formData.resultado]);

  const handleInputChange = useCallback((field: keyof AcuidadeVisualData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  // Configuração das placas do teste de Ishihara
  const placasIshihara = [
    { number: 1, fieldPlaca: 'ishiharaPlaca1', fieldResultado: 'ishiharaResultado1' },
    { number: 2, fieldPlaca: 'ishiharaPlaca2', fieldResultado: 'ishiharaResultado2' },
    { number: 3, fieldPlaca: 'ishiharaPlaca3', fieldResultado: 'ishiharaResultado3' },
    { number: 4, fieldPlaca: 'ishiharaPlaca4', fieldResultado: 'ishiharaResultado4' },
    { number: 5, fieldPlaca: 'ishiharaPlaca5', fieldResultado: 'ishiharaResultado5' },
    { number: 6, fieldPlaca: 'ishiharaPlaca6', fieldResultado: 'ishiharaResultado6' },
    { number: 7, fieldPlaca: 'ishiharaPlaca7', fieldResultado: 'ishiharaResultado7' },
    { number: 8, fieldPlaca: 'ishiharaPlaca8', fieldResultado: 'ishiharaResultado8' },
    { number: 9, fieldPlaca: 'ishiharaPlaca9', fieldResultado: 'ishiharaResultado9' },
    { number: 10, fieldPlaca: 'ishiharaPlaca10', fieldResultado: 'ishiharaResultado10' }
  ];

  // Opções de resultado baseadas na tabela de Snellen
  const opcoesResultado = [
    'Visão Normal',
    'Deficiência Visual Leve',
    'Deficiência Visual Moderada',
    'Baixa Visão',
    'Deficiência Visual Grave',
    'Cegueira Legal'
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 bg-gray-50 min-h-screen">
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

      {/* 2. Acuidade Visual */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle 
          number="2" 
          title="Acuidade Visual" 
          icon={<Eye className="h-5 w-5 text-gray-600" />}
        />
        
        <div className="space-y-6">
          {/* Exame com lente corretiva */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Exame com lente corretiva?
            </label>
            <RadioGroup
              value={formData.exameComLenteCorretiva}
              onValueChange={(value) => handleInputChange('exameComLenteCorretiva', value)}
              orientation="horizontal"
              classNames={{ wrapper: "gap-6" }}
            >
              <Radio value="Sim" classNames={{ label: "text-gray-700" }}>Sim</Radio>
              <Radio value="Não" classNames={{ label: "text-gray-700" }}>Não</Radio>
            </RadioGroup>
          </div>

          {/* Tabela de Acuidade Visual */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Resultados da Acuidade Visual</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Distância</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">Olho Direito (OD)</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">Olho Esquerdo (OE)</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">Binocular</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-3 font-medium text-gray-700">Para longe</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <Input
                        value={formData.longeOD}
                        onChange={(e) => handleInputChange('longeOD', e.target.value)}
                        placeholder="Ex: 20/20 ou 1.0"
                        className="border-gray-300 text-center bg-white"
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <Input
                        value={formData.longeOE}
                        onChange={(e) => handleInputChange('longeOE', e.target.value)}
                        placeholder="Ex: 20/25 ou 0.8"
                        className="border-gray-300 text-center bg-white"
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <Input
                        value={formData.longeBinocular}
                        onChange={(e) => handleInputChange('longeBinocular', e.target.value)}
                        placeholder="Ex: 20/20"
                        className="border-gray-300 text-center bg-white"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-3 font-medium text-gray-700">Para perto</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <Input
                        value={formData.pertoOD}
                        onChange={(e) => handleInputChange('pertoOD', e.target.value)}
                        placeholder="Ex: Jaeger 1 ou 20/20"
                        className="border-gray-300 text-center bg-white"
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <Input
                        value={formData.pertoOE}
                        onChange={(e) => handleInputChange('pertoOE', e.target.value)}
                        placeholder="Ex: Jaeger 1 ou 20/25"
                        className="border-gray-300 text-center bg-white"
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <Input
                        value={formData.pertoBinocular}
                        onChange={(e) => handleInputChange('pertoBinocular', e.target.value)}
                        placeholder="Ex: Jaeger 1"
                        className="border-gray-300 text-center bg-white"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Teste de Ishihara (Opcional) */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <SectionTitle 
            number="3" 
            title="Teste de Ishihara (Colorimetria)" 
            icon={<Palette className="h-5 w-5 text-gray-600" />}
          />
          <Button
            variant="flat"
            onPress={() => setShowIshihara(!showIshihara)}
            className="flex items-center gap-2"
            startContent={showIshihara ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          >
            {showIshihara ? 'Ocultar' : 'Mostrar'}
          </Button>
        </div>
        
        {showIshihara && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-4">
                Identificação de deficiência de visão de cores. O resultado abaixo indica o número identificado pelo examinado em cada placa.
              </p>
              
              {/* Tabela de Placas */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">Placa</th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">Número identificado</th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {placasIshihara.map((placa) => (
                      <tr key={placa.number}>
                        <td className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-700">
                          {placa.number}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <Input
                            value={formData[placa.fieldPlaca as keyof AcuidadeVisualData] as string}
                            onChange={(e) => handleInputChange(placa.fieldPlaca as keyof AcuidadeVisualData, e.target.value)}
                            placeholder={`Ex: ${placa.number === 1 ? '12' : placa.number === 3 ? '29' : placa.number === 7 ? '74' : '5'}`}
                            className="border-gray-300 text-center bg-white"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <Select
                            selectedKeys={[formData[placa.fieldResultado as keyof AcuidadeVisualData] as string]}
                            onChange={(e) => handleInputChange(placa.fieldResultado as keyof AcuidadeVisualData, e.target.value)}
                            className="w-full"
                            classNames={{
                              trigger: "bg-white border-gray-300"
                            }}
                          >
                            <SelectItem key="Normal">Normal</SelectItem>
                            <SelectItem key="Daltonismo parcial">Daltonismo parcial</SelectItem>
                            <SelectItem key="Daltonismo total">Daltonismo total</SelectItem>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Conclusão do Teste */}
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Conclusão do teste
                </label>
                <Select
                  selectedKeys={[formData.conclusaoIshihara]}
                  onChange={(e) => handleInputChange('conclusaoIshihara', e.target.value)}
                  className="w-full"
                  classNames={{
                    trigger: "bg-white border-gray-300"
                  }}
                >
                  <SelectItem key="Visão normal para cores">Visão normal para cores</SelectItem>
                  <SelectItem key="Daltonismo parcial (verde/vermelho)">Daltonismo parcial (verde/vermelho)</SelectItem>
                  <SelectItem key="Daltonismo total">Daltonismo total</SelectItem>
                </Select>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* 4. Teste de Estereopsia (Opcional) */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <SectionTitle 
            number="4" 
            title="Teste de Estereopsia (Profundidade)" 
            icon={<Gauge className="h-5 w-5 text-gray-600" />}
          />
          <Button
            variant="flat"
            onPress={() => setShowEstereopsia(!showEstereopsia)}
            className="flex items-center gap-2"
            startContent={showEstereopsia ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          >
            {showEstereopsia ? 'Ocultar' : 'Mostrar'}
          </Button>
        </div>
        
        {showEstereopsia && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-4">
                Aplicável principalmente a motoristas e operadores de máquinas.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Resultado:
                  </label>
                  <Select
                    selectedKeys={[formData.estereopsiaResultado]}
                    onChange={(e) => handleInputChange('estereopsiaResultado', e.target.value)}
                    className="w-full"
                    classNames={{
                      trigger: "bg-white border-gray-300"
                    }}
                  >
                    <SelectItem key="Normal">Normal</SelectItem>
                    <SelectItem key="Alterado">Alterado</SelectItem>
                    <SelectItem key="Não aplicável">Não aplicável</SelectItem>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Observação
                  </label>
                  <Textarea
                    value={formData.estereopsiaObservacao}
                    onChange={(e) => handleInputChange('estereopsiaObservacao', e.target.value)}
                    rows={2}
                    placeholder="Ex: leve dificuldade em percepção de profundidade..."
                    className="border-gray-300 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* 5. Conclusão Geral */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle 
          number="5" 
          title="Conclusão Geral" 
          icon={<FileText className="h-5 w-5 text-gray-600" />}
        />
        
        <div className="space-y-6">
          {/* Alerta para investigação oftalmológica */}
          {resultadoInvestigacao.sugereInvestigacao && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-yellow-800 text-sm mb-1">
                    Investigação Oftalmológica Recomendada para PCD
                  </h3>
                  <p className="text-yellow-700 text-sm mb-2">
                    <strong>Critério atendido:</strong> {resultadoInvestigacao.criterio}
                  </p>
                  <p className="text-yellow-700 text-sm">
                    <strong>Base legal:</strong> {resultadoInvestigacao.detalhes}
                  </p>
                  <p className="text-yellow-700 text-sm mt-1">
                    Recomenda-se avaliação com oftalmologista para confirmação diagnóstica e 
                    eventual inclusão na cota PCD conforme Lei 8.213/91.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Resultado
                </label>
                <Select
                  disabled={true}
                  selectedKeys={[formData.resultado]}
                  onChange={(e) => handleInputChange('resultado', e.target.value)}
                  className="w-full"
                  classNames={{
                    trigger: "bg-white border-gray-300"
                  }}
                >
                  {opcoesResultado.map((opcao) => (
                    <SelectItem key={opcao}>
                      {opcao}
                    </SelectItem>
                  ))}
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Classificação baseada em triagem Snellen/NR-7. **Apto/Inapto deve ser definido pelo Médico do Trabalho.**
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Profissional responsável
                </label>
                <Input
                  value={formData.profissional}
                  onChange={(e) => handleInputChange('profissional', e.target.value)}
                  placeholder="Nome do profissional"
                  className="border-gray-300 bg-white"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Observações
            </label>
            <Textarea
              value={formData.observacoesFinais}
              onChange={(e) => handleInputChange('observacoesFinais', e.target.value)}
              rows={3}
              placeholder="Observações adicionais sobre o exame..."
              className="border-gray-300 bg-white"
            />
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
        >
          Salvar / Concluir Exame
        </Button>
      </div>
    </div>
  );
};

export default AcuidadeVisual;