import React, { useEffect } from 'react';
import { Card } from "@heroui/react";
import { Clock } from "lucide-react";

import { Socket } from "socket.io-client";
import { PreparationRequest, Ticket } from '@/lib/ticket/ticket';
import { Scheduling } from '@/lib/scheduling/interface/scheduling';
import AtendimentoSection from './AtendimentoSection';
import AtendimentoCardCompacto from './AtendimentoCardCompacto';
import AtendimentoCardCompact from './AtendimentoCardCompacto';


// Interface para tipagem robusta
interface SenhasListProps {
  // /** Lista ordenada de todas as senhas */
  // senhasOrdenadas: Ticket[];
  // /** Lista de senhas preferenciais */
  // senhasPreferenciais: Ticket[];
  // /** Lista de senhas com prefixo */
  // senhasComPrefixo: Ticket[];
  // /** Lista de senhas normais */
  // senhasNormais: Ticket[];

  // senhasEmAtendimento: Ticket[]


  /** Lista ordenada de todas as senhas */
  senhasOrdenadas: Scheduling[];
  /** Lista de senhas preferenciais */
  senhasPreferenciais: Scheduling[];
  /** Lista de senhas com prefixo */
  senhasComPrefixo: Scheduling[];
  /** Lista de senhas normais */
  senhasNormais: Scheduling[];

  senhasEmAtendimento: Scheduling[]

  /** Set ticket clicado */
  setTicketSelecionado: (ticket: Ticket | null) => void

  setFuncionarioSelecionado:(funcionario: Scheduling | null) => void
  /** Instância do socket */
  socket: Socket;
  /** Sala atualmente selecionada */
  salaSelecionada: string;

  codigosDeAtendimento: Set<string>
  /** Unidade atualmente selecionada */
  unidadeSelecionada: string;

  // agendamentos: Scheduling[]

   onHandleModal: (state: Boolean) => void

   onPreparationRequests: PreparationRequest[];

   preparacoesFinalizadas: PreparationRequest[];

   exameSelecionado: string;
}

// Componente para o estado vazio
const EmptyState: React.FC<{ buscaSenha?: string }> = ({ buscaSenha }) => (
  <Card
    className="bg-white rounded-lg border border-gray-200 shadow-md p-8 text-center 
      transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    role="alertdialog"
    aria-describedby="empty-senhas-description"
  >
    <div className="text-gray-600">
      <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" aria-hidden="true" />
      <p className="text-lg font-semibold text-gray-900 mb-2">Nenhuma senha encontrada</p>
      <p className="text-sm">
        {buscaSenha ? "Tente uma busca diferente" : "Ajuste os filtros para ver mais resultados"}
      </p>
    </div>
  </Card>
);

// Componente principal
const AtendimentoList: React.FC<SenhasListProps> = ({
  senhasOrdenadas,
  senhasPreferenciais,
  senhasComPrefixo,
  senhasNormais,
  senhasEmAtendimento,
  setTicketSelecionado,
  socket,
  salaSelecionada,
  codigosDeAtendimento,
  unidadeSelecionada,
  setFuncionarioSelecionado,
  onHandleModal,
  exameSelecionado,
}) => {
  if (senhasOrdenadas.length === 0) {
    return <EmptyState />;
  }

  useEffect(() => {
    console.log("Atendimento List", senhasOrdenadas)
  }, [senhasOrdenadas])

  return (
    <section
      className="space-y-6 p-4 bg-gray-50 rounded-lg flex gap-4"
      aria-label="Lista de senhas organizadas por categoria"
    >
      <div className='w-screen'>
        { senhasPreferenciais.length > 0 && (
          <AtendimentoSection
            key="senhas-preferenciais"
            title={`Preferencial: ${senhasPreferenciais.length}`}
            senhas={senhasPreferenciais}
            emptyMessage="Nenhuma"
            setTicketSelecionado={setTicketSelecionado}
            socket={socket}
            salaSelecionada={salaSelecionada}
            codigosDeAtendimento={codigosDeAtendimento}
            unidadeSelecionada={unidadeSelecionada}
            setFuncionarioSelecionado={setFuncionarioSelecionado}
            onHandleModal={onHandleModal}
            exameSelecionado={exameSelecionado}
          />
        )}
        { senhasComPrefixo.length > 0 && (
          <AtendimentoSection
            key="senhas-prioridade"
            title={`Prioridade: ${senhasComPrefixo.length}`}
            senhas={senhasComPrefixo}
            emptyMessage="Nenhuma"
            setTicketSelecionado={setTicketSelecionado}
            socket={socket}
            salaSelecionada={salaSelecionada}
            codigosDeAtendimento={codigosDeAtendimento}
            unidadeSelecionada={unidadeSelecionada}
            setFuncionarioSelecionado={setFuncionarioSelecionado}
            onHandleModal={onHandleModal}
            exameSelecionado={exameSelecionado}
          />
        )}
        <AtendimentoSection
          key="senhas-normais"
          title={`Atendimento: ${senhasNormais.length}`}
          senhas={senhasNormais}
          emptyMessage="Nenhuma"
          setTicketSelecionado={setTicketSelecionado}
          socket={socket}
          salaSelecionada={salaSelecionada}
          codigosDeAtendimento={codigosDeAtendimento}
          unidadeSelecionada={unidadeSelecionada}
          setFuncionarioSelecionado={setFuncionarioSelecionado}
          onHandleModal={onHandleModal}
          exameSelecionado={exameSelecionado}
        />
      </div>
      <div className='w-md mb-2'>
        { senhasEmAtendimento.map(atend => (
            <AtendimentoCardCompacto
              key={`compacto-${atend._id}`}
              atendimento={atend}
            // title={`Em exame (${senhasEmAtendimento.length})`}
            // senhas={senhasEmAtendimento}
            // emptyMessage="Nenhuma"
            // setTicketSelecionado={setTicketSelecionado}
            // socket={socket}
            // salaSelecionada={salaSelecionada}
            // codigosDeAtendimento={codigosDeAtendimento}
            // unidadeSelecionada={unidadeSelecionada}
            // setFuncionarioSelecionado={setFuncionarioSelecionado}
            // onHandleModal={onHandleModal}
          />
        ))}
      </div>
    </section>
  );
};

export default AtendimentoList;