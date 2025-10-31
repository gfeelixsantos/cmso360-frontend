import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Input, RadioGroup, Radio, Textarea, Spinner } from "@heroui/react";
import { useUser } from '@/hooks/useUser';
import { Scheduling } from '@/lib/scheduling/interface/scheduling';
import { User, Brain, Heart, Eye, FileText, Scale } from 'lucide-react';

interface PsicossocialProps {
  atendimento: any;
  exame: string;
  formulario: any;
  onSave?: (data: any) => void;
  onClose?: () => void;
}

interface PsicossocialData {
  // Saúde Mental e Hábitos
  transtornoEmocional: string;
  medicamentosControlados: string;
  usoAlcoolDrogas: string;
  
  // Condições Clínicas e Sensoriais
  tonturaDesmaios: string;
  problemasSensoriais: string;
  hipertensaoDiabetes: string;
  
  // Aspectos Psicossociais
  relacionamentoFamiliar: string;
  medoAlturaEspacos: string;
  experienciaAlturaConfinado: string;
  
  // Autoavaliação
  autoAvaliacaoAltura: string;
  autoAvaliacaoConfinado: string;
  
  // Conclusão
  observacoes: string;
}

const Psicossocial: React.FC<PsicossocialProps> = ({ 
  atendimento, 
  exame,
  formulario,
  onSave, 
  onClose 
}) => {
  const user = useUser();
  const [agendamento, setAgendamento] = useState<Scheduling>();
  
  const [formData, setFormData] = useState<PsicossocialData>({
    // Saúde Mental e Hábitos
    transtornoEmocional: 'Não',
    medicamentosControlados: 'Não',
    usoAlcoolDrogas: 'Não',
    
    // Condições Clínicas e Sensoriais
    tonturaDesmaios: 'Não',
    problemasSensoriais: 'Não',
    hipertensaoDiabetes: 'Não',
    
    // Aspectos Psicossociais
    relacionamentoFamiliar: 'Sim',
    medoAlturaEspacos: 'Não',
    experienciaAlturaConfinado: 'Não',
    
    // Autoavaliação
    autoAvaliacaoAltura: 'Sim',
    autoAvaliacaoConfinado: 'Sim',
    
    // Conclusão
    observacoes: ''
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

  const handleInputChange = useCallback((field: keyof PsicossocialData, value: any) => {
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

      {/* 2. Saúde Mental e Hábitos */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle 
          number="2" 
          title="Saúde Mental e Hábitos" 
          icon={<Brain className="h-5 w-5 text-gray-600" />}
        />
        
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="space-y-4">
              {[
                {
                  label: "Você tem ou já teve algum transtorno emocional (depressão, ansiedade, insônia)?",
                  field: "transtornoEmocional" as keyof PsicossocialData,
                  options: [
                    { value: "Não", label: "Não" },
                    { value: "Sim", label: "Sim" },
                    { value: "Teve no passado", label: "Teve no passado" }
                  ]
                },
                {
                  label: "Faz uso atual de medicamentos controlados (sono, ansiedade, humor)?",
                  field: "medicamentosControlados" as keyof PsicossocialData,
                  options: [
                    { value: "Não", label: "Não" },
                    { value: "Sim", label: "Sim" }
                  ]
                },
                {
                  label: "Faz uso frequente de álcool ou drogas?",
                  field: "usoAlcoolDrogas" as keyof PsicossocialData,
                  options: [
                    { value: "Não", label: "Não" },
                    { value: "Sim", label: "Sim" },
                    { value: "Usou no passado", label: "Usou no passado" }
                  ]
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
                    classNames={{ wrapper: "flex gap-6" }}
                  >
                    {item.options.map((option) => (
                      <Radio key={option.value} value={option.value}>
                        {option.label}
                      </Radio>
                    ))}
                  </RadioGroup>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Condições Clínicas e Sensoriais */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle 
          number="3" 
          title="Condições Clínicas e Sensoriais" 
          icon={<Eye className="h-5 w-5 text-gray-600" />}
        />
        
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="space-y-4">
              {[
                {
                  label: "Já teve tontura, desmaios ou convulsões?",
                  field: "tonturaDesmaios" as keyof PsicossocialData
                },
                {
                  label: "Tem labirintite, problema de visão ou audição que dificulte o trabalho?",
                  field: "problemasSensoriais" as keyof PsicossocialData
                },
                {
                  label: "Possui hipertensão ou diabetes sob controle?",
                  field: "hipertensaoDiabetes" as keyof PsicossocialData
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
                    classNames={{ wrapper: "flex gap-6" }}
                  >
                    <Radio value="Sim">Sim</Radio>
                    <Radio value="Não">Não</Radio>
                  </RadioGroup>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 4. Aspectos Psicossociais */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle 
          number="4" 
          title="Aspectos Psicossociais" 
          icon={<Heart className="h-5 w-5 text-gray-600" />}
        />
        
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seu relacionamento familiar e social é satisfatório?
                </label>
                <RadioGroup
                  value={formData.relacionamentoFamiliar}
                  onValueChange={(value) => handleInputChange('relacionamentoFamiliar', value)}
                  orientation="horizontal"
                  classNames={{ wrapper: "flex gap-6" }}
                >
                  <Radio value="Sim">Sim</Radio>
                  <Radio value="Com dificuldades">Com dificuldades</Radio>
                </RadioGroup>
              </div>

              {[
                {
                  label: "Já sentiu medo ou ansiedade em locais altos ou fechados?",
                  field: "medoAlturaEspacos" as keyof PsicossocialData
                },
                {
                  label: "Já trabalhou em altura ou em espaço confinado antes?",
                  field: "experienciaAlturaConfinado" as keyof PsicossocialData
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
                    classNames={{ wrapper: "flex gap-6" }}
                  >
                    <Radio value="Sim">Sim</Radio>
                    <Radio value="Não">Não</Radio>
                  </RadioGroup>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 5. Autoavaliação */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle 
          number="5" 
          title="Autoavaliação" 
          icon={<Scale className="h-5 w-5 text-gray-600" />}
        />
        
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="space-y-4">
              {[
                {
                  label: "Você se considera apto para trabalhar em altura?",
                  field: "autoAvaliacaoAltura" as keyof PsicossocialData,
                  options: [
                    { value: "Sim", label: "Sim" },
                    { value: "Não", label: "Não" },
                    { value: "Indefinido", label: "Indefinido" }
                  ]
                },
                {
                  label: "Você se considera apto para trabalhar em espaço confinado?",
                  field: "autoAvaliacaoConfinado" as keyof PsicossocialData,
                  options: [
                    { value: "Sim", label: "Sim" },
                    { value: "Não", label: "Não" },
                    { value: "Indefinido", label: "Indefinido" }
                  ]
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
                    classNames={{ wrapper: "flex gap-6" }}
                  >
                    {item.options.map((option) => (
                      <Radio key={option.value} value={option.value}>
                        {option.label}
                      </Radio>
                    ))}
                  </RadioGroup>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 6. Conclusão */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle 
          number="6" 
          title="Conclusão" 
          icon={<FileText className="h-5 w-5 text-gray-600" />}
        />
        
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações do avaliador:
              </label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                rows={3}
                placeholder="Observações sobre a avaliação psicossocial..."
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
        >
          Salvar / Concluir Avaliação
        </Button>
      </div>
    </div>
  );
};

export default Psicossocial;