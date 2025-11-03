import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Button, Input, Select, SelectItem, Textarea, RadioGroup, Radio, Checkbox, Spinner } from "@heroui/react";
import { useUser } from '@/hooks/useUser';
import { Scheduling } from '@/lib/scheduling/interface/scheduling';
import { User, Stethoscope, Heart, FileText, Eye, EyeOff } from 'lucide-react';
import HeaderExame from './HeaderExame';

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
  }, [setFormData]);

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



const handleSave = useCallback(() => {
  onSave?.(formData);
}, [onSave, formData]);

  const SectionTitle: React.FC<{ number: string; title: string; icon?: React.ReactNode }> = ({ 
    number, 
    title,
    icon 
  }) => (
    <div className="flex items-start gap-3 mb-4">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 min-h-screen">
      {/* Header */}
      <HeaderExame 
        agendamento={agendamento}
        exame={exame}
      />

      {/* 2. Histórico Respiratório e Tabagismo */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle 
          number="2" 
          title="Histórico Respiratório e Tabagismo" 
        />
        
        <div className="space-y-6">
          <div className="p-4">
            <div className="space-y-4">
              <div>
                <Checkbox
                  color='success'
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
                      Fumou hoje? Há quanto tempo?
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
          <div className="p-4">
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
                    color='success'
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
        />
        
        <div className="space-y-6">
          <div className="p-4">
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
                    color="success"
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
        />
        
        <div className="space-y-6">
          <div className="p-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Já trabalhou em ambiente com poeira, fumaça ou vapores químicos por um ano ou mais?
                </label>
                <RadioGroup
                  color='success'
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
                  color='success'
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
        />
        
        <div className="space-y-6">
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