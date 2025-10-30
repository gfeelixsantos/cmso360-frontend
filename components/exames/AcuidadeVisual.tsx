import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Input, Select, SelectItem, Textarea, RadioGroup, Radio, Spinner } from "@heroui/react";
import { useUser } from '@/hooks/useUser';
import { Scheduling } from '@/lib/scheduling/interface/scheduling';
import { User, Eye, Palette, Gauge, FileText, Plus, Minus, AlertTriangle, Check, X } from 'lucide-react';

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
  tipoLenteCorretiva: string;
  profissional: string;
  
  // Acuidade Visual - Longe
  longeOD: string;
  longeOE: string;
  longeBinocular: string;
  
  // Acuidade Visual - Perto
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
  estereopsiaAcertos: number;
  estereopsiaTotal: number;
  estereopsiaRespostas: { [key: number]: 'acerto' | 'erro' | null };
  
  // Resultados Separados
  resultadoAcuidadeVisual: string;
  resultadoIshihara: string;
  resultadoEstereopsia: string;
  
  // Conclusão Geral
  observacoesFinais: string;
}

interface ResultadoInvestigacao {
  sugereInvestigacao: boolean;
  criterio: string;
  detalhes: string;
}

// Configuração das placas do teste de Ishihara com resultados esperados
const placasIshiharaConfig = [
  { 
    number: 1, 
    real: '12', 
    fieldPlaca: 'ishiharaPlaca1', 
    fieldResultado: 'ishiharaResultado1',
  },
  { 
    number: 2, 
    real: '8', 
    fieldPlaca: 'ishiharaPlaca2', 
    fieldResultado: 'ishiharaResultado2',
  },
  { 
    number: 3, 
    real: '29', 
    fieldPlaca: 'ishiharaPlaca3', 
    fieldResultado: 'ishiharaResultado3',
  },
  { 
    number: 4, 
    real: '5', 
    fieldPlaca: 'ishiharaPlaca4', 
    fieldResultado: 'ishiharaResultado4',
  },
  { 
    number: 5, 
    real: '3', 
    fieldPlaca: 'ishiharaPlaca5', 
    fieldResultado: 'ishiharaResultado5',
  },
  { 
    number: 6, 
    real: '15', 
    fieldPlaca: 'ishiharaPlaca6', 
    fieldResultado: 'ishiharaResultado6',
  },
  { 
    number: 7, 
    real: '74', 
    fieldPlaca: 'ishiharaPlaca7', 
    fieldResultado: 'ishiharaResultado7',
  },
  { 
    number: 8, 
    real: '6', 
    fieldPlaca: 'ishiharaPlaca8', 
    fieldResultado: 'ishiharaResultado8',
  },
  { 
    number: 9, 
    real: '45', 
    fieldPlaca: 'ishiharaPlaca9', 
    fieldResultado: 'ishiharaResultado9',
  },
  { 
    number: 10, 
    real: '5', 
    fieldPlaca: 'ishiharaPlaca10', 
    fieldResultado: 'ishiharaResultado10',
  }
];

