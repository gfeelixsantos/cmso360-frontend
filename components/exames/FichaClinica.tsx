import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Input, Select, SelectItem, Textarea, Checkbox, Radio, RadioGroup } from "@heroui/react";
import { Calendar, User, Building, Briefcase, Stethoscope, FileText, ClipboardList } from 'lucide-react';
import { IUserInfo, useUser } from '@/hooks/useUser';
import { Scheduling } from '@/lib/scheduling/interface/scheduling';

interface FichaClinicaProps {
  atendimento: any;
  exame: string;
  formulario: any;
  onSave?: (data: any) => void;
  onClose?: () => void;
}

interface RegistroPa {
  valor: string,
  horario: string,
  profissional: string
}

interface FichaClinicaData {
  // Anamnese
  doencasFamiliares: string[];
  doencasPessoais: string[];
  afastamento: string;
  observacaoAfastamento: string;
  
  // Hábitos
  tabagismo: string;
  etilismo: string;
  atividadeFisica: string;
  acimaPeso: string;
  
  // Aptidões funcionais
  trabalhoAltura: string;
  trabalhoEspacoConfinado: string;
  capacidadeCarregarPeso: string;
  aptoOperarVeiculos: string;
  
  // Exame clínico
  cabecaPescoco: string;
  torax: string;
  abdome: string;
  coluna: string;
  membrosSuperiores: string;
  membrosInferiores: string;
  
  // Dados vitais
  pressaoArterial: RegistroPa[];
  peso: string;
  altura: string;
  imc: string;
  resultadoImc: string;
  
  // Conclusão
  conclusao: string;
  observacoesMedicas: string;
  codigoMedico: string,
  medico: string
}

