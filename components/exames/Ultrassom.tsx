import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Textarea, RadioGroup, Radio } from "@heroui/react";
import { useUser } from '@/hooks/useUser';
import { Scheduling } from '@/lib/scheduling/interface/scheduling';
import { FileText, Scan } from 'lucide-react';
import HeaderExame from './HeaderExame';

interface UltrassomProps {
  atendimento: any;
  exame: string;
  formulario: any;
  onSave?: (data: any) => void;
  onClose?: () => void;
}

interface UltrassomData {
  normal: string;
  observacoes: string;
}

const Ultrassom: React.FC<UltrassomProps> = ({ 
  atendimento, 
  exame,
  formulario,
  onSave, 
  onClose 
}) => {
  const user = useUser();
  const [agendamento, setAgendamento] = useState<Scheduling>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<UltrassomData>({
    normal: 'Sim',
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

  const handleInputChange = useCallback((field: keyof UltrassomData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await onSave?.(formData);
    } catch (error) {
      console.error('Erro ao salvar ultrassom:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSave]);

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
      <HeaderExame 
        agendamento={agendamento}
        exame={exame}
      />

      {/* 2. Resultado do Exame */}
      <Card className="p-6 shadow-sm border border-gray-200 bg-white">
        <SectionTitle 
          number="2" 
          title="Resultado do Ultrassom" 
        />
        
        <div className="space-y-6">
          <div className="p-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  EXAME NORMAL ?
                </label>
                <RadioGroup
                  color="success"
                  value={formData.normal}
                  onValueChange={(value) => handleInputChange('normal', value)}
                  orientation="horizontal"
                  classNames={{ wrapper: "flex gap-6" }}
                >
                  <Radio value="Sim">Sim</Radio>
                  <Radio value="Não">Não</Radio>
                </RadioGroup>
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
          disabled={isSubmitting}
          className="px-8 border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancelar
        </Button>
        <Button
          color="primary"
          onPress={handleSave}
          disabled={isSubmitting}
          className="px-8 bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
          startContent={isSubmitting ? null : <FileText className="h-4 w-4" />}
        >
          {isSubmitting ? 'Salvando...' : 'Salvar / Concluir Exame'}
        </Button>
      </div>
    </div>
  );
};

export default Ultrassom;