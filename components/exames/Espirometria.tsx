import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Button, Input, Select, SelectItem, Textarea, RadioGroup, Radio, Checkbox, Spinner } from "@heroui/react";
import { useUser } from '@/hooks/useUser';
import { Scheduling } from '@/lib/scheduling/interface/scheduling';
import { User, Stethoscope, Heart, FileText, Eye, EyeOff } from 'lucide-react';

interface EspirometriaProps {
  atendimento: any;
  exame: string;
  formulario: any;
  onSave?: (data: any) => void;
  onClose?: () => void;
}

interface EspirometriaData {
  // Histórico Respiratório e Tabagismo
  tabagismo: boolean;
  tempoParouFumar: string;
  quantidadeCigarrosDia: string;
  fumouHoje: string;
  
  // Sintomas Respiratórios
  tossePigarroManha: string;
  catarroHabitual: string;
  sibilancia: string;
  faltaArEsforco: string;
  
  // Doenças Pulmonares e Outras Condições
  doencaPulmonar: string;
  asma: string;
  medicacaoAsma: string;
  cirurgiaToraxPulmao: string;
  doencaCardiacaHipertensao: string;
  proteseDentaria: string;
  
  // Histórico Ocupacional e Exposição
  exposicaoPoeiraFumaca: string;
  descricaoExposicao: string;
  exposicaoAtual: string;
  
  // Observações
  observacoes: string;
}

