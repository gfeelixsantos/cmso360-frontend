"use client";

import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
} from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Button, Snippet, Spinner, Alert, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import {
  ClipboardList,
  User,
  Building2,
  Ticket as TicketIcon,
  Check,
  Clock,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { emitEvent, EventType } from "@/lib/websocket/events/events";
import { Socket } from "socket.io-client";
import { PreparationRequestTypes } from "@/lib/websocket/enums/websocket.enum";
import { IndexDb } from "@/lib/indexDb/indexdb";
import { PreparationRequest, Ticket } from "@/lib/ticket/ticket";


interface PreparationCardProps {
  request: PreparationRequest;
  ticket?: Ticket;
  onAttachments?: () => void;
  onComplete?: () => void;
  disabled: boolean
}

export function PreparationCard({ request, ticket, onAttachments, onComplete, disabled }: PreparationCardProps) {
  const [nomeEmpresa, setNomeEmpresa] = useState<string>();

  const waitingMinutes = ticket?.emissao
    ? Math.floor((Date.now() - new Date(ticket.emissao).getTime()) / 60000)
    : 0;

  // Define status com base no tempo de espera
  let statusColor: "default" | "danger" | "warning" = "default";
  if (waitingMinutes > 60) statusColor = "danger";
  else if (waitingMinutes > 30) statusColor = "warning";

  const getRazaoSocialByIndexDb = async () => {
    const empresa = await IndexDb.getCompanyById(request.empresa);
    if (empresa) setNomeEmpresa(empresa.RAZAOSOCIAL);
  };

  useEffect(() => {
    getRazaoSocialByIndexDb();
  }, [request]);

  return (
    <Card
      shadow="md"
      className={`w-full rounded-xl transition-all duration-200 hover:shadow-lg border-2 ${
        statusColor === "danger"
          ? "border-red-400"
          : statusColor === "warning"
          ? "border-yellow-400"
          : "border-gray-200"
      }`}
    >
      <CardHeader className="flex flex-col gap-2 font-bold">
        <Alert
          title={request.nome}
          color={statusColor as any}
          variant="solid"
          description=
            {<span className="flex gap-2  text-xs">
              {request.tipoExame}
            </span> 
            }
        />
        <Snippet
          hideSymbol
          variant="bordered"
          size="sm"
          color="default"
          tooltipProps={{ color: "foreground", content: "Copiar", disableAnimation: true }}
          className="w-full"
        >
          <p className="text-xs">{nomeEmpresa ?? "Empresa não encontrada"}</p>
        </Snippet>
      </CardHeader>

      <CardBody className="p-1 space-y-4">
        {/* Informações principais */}
        <div className="flex gap-3">
          <InfoItem
            
            label="Nascimento"
            value={request.dataNascimento}
            copyable
          />
          <InfoItem
            
            label="CPF"
            value={request.cpf}
            copyable
          />
        </div>
        <div>
          <InfoItem
            label="Informações"
            value={request.informacoes || "-"}
            fullWidth
          />
        </div>

        {/* Ticket */}
        {ticket && (
          <>
            <Divider />
            <div className="p-1 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-default-700">
                  Senha { ticket.preferencial ? <Chip color="danger" className="text-xs">PREFERENCIAL</Chip> : "" }
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoItem
                  icon={<TicketIcon className="w-4 h-4" />}
                  label="Número"
                  value={`${ticket.prefixo}${ticket.numero ?? ""}`}
                />
                <InfoItem
                  icon={<Clock className="w-4 h-4" />}
                  label="Espera"
                  value={`${waitingMinutes} min`}
                />
                <InfoItem
                  icon={<Building2 className="w-4 h-4" />}
                  label="Unidade"
                  value={ticket.unidade}
                />
                {request.sala && (
                  <InfoItem
                    icon={<ClipboardList className="w-4 h-4" />}
                    label="Sala"
                    value={request.sala}
                  />
                )}
                {request.atendente && (
                  <InfoItem
                    icon={<User className="w-4 h-4" />}
                    label="Atendente"
                    value={request.atendente}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </CardBody>

      <CardFooter className="flex sm:flex-row gap-3 p-5 pt-0">
        <div className="flex flex-wrap gap-2 w-full">
          <Button
            color="success"
            variant="light"
            fullWidth={true}
            onPress={onComplete}
            disabled={disabled}
            className="flex-1 sm:flex-none text-xs"
            startContent={<Check className="w-3 h-3" />}
          >
            Finalizar
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

interface InfoItemProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number | null | undefined;
  fullWidth?: boolean;
  copyable?: boolean;
}

function InfoItem({ icon, label, value, fullWidth = false, copyable = false }: InfoItemProps) {
  return (
    <div
      className={`flex items-start gap-2 ${
        fullWidth ? "sm:col-span-2" : ""
      }`}
    >
      <span className="text-default-500 mt-0.5 flex-shrink-0">{icon}</span>
      <div className="flex-1">
        <p className="text-xs text-default-600 mb-0.5">{label}</p>
        {copyable ? (
          <Snippet
            hideSymbol
            variant="bordered"
            size="sm"
            color="default"
            tooltipProps={{ color: "foreground", content: "Copiar", disableAnimation: true }}
          >
            <p className="text-xs font-medium text-default-800 truncate">
              {value ?? "-"}
            </p>
          </Snippet>
        ) : (
          <p className="text-xs font-medium text-default-800 truncate">
            {value ?? "-"}
          </p>
        )}
      </div>
    </div>
  );
}

/* ========== GRID ========== */
interface PreparationGridProps {
  requests: PreparationRequest[];
  socket: Socket;
}

export function PreparationGrid({ requests, socket }: PreparationGridProps) {
  const [requestToConfirm, setRequestToConfirm] = useState<PreparationRequest | null>(null);

  const handleAttachments = (request: PreparationRequest) => {
    console.log("Anexos para:", request.nome);
  };

  const handleComplete = (requestComplete: PreparationRequest) => {
    setRequestToConfirm(requestComplete); // abre o modal de confirmação
  };

  const handleConfirm = () => {
    if (requestToConfirm) {
      emitEvent(socket, EventType.PREPARATION_REQUEST, {
        type: PreparationRequestTypes.FINISHED,
        request: requestToConfirm,
      });
      setRequestToConfirm(null); // fecha o modal
    }
  };

  const handleCancel = () => {
    setRequestToConfirm(null); // fecha o modal
  };

  return (
    <>
      {requests.length > 0 ? (
        <div className="px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl font-bold mb-6">Solicitações de preparo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {requests.map((req, idx) => (
              <PreparationCard
                key={idx}
                request={req}
                ticket={req.ticket}
                onAttachments={() => handleAttachments(req)}
                onComplete={() => handleComplete(req)}
                disabled={!!requestToConfirm}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex text-center justify-center mt-16 gap-6">
          <Spinner size="lg" variant="default" color="success" />
          <h3 className="text-2xl">Sem solicitações...</h3>
        </div>
      )}

      {/* Modal de confirmação do HeroUI */}
      <Modal 
        isOpen={!!requestToConfirm} 
        onOpenChange={handleCancel}
        disableAnimation={true}
        isDismissable={false}
      >
        <ModalContent>
          <ModalHeader>Confirmar</ModalHeader>
          <ModalBody>
            {requestToConfirm && (
              <p>Finalizar a documentação de <strong>{requestToConfirm.nome}</strong>?</p>
            )}
          </ModalBody>
          <ModalFooter className="flex justify-end gap-2">
            <Button variant="ghost" color="danger" size="sm" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button variant="ghost" color="primary" size="sm" onClick={handleConfirm}>
              Confirmar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
