import { Button } from "@heroui/react";
import { useState } from "react";


export default function FormularioGenerico ({
  tipoExame,
  onClose,
  onSave,
}: { tipoExame: string; onClose: () => void; onSave: (data: any) => void }) {
  const [observacoes, setObservacoes] = useState("")

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">Formulário - {tipoExame}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Resultado</label>
            <select className="w-full border rounded-md px-3 py-2">
              <option>Normal</option>
              <option>Alterado</option>
              <option>Inconclusivo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Observações</label>
            <textarea
              className="w-full border rounded-md px-3 py-2"
              rows={4}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Descreva os resultados e observações do exame..."
            />
          </div>
        </div>
        <div className="flex space-x-2 mt-6">
          <Button onClick={() => onSave({ resultado: "Normal", observacoes })} className="flex-1">
            Salvar
          </Button>
          <Button  onClick={onClose} className="flex-1 bg-transparent">
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  )
}