"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Autocomplete,
  AutocompleteItem,
  Select,
  SelectItem,
  addToast
} from "@heroui/react";
import { FileClock } from "lucide-react";
import { IndexDb } from "@/lib/indexDb/indexdb";
import { CadastroEmpresa } from "@/lib/soc/interfaces/CadastroEmpresa";
import { Ticket, PreparationRequest } from "@/lib/ticket/ticket";
import { formatBrithdayDate, formatCPF, getCurrentUser } from "@/lib/utils";
import { Socket } from "socket.io-client";
import { TIPOS_EXAME } from "@/config/constants";
import { IUserInfo } from "@/lib/user/interfaces/IUser";
import { emitEvent, EventType } from "@/lib/websocket/events/events";
import { PreparationRequestTypes } from "@/lib/websocket/enums/websocket.enum";
import React from "react";
import { SchedulingClass } from "@/lib/scheduling/model/scheduling";
import { Scheduling } from "@/lib/scheduling/interface/scheduling";

interface EmPreparacaoModalProps {
  isOpen: boolean;
  onOpenChange: React.Dispatch<React.SetStateAction<boolean>>;
  ticket: Ticket;
  unidadeSelecionada: string;
  socket: Socket;
  salaSelecionada: string;
  funcionario?: Scheduling;
}

