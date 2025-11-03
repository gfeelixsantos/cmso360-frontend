import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Input, Spinner, Radio, RadioGroup } from "@heroui/react";
import { useUser } from '@/hooks/useUser';
import { ExamRegister, Scheduling } from '@/lib/scheduling/interface/scheduling';
import { User, Clock, FileText, Calendar, Building, Briefcase, MapPin, Filter } from 'lucide-react';
import { formatCPF } from '@/lib/utils';
import HeaderExame from './HeaderExame';

interface ExamePadraoProps {
  atendimento: any;
  exame: string;
  formulario: any;
  onSave?: (data: any) => void;
  onClose?: () => void;
}

interface ExameFiltrado extends ExamRegister {
  realizado?: boolean;
}

const ExamePadrao: React.FC<ExamePadraoProps> = ({ 
  atendimento, 
  exame,
  formulario,
  onSave, 
  onClose 
}) => {
  const [agendamento, setAgendamento] = useState<Scheduling>();
  const [examesFiltrados, setExamesFiltrados] = useState<ExameFiltrado[]>([]);
  const [loading, setLoading] = useState(false);

  // Preenchimento automático dos dados do atendimento
  useEffect(() => {
    if (atendimento) {
      setAgendamento(atendimento);
      filtrarExamesPorGrupo(atendimento, exame);
    }
  }, [atendimento, exame, formulario]);

  // Função para filtrar exames pelo grupo recebido via prop
  const filtrarExamesPorGrupo = useCallback((atendimentoData: any, grupoExame: string) => {
    if (!atendimentoData?.EXAMES || !grupoExame) {
      setExamesFiltrados([]);
      return;
    }

    const examesFiltrados = atendimentoData.EXAMES.filter((exameItem: any) => 
      exameItem.grupo?.toLowerCase() === grupoExame.toLowerCase()
    ).map((exameItem: any) => ({
      ...exameItem,
      realizado: true // Inicializa como não realizado
    }));

    setExamesFiltrados(examesFiltrados);
  }, []);

  // Função para atualizar o status de realização do exame
  const handleRealizacaoExameChange = useCallback((sequencialResultadoExame: string, realizado: boolean) => {
    setExamesFiltrados(prev => 
      prev.map(exame => 
        exame.sequencialResultadoExame === sequencialResultadoExame 
          ? { ...exame, realizado }
          : exame
      )
    );
  }, []);

  const handleSave = useCallback(() => {

    onSave?.({ 
      status: 'concluded',
    });


  }, [examesFiltrados, onSave]);

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
    <div className="max-w-4xl mx-auto p-6 space-y-6 min-h-screen">
      {/* Header */}
      <HeaderExame 
        agendamento={agendamento}
        exame={exame}
      />

      {/* 2. Exames Filtrados por Grupo */}
      {examesFiltrados.length > 0 && (
        <Card className="p-6 shadow-sm border border-gray-200 bg-white">
          <SectionTitle 
            number="2" 
            title={`Exame(s)`} 
          />
          
          <div className="space-y-4">
            {examesFiltrados.map((exameItem, index) => (
              <div 
                key={exameItem.sequencialResultadoExame || index}
                className="rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 text-sm mb-1">
                      {exameItem.nomeExame}
                    </h4>
                    {/* <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                      <span>Código: {exameItem.codigoExame}</span>
                      {exameItem.sequencialResultadoExame && (
                        <span>Sequencial: {exameItem.sequencialResultadoExame}</span>
                      )}
                    </div> */}
                  </div>
                  
                  <div className="flex-shrink-0">
                    <RadioGroup
                      color='success'
                      label="Exame realizado?"
                      orientation="horizontal"
                      value={exameItem.realizado ? "sim" : "nao"}
                      onValueChange={(value) => 
                        handleRealizacaoExameChange(
                          exameItem.sequencialResultadoExame!, 
                          value === "sim"
                        )
                      }
                      classNames={{
                        base: "flex gap-4",
                        label: "text-sm font-medium text-gray-700"
                      }}
                    >
                      <Radio value="sim" classNames={{ label: "text-sm" }}>
                        Sim
                      </Radio>
                      <Radio value="nao" classNames={{ label: "text-sm" }}>
                        Não
                      </Radio>
                    </RadioGroup>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Card Informativo */}
      <Card className="p-5 shadow-md border border-blue-200 bg-blue-50">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <Clock className="h-6 w-6 text-blue-600 mt-1" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-800 mb-2">
              {examesFiltrados.length > 0 ? 'Confirmação de Exames' : 'Atendimento em Andamento'}
            </h3>
            <p className="text-blue-700 text-sm leading-relaxed">
              {examesFiltrados.length > 0 
                ? `Os resultados detalhados serão lançados posteriormente no sistema.`
                : 'Este exame não possui questionário digital. O atendimento está sendo realizado e os resultados serão lançados posteriormente no sistema pelo profissional responsável.'
              }
            </p>
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
          Concluir Atendimento
        </Button>
      </div>
    </div>
  );
};

export default React.memo(ExamePadrao);