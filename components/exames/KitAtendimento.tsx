import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Input, Spinner, Radio, RadioGroup, Textarea } from "@heroui/react";
import { useUser } from '@/hooks/useUser';
import { ExamRegister, Scheduling } from '@/lib/scheduling/interface/scheduling';
import { User, Clock, FileText, AlertTriangle, MessageSquare, Package } from 'lucide-react';
import HeaderExame from './HeaderExame';

interface KitAtendimentoProps {
  atendimento: any;
  exame: string;
  formulario: any;
  onSave?: (data: any) => void;
  onClose?: () => void;
}

interface ExameFiltrado extends ExamRegister {
  realizado?: boolean;
}

const KitAtendimento: React.FC<KitAtendimentoProps> = ({ 
  atendimento, 
  exame,
  formulario,
  onSave, 
  onClose 
}) => {
  const [agendamento, setAgendamento] = useState<Scheduling>();
  const [examesFiltrados, setExamesFiltrados] = useState<ExameFiltrado[]>([]);
  const [loading, setLoading] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  const [numeroFichas, setNumeroFichas] = useState('');
  const [fichasEntregues, setFichasEntregues] = useState(false);

  // Preenchimento automático dos dados do atendimento
  useEffect(() => {
    if (atendimento) {
      setAgendamento(atendimento);
      filtrarExamesPorGrupo(atendimento, exame);
      
      // Preenche o campo de observações com o valor existente, se houver
      if (atendimento.ANOTACOES) {
        setObservacoes(atendimento.ANOTACOES);
      }
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
      realizado: true // Inicializa como realizado
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
    if (!fichasEntregues) {
      alert('Por favor, confirme que as fichas foram entregues pelo funcionário antes de concluir o atendimento.');
      return;
    }

    const anotacoesExistentes = agendamento?.ANOTACOES || '';
    const observacoesCompleta = `KIT ATENDIMENTO - Fichas entregues: ${numeroFichas || 'Não informado'}\n${observacoes ? '\n' + observacoes : ''}`;
    
    const anotacoesFinais = anotacoesExistentes 
      ? `${anotacoesExistentes}\n${observacoesCompleta}`
      : observacoesCompleta;
    
    onSave?.({ 
      status: 'concluded',
      anotacoes: anotacoesFinais,
      fichasEntregues: true,
      numeroFichas: numeroFichas
    });
  }, [onSave, observacoes, agendamento?.ANOTACOES, fichasEntregues, numeroFichas]);

  const SectionTitle: React.FC<{ number?: string; title: string; icon?: React.ReactNode }> = ({ 
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
      {/* Alerta de Kit Atendimento */}
      <Card className="p-6 shadow-sm border border-amber-200 bg-amber-50">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <Package className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-800 text-lg mb-2">
              KIT ATENDIMENTO - Procedimento Especial
            </h3>
            <p className="text-amber-700 text-sm leading-relaxed">
              <strong>Importante:</strong> Este atendimento utiliza fichas específicas fornecidas pela empresa. 
              Certifique-se de utilizar as fichas entregues pelo funcionário para realizar o procedimento.
            </p>
          </div>
        </div>
      </Card>

      {/* Header */}
      <HeaderExame 
        agendamento={agendamento}
        exame={exame}
      />

      {/* 2. Exames Filtrados por Grupo */}
      {examesFiltrados.length > 0 && (
        <Card className="p-6 shadow-sm border border-gray-200 bg-white">
          <SectionTitle 
            title={`Exame(s) - Realizar nas Fichas do Kit`} 
          />
          
          <div className="space-y-4">
            {examesFiltrados.map((exameItem, index) => (
              <div 
                key={exameItem.sequencialResultadoExame || index}
                className="rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 text-sm mb-1">
                      {exameItem.nomeExame}
                    </h4>
                    <p className="text-xs text-blue-600 font-medium">
                      📋 Realizar na ficha específica do kit
                    </p>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <RadioGroup
                      color='success'
                      label="Exame realizado na ficha?"
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
            
            <div className="space-y-3 mt-6">
              <Textarea
                label="Observações do atendimento (Kit)"
                placeholder="Ex: Fichas em bom estado, procedimento realizado conforme orientação..."
                value={observacoes}
                onValueChange={setObservacoes}
                minRows={3}
                classNames={{
                  base: "w-full",
                  label: "text-sm font-medium text-gray-700"
                }}
              />
            </div>
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
          disabled={!fichasEntregues}
          className="px-8 bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          startContent={<FileText className="h-4 w-4" />}
        >
          {fichasEntregues ? 'Concluir Atendimento' : 'Confirme as Fichas'}
        </Button>
      </div>
    </div>
  );
};

export default React.memo(KitAtendimento);