// Memoized Inputs
const NomeInput = React.memo(({ value, onChange }: { value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
  <Input
    label="Nome"
    value={value}
    onChange={onChange}
    size="sm"
    classNames={{ input: "uppercase" }}
  />
));

const CpfInput = React.memo(({ value, onChange, isInvalid, errorMessage }: any) => (
  <Input
    label="CPF"
    placeholder="000.000.000-00"
    value={value}
    onChange={onChange}
    isInvalid={isInvalid}
    errorMessage={errorMessage}
    size="sm"
  />
));

const DataNascimentoInput = React.memo(({ value, onChange }: any) => (
  <Input
    label="Data Nasc."
    placeholder="DD/MM/AAAA"
    value={value}
    onChange={onChange}
    size="sm"
  />
));

export default function EmPreparacaoModal({
  isOpen,
  onOpenChange,
  ticket,
  unidadeSelecionada,
  socket,
  salaSelecionada,
  funcionario,
}: EmPreparacaoModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [currentUser, setCurrentUser] = useState<IUserInfo>();
  const [empresasSoc, setEmpresasSoc] = useState<CadastroEmpresa[]>([]);
  const [solicitacao, setSolicitacao] = useState<PreparationRequest>({
    empresa: "",
    nome: "",
    dataNascimento: "",
    cpf: "",
    tipoExame: "",
    informacoes: "",
    ticketId: undefined,
    unidade: unidadeSelecionada,
    atendente: "",
    sala: ""
  });

  // Memoized values
  const tiposExames = useMemo(() => Object.values(TIPOS_EXAME), []);
  const isCpfValid = useMemo(() => /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(solicitacao.cpf), [solicitacao.cpf]);
  const isFormValid = useMemo(() =>
    isCpfValid &&
    solicitacao.tipoExame !== "" &&
    solicitacao.dataNascimento !== "" &&
    solicitacao.empresa !== "" &&
    solicitacao.nome !== "",
    [isCpfValid, solicitacao.tipoExame, solicitacao.dataNascimento, solicitacao.empresa, solicitacao.nome]
  );

  // Memoize empresa items
  const empresaItems = useMemo(() => {
    return empresasSoc.map(item => (
      <AutocompleteItem key={item.CODIGO} textValue={item.RAZAOSOCIAL}>
        {item.RAZAOSOCIAL}
      </AutocompleteItem>
    ));
  }, [empresasSoc]);

  const exameItems = useMemo(() => {
    return tiposExames.map(tipo => (
      <SelectItem key={tipo}>{tipo}</SelectItem>
    ));
  }, [tiposExames]);

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      setLoadingData(true);
      const loadInitialData = async () => {
        const [companies, user] = await Promise.all([
          IndexDb.getCompanies(),
          Promise.resolve(getCurrentUser())
        ]);
        setEmpresasSoc(companies);
        if (user) setCurrentUser(user);
        setLoadingData(false);
      };
      loadInitialData();

      if(funcionario) {
        // Completa formulário se funcionário vier do modal

        setSolicitacao({
          empresa: funcionario.CODIGOEMPRESA,
          nome: funcionario.NOME,
          dataNascimento: funcionario.DATAAGENDAMENTO,
          cpf: formatCPF(funcionario.CPFFUNCIONARIO),
          tipoExame: TIPOS_EXAME[funcionario.TIPOEXAMENOME],
          informacoes: "",
          ticketId: ticket.id,
          unidade: unidadeSelecionada,
          atendente: currentUser?.nome ?? "",
          sala: salaSelecionada
        });
      }
      else
      {
        // Reset form ao abrir
        setSolicitacao({
          empresa: "",
          nome: "",
          dataNascimento: "",
          cpf: "",
          tipoExame: "",
          informacoes: "",
          ticketId: undefined,
          unidade: unidadeSelecionada,
          atendente: "",
          sala: salaSelecionada
        });
      }
    }
  }, [isOpen, unidadeSelecionada, salaSelecionada]);

  // Handlers
  const handleFieldChange = useCallback((field: keyof PreparationRequest, value: string) => {
    setSolicitacao(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleNomeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFieldChange("nome", e.target.value.toUpperCase());
  }, [handleFieldChange]);

  const handleCpfChange = useCallback((value: string) => {
    const numeric = value.replace(/\D/g, "").slice(0, 11);
    let formatted = numeric;
    if (numeric.length > 9) formatted = `${numeric.slice(0,3)}.${numeric.slice(3,6)}.${numeric.slice(6,9)}-${numeric.slice(9)}`;
    else if (numeric.length > 6) formatted = `${numeric.slice(0,3)}.${numeric.slice(3,6)}.${numeric.slice(6)}`;
    else if (numeric.length > 3) formatted = `${numeric.slice(0,3)}.${numeric.slice(3)}`;
    setSolicitacao(prev => ({ ...prev, cpf: formatted }));
  }, []);



  const handleFinalizarSolicitacao = useCallback(() => {
    if (!socket || !socket.connected) {
      addToast({
        title: "Erro de conexão",
        description: "Socket não conectado. Tente novamente mais tarde.",
        severity: "danger",
        color: "danger",
        variant: "flat"
      });
      return;
    }

    if (window.confirm("Finalizar solicitação de documentação?")) {
      setLoading(true);
      const requestData: PreparationRequest = {
        ...solicitacao,
        ticketId: ticket.id,
        atendente: currentUser?.nome ?? "",
        sala: salaSelecionada,
        unidade: unidadeSelecionada
      };

      try {
        emitEvent(socket, EventType.PREPARATION_REQUEST, {
          type: PreparationRequestTypes.CREATE,
          request: requestData
        });
      } catch (err) {
        console.error("Erro ao enviar solicitação:", err);
        addToast({
          title: "Erro ao enviar",
          description: "Não foi possível enviar a solicitação de documentação.",
          severity: "danger",
          color: "danger",
          variant: "flat"
        });
      } finally {
        setLoading(false);
        onOpenChange(false);
      }
    }
  }, [solicitacao, ticket.id, socket, currentUser, onOpenChange]);

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      disableAnimation={true}
      size="md"
      backdrop="blur"
      classNames={{
        base: "rounded-xl shadow-xl bg-white",
        header: "border-b border-gray-100 px-5 py-3",
        body: "px-5 py-4",
        footer: "border-t border-gray-100 px-5 py-3",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-2">
                <FileClock size={20} className="text-blue-600" />
                <span className="text-lg font-semibold text-gray-800">
                  Solicitar Documentação
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1"
                aria-label="Fechar"
              />
            </ModalHeader>

            <ModalBody className="space-y-4">
              {loadingData ? (
                <div className="flex justify-center py-10">Carregando...</div>
              ) : (
                <>
                  <Autocomplete
                    label="Empresa"
                    placeholder="Selecione a empresa"
                    selectedKey={solicitacao.empresa}
                    onSelectionChange={(key) => handleFieldChange("empresa", key as string)}
                    size="sm"
                    classNames={{ base: "focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-1" }}
                  >
                    {empresaItems}
                  </Autocomplete>

                  <NomeInput value={solicitacao.nome} onChange={handleNomeChange} />

                  <div className="grid grid-cols-2 gap-3">
                    <CpfInput
                      value={solicitacao.cpf}
                      onChange={(e: any) => handleCpfChange(e.target.value)}
                      isInvalid={solicitacao.cpf.length > 0 && !isCpfValid}
                      errorMessage={solicitacao.cpf.length > 0 && !isCpfValid ? "CPF inválido" : ""}
                    />
                    <DataNascimentoInput
                      value={solicitacao.dataNascimento}
                      onChange={(e: any) => 
                        setSolicitacao(prev => ({ ...prev, dataNascimento: formatBrithdayDate(e.target.value) 
                        }))  
                      }
                    />
                  </div>
         
                  <Select
                    label="Tipo de Exame"
                    selectedKeys={solicitacao.tipoExame ? [solicitacao.tipoExame] : []}
                    onChange={(e) => handleFieldChange("tipoExame", e.target.value)}
                    size="sm"
                  >
                    {exameItems}
                  </Select>

                  <Textarea
                    label="Informações Adicionais"
                    value={solicitacao.informacoes}
                    onChange={(e) => handleFieldChange("informacoes", e.target.value)}
                    minRows={2}
                    maxRows={4}
                    size="sm"
                  />
                </>
              )}
            </ModalBody>

            <ModalFooter className="flex justify-end gap-2">
              <Button
                variant="light"
                onPress={onClose}
                size="sm"
                className="text-gray-600 hover:text-gray-800 px-4"
              >
                Cancelar
              </Button>
              <Button
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium shadow-sm hover:from-blue-700 hover:to-blue-800 px-4"
                isDisabled={!isFormValid}
                isLoading={loading}
                onPress={handleFinalizarSolicitacao}
                size="sm"
              >
                {loading ? "Enviando..." : "Enviar"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