// Configuração das setas para teste de profundidade
const setasProfundidade = [
  { id: 1, numero: '1', direcao: '⬆️' },
  { id: 2, numero: '2', direcao: '➡️' },
  { id: 3, numero: '3', direcao: '⬇️' },
  { id: 4, numero: '4', direcao: '↙️' },
  { id: 5, numero: '5', direcao: '↘️' },
  { id: 6, numero: '6', direcao: '↖️' },
  { id: 7, numero: '7', direcao: '↗️' },
  { id: 8, numero: '8', direcao: '⬅️' },
  { id: 9, numero: '9', direcao: '↔️' }
];

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
    tipoLenteCorretiva: '',
    profissional: '',
    
    // Acuidade Visual
    longeOD: '', longeOE: '', longeBinocular: '',
    pertoBinocular: '',
    
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
    estereopsiaAcertos: 0,
    estereopsiaTotal: 9,
    estereopsiaRespostas: {},
    
    // Resultados Separados
    resultadoAcuidadeVisual: 'Normal',
    resultadoIshihara: 'Normal',
    resultadoEstereopsia: '',
    
    // Conclusão Geral
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

  const handleInputChange = useCallback((field: keyof AcuidadeVisualData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    onSave?.(formData);
  }, [formData, onSave]);

  // Função para lidar com as respostas do teste de profundidade
  const handleRespostaProfundidade = useCallback((setaId: number, resposta: 'acerto' | 'erro') => {
    setFormData(prev => {
      const novasRespostas = {
        ...prev.estereopsiaRespostas,
        [setaId]: resposta
      };
      
      // Calcular acertos baseado nas respostas
      const acertos = Object.values(novasRespostas).filter(resp => resp === 'acerto').length;
      const total = Object.keys(novasRespostas).length;
      
      return {
        ...prev,
        estereopsiaRespostas: novasRespostas,
        estereopsiaAcertos: acertos,
        estereopsiaTotal: total > 0 ? total : 9
      };
    });
  }, []);

  // Calcular resultado do teste de estereopsia baseado nas respostas
  useEffect(() => {
    const calcularResultado = (acertos: number, total: number) => {
      if (total === 0) return '';
      const porcentagem = (acertos / total) * 100;
      if (porcentagem >= 80) return 'Normal';
      if (porcentagem >= 50) return 'Alterado Leve';
      return 'Alterado Grave';
    };

    const resultado = calcularResultado(formData.estereopsiaAcertos, formData.estereopsiaTotal);
    setFormData(prev => ({
      ...prev,
      estereopsiaResultado: resultado,
      resultadoEstereopsia: resultado
    }));
  }, [formData.estereopsiaAcertos, formData.estereopsiaTotal]);

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

  // Componente para o teste de estereopsia com botões de acerto/erro
  const TesteEstereopsia = () => {
    const limparTeste = () => {
      setFormData(prev => ({
        ...prev,
        estereopsiaRespostas: {},
        estereopsiaAcertos: 0,
        estereopsiaTotal: 9,
        estereopsiaResultado: '',
        resultadoEstereopsia: ''
      }));
    };

    const marcarTodosComoAcerto = () => {
      const todasRespostas: { [key: number]: 'acerto' } = {};
      setasProfundidade.forEach(seta => {
        todasRespostas[seta.id] = 'acerto';
      });
      
      setFormData(prev => ({
        ...prev,
        estereopsiaRespostas: todasRespostas,
        estereopsiaAcertos: setasProfundidade.length,
        estereopsiaTotal: setasProfundidade.length
      }));
    };

    const marcarTodosComoErro = () => {
      const todasRespostas: { [key: number]: 'erro' } = {};
      setasProfundidade.forEach(seta => {
        todasRespostas[seta.id] = 'erro';
      });
      
      setFormData(prev => ({
        ...prev,
        estereopsiaRespostas: todasRespostas,
        estereopsiaAcertos: 0,
        estereopsiaTotal: setasProfundidade.length
      }));
    };

    const porcentagem = formData.estereopsiaTotal > 0 
      ? Math.round((formData.estereopsiaAcertos / formData.estereopsiaTotal) * 100) 
      : 0;

    return (
      <div className="space-y-6">
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-4 text-center">
            Teste de Estereopsia - Clique nos botões para registrar se o paciente acertou ou errou cada seta
          </p>
          
          {/* Display visual simples */}
          <div className="bg-white border-2 border-gray-300 rounded-lg p-6 mb-6 text-center">
            <div className="text-lg font-semibold text-gray-700 mb-2">Teste de Profundidade</div>
            <div className="text-sm text-gray-600 mb-4">
              Clique em ✓ para acerto ou ✗ para erro em cada seta identificada pelo paciente
            </div>
            
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{formData.estereopsiaAcertos}</div>
                <div className="text-sm text-gray-600">Acertos</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-700">{formData.estereopsiaTotal}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-700">
                {porcentagem}% de acerto
              </div>
              <div className={`text-sm font-medium ${
                formData.estereopsiaResultado === 'Normal' ? 'text-green-600' :
                formData.estereopsiaResultado === 'Alterado Leve' ? 'text-yellow-600' :
                formData.estereopsiaResultado === 'Alterado Grave' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {formData.estereopsiaResultado || 'Resultado não calculado'}
              </div>
            </div>
          </div>

          {/* Grid de setas com botões de acerto/erro */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">
              Registre as respostas para cada seta:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {setasProfundidade.map((seta) => (
                <div key={seta.id} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">{seta.direcao}</div>
                  <div className="text-sm font-medium text-gray-700 mb-3">Set {seta.numero}</div>
                  <div className="flex justify-center gap-2">
                    <Button
                      size="sm"
                      variant={formData.estereopsiaRespostas[seta.id] === 'acerto' ? 'solid' : 'flat'}
                      color={formData.estereopsiaRespostas[seta.id] === 'acerto' ? 'success' : 'default'}
                      onPress={() => handleRespostaProfundidade(seta.id, 'acerto')}
                      className="min-w-12"
                      startContent={<Check className="h-4 w-4" />}
                    >
                      ✓
                    </Button>
                    <Button
                      size="sm"
                      variant={formData.estereopsiaRespostas[seta.id] === 'erro' ? 'solid' : 'flat'}
                      color={formData.estereopsiaRespostas[seta.id] === 'erro' ? 'danger' : 'default'}
                      onPress={() => handleRespostaProfundidade(seta.id, 'erro')}
                      className="min-w-12"
                      startContent={<X className="h-4 w-4" />}
                    >
                      ✗
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {formData.estereopsiaRespostas[seta.id] === 'acerto' && '✓ Acerto'}
                    {formData.estereopsiaRespostas[seta.id] === 'erro' && '✗ Erro'}
                    {!formData.estereopsiaRespostas[seta.id] && 'Pendente'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-4 mb-6">
            <Button
              variant="flat"
              onPress={limparTeste}
              className="flex items-center gap-2"
            >
              Limpar Teste
            </Button>
            <Button
              variant="flat"
              onPress={marcarTodosComoAcerto}
              className="flex items-center gap-2 bg-green-50 text-green-700"
            >
              <Check className="h-4 w-4" />
              Todos Corretos
            </Button>
            <Button
              variant="flat"
              onPress={marcarTodosComoErro}
              className="flex items-center gap-2 bg-red-50 text-red-700"
            >
              <X className="h-4 w-4" />
              Todos Errados
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Resultado Final:
              </label>
              <Select
                selectedKeys={formData.estereopsiaResultado ? [formData.estereopsiaResultado] : []}
                onChange={(e) => {
                  handleInputChange('estereopsiaResultado', e.target.value);
                  handleInputChange('resultadoEstereopsia', e.target.value);
                }}
                className="w-full"
                classNames={{
                  trigger: "bg-white border-gray-300"
                }}
              >
                <SelectItem key="Normal">Normal</SelectItem>
                <SelectItem key="Alterado Leve">Alterado Leve</SelectItem>
                <SelectItem key="Alterado Grave">Alterado Grave</SelectItem>
                <SelectItem key="Não realizado">Não realizado</SelectItem>
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
    );
  };

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

            {/* Opções de lente corretiva - aparece apenas se "Sim" for selecionado */}
            {formData.exameComLenteCorretiva === 'Sim' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Uso de lente:
                </label>
                <RadioGroup
                  value={formData.tipoLenteCorretiva}
                  onValueChange={(value) => handleInputChange('tipoLenteCorretiva', value)}
                  orientation="horizontal"
                  classNames={{ wrapper: "gap-6" }}
                >
                  <Radio value="Para perto" classNames={{ label: "text-gray-700" }}>Para perto</Radio>
                  <Radio value="Para longe" classNames={{ label: "text-gray-700" }}>Para longe</Radio>
                  <Radio value="Ambos" classNames={{ label: "text-gray-700" }}>Ambos</Radio>
                </RadioGroup>
              </div>
            )}
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
                    <td className="border border-gray-300 px-4 py-3 font-medium text-gray-700">Longe</td>
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
                    <td className="border border-gray-300 px-4 py-3 font-medium text-gray-700">Perto</td>
                    <td className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                      -
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                      -
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <Input
                        value={formData.pertoBinocular}
                        onChange={(e) => handleInputChange('pertoBinocular', e.target.value)}
                        placeholder="Ex: 20/20 ou J1"
                        className="border-gray-300 text-center bg-white"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className="text-xs text-gray-500 mt-2">
                * A acuidade visual para perto é realizada apenas com os dois olhos (binocular)
              </p>
            </div>
          </div>

          {/* Resultado da Acuidade Visual */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Resultado da Acuidade Visual
            </label>
            <Input
              value={formData.resultadoAcuidadeVisual}
              onChange={(e) => handleInputChange('resultadoAcuidadeVisual', e.target.value)}
              className="w-full bg-white border-gray-300"
              placeholder="Digite o resultado da acuidade visual..."
            />
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
                Identificação de deficiência de visão de cores. Digite o número identificado pelo examinado em cada placa. Use "NA", "-" ou "nenhum" para quando não enxergar nenhum número.
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
                    {placasIshiharaConfig.map((placa) => (
                      <tr key={placa.number}>
                        <td className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-700">
                          {placa.number}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <Input
                            value={formData[placa.fieldPlaca as keyof AcuidadeVisualData] as string}
                            onChange={(e) => handleInputChange(placa.fieldPlaca as keyof AcuidadeVisualData, e.target.value)}
                            placeholder={`Ex: ${placa.real} ou NA`}
                            className="border-gray-300 text-center bg-white"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <Select
                            selectedKeys={formData[placa.fieldResultado as keyof AcuidadeVisualData] ? [formData[placa.fieldResultado as keyof AcuidadeVisualData] as string] : []}
                            onChange={(e) => handleInputChange(placa.fieldResultado as keyof AcuidadeVisualData, e.target.value)}
                            className="w-full"
                            classNames={{
                              trigger: "bg-white border-gray-300"
                            }}
                          >
                            <SelectItem key="Normal">Normal</SelectItem>
                            <SelectItem key="Daltonismo verde-vermelho">Daltonismo verde-vermelho</SelectItem>
                            <SelectItem key="Daltonismo total">Daltonismo total</SelectItem>
                            <SelectItem key="Alteração">Alteração</SelectItem>
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
                  Resultado do Teste de Ishihara
                </label>
                <Input
                  value={formData.resultadoIshihara}
                  onChange={(e) => {
                    handleInputChange('resultadoIshihara', e.target.value);
                    handleInputChange('conclusaoIshihara', e.target.value);
                  }}
                  className="w-full bg-white border-gray-300"
                  placeholder="Digite o resultado do teste de Ishihara..."
                />
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
          <TesteEstereopsia />
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Observações Finais
            </label>
            <Textarea
              value={formData.observacoesFinais}
              onChange={(e) => handleInputChange('observacoesFinais', e.target.value)}
              rows={3}
              placeholder="Informações adicionais sobre o exame..."
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