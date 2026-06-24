import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
  Chip,
  Checkbox
} from "@heroui/react";

import { getAvailableVehicles, VehicleType } from "@/lib/commitments/commitments-api";

const VEHICLE_LABEL_MAP: Record<string, string> = {
  UNIDADE_MOVEL: "Unidade Móvel",
  UNIDADE_RAIO_X: "Unidade Raio-X",
  DOBLO_I: "Doblô I",
  DOBLO_II: "Doblô II",
  UP: "Up",
  PICKUP: "Pickup"
};

export interface CommitmentModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: any) => void;
  onDelete?: () => void;
  initialData?: any;
}

export function CommitmentModal({ isOpen, onOpenChange, onSubmit, onDelete, initialData }: CommitmentModalProps) {
  const [participants, setParticipants] = useState<string[]>([]);
  const [participantInput, setParticipantInput] = useState("");
  
  const [title, setTitle] = useState(initialData?.title || "");
  const [type, setType] = useState(initialData?.type || "VISITA_TECNICA");
  
  const [company, setCompany] = useState(initialData?.company || "");
  const [companyContact, setCompanyContact] = useState(initialData?.company_contact || "");
  
  const [emailsComunicado, setEmailsComunicado] = useState<string[]>(initialData?.emails_comunicado || []);
  const [emailInput, setEmailInput] = useState("");
  
  const [startDate, setStartDate] = useState(initialData?.start_time ? initialData.start_time.split("T")[0] : "");
  const [startTime, setStartTime] = useState(initialData?.start_time ? initialData.start_time.split("T")[1].substring(0, 5) : "08:00");
  const [endDate, setEndDate] = useState(initialData?.end_time ? initialData.end_time.split("T")[0] : "");
  const [endTime, setEndTime] = useState(initialData?.end_time ? initialData.end_time.split("T")[1].substring(0, 5) : "18:00");
  
  const [isAllDay, setIsAllDay] = useState(false);
  const [isNoReturn, setIsNoReturn] = useState(false);

  const [vehicle, setVehicle] = useState(initialData?.vehicle || "NENHUM");
  const [description, setDescription] = useState(initialData?.description || "");
  const [availableVehicles, setAvailableVehicles] = useState<VehicleType[]>(initialData?.vehicle ? [initialData.vehicle as VehicleType] : []);

  // Update states if initialData changes
  React.useEffect(() => {
    if (isOpen) {
      setParticipants(initialData?.participants || []);
      setTitle(initialData?.title || "");
      setType(initialData?.type || "VISITA_TECNICA");
      setCompany(initialData?.company || "");
      setCompanyContact(initialData?.company_contact || "");
      setEmailsComunicado(initialData?.emails_comunicado || []);
      setStartDate(initialData?.start_time ? initialData.start_time.split("T")[0] : "");
      setStartTime(initialData?.start_time ? initialData.start_time.split("T")[1].substring(0, 5) : "08:00");
      setEndDate(initialData?.end_time ? initialData.end_time.split("T")[0] : "");
      setEndTime(initialData?.end_time ? initialData.end_time.split("T")[1].substring(0, 5) : "18:00");
      setVehicle(initialData?.vehicle || "NENHUM");
      setDescription(initialData?.description || "");
      setIsAllDay(false);
      setIsNoReturn(false);
    }
  }, [isOpen, initialData]);

  // Calculate full ISO strings for the API
  const computedStart = startDate ? `${startDate}T${isAllDay ? "00:00" : startTime}:00` : "";
  const computedEnd = endDate 
    ? `${endDate}T${isAllDay || isNoReturn ? "23:59" : endTime}:00` 
    : (isNoReturn && startDate ? `${startDate}T23:59:00` : "");

  // Fetch available vehicles whenever time changes
  React.useEffect(() => {
    if (computedStart && computedEnd && new Date(computedStart) < new Date(computedEnd)) {
      getAvailableVehicles(new Date(computedStart).toISOString(), new Date(computedEnd).toISOString(), initialData?.id)
        .then(setAvailableVehicles)
        .catch(console.error);
    } else {
      setAvailableVehicles([]);
    }
  }, [computedStart, computedEnd, initialData?.id]);

  const handleAddParticipant = () => {
    const formattedName = participantInput.trim().toUpperCase();
    if (formattedName !== "" && !participants.includes(formattedName)) {
      setParticipants([...participants, formattedName]);
      setParticipantInput("");
    }
  };

  const handleRemoveParticipant = (participantToRemove: string) => {
    setParticipants(participants.filter(p => p !== participantToRemove));
  };

  const handleAddEmail = () => {
    if (emailInput.trim() !== "" && !emailsComunicado.includes(emailInput.trim())) {
      setEmailsComunicado([...emailsComunicado, emailInput.trim()]);
      setEmailInput("");
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmailsComunicado(emailsComunicado.filter(e => e !== emailToRemove));
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 text-xl font-bold">
              {initialData ? "Editar Compromisso" : "Novo Compromisso"}
            </ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Título" 
                  placeholder="Ex: Visita Cliente XYZ" 
                  className="md:col-span-1"
                  variant="bordered"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.toUpperCase())}
                />

                <Select 
                  label="Tipo" 
                  placeholder="Selecione o tipo"
                  className="md:col-span-1"
                  variant="bordered"
                  selectedKeys={[type]}
                  onChange={(e) => setType(e.target.value)}
                >
                  <SelectItem key="EXAME">Realização de Exames</SelectItem>
                  <SelectItem key="TREINAMENTO">Treinamento</SelectItem>
                  <SelectItem key="VISITA_TECNICA">Visita Técnica</SelectItem>
                  <SelectItem key="PERICIA">Perícia</SelectItem>
                  <SelectItem key="OUTRO">Outro</SelectItem>
                </Select>
                
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border-2 border-default-200 hover:border-default-300 transition-colors p-4 rounded-xl bg-white shadow-sm">
                  <div className="md:col-span-2 flex gap-4">
                    <Checkbox isSelected={isAllDay} onValueChange={setIsAllDay}>Dia todo</Checkbox>
                    <Checkbox isSelected={isNoReturn} onValueChange={setIsNoReturn}>Sem retorno previsto</Checkbox>
                  </div>

                  <div className="flex gap-2">
                    <Input 
                      label="Data de Início" 
                      type="date"
                      variant="bordered"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (!endDate) setEndDate(e.target.value);
                      }}
                      className="flex-2"
                    />
                    {!isAllDay && (
                      <Input 
                        label="Hora" 
                        type="time"
                        variant="bordered"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="flex-1"
                      />
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Input 
                      label="Data de Fim" 
                      type="date"
                      variant="bordered"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      isDisabled={isNoReturn}
                      className="flex-2"
                    />
                    {!isAllDay && !isNoReturn && (
                      <Input 
                        label="Hora" 
                        type="time"
                        variant="bordered"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="flex-1"
                      />
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Input 
                      label="Adicionar Funcionário/Participante" 
                      placeholder="Digite o nome e pressione Enter"
                      value={participantInput}
                      onChange={(e) => setParticipantInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddParticipant();
                        }
                      }}
                      className="flex-1"
                      variant="bordered"
                    />
                    <Button className="bg-[#44735E] text-white font-semibold hover:bg-[#355a4a] transition-colors" onPress={handleAddParticipant} variant="solid">
                      Adicionar
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {participants.map((name, index) => (
                      <Chip 
                        key={index} 
                        onClose={() => handleRemoveParticipant(name)}
                        color="default"
                        variant="flat"
                      >
                        {name}
                      </Chip>
                    ))}
                    {participants.length === 0 && (
                      <span className="text-sm text-gray-400">Nenhum participante adicionado.</span>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Input 
                      label="E-mails para Comunicado" 
                      placeholder="Ex: contato@empresa.com" 
                      variant="bordered"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
                      className="flex-1"
                    />
                    <Button onPress={handleAddEmail} className="bg-[#44735E] text-white font-semibold hover:bg-[#355a4a] transition-colors" variant="solid">
                      Adicionar
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {emailsComunicado.map((email) => (
                      <Chip key={email} onClose={() => handleRemoveEmail(email)} variant="flat" color="default">
                        {email}
                      </Chip>
                    ))}
                  </div>
                </div>

                <Input 
                  label="Empresa" 
                  placeholder="Nome da empresa (Ex: Empresa ABC)" 
                  className="md:col-span-1"
                  variant="bordered"
                  value={company}
                  onChange={(e) => setCompany(e.target.value.toUpperCase())}
                />

                <Input 
                  label="Contato na Empresa" 
                  placeholder="Nome ou telefone de contato" 
                  className="md:col-span-1"
                  variant="bordered"
                  value={companyContact}
                  onChange={(e) => setCompanyContact(e.target.value.toUpperCase())}
                />

                <Select 
                  label="Veículo Necessário?" 
                  placeholder={!computedStart || !computedEnd ? "Selecione o horário primeiro" : "Selecione o veículo"}
                  className="md:col-span-2"
                  variant="bordered"
                  selectedKeys={[vehicle]}
                  onChange={(e) => setVehicle(e.target.value)}
                  isDisabled={!computedStart || !computedEnd}
                  items={[{ key: "NENHUM", label: "Nenhum" }, ...[...availableVehicles]
                    .sort((a, b) => VEHICLE_LABEL_MAP[a].localeCompare(VEHICLE_LABEL_MAP[b]))
                    .map(v => ({
                      key: v,
                      label: VEHICLE_LABEL_MAP[v] || v.replace(/_/g, " ")
                    }))]}
                >
                  {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
                </Select>

                <Textarea 
                  label="Descrição / Observações" 
                  placeholder="Detalhes adicionais do compromisso..."
                  className="md:col-span-2"
                  variant="bordered"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </ModalBody>
            <ModalFooter className="flex justify-between w-full">
              <div>
                {initialData && onDelete && (
                  <Button color="danger" variant="flat" onPress={() => { onDelete(); onClose(); }}>
                    Excluir
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button color="default" variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button className="bg-[#44735E] text-white font-semibold hover:bg-[#355a4a] transition-colors" onPress={() => { 
                  if (!computedStart || !computedEnd) {
                    alert("Preencha as datas corretamente.");
                    return;
                  }
                  onSubmit({ 
                    title, 
                    type,
                    company,
                    company_contact: companyContact,
                    emails_comunicado: emailsComunicado, 
                    start_time: computedStart, 
                    end_time: computedEnd, 
                    participants, 
                    vehicle: vehicle === "NENHUM" ? null : vehicle, 
                    description 
                  }); 
                  onClose(); 
                }}>
                  {initialData ? "Salvar Alterações" : "Salvar Compromisso"}
                </Button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
