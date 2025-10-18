import { Button } from "@heroui/react";
import { useState } from "react";


export default function FormularioAudiometria({ onClose, onSave }: { onClose: () => void; onSave: (data: any) => void }){
  const [formData, setFormData] = useState({
    orelhaEsquerda: "",
    orelhaDireita: "",
    observacoes: "",
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">Formulário - Audiometria</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Orelha Esquerda (dB)</label>
            <input
              type="text"
              className="w-full border rounded-md px-3 py-2"
              value={formData.orelhaEsquerda}
              onChange={(e) => setFormData({ ...formData, orelhaEsquerda: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Orelha Direita (dB)</label>
            <input
              type="text"
              className="w-full border rounded-md px-3 py-2"
              value={formData.orelhaDireita}
              onChange={(e) => setFormData({ ...formData, orelhaDireita: e.target.value })}
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