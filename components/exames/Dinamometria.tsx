import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Input, Select, SelectItem, Textarea, RadioGroup, Radio, Spinner } from "@heroui/react";
import { useUser } from '@/hooks/useUser';
import { Scheduling } from '@/lib/scheduling/interface/scheduling';
import { User, Hand, Activity, FileText, Target } from 'lucide-react';

interface DinamometriaProps {
  atendimento: any;
  exame: string;
  formulario: any;
  onSave?: (data: any) => void;
  onClose?: () => void;
}

interface DinamometriaData {
  // Dados do exame
  profissional: string;
  
  // Dados do Paciente
  ladoDominante: string;
  sexo: string;
  
  // Dinamometria Palmar - Força de Preensão Manual
  palmarDireita1: string;
  palmarDireita2: string;
  palmarDireita3: string;
  palmarDireitaMedia: string;
  palmarEsquerda1: string;
  palmarEsquerda2: string;
  palmarEsquerda3: string;
  palmarEsquerdaMedia: string;
  classificacaoPalmar: string;
  
  // Dinamometria Escapular - Força de Membros Superiores
  escapular1: string;
  escapular2: string;
  escapular3: string;
  escapularMedia: string;
  classificacaoEscapular: string;
  
  // Dinamometria Dorsal - Força de Tronco
  dorsal1: string;
  dorsal2: string;
  dorsal3: string;
  dorsalMedia: string;
  classificacaoDorsal: string;
  
  // Resultado e Observações
  resultado: string;
  observacoesFinais: string;
}