const Espirometria: React.FC<EspirometriaProps> = ({ 
  atendimento, 
  exame,
  formulario,
  onSave, 
  onClose 
}) => {
  const user = useUser();
  const [agendamento, setAgendamento] = useState<Scheduling>();
  const [mostrarQuestionarioTabagismo, setMostrarQuestionarioTabagismo] = useState(false);
  const [mostrarObservacoesAutomaticas, setMostrarObservacoesAutomaticas] = useState(true);
  
  const [formData, setFormData] = useState<EspirometriaData>({
    // Histórico Respiratório e Tabagismo
    tabagismo: false,
    tempoParouFumar: '',
    quantidadeCigarrosDia: 'Não se aplica',
    fumouHoje: '',
    
    // Sintomas Respiratórios
    tossePigarroManha: 'Não',
    catarroHabitual: 'Não',
    sibilancia: 'Não',
    faltaArEsforco: 'Não',
    
    // Doenças Pulmonares e Outras Condições
    doencaPulmonar: 'Não',
    asma: 'Não',
    medicacaoAsma: 'Não',
    cirurgiaToraxPulmao: 'Não',
    doencaCardiacaHipertensao: 'Não',
    proteseDentaria: 'Não',
    
    // Histórico Ocupacional e Exposição
    exposicaoPoeiraFumaca: 'Não',
    descricaoExposicao: '',
    exposicaoAtual: 'Não',
    
    // Observações
    observacoes: ''
  });

  // Preenchimento automático dos dados do atendimento
  useEffect(() => {
    if (atendimento) {
      setAgendamento(atendimento);
    }

    if (formulario) {
      setFormData(prev => ({ ...prev, ...formulario }));
      // Atualizar visibilidade do questionário de tabagismo baseado nos dados existentes
      if (formulario.tabagismo) {
        setMostrarQuestionarioTabagismo(true);
      }
    }
  }, [atendimento, formulario]);

  const handleInputChange = useCallback((field: keyof EspirometriaData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleTabagismoChange = useCallback((isChecked: boolean) => {
    setFormData(prev => ({ ...prev, tabagismo: isChecked }));
    setMostrarQuestionarioTabagismo(isChecked);
    
    // Resetar campos do questionário de tabagismo quando desmarcado
    if (!isChecked) {
      setFormData(prev => ({
        ...prev,
        tempoParouFumar: '',
        quantidadeCigarrosDia: 'Não se aplica',
        fumouHoje: ''
      }));
    }
  }, []);

  // Função para gerar observações automáticas baseadas nas respostas
  const observacoesAutomaticas = useMemo(() => {
    const observacoes: string[] = [];

    // Verificar tabagismo
    if (formData.tabagismo) {
      let tabagismoInfo = "Paciente com histórico de tabagismo";
      
      if (formData.quantidadeCigarrosDia && formData.quantidadeCigarrosDia !== 'Não se aplica') {
        tabagismoInfo += ` (${formData.quantidadeCigarrosDia.toLowerCase()})`;
      }
      
      if (formData.tempoParouFumar) {
        tabagismoInfo += `, parou há ${formData.tempoParouFumar}`;
      }
      
      if (formData.fumouHoje) {
        tabagismoInfo += `, fumou há ${formData.fumouHoje}`;
      }
      
      observacoes.push(tabagismoInfo);
    }

    // Verificar sintomas respiratórios
    const sintomasRespiratorios = [
      { campo: formData.tossePigarroManha, descricao: "tosse/pigarro matinal" },
      { campo: formData.catarroHabitual, descricao: "catarro habitual" },
      { campo: formData.sibilancia, descricao: "sibilância" },
      { campo: formData.faltaArEsforco, descricao: "dispneia aos esforços" }
    ].filter(sintoma => sintoma.campo === 'Sim');

    if (sintomasRespiratorios.length > 0) {
      const sintomasDesc = sintomasRespiratorios.map(s => s.descricao).join(', ');
      observacoes.push(`Relata ${sintomasDesc}`);
    }

    // Verificar doenças pulmonares
    const condicoesMedicas = [
      { campo: formData.doencaPulmonar, descricao: "doença pulmonar" },
      { campo: formData.asma, descricao: "asma" },
      { campo: formData.medicacaoAsma, descricao: "uso de medicação para asma/respiração" },
      { campo: formData.cirurgiaToraxPulmao, descricao: "cirurgia torácica/pulmonar" },
      { campo: formData.doencaCardiacaHipertensao, descricao: "doença cardíaca/hipertensão" }
    ].filter(condicao => condicao.campo === 'Sim');

    if (condicoesMedicas.length > 0) {
      const condicoesDesc = condicoesMedicas.map(c => c.descricao).join(', ');
      observacoes.push(`Histórico de ${condicoesDesc}`);
    }

    // Verificar prótese dentária
    if (formData.proteseDentaria === 'Sim') {
      observacoes.push("Utiliza prótese dentária");
    }


    return observacoes;
  }, [formData]);

  const handleSave = useCallback(() => {
    // Combinar observações manuais com automáticas
    const observacoesCombinadas = formData.observacoes 
      ? `${formData.observacoes}\n\n--- Observações Automáticas ---\n${observacoesAutomaticas}`
      : observacoesAutomaticas;
    
    const dadosParaSalvar = {
      ...formData,
      observacoes: observacoesCombinadas
    };
    
    onSave?.(dadosParaSalvar);
  }, [formData, observacoesAutomaticas, onSave]);

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
    <div className="max-w-6xl mx-auto p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
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

      {/* 2. Histórico Respiratório e Tabagismo */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle 
          number="2" 
          title="Histórico Respiratório e Tabagismo" 
        />
        
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="space-y-4">
              <div>
                <Checkbox
                  isSelected={formData.tabagismo}
                  onValueChange={handleTabagismoChange}
                  classNames={{ label: "text-sm font-medium text-gray-700" }}
                >
                  Fuma ou já fumou cigarros?
                </Checkbox>
              </div>

              {mostrarQuestionarioTabagismo && (
                <div className="pl-6 border-l-2 border-gray-300 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tempo desde que parou de fumar:
                      </label>
                      <Input
                        value={formData.tempoParouFumar}
                        onChange={(e) => handleInputChange('tempoParouFumar', e.target.value)}
                        placeholder="Ex: 2 anos"
                        className="bg-white border-gray-300"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantidade média diária:
                      </label>
                      <Select
                        selectedKeys={[formData.quantidadeCigarrosDia]}
                        onChange={(e) => handleInputChange('quantidadeCigarrosDia', e.target.value)}
                        className="w-full"
                        classNames={{
                          trigger: "bg-white border-gray-300"
                        }}
                      >
                        <SelectItem key="Não se aplica">Não se aplica</SelectItem>
                        <SelectItem key="Até 10 cigarros/dia">Até 10 cigarros/dia</SelectItem>
                        <SelectItem key="10 a 20 cigarros/dia">10 a 20 cigarros/dia</SelectItem>
                        <SelectItem key="Mais de 20 cigarros/dia">Mais de 20 cigarros/dia</SelectItem>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fumou hoje? Se sim, há quanto tempo?
                    </label>
                    <Input
                      value={formData.fumouHoje}
                      onChange={(e) => handleInputChange('fumouHoje', e.target.value)}
                      placeholder="Ex: 2 horas"
                      className="bg-white border-gray-300"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Sintomas Respiratórios */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle 
          number="3" 
          title="Sintomas Respiratórios" 
        />
        
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="space-y-4">
              {[
                {
                  label: "Tosse ou pigarro frequente pela manhã?",
                  field: "tossePigarroManha" as keyof EspirometriaData
                },
                {
                  label: "Produz catarro habitualmente?",
                  field: "catarroHabitual" as keyof EspirometriaData
                },
                {
                  label: "Seu peito chia com frequência (sibilância)?",
                  field: "sibilancia" as keyof EspirometriaData
                },
                {
                  label: "Sente falta de ar com esforço leve?",
                  field: "faltaArEsforco" as keyof EspirometriaData
                }
              ].map((item) => (
                <div key={item.field}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {item.label}
                  </label>
                  <RadioGroup
                    value={formData[item.field] as string}
                    onValueChange={(value) => handleInputChange(item.field, value)}
                    orientation="horizontal"
                    classNames={{ wrapper: "gap-6" }}
                  >
                    <Radio value="Sim" classNames={{ label: "text-gray-700" }}>Sim</Radio>
                    <Radio value="Não" classNames={{ label: "text-gray-700" }}>Não</Radio>
                  </RadioGroup>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 4. Doenças Pulmonares e Outras Condições */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle 
          number="4" 
          title="Doenças Pulmonares e Outras Condições" 
          icon={<Stethoscope className="h-5 w-5 text-gray-600" />}
        />
        
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="space-y-4">
              {[
                {
                  label: "Já teve alguma doença pulmonar diagnosticada (ex: bronquite, DPOC)?",
                  field: "doencaPulmonar" as keyof EspirometriaData
                },
                {
                  label: "Tem ou teve asma?",
                  field: "asma" as keyof EspirometriaData
                },
                {
                  label: "Faz uso atual de medicação para asma ou respiração?",
                  field: "medicacaoAsma" as keyof EspirometriaData
                },
                {
                  label: "Já realizou cirurgia no tórax ou pulmão?",
                  field: "cirurgiaToraxPulmao" as keyof EspirometriaData
                },
                {
                  label: "Tem alguma doença cardíaca ou hipertensão?",
                  field: "doencaCardiacaHipertensao" as keyof EspirometriaData
                },
                {
                  label: "Usa prótese dentária?",
                  field: "proteseDentaria" as keyof EspirometriaData
                }
              ].map((item) => (
                <div key={item.field}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {item.label}
                  </label>
                  <RadioGroup
                    value={formData[item.field] as string}
                    onValueChange={(value) => handleInputChange(item.field, value)}
                    orientation="horizontal"
                    classNames={{ wrapper: "gap-6" }}
                  >
                    <Radio value="Sim" classNames={{ label: "text-gray-700" }}>Sim</Radio>
                    <Radio value="Não" classNames={{ label: "text-gray-700" }}>Não</Radio>
                  </RadioGroup>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 5. Histórico Ocupacional e Exposição */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle 
          number="5" 
          title="Histórico Ocupacional e Exposição" 
          icon={<Heart className="h-5 w-5 text-gray-600" />}
        />
        
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Já trabalhou em ambiente com poeira, fumaça ou vapores químicos por um ano ou mais?
                </label>
                <RadioGroup
                  value={formData.exposicaoPoeiraFumaca}
                  onValueChange={(value) => handleInputChange('exposicaoPoeiraFumaca', value)}
                  orientation="horizontal"
                  classNames={{ wrapper: "gap-6" }}
                >
                  <Radio value="Sim" classNames={{ label: "text-gray-700" }}>Sim</Radio>
                  <Radio value="Não" classNames={{ label: "text-gray-700" }}>Não</Radio>
                </RadioGroup>
              </div>

              {formData.exposicaoPoeiraFumaca === 'Sim' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Se sim, descreva a atividade:
                  </label>
                  <Input
                    value={formData.descricaoExposicao}
                    onChange={(e) => handleInputChange('descricaoExposicao', e.target.value)}
                    placeholder="Ex: construção civil, soldagem, mineração..."
                    className="bg-white border-gray-300"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Atualmente trabalha exposto a esses agentes?
                </label>
                <RadioGroup
                  value={formData.exposicaoAtual}
                  onValueChange={(value) => handleInputChange('exposicaoAtual', value)}
                  orientation="horizontal"
                  classNames={{ wrapper: "gap-6" }}
                >
                  <Radio value="Sim" classNames={{ label: "text-gray-700" }}>Sim</Radio>
                  <Radio value="Não" classNames={{ label: "text-gray-700" }}>Não</Radio>
                </RadioGroup>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 6. Observações */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle 
          number="6" 
          title="Observações" 
          icon={<FileText className="h-5 w-5 text-gray-600" />}
        />
        
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="space-y-4">
              {/* Observações Automáticas */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-blue-800 text-sm uppercase tracking-wide">
                    Observações Automáticas Geradas
                  </h3>
                  <Button
                    variant="light"
                    size="sm"
                    onPress={() => setMostrarObservacoesAutomaticas(!mostrarObservacoesAutomaticas)}
                    startContent={mostrarObservacoesAutomaticas ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    className="text-blue-700 hover:text-blue-800"
                  >
                    {mostrarObservacoesAutomaticas ? 'Ocultar' : 'Mostrar'}
                  </Button>
                </div>
                
                {mostrarObservacoesAutomaticas && (
                  <div className="text-sm text-blue-700 bg-white p-3 rounded border border-blue-100">
                    {observacoesAutomaticas.length > 0 ? 
                    observacoesAutomaticas.map((obs, index) => (
                      <p key={index} className="whitespace-pre-wrap">{obs}</p>
                    )): (
                      <p className="text-blue-500 italic">
                        Nenhuma observação automática gerada. 
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Observações Manuais */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações do avaliador:
                </label>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  rows={4}
                  placeholder="Digite suas observações adicionais aqui."
                  className="bg-white border-gray-300"
                />
                <p className="text-xs text-gray-500 mt-2">
                  As observações automáticas serão combinadas com suas observações manuais no relatório final.
                </p>
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
          Salvar / Concluir Questionário
        </Button>
      </div>
    </div>
  );
};

export default Espirometria;