const FichaClinicaOcupacional: React.FC<FichaClinicaProps> = ({ 
  atendimento, 
  exame,
  formulario,
  onSave, 
  onClose 
}) => {
  const user = useUser();
  const [agendamento, setAgendamento] = useState<Scheduling>();
  const [tipoAdmissional, setTipoAdmissional] = useState<boolean>(false);
  const [pressaoAlterada, setPressaoAlterada] = useState<boolean>(false);
  
  const [formData, setFormData] = useState<FichaClinicaData>({
    doencasFamiliares: ["Nenhuma"],
    doencasPessoais: [],
    afastamento: 'Não',
    observacaoAfastamento: '',
    tabagismo: 'Não',
    etilismo: 'Não',
    atividadeFisica: 'Não',
    acimaPeso: 'Não',
    trabalhoAltura: 'Apto', 
    trabalhoEspacoConfinado: 'Apto', 
    capacidadeCarregarPeso: 'Apto', 
    aptoOperarVeiculos: 'Apto',
    cabecaPescoco: 'Normal',
    torax: 'Normal',
    abdome: 'Normal',
    coluna: 'Normal',
    membrosSuperiores: 'Normal',
    membrosInferiores: 'Normal',
    pressaoArterial: [],
    peso: '',
    altura: '',
    imc: '',
    resultadoImc: '',
    conclusao: 'Apto',
    observacoesMedicas: '',
    codigoMedico: user?.perfil.includes("MEDICO") ? user.codigo : "",
    medico: user?.perfil.includes("MEDICO") ? user.nome : ""
  });

  // Função para verificar se a pressão arterial está alterada
  const verificarPressaoAlterada = useCallback((pressao: string): boolean => {
    if (!pressao || !pressao.includes('/')) return false;
    
    const [sistolica, diastolica] = pressao.split('/').map(Number);
    
    if (isNaN(sistolica) || isNaN(diastolica)) return false;
    
    // Valores de referência para pressão arterial normal
    // Sistólica: 90-139 mmHg, Diastólica: 60-89 mmHg
    return sistolica < 90 || sistolica > 139 || diastolica < 60 || diastolica > 89;
  }, []);

  // Verificar se há pressão arterial alterada
  useEffect(() => {
    const temPressaoAlterada = formData.pressaoArterial.some(pa => 
      pa.valor && verificarPressaoAlterada(pa.valor)
    );
    setPressaoAlterada(temPressaoAlterada);
  }, [formData.pressaoArterial, verificarPressaoAlterada]);

  // Preenchimento automático dos dados do atendimento
  useEffect(() => {
    if (atendimento) {
      setAgendamento(atendimento);
    }

    if (formulario) {
      setFormData(Object.assign(formulario));
    }

    if (atendimento?.TIPOEXAME === "1") {
      setTipoAdmissional(true);
    }
  }, [atendimento, formulario]);

  // Cálculo automático do IMC e classificação
  useEffect(() => {
    const peso = parseFloat(formData.peso.replace(',', '.'));
    const altura = parseFloat(formData.altura.replace(',', '.'));
    
    if (!isNaN(peso) && !isNaN(altura) && altura > 0) {
      const imcValue = (peso / (altura * altura));
      const imc = imcValue.toFixed(2);
      const resultado = classificarIMC(imcValue);
      
      setFormData(prev => ({ 
        ...prev, 
        imc,
        resultadoImc: resultado
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        imc: '',
        resultadoImc: ''
      }));
    }
  }, [formData.peso, formData.altura]);

  // Classificação do IMC
  const classificarIMC = (imc: number): string => {
    if (imc < 18.5) return 'Abaixo do peso';
    if (imc < 25) return 'Peso normal';
    if (imc < 30) return 'Sobrepeso';
    if (imc < 35) return 'Obesidade grau I';
    if (imc < 40) return 'Obesidade grau II';
    return 'Obesidade grau III';
  };

  // Formatação automática da pressão arterial
  const formatarPressaoArterial = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length <= 3) {
      return numbers;
    }
    
    const parte1 = numbers.slice(0, 3);
    const parte2 = numbers.slice(3, 6);
    
    return parte2 ? `${parte1}/${parte2}` : parte1;
  };

  // Formatação automática da altura
  const formatarAltura = (value: string): string => {
    const cleaned = value.replace(/[^\d,]/g, '');
    
    if (cleaned.includes(',')) {
      return cleaned;
    }
    
    if (cleaned.length === 3) {
      return `${cleaned.slice(0, 1)},${cleaned.slice(1)}`;
    }
    
    return cleaned;
  };

  const handleInputChange = useCallback((field: keyof FichaClinicaData, value: any) => {
    let formattedValue = value;

    if (field === 'pressaoArterial') {
      formattedValue = formatarPressaoArterial(value);
    } else if (field === 'altura') {
      formattedValue = formatarAltura(value);
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }));
  }, []);

  const handleMultiSelectChange = useCallback((field: keyof FichaClinicaData, value: string) => {
    setFormData(prev => {
      const currentValues = prev[field] as string[];
      
      // Lógica especial para "Nenhuma" nas doenças familiares
      if (field === 'doencasFamiliares') {
        if (value === 'Nenhuma') {
          // Se clicou em "Nenhuma", limpa todas as outras e marca apenas "Nenhuma"
          return { ...prev, [field]: ['Nenhuma'] };
        } else {
          // Se clicou em outra opção, remove "Nenhuma" se estiver presente
          const newValues = currentValues.includes(value)
            ? currentValues.filter(v => v !== value && v !== 'Nenhuma')
            : [...currentValues.filter(v => v !== 'Nenhuma'), value];
          return { ...prev, [field]: newValues };
        }
      }
      
      // Lógica padrão para outros campos
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [field]: newValues };
    });
  }, []);

  const handleNormalAll = useCallback((checked: boolean) => {
    const normalValue = checked ? 'Normal' : 'Alterado';
    setFormData(prev => ({
      ...prev,
      cabecaPescoco: normalValue,
      torax: normalValue,
      abdome: normalValue,
      coluna: normalValue,
      membrosSuperiores: normalValue,
      membrosInferiores: normalValue
    }));
  }, []);

  const handleSave = useCallback(() => {
    onSave?.(formData);
  }, [formData, onSave]);

  const doencasFamiliaresOptions = [
    "Cardiopatias / Hipertensão",
    "Diabetes",
    "Câncer",
    "Doenças psiquiátricas",
    "Doenças respiratórias",
    "Nenhuma"
  ];

  const doencasPessoaisOptions = [
    "Hipertensão",
    "Diabetes",
    "Doenças osteomusculares (DORT / lombalgia)",
    "Asma / Doença pulmonar",
    "Depressão / Ansiedade",
    "Cirurgias prévias",
    "Outros"
  ];

  const tabagismoOptions = [
    { value: 'Não', label: 'Não' },
    { value: 'Sim - até 10 cigarros/dia', label: 'Sim - até 10 cigarros/dia' },
    { value: 'Sim - >10 cigarros/dia', label: 'Sim - >10 cigarros/dia' }
  ];

  const etilismoOptions = [
    { value: 'Não', label: 'Não' },
    { value: 'Social', label: 'Social' },
    { value: 'Frequente', label: 'Frequente' }
  ];

  const atividadeFisicaOptions = [
    { value: 'Não', label: 'Não' },
    { value: 'Ocasionalmente', label: 'Ocasionalmente' },
    { value: 'Regularmente', label: 'Regularmente' }
  ];

  const acimaPesoOptions = [
    { value: 'Não', label: 'Não' },
    { value: 'Sim', label: 'Sim' }
  ];

  const aptidaoOptions = [
    { value: 'Apto', label: 'Apto' },
    { value: 'Inapto', label: 'Inapto' },
    { value: 'Indefinido', label: 'Indefinido' }
  ];

  const conclusaoOptions = [
    { value: 'Apto', label: 'Apto' },
    { value: 'Inapto Temporariamente', label: 'Inapto Temporariamente' },
    { value: 'Inapto', label: 'Inapto' },
    { value: 'Aguardar Avaliação', label: 'Aguardar Avaliação' }
  ];

  const SectionTitle: React.FC<{ number: string; title: string; icon?: React.ReactNode }> = ({ 
    number, 
    title, 
    icon 
  }) => (
    <div className="flex items-center gap-3 mb-4">
      {icon}
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-gray-900">{title}</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 bg-gray-50 min-h-screen">
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

      {/* 2. Anamnese e Histórico Familiar */}
      {tipoAdmissional && (
        <>
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle 
          number="2" 
          title="Anamnese e Histórico Familiar" 
          icon={<Stethoscope className="h-5 w-5 text-gray-600" />}
        />
        
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Doenças familiares relevantes:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {doencasFamiliaresOptions.map((doenca) => (
                <Checkbox
                  key={doenca}
                  isSelected={formData.doencasFamiliares.includes(doenca)}
                  onValueChange={() => handleMultiSelectChange('doencasFamiliares', doenca)}
                  classNames={{
                    base: "w-full max-w-full hover:bg-gray-100 rounded-lg p-2 transition-colors",
                    label: "text-sm text-gray-700"
                  }}
                >
                  {doenca}
                </Checkbox>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Doenças pessoais / antecedentes:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {doencasPessoaisOptions.map((doenca) => (
                <Checkbox
                  key={doenca}
                  isSelected={formData.doencasPessoais.includes(doenca)}
                  onValueChange={() => handleMultiSelectChange('doencasPessoais', doenca)}
                  classNames={{
                    base: "w-full max-w-full hover:bg-gray-100 rounded-lg p-2 transition-colors",
                    label: "text-sm text-gray-700"
                  }}
                >
                  {doenca}
                </Checkbox>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Já sofreu acidente ou afastamento {'>'} 15 dias?
            </label>
            <RadioGroup
              value={formData.afastamento}
              onValueChange={(value) => handleInputChange('afastamento', value)}
              orientation="horizontal"
              classNames={{
                wrapper: "gap-6"
              }}
            >
              <Radio value="Sim" classNames={{ label: "text-gray-700" }}>Sim</Radio>
              <Radio value="Não" classNames={{ label: "text-gray-700" }}>Não</Radio>
            </RadioGroup>
          </div>

          {formData.afastamento === 'Sim' && (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <label className="block text-sm font-medium text-amber-700 mb-2">
                Observação - Motivo do Acidente/Afastamento:
              </label>
              <Textarea
                value={formData.observacaoAfastamento}
                onChange={(e) => handleInputChange('observacaoAfastamento', e.target.value)}
                rows={3}
                placeholder="Descreva o motivo do acidente ou afastamento prolongado..."
                className="w-full border-amber-300 focus:border-amber-400"
              />
            </div>
          )}
        </div>
      </Card>

      {/* 3. Hábitos e Condições Gerais */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle 
          number="3" 
          title="Hábitos e Condições Gerais" 
          icon={<User className="h-5 w-5 text-gray-600" />}
        />
        
        <div className="space-y-6">
          {/* Tabagismo */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">Tabagismo:</label>
            <div className="flex flex-wrap gap-4">
              {tabagismoOptions.map((option) => (
                <Checkbox
                  key={option.value}
                  isSelected={formData.tabagismo === option.value}
                  onValueChange={(checked) => {
                    if (checked) {
                      handleInputChange('tabagismo', option.value);
                    }
                  }}
                  classNames={{
                    base: "min-w-[200px] hover:bg-gray-100 rounded-lg p-3 transition-colors border border-gray-200",
                    label: "text-sm font-medium text-gray-700"
                  }}
                >
                  {option.label}
                </Checkbox>
              ))}
            </div>
          </div>

          {/* Etilismo */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">Etilismo:</label>
            <div className="flex flex-wrap gap-4">
              {etilismoOptions.map((option) => (
                <Checkbox
                  key={option.value}
                  isSelected={formData.etilismo === option.value}
                  onValueChange={(checked) => {
                    if (checked) {
                      handleInputChange('etilismo', option.value);
                    }
                  }}
                  classNames={{
                    base: "min-w-[120px] hover:bg-gray-100 rounded-lg p-3 transition-colors border border-gray-200",
                    label: "text-sm font-medium text-gray-700"
                  }}
                >
                  {option.label}
                </Checkbox>
              ))}
            </div>
          </div>

          {/* Atividade Física */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Pratica atividade física?
            </label>
            <div className="flex flex-wrap gap-4">
              {atividadeFisicaOptions.map((option) => (
                <Checkbox
                  key={option.value}
                  isSelected={formData.atividadeFisica === option.value}
                  onValueChange={(checked) => {
                    if (checked) {
                      handleInputChange('atividadeFisica', option.value);
                    }
                  }}
                  classNames={{
                    base: "min-w-[140px] hover:bg-gray-100 rounded-lg p-3 transition-colors border border-gray-200",
                    label: "text-sm font-medium text-gray-700"
                  }}
                >
                  {option.label}
                </Checkbox>
              ))}
            </div>
          </div>

          {/* Acima do Peso */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Considera-se acima do peso?
            </label>
            <div className="flex flex-wrap gap-4">
              {acimaPesoOptions.map((option) => (
                <Checkbox
                  key={option.value}
                  isSelected={formData.acimaPeso === option.value}
                  onValueChange={(checked) => {
                    if (checked) {
                      handleInputChange('acimaPeso', option.value);
                    }
                  }}
                  classNames={{
                    base: "min-w-[80px] hover:bg-gray-100 rounded-lg p-3 transition-colors border border-gray-200",
                    label: "text-sm font-medium text-gray-700"
                  }}
                >
                  {option.label}
                </Checkbox>
              ))}
            </div>
          </div>
        </div>
      </Card>
        </>
      )}

      {/* 4. Aptidões Funcionais */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle 
          number="4" 
          title="Aptidões Funcionais" 
          icon={<Briefcase className="h-5 w-5 text-gray-600" />}
        />
        
        <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
          Perguntas voltadas à função laboral — respostas rápidas.
        </p>
        
        <div className="space-y-4">
          {[
            { label: "Trabalho em altura:", field: "trabalhoAltura" as keyof FichaClinicaData },
            { label: "Trabalho em espaço confinado:", field: "trabalhoEspacoConfinado" as keyof FichaClinicaData },
            { label: "Capacidade para carregar peso:", field: "capacidadeCarregarPeso" as keyof FichaClinicaData },
            { label: "Apto a operar veículos:", field: "aptoOperarVeiculos" as keyof FichaClinicaData }
          ].map((item) => (
            <div key={item.field} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <span className="block text-sm font-medium text-gray-700 mb-3">{item.label}</span>
              <div className="flex gap-6">
                {aptidaoOptions.map((option) => (
                  <Checkbox
                    key={option.value}
                    isSelected={formData[item.field] === option.value}
                    onValueChange={(checked) => {
                      if (checked) {
                        handleInputChange(item.field, option.value);
                      }
                    }}
                    classNames={{
                      label: "text-sm text-gray-700"
                    }}
                  >
                    {option.label}
                  </Checkbox>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 5. Exame Clínico */}
      { !exame.includes("Triagem") && (
        <Card className="p-6 shadow-sm border border-gray-200 bg-white">
          <SectionTitle 
            number="5" 
            title="Exame Clínico" 
            icon={<Stethoscope className="h-5 w-5 text-gray-600" />}
          />
          
          <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <Checkbox
              isSelected={Object.values({
                cabecaPescoco: formData.cabecaPescoco,
                torax: formData.torax,
                abdome: formData.abdome,
                coluna: formData.coluna,
                membrosSuperiores: formData.membrosSuperiores,
                membrosInferiores: formData.membrosInferiores
              }).every(value => value === 'Normal')}
              onValueChange={handleNormalAll}
              classNames={{
                label: "text-gray-700 font-medium"
              }}
            >
              Marcar "Normal em todos"
            </Checkbox>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "Cabeça / Pescoço", field: "cabecaPescoco" as keyof FichaClinicaData },
              { label: "Tórax", field: "torax" as keyof FichaClinicaData },
              { label: "Abdome", field: "abdome" as keyof FichaClinicaData },
              { label: "Coluna", field: "coluna" as keyof FichaClinicaData },
              { label: "Membros Superiores", field: "membrosSuperiores" as keyof FichaClinicaData },
              { label: "Membros Inferiores", field: "membrosInferiores" as keyof FichaClinicaData }
            ].map((item) => (
              <div key={item.field} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <span className="block text-sm font-medium text-gray-700 mb-2">{item.label}</span>
                <div className="flex gap-4">
                  <Checkbox
                    isSelected={formData[item.field] === 'Normal'}
                    onValueChange={(checked) => 
                      handleInputChange(item.field, checked ? 'Normal' : 'Alterado')
                    }
                    classNames={{
                      label: "text-gray-700"
                    }}
                  >
                    Normal
                  </Checkbox>
                  <Checkbox
                    isSelected={formData[item.field] === 'Alterado'}
                    onValueChange={(checked) => 
                      handleInputChange(item.field, checked ? 'Alterado' : 'Normal')
                    }
                    classNames={{
                      label: "text-gray-700"
                    }}
                  >
                    Alterado
                  </Checkbox>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 6. Dados Vitais */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle 
          number="6" 
          title="Dados Vitais e Medidas" 
          icon={<FileText className="h-5 w-5 text-gray-600" />}
        />

        {/* Pressões Arteriais */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Pressões Arteriais (mmHg)
            </label>
            <Button
              size="sm"
              color="primary"
              variant="flat"
              onPress={() =>
                setFormData((prev) => ({
                  ...prev,
                  pressaoArterial: [
                    ...(Array.isArray(prev.pressaoArterial) ? prev.pressaoArterial : []),
                    { 
                      valor: "", 
                      horario: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
                      profissional: user?.nome ?? ""
                    }
                  ]
                }))
              }
            >
              + Adicionar Aferição
            </Button>
          </div>

          {(Array.isArray(formData.pressaoArterial) ? formData.pressaoArterial : []).map((pa, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 items-center bg-white p-3 rounded-lg border border-gray-200"
            >
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Valor (mmHg):</label>
                <Input
                  value={pa.valor}
                  onChange={(e) => {
                    const formatted = formatarPressaoArterial(e.target.value);
                    setFormData((prev) => {
                      const novas = [...(Array.isArray(prev.pressaoArterial) ? prev.pressaoArterial : [])];
                      novas[index] = { ...novas[index], valor: formatted };
                      return { ...prev, pressaoArterial: novas };
                    });
                  }}
                  placeholder="120/80"
                  maxLength={7}
                  className="bg-white border-gray-300"
                />
                {pa.valor && verificarPressaoAlterada(pa.valor) && (
                  <p className="text-xs text-red-600 font-medium mt-1">
                    ⚠️ Pressão arterial alterada
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Horário:</label>
                <Input
                  readOnly={true}
                  type="time"
                  value={pa.horario}
                  onChange={(e) => {
                    setFormData((prev) => {
                      const novas = [...(Array.isArray(prev.pressaoArterial) ? prev.pressaoArterial : [])];
                      novas[index] = { ...novas[index], horario: e.target.value };
                      return { ...prev, pressaoArterial: novas };
                    });
                  }}
                  className="bg-white border-gray-300"
                />
              </div>

              <div className="flex justify-end items-end">
                <Button
                  size="sm"
                  color="danger"
                  variant="light"
                  onPress={() => {
                    setFormData((prev) => {
                      const novas = [...(Array.isArray(prev.pressaoArterial) ? prev.pressaoArterial : [])];
                      novas.splice(index, 1);
                      return { ...prev, pressaoArterial: novas };
                    });
                  }}
                >
                  Remover
                </Button>
              </div>
            </div>
          ))}

          {(!formData.pressaoArterial || formData.pressaoArterial.length === 0) && (
            <p className="text-sm text-gray-500">Nenhuma aferição registrada.</p>
          )}
        </div>

        {/* Peso, altura e IMC */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Peso (kg):</label>
            <Input
              type="text"
              inputMode="decimal"
              value={formData.peso}
              onChange={(e) => handleInputChange("peso", e.target.value)}
              placeholder="70,5"
              className="bg-white border-gray-300"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Altura (m):</label>
            <Input
              type="text"
              inputMode="decimal"
              value={formData.altura}
              onChange={(e) => handleInputChange("altura", e.target.value)}
              placeholder="1,75"
              className="bg-white border-gray-300"
            />
            <p className="text-xs text-gray-500 mt-1">Vírgula automática</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">IMC:</label>
            <Input
              value={formData.imc}
              isReadOnly
              className="bg-white border-gray-300"
              placeholder="Calculado automaticamente"
            />
            {formData.resultadoImc && (
              <p
                className={`text-xs font-medium mt-1 ${
                  formData.resultadoImc.includes("normal")
                    ? "text-green-600"
                    : formData.resultadoImc.includes("Abaixo")
                    ? "text-amber-600"
                    : "text-orange-600"
                }`}
              >
                {formData.resultadoImc}
              </p>
            )}
          </div>
        </div>

        {/* Campo de observações médicas para triagem com pressão alterada */}
        {exame.includes("Triagem") && pressaoAlterada && (
          <div className="mt-6 bg-amber-50 p-4 rounded-lg border border-amber-200">
            <label className="block text-sm font-medium text-amber-700 mb-2">
              Observações Médicas (Pressão arterial alterada detectada):
            </label>
            <Textarea
              value={formData.observacoesMedicas}
              onChange={(e) => handleInputChange('observacoesMedicas', e.target.value)}
              rows={3}
              placeholder="Descreva as observações sobre a pressão arterial alterada e as recomendações necessárias..."
              className="w-full border-amber-300 focus:border-amber-400"
            />
            <p className="text-xs text-amber-600 mt-1">
              Campo habilitado devido à detecção de pressão arterial alterada em exame de triagem.
            </p>
          </div>
        )}
      </Card>

      {/* 7. Conclusão */}
      { !exame.includes("Triagem") && (
        <Card className="p-6 shadow-sm border border-gray-200 bg-white">
          <SectionTitle 
            number="7" 
            title="Conclusão Médica" 
            icon={<Calendar className="h-5 w-5 text-gray-600" />}
          />
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">Conclusão:</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {conclusaoOptions.map((option) => (
                  <Checkbox
                    key={option.value}
                    isSelected={formData.conclusao === option.value}
                    onValueChange={(checked) => {
                      if (checked) {
                        handleInputChange('conclusao', option.value);
                      }
                    }}
                    classNames={{
                      base: "w-full hover:bg-gray-100 rounded-lg p-3 transition-colors border border-gray-200",
                      label: "text-sm font-medium text-gray-700"
                    }}
                  >
                    {option.label}
                  </Checkbox>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações Médicas:
              </label>
              <Textarea
                value={formData.observacoesMedicas}
                onChange={(e) => handleInputChange('observacoesMedicas', e.target.value)}
                rows={4}
                placeholder="Digite as observações médicas relevantes..."
                className="w-full bg-white border-gray-300"
              />
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Assinatura digital e CRM serão preenchidos automaticamente no sistema.
            </p>
          </div>
        </Card>
      )}

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
          Salvar / Concluir Atendimento
        </Button>
      </div>
    </div>
  );
};

export default FichaClinicaOcupacional;