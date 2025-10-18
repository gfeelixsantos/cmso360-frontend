import React from 'react';
import { Card, CardBody } from "@heroui/card";
import { AlertTriangle } from "lucide-react";

// Interface para tipagem robusta
interface DisconnectedStateProps {
  /** Mensagem principal de desconexão */
  message?: string;
  /** Mensagem adicional com instruções */
  additionalMessage?: string;
}

// Componente para o ícone de alerta
const AlertIcon: React.FC = () => (
  <AlertTriangle
    className="h-12 w-12 mx-auto mb-4 text-yellow-600"
    aria-hidden="true"
  />
);

// Componente para as mensagens
const MessageContent: React.FC<DisconnectedStateProps> = ({ message, additionalMessage }) => (
  <div className="space-y-2">
    <p className="text-lg font-semibold text-gray-900" role="alert">
      {message}
    </p>
    <p className="text-sm text-gray-600">
      {additionalMessage}
    </p>
  </div>
);

// Componente principal
const DisconnectedState: React.FC<DisconnectedStateProps> = ({
  message = "Sistema Desconectado",
  additionalMessage = 'Selecione uma sala e clique em "Conectar" para visualizar as senhas',
}) => {
  return (
    <section
      className="mt-6"
      aria-label="Estado de desconexão do sistema"
    >
      <Card
        shadow="sm"
        className="bg-white rounded-lg border border-gray-200 shadow-md 
          hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        role="alertdialog"
        aria-describedby="disconnected-message"
      >
        <CardBody className="p-8 text-center">
          <AlertIcon />
          <MessageContent message={message} additionalMessage={additionalMessage} />
        </CardBody>
      </Card>
    </section>
  );
};

export default DisconnectedState;