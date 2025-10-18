import React from 'react';
import { Button } from "@heroui/react";
import { Plus, Search } from "lucide-react";

// Definindo interface para tipagem robusta
interface AtendimentoHeaderProps {
  /** Valor atual do campo de busca */
  buscaSenha: string;
  /** Callback para alterar o valor da busca */
  onSearchChange: (value: string) => void;
  /** Ação ao clicar em "Adicionar atendimento" */
  onAdicionarAtendimento: () => void;
  /** Título opcional (default: "Senhas Emitidas") */
  titulo?: string;
  /** Placeholder opcional do input */
  placeholderBusca?: string;
}

// Componente para o título
const HeaderTitle: React.FC<{ titulo: string; buscaSenha: string }> = ({ titulo, buscaSenha }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
    <h2 className="text-xl font-semibold text-gray-900">{titulo}</h2>
    {buscaSenha && (
      <span className="text-sm text-gray-600" aria-live="polite">
        — Filtrado por: “{buscaSenha}”
      </span>
    )}
  </div>
);

// Componente para o campo de busca
const SearchInput: React.FC<{
  buscaSenha: string;
  onSearchChange: (value: string) => void;
  placeholderBusca?: string;
}> = ({ buscaSenha, onSearchChange, placeholderBusca }) => (
  <div className="relative w-full max-w-xs">
    <label
      htmlFor="busca-senha"
      className="flex items-center text-sm font-medium text-gray-700 mb-1"
    >
      <Search className="h-4 w-4 mr-2 text-gray-500" aria-hidden="true" />
      Buscar Senha
    </label>
    <input
      id="busca-senha"
      type="text"
      value={buscaSenha}
      onChange={(e) => onSearchChange(e.target.value)}
      placeholder={placeholderBusca}
      className="w-full px-3 py-2 pl-10 bg-white border border-gray-300 rounded-md text-sm 
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
        hover:border-blue-400 transition-colors"
      aria-describedby="busca-senha-label"
    />
    <Search
      className="absolute left-3 top-9 h-4 w-4 text-gray-400"
      aria-hidden="true"
    />
  </div>
);

// Componente principal
const AtendimentoHeader: React.FC<AtendimentoHeaderProps> = ({
  buscaSenha,
  onSearchChange,
  onAdicionarAtendimento,
  titulo = "Senhas Emitidas",
  placeholderBusca = "Digite o número da senha...",
}) => {
  return (
    <header
      className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 p-4 bg-white rounded-lg shadow-sm"
      aria-label="Cabeçalho de atendimentos"
    >
      <HeaderTitle titulo={titulo} buscaSenha={buscaSenha} />
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4 sm:mt-0">
        <Button
          onClick={onAdicionarAtendimento}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md 
            hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
            focus:ring-offset-2 transition-colors shadow-sm disabled:bg-blue-300"
          aria-label="Adicionar novo atendimento"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Adicionar atendimento
        </Button>
        <SearchInput
          buscaSenha={buscaSenha}
          onSearchChange={onSearchChange}
          placeholderBusca={placeholderBusca}
        />
      </div>
    </header>
  );
};

export default AtendimentoHeader;