const Dinamometria: React.FC<DinamometriaProps> = ({ 
  atendimento, 
  exame,
  formulario,
  onSave, 
  onClose 
}) => {
  const user = useUser();
  const [agendamento, setAgendamento] = useState<Scheduling>();
  const [formErrors, setFormErrors] = useState<{ladoDominante?: string; sexo?: string}>({});
  
  const [formData, setFormData] = useState<DinamometriaData>({
    // Dados do exame
    profissional: '',
    
    // Dados do Paciente
    ladoDominante: '',
    sexo: '',
    
    // Dinamometria Palmar
    palmarDireita1: '', palmarDireita2: '', palmarDireita3: '',
    palmarDireitaMedia: '',
    palmarEsquerda1: '', palmarEsquerda2: '', palmarEsquerda3: '',
    palmarEsquerdaMedia: '',
    classificacaoPalmar: '',
    
    // Dinamometria Escapular
    escapular1: '', escapular2: '', escapular3: '',
    escapularMedia: '',
    classificacaoEscapular: '',
    
    // Dinamometria Dorsal
    dorsal1: '', dorsal2: '', dorsal3: '',
    dorsalMedia: '',
    classificacaoDorsal: '',
    
    // Resultado e Observações
    resultado: 'Normal',
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

  // Cálculo automático das médias
  useEffect(() => {
    // Cálculo da média palmar direita
    const valoresPalmarDireita = [
      parseFloat(formData.palmarDireita1.replace(',', '.')),
      parseFloat(formData.palmarDireita2.replace(',', '.')),
      parseFloat(formData.palmarDireita3.replace(',', '.'))
    ].filter(v => !isNaN(v));
    
    if (valoresPalmarDireita.length > 0) {
      const media = valoresPalmarDireita.reduce((a, b) => a + b) / valoresPalmarDireita.length;
      setFormData(prev => ({
        ...prev,
        palmarDireitaMedia: media.toFixed(1).replace('.', ',')
      }));
    }

    // Cálculo da média palmar esquerda
    const valoresPalmarEsquerda = [
      parseFloat(formData.palmarEsquerda1.replace(',', '.')),
      parseFloat(formData.palmarEsquerda2.replace(',', '.')),
      parseFloat(formData.palmarEsquerda3.replace(',', '.'))
    ].filter(v => !isNaN(v));
    
    if (valoresPalmarEsquerda.length > 0) {
      const media = valoresPalmarEsquerda.reduce((a, b) => a + b) / valoresPalmarEsquerda.length;
      setFormData(prev => ({
        ...prev,
        palmarEsquerdaMedia: media.toFixed(1).replace('.', ',')
      }));
    }

    // Cálculo da média escapular direita
    const valoresEscapularDireita = [
      parseFloat(formData.escapular1.replace(',', '.')),
      parseFloat(formData.escapular2.replace(',', '.')),
      parseFloat(formData.escapular3.replace(',', '.'))
    ].filter(v => !isNaN(v));
    
    if (valoresEscapularDireita.length > 0) {
      const media = valoresEscapularDireita.reduce((a, b) => a + b) / valoresEscapularDireita.length;
      setFormData(prev => ({
        ...prev,
        escapularDireitaMedia: media.toFixed(1).replace('.', ',')
      }));
    }

    // Cálculo da média dorsal
    const valoresDorsal = [
      parseFloat(formData.dorsal1.replace(',', '.')),
      parseFloat(formData.dorsal2.replace(',', '.')),
      parseFloat(formData.dorsal3.replace(',', '.'))
    ].filter(v => !isNaN(v));
    
    if (valoresDorsal.length > 0) {
      const media = valoresDorsal.reduce((a, b) => a + b) / valoresDorsal.length;
      setFormData(prev => ({
        ...prev,
        dorsalMedia: media.toFixed(1).replace('.', ',')
      }));
    }
  }, [
    formData.palmarDireita1, formData.palmarDireita2, formData.palmarDireita3,
    formData.palmarEsquerda1, formData.palmarEsquerda2, formData.palmarEsquerda3,
    formData.escapular1, formData.escapular2, formData.escapular3,
    formData.dorsal1, formData.dorsal2, formData.dorsal3
  ]);

  // Cálculo automático do resultado
  useEffect(() => {
    calcularResultado();
  }, [
    formData.palmarDireitaMedia,
    formData.palmarEsquerdaMedia,
    formData.escapularMedia,
    formData.dorsalMedia,
    formData.ladoDominante,
    formData.sexo
  ]);

  const validarFormulario = useCallback(() => {
    const errors: {ladoDominante?: string; sexo?: string} = {};
    
    if (!formData.ladoDominante) {
      errors.ladoDominante = 'Lado dominante é obrigatório';
    }
    
    if (!formData.sexo) {
      errors.sexo = 'Sexo é obrigatório';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData.ladoDominante, formData.sexo]);

  // Função para avaliar dinamometria palmar
  const avaliarDinamometriaPalmar = useCallback((mediaDominante: number, mediaNaoDominante: number, sexo: string) => {
    if (sexo === 'Masculino') {
      const dominanteAdequado = mediaDominante >= 45;
      const naoDominanteAdequado = mediaNaoDominante >= 40;
      return dominanteAdequado && naoDominanteAdequado;
    } else {
      const dominanteAdequado = mediaDominante >= 25;
      const naoDominanteAdequado = mediaNaoDominante >= 20;
      return dominanteAdequado && naoDominanteAdequado;
    }
  }, []);

  // Função para avaliar dinamometria escapular
  const avaliarDinamometriaEscapular = useCallback((mediaDireita: number, sexo: string) => {
    const minimo = sexo === 'Masculino' ? 20 : 10;
    return mediaDireita >= minimo;
  }, []);

  // Função para avaliar dinamometria dorsal
  const avaliarDinamometriaDorsal = useCallback((media: number, sexo: string) => {
    const minimo = sexo === 'Masculino' ? 100 : 50;
    return media >= minimo;
  }, []);

  const calcularResultado = useCallback(() => {
    // Obter todas as médias como números
    const mediaPalmarDir = parseFloat(formData.palmarDireitaMedia.replace(',', '.')) || 0;
    const mediaPalmarEsq = parseFloat(formData.palmarEsquerdaMedia.replace(',', '.')) || 0;
    const mediaEscapularDir = parseFloat(formData.escapularMedia.replace(',', '.')) || 0;
    const mediaDorsal = parseFloat(formData.dorsalMedia.replace(',', '.')) || 0;

    // Verificar se temos dados suficientes para avaliação
    if (!formData.ladoDominante || !formData.sexo) {
      setFormData(prev => ({
        ...prev,
        resultado: 'Normal',
        observacoesFinais: 'Aguardando preenchimento dos dados obrigatórios para avaliação.'
      }));
      return;
    }

    // Avaliar cada tipo de dinamometria
    let palmarNormal = false;
    let escapularNormal = false;
    let dorsalNormal = false;

    if (formData.ladoDominante === 'Direito') {
      palmarNormal = avaliarDinamometriaPalmar(mediaPalmarDir, mediaPalmarEsq, formData.sexo);
    } else {
      palmarNormal = avaliarDinamometriaPalmar(mediaPalmarEsq, mediaPalmarDir, formData.sexo);
    }

    escapularNormal = avaliarDinamometriaEscapular(mediaEscapularDir, formData.sexo);
    dorsalNormal = avaliarDinamometriaDorsal(mediaDorsal, formData.sexo);

    // Determinar resultado final
    const todasNormais = palmarNormal && escapularNormal && dorsalNormal;
    const resultado = todasNormais ? 'Normal' : 'Alterado';

    // Gerar observações detalhadas
    let observacoes = '';
    
    if (todasNormais) {
      observacoes = 'Dinamometria dentro dos padrões da normalidade';
    } else {
      observacoes = 'Dinamometria fora dos padrões da normalidade.';

    }

    // Atualizar classificações individuais
    setFormData(prev => ({
      ...prev,
      resultado,
      observacoesFinais: observacoes,
      classificacaoPalmar: palmarNormal ? 'Normal' : 'Abaixo do esperado',
      classificacaoEscapular: escapularNormal ? 'Normal' : 'Abaixo do esperado',
      classificacaoDorsal: dorsalNormal ? 'Normal' : 'Abaixo do esperado'
    }));
  }, [
    formData.palmarDireitaMedia,
    formData.palmarEsquerdaMedia,
    formData.escapularMedia,
    formData.dorsalMedia,
    formData.ladoDominante,
    formData.sexo,
    avaliarDinamometriaPalmar,
    avaliarDinamometriaEscapular,
    avaliarDinamometriaDorsal
  ]);

  const handleInputChange = useCallback((field: keyof DinamometriaData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando preenchido
    if ((field === 'ladoDominante' || field === 'sexo') && value) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, []);

  const handleSave = useCallback(() => {
    if (!validarFormulario()) {
      return;
    }
    onSave?.(formData);
  }, [formData, onSave, validarFormulario]);

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

  const renderTabelaDinamometria = (
    titulo: string,
    ladoDireito: { campo1: string; campo2: string; campo3: string; media: string },
    ladoEsquerdo: { campo1: string; campo2: string; campo3: string; media: string },
    unidade: string = 'kgf'
  ) => (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <h3 className="font-semibold text-gray-700 mb-4 text-center text-lg">{titulo}</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">Lado</th>
              <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">1ª Medida ({unidade})</th>
              <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">2ª Medida ({unidade})</th>
              <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">3ª Medida ({unidade})</th>
              <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">Média ({unidade})</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-4 py-3 font-medium text-gray-700 text-center">Direito</td>
              <td className="border border-gray-300 px-4 py-2">
                <Input
                  value={formData[ladoDireito.campo1 as keyof DinamometriaData] as string}
                  onChange={(e) => handleInputChange(ladoDireito.campo1 as keyof DinamometriaData, e.target.value)}
                  placeholder="0,0"
                  className="border-gray-300 text-center bg-white"
                />
              </td>
              <td className="border border-gray-300 px-4 py-2">
                <Input
                  value={formData[ladoDireito.campo2 as keyof DinamometriaData] as string}
                  onChange={(e) => handleInputChange(ladoDireito.campo2 as keyof DinamometriaData, e.target.value)}
                  placeholder="0,0"
                  className="border-gray-300 text-center bg-white"
                />
              </td>
              <td className="border border-gray-300 px-4 py-2">
                <Input
                  value={formData[ladoDireito.campo3 as keyof DinamometriaData] as string}
                  onChange={(e) => handleInputChange(ladoDireito.campo3 as keyof DinamometriaData, e.target.value)}
                  placeholder="0,0"
                  className="border-gray-300 text-center bg-white"
                />
              </td>
              <td className="border border-gray-300 px-4 py-2">
                <Input
                  value={formData[ladoDireito.media as keyof DinamometriaData] as string}
                  isReadOnly
                  className="border-gray-300 text-center bg-gray-100 font-semibold"
                />
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-3 font-medium text-gray-700 text-center">Esquerdo</td>
              <td className="border border-gray-300 px-4 py-2">
                <Input
                  value={formData[ladoEsquerdo.campo1 as keyof DinamometriaData] as string}
                  onChange={(e) => handleInputChange(ladoEsquerdo.campo1 as keyof DinamometriaData, e.target.value)}
                  placeholder="0,0"
                  className="border-gray-300 text-center bg-white"
                />
              </td>
              <td className="border border-gray-300 px-4 py-2">
                <Input
                  value={formData[ladoEsquerdo.campo2 as keyof DinamometriaData] as string}
                  onChange={(e) => handleInputChange(ladoEsquerdo.campo2 as keyof DinamometriaData, e.target.value)}
                  placeholder="0,0"
                  className="border-gray-300 text-center bg-white"
                />
              </td>
              <td className="border border-gray-300 px-4 py-2">
                <Input
                  value={formData[ladoEsquerdo.campo3 as keyof DinamometriaData] as string}
                  onChange={(e) => handleInputChange(ladoEsquerdo.campo3 as keyof DinamometriaData, e.target.value)}
                  placeholder="0,0"
                  className="border-gray-300 text-center bg-white"
                />
              </td>
              <td className="border border-gray-300 px-4 py-2">
                <Input
                  value={formData[ladoEsquerdo.media as keyof DinamometriaData] as string}
                  isReadOnly
                  className="border-gray-300 text-center bg-gray-100 font-semibold"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );


  const renderTabelaDinamometriaEscapular = (
    titulo: string,
    ladoDireito: { campo1: string; campo2: string; campo3: string; media: string },
    unidade: string = 'kgf'
  ) => (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <h3 className="font-semibold text-gray-700 mb-4 text-center text-lg">{titulo}</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">1ª Medida ({unidade})</th>
              <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">2ª Medida ({unidade})</th>
              <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">3ª Medida ({unidade})</th>
              <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">Média ({unidade})</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-4 py-2">
                <Input
                  value={formData[ladoDireito.campo1 as keyof DinamometriaData] as string}
                  onChange={(e) => handleInputChange(ladoDireito.campo1 as keyof DinamometriaData, e.target.value)}
                  placeholder="0,0"
                  className="border-gray-300 text-center bg-white"
                />
              </td>
              <td className="border border-gray-300 px-4 py-2">
                <Input
                  value={formData[ladoDireito.campo2 as keyof DinamometriaData] as string}
                  onChange={(e) => handleInputChange(ladoDireito.campo2 as keyof DinamometriaData, e.target.value)}
                  placeholder="0,0"
                  className="border-gray-300 text-center bg-white"
                />
              </td>
              <td className="border border-gray-300 px-4 py-2">
                <Input
                  value={formData[ladoDireito.campo3 as keyof DinamometriaData] as string}
                  onChange={(e) => handleInputChange(ladoDireito.campo3 as keyof DinamometriaData, e.target.value)}
                  placeholder="0,0"
                  className="border-gray-300 text-center bg-white"
                />
              </td>
              <td className="border border-gray-300 px-4 py-2">
                <Input
                  value={formData[ladoDireito.media as keyof DinamometriaData] as string}
                  isReadOnly
                  className="border-gray-300 text-center bg-gray-100 font-semibold"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 bg-gray-50 min-h-screen">
      <Card className="p-6 shadow-lg border border-blue-200 bg-white">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="text-center lg:text-left">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              {exame || 'Exame Ocupacional'}
            </h1>
            <p className="text-gray-600 text-sm lg:text-base">
              Avaliação da função muscular
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

        {/* Dados Obrigatórios - Lado Dominante e Sexo */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6">
          <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide flex items-center">
            Dados Obrigatórios para Avaliação
            <span className="ml-2 text-red-500 text-xs">*</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Lado Dominante <span className="text-red-500">*</span>
                {formErrors.ladoDominante && (
                  <span className="ml-2 text-red-500 text-xs">{formErrors.ladoDominante}</span>
                )}
              </label>
              <RadioGroup
                value={formData.ladoDominante}
                onValueChange={(value) => handleInputChange('ladoDominante', value)}
                orientation="horizontal"
                className="gap-4"
              >
                <Radio value="Direito" className="mr-2">
                  Direito
                </Radio>
                <Radio value="Esquerdo">
                  Esquerdo
                </Radio>
              </RadioGroup>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Sexo <span className="text-red-500">*</span>
                {formErrors.sexo && (
                  <span className="ml-2 text-red-500 text-xs">{formErrors.sexo}</span>
                )}
              </label>
              <RadioGroup
                value={formData.sexo}
                onValueChange={(value) => handleInputChange('sexo', value)}
                orientation="horizontal"
                className="gap-4"
              >
                <Radio value="Masculino" className="mr-2">
                  Masculino
                </Radio>
                <Radio value="Feminino">
                  Feminino
                </Radio>
              </RadioGroup>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Dinamometria Palmar */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle 
          number="2" 
          title="Dinamometria Palmar - Força de Preensão Manual" 
          icon={<Hand className="h-5 w-5 text-gray-600" />}
        />
        
        <div className="space-y-6">
          {renderTabelaDinamometria(
            "Força de Preensão Manual (kgf)",
            {
              campo1: 'palmarDireita1',
              campo2: 'palmarDireita2',
              campo3: 'palmarDireita3',
              media: 'palmarDireitaMedia'
            },
            {
              campo1: 'palmarEsquerda1',
              campo2: 'palmarEsquerda2',
              campo3: 'palmarEsquerda3',
              media: 'palmarEsquerdaMedia'
            },
            'kgf'
          )}
          
          {/* Critérios de Avaliação */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Critérios de Avaliação - Dinamometria Palmar:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Homens:</strong> Lado dominante ≥ 45 kgf | Lado não dominante ≥ 40 kgf</li>
              <li>• <strong>Mulheres:</strong> Lado dominante ≥ 25 kgf | Lado não dominante ≥ 20 kgf</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* 3. Dinamometria Escapular */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle 
          number="3" 
          title="Dinamometria Escapular - Força de Membros Superiores" 
          icon={<Target className="h-5 w-5 text-gray-600" />}
        />
        
        <div className="space-y-6">
          {renderTabelaDinamometriaEscapular(
            "Força de Membros Superiores (kgf)",
            {
              campo1: 'escapularDireita1',
              campo2: 'escapularDireita2',
              campo3: 'escapularDireita3',
              media: 'escapularDireitaMedia'
            },
            'kgf'
          )}
          
          {/* Critérios de Avaliação */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Critérios de Avaliação - Dinamometria Escapular:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Homens:</strong> Ambos os lados ≥ 20 kgf</li>
              <li>• <strong>Mulheres:</strong> Ambos os lados ≥ 10 kgf</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* 4. Dinamometria Dorsal */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle 
          number="4" 
          title="Dinamometria Dorsal - Força de Tronco" 
          icon={<Activity className="h-5 w-5 text-gray-600" />}
        />
        
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-700 mb-4 text-center text-lg">Força de Tronco (kgf)</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">1ª Medida (kgf)</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">2ª Medida (kgf)</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">3ª Medida (kgf)</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">Média (kgf)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">
                      <Input
                        value={formData.dorsal1}
                        onChange={(e) => handleInputChange('dorsal1', e.target.value)}
                        placeholder="0,0"
                        className="border-gray-300 text-center bg-white"
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <Input
                        value={formData.dorsal2}
                        onChange={(e) => handleInputChange('dorsal2', e.target.value)}
                        placeholder="0,0"
                        className="border-gray-300 text-center bg-white"
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <Input
                        value={formData.dorsal3}
                        onChange={(e) => handleInputChange('dorsal3', e.target.value)}
                        placeholder="0,0"
                        className="border-gray-300 text-center bg-white"
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <Input
                        value={formData.dorsalMedia}
                        isReadOnly
                        className="border-gray-300 text-center bg-gray-100 font-semibold"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Critérios de Avaliação */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Critérios de Avaliação - Dinamometria Dorsal:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Homens:</strong> Média ≥ 100 kgf</li>
              <li>• <strong>Mulheres:</strong> Média ≥ 50 kgf</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* 5. Resultado e Observações */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle 
          number="5" 
          title="Resultado e Observações" 
          icon={<FileText className="h-5 w-5 text-gray-600" />}
        />
        
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="space-y-4">
              <div>
                <Textarea
                  value={formData.observacoesFinais}
                  onChange={(e) => handleInputChange('observacoesFinais', e.target.value)}
                  rows={4}
                  placeholder="Observações finais sobre a avaliação de força muscular..."
                  className="bg-white border-gray-300"
                />
              </div>
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
        >
          Salvar / Concluir Exame
        </Button>
      </div>
    </div>
  );
};

export default Dinamometria;