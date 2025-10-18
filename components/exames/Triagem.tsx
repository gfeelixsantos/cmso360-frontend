"use client";
import React, { useEffect } from "react";
import { Card, Input } from "@heroui/react";
import { FileText } from "lucide-react";

interface DadosVitaisProps {
  pressaoArterial: string;
  peso: string;
  altura: string;
  imc: string;
  resultadoImc: string;
  onChange: (field: string, value: string) => void;
  setImc: (imc: string, resultado: string) => void;
}

export const DadosVitais: React.FC<DadosVitaisProps> = ({
  pressaoArterial,
  peso,
  altura,
  imc,
  resultadoImc,
  onChange,
  setImc,
}) => {
  // Formata PA automaticamente
  const formatarPressaoArterial = (value: string): string => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    const parte1 = numbers.slice(0, 3);
    const parte2 = numbers.slice(3, 6);
    return parte2 ? `${parte1}/${parte2}` : parte1;
  };

  // Formata altura automaticamente
  const formatarAltura = (value: string): string => {
    const cleaned = value.replace(/[^\d,]/g, "");
    if (cleaned.includes(",")) return cleaned;
    if (cleaned.length === 3) return `${cleaned.slice(0, 1)},${cleaned.slice(1)}`;
    return cleaned;
  };

  // Classifica IMC
  const classificarIMC = (imc: number): string => {
    if (imc < 18.5) return "Abaixo do peso";
    if (imc < 25) return "Peso normal";
    if (imc < 30) return "Sobrepeso";
    if (imc < 35) return "Obesidade grau I";
    if (imc < 40) return "Obesidade grau II";
    return "Obesidade grau III";
  };

  // Cálculo automático do IMC
  useEffect(() => {
    const pesoNum = parseFloat(peso.replace(",", "."));
    const alturaNum = parseFloat(altura.replace(",", "."));
    if (!isNaN(pesoNum) && !isNaN(alturaNum) && alturaNum > 0) {
      const imcValue = pesoNum / (alturaNum * alturaNum);
      const imcStr = imcValue.toFixed(2);
      setImc(imcStr, classificarIMC(imcValue));
    } else {
      setImc("", "");
    }
  }, [peso, altura]);

  return (
    <Card className="p-6 shadow-sm border border-gray-200 bg-white">
      <div className="flex items-center gap-3 mb-4">
        <FileText className="h-5 w-5 text-gray-600" />
        <div className="flex items-center gap-2">
          {/* <span className="text-lg font-semibold bg-gray-100 text-gray-700 px-3 py-1 rounded-lg">
            6
          </span> */}
          <span className="text-lg font-semibold text-gray-900">
            Dados Vitais e Medidas
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pressão Arterial */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">PA (mmHg):</label>
          <Input
            value={pressaoArterial}
            onChange={(e) => onChange("pressaoArterial", formatarPressaoArterial(e.target.value))}
            placeholder="120/80"
            maxLength={7}
            className="bg-white border-gray-300"
          />
          <p className="text-xs text-gray-500 mt-1">Formato: xxx/xxx</p>
        </div>

        {/* Peso */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">Peso (kg):</label>
          <Input
            type="text"
            inputMode="decimal"
            value={peso}
            onChange={(e) => onChange("peso", e.target.value)}
            placeholder="70,5"
            className="bg-white border-gray-300"
          />
        </div>

        {/* Altura */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">Altura (m):</label>
          <Input
            type="text"
            inputMode="decimal"
            value={altura}
            onChange={(e) => onChange("altura", formatarAltura(e.target.value))}
            placeholder="1,75"
            className="bg-white border-gray-300"
          />
          <p className="text-xs text-gray-500 mt-1">Vírgula automática</p>
        </div>

        {/* IMC */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">IMC:</label>
          <Input
            value={imc}
            isReadOnly
            className="bg-white border-gray-300"
            placeholder="Calculado automaticamente"
          />
          {resultadoImc && (
            <p
              className={`text-xs font-medium mt-1 ${
                resultadoImc.includes("normal")
                  ? "text-green-600"
                  : resultadoImc.includes("Abaixo")
                  ? "text-amber-600"
                  : "text-orange-600"
              }`}
            >
              {resultadoImc}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};
