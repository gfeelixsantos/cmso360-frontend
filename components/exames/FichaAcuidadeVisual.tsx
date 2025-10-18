import { Button } from "@heroui/react";
import { useState } from "react";


export default function FormularioAcuidadeVisual({ onClose, onSave }: { onClose: () => void; onSave: (data: any) => void }) {
  const [formData, setFormData] = useState({
    olhoEsquerdo: "",
    olhoDireito: "",
    ambosOlhos: "",
    observacoes: "",
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">Formulário - Acuidade Visual</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Olho Esquerdo</label>
            <input
              type="text"
              className="w-full border rounded-md px-3 py-2"
              value={formData.olhoEsquerdo}
              onChange={(e) => setFormData({ ...formData, olhoEsquerdo: e.target.value })}
              placeholder="Ex: 20/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Olho Direito</label>
            <input
              type="text"
              className="w-full border rounded-md px-3 py-2"
              value={formData.olhoDireito}
              onChange={(e) => setFormData({ ...formData, olhoDireito: e.target.value })}
              placeholder="Ex: 20/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ambos os Olhos</label>
            <input
              type="text"
              className="w-full border rounded-md px-3 py-2"
              value={formData.ambosOlhos}
              onChange={(e) => setFormData({ ...formData, ambosOlhos: e.target.value })}
              placeholder="Ex: 20/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Observações</label>
            <textarea
              className="w-full border rounded-md px-3 py-2"
              rows={3}
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            />
          </div>
        </div>
        <div className="flex space-x-2 mt-6">
          <Button onClick={() => onSave(formData)} className="flex-1">
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