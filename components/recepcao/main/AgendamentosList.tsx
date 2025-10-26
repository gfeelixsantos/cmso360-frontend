"use client";
import React, { useState, useMemo, useCallback } from "react";
import {
  Chip,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { VariableSizeList as List } from "react-window";
import { 
  Building2, 
  Briefcase, 
  FileText, 
  CalendarDays, 
  Search, 
  X, 
  Clock, 
  Calendar, 
  Plus, 
  ExternalLink,
  CheckCircle,
  Clock as ClockIcon,
  AlertCircle,
  Stethoscope,
  User,
  MapPin,
  Calendar as CalendarIcon
} from "lucide-react";
import { Scheduling } from "@/lib/scheduling/interface/scheduling";
import { AtendimentoStatus } from "@/lib/scheduling/enum/scheduling.enum";

interface AgendamentosListProps {
  agendadosFiltrados: Scheduling[];
  conectado: boolean;
  unidadeSelecionada: string;
}

const StatusBadge: React.FC<{ status: string }> = React.memo(({ status }) => {
  const statusConfig = {
    "EM_ATENDIMENTO": { color: "danger", label: AtendimentoStatus.EM_ATENDIMENTO },
    "AGENDADO": { color: "primary", label: AtendimentoStatus.AGENDADO },
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || "";
  
  return (
    <Chip
      size="sm"
      variant="flat"
      color={config.color as "success" | "warning" | "danger" | "primary"}
      className="text-xs font-medium"
    >
      {config.label}
    </Chip>
  );
});
StatusBadge.displayName = 'StatusBadge';

// Componente para o status do exame
const ExameStatus: React.FC<{ status: string }> = React.memo(({ status }) => {
  const statusConfig = {
    "FINALIZADO": { color: "success", icon: CheckCircle, label: "Finalizado" },
    "PENDENTE": { color: "warning", icon: ClockIcon, label: "Pendente" },
    "CANCELADO": { color: "danger", icon: AlertCircle, label: "Cancelado" },
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || { color: "default", icon: FileText, label: status };
  const IconComponent = config.icon;
  
  return (
    <Chip
      size="sm"
      variant="flat"
      color={config.color as "success" | "warning" | "danger" | "default"}
      className="text-xs font-medium flex items-center gap-1"
    >
      <IconComponent size={12} />
      {config.label}
    </Chip>
  );
});
ExameStatus.displayName = 'ExameStatus';

// Modal para exibir os exames
const ExamesModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  exames: any[];
  nomePaciente: string;
}> = React.memo(({ isOpen, onClose, exames, nomePaciente }) => {
  const examesFinalizados = exames.filter(exame => exame.status === "FINALIZADO");
  const examesPendentes = exames.filter(exame => exame.status === "PENDENTE");

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Stethoscope size={20} />
            <h3 className="text-lg font-semibold">Exames do Paciente</h3>
          </div>
          <p className="text-sm text-gray-600">{nomePaciente}</p>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Exames Pendentes */}
            {examesPendentes.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <ClockIcon size={14} className="text-amber-500" />
                  Exames Pendentes ({examesPendentes.length})
                </h4>
                <div className="space-y-2">
                  {examesPendentes.map((exame, index) => (
                    <ExameCard key={exame.sequencialResultadoExame || index} exame={exame} />
                  ))}
                </div>
              </div>
            )}

            {/* Exames Finalizados */}
            {examesFinalizados.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500" />
                  Exames Finalizados ({examesFinalizados.length})
                </h4>
                <div className="space-y-2">
                  {examesFinalizados.map((exame, index) => (
                    <ExameCard key={exame.sequencialResultadoExame || index} exame={exame} />
                  ))}
                </div>
              </div>
            )}

            {/* Caso não haja exames */}
            {exames.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                <Stethoscope size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Nenhum exame encontrado</p>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onPress={onClose}>
            Fechar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});
ExamesModal.displayName = 'ExamesModal';

// Card individual compacto para cada exame
const ExameCard: React.FC<{ exame: any }> = React.memo(({ exame }) => (
  <div className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
    <div className="flex-1 min-w-0">
      {/* Nome do exame e status na mesma linha */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-gray-900 leading-tight flex-1">
          {exame.nomeExame}
        </h4>
        <div className="flex-shrink-0">
          <ExameStatus status={exame.status} />
        </div>
      </div>
      
      {/* Informações compactas em linha */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
        {/* Código do exame (se aplicável) */}
        {exame.codigoExame && exame.codigoExame !== "clinico" && exame.codigoExame !== "triagem" && (
          <div className="flex items-center gap-1">
            <FileText size={10} className="text-gray-400" />
            <span>{exame.codigoExame}</span>
          </div>
        )}
        
        {/* Data do exame */}
        {exame.dataExame && (
          <div className="flex items-center gap-1">
            <CalendarIcon size={10} className="text-gray-400" />
            <span>{new Date(exame.dataExame).toLocaleDateString('pt-BR')}</span>
          </div>
        )}
        
        {/* Profissional */}
        {exame.profissional && (
          <div className="flex items-center gap-1">
            <User size={10} className="text-gray-400" />
            <span className="truncate max-w-[120px]">{exame.profissional}</span>
          </div>
        )}
        
        {/* Sala */}
        {exame.sala && (
          <div className="flex items-center gap-1">
            <MapPin size={10} className="text-gray-400" />
            <span>{exame.sala}</span>
          </div>
        )}
      </div>
      
      {/* Preparação (se houver) */}
      {exame.preparacao && (
        <div className="mt-2 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
          <strong>Preparação:</strong> {exame.preparacao}
        </div>
      )}
    </div>
    
    {/* Botão de resultado alinhado à direita */}
    {exame.url && (
      <div className="flex-shrink-0 ml-3">
        <Button
          size="sm"
          variant="flat"
          color="primary"
          as="a"
          href={exame.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs min-w-0 px-2"
          startContent={<ExternalLink size={10} />}
        >
          Resultado
        </Button>
      </div>
    )}
  </div>
));
ExameCard.displayName = 'ExameCard';

// Badge para mostrar resumo dos exames no card principal
const ExamesBadge: React.FC<{ 
  exames: any[]; 
  onOpen: (e: React.MouseEvent) => void;
}> = React.memo(({ exames, onOpen }) => {
  if (!exames || exames.length === 0) return null;

  const examesFinalizados = exames.filter(exame => exame.status === "FINALIZADO").length;
  const examesPendentes = exames.filter(exame => exame.status === "PENDENTE").length;

  return (
    <div className="mt-2">
      <Button
        size="sm"
        variant="flat"
        onPress={() => {
          const syntheticEvent = {
            stopPropagation: () => {}
          } as React.MouseEvent;
          onOpen(syntheticEvent);
        }}
        className="w-full justify-start text-xs h-8 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100"
        startContent={<Stethoscope size={14} />}
      >
        <span className="flex-1 text-left">
          Exames: {examesFinalizados} finalizado(s), {examesPendentes} pendente(s)
        </span>
        <FileText size={12} className="ml-auto" />
      </Button>
    </div>
  );
});
ExamesBadge.displayName = 'ExamesBadge';

// Componente memoizado para cada item (mantido igual)
const AgendamentoItem = React.memo(({
  agendamento,
  style,
  onSelect
}: {
  agendamento: Scheduling;
  style: React.CSSProperties;
  onSelect: (agendamento: Scheduling) => void;
}) => {
  const [showExamesModal, setShowExamesModal] = useState(false);

  const handleClick = useCallback(() => {
    onSelect(agendamento);
  }, [onSelect, agendamento]);

  const handleOpenExames = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowExamesModal(true);
  }, []);

  const handleCloseExames = useCallback(() => {
    setShowExamesModal(false);
  }, []);

  return (
    <>
      <div
        style={style}
        className="rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer p-4 my-2"
        onClick={handleClick}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">{agendamento.NOME}</h3>
            <div className="flex items-center mt-1 text-sm text-gray-500">
              <Clock size={14} className="mr-2" />
              <span>{agendamento.HORARIO != "" ? agendamento.HORARIO : "N/A"}</span>
            </div>
          </div>
          <div className="ml-3 flex-shrink-0">
            <StatusBadge status={agendamento.ATENDIMENTOSTATUS} />
          </div>
        </div>
        
        <div className="text-sm">
          <div className="flex items-center text-gray-700">
            <Building2 size={16} className="text-gray-500 mr-3 flex-shrink-0" />
            <span className="truncate">{agendamento.NOMEEMPRESA}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <Briefcase size={16} className="text-gray-500 mr-3 flex-shrink-0" />
            <span className="truncate">{agendamento.NOMECARGO}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <FileText size={16} className="text-gray-500 mr-3 flex-shrink-0" />
            <span className="truncate">{agendamento.TIPOEXAMENOME}</span>
          </div>
          
          {/* Observações */}
          {agendamento.OBSERVACOES && (
            <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 mt-2">
              <p className="text-xs text-amber-700">
                <strong>Observações:</strong> {agendamento.OBSERVACOES}
              </p>
            </div>
          )}
          
          {/* Badge dos Exames */}
          {agendamento.EXAMES && agendamento.EXAMES.length > 0 && (
            <ExamesBadge 
              exames={agendamento.EXAMES} 
              onOpen={handleOpenExames}
            />
          )}
        </div>
      </div>

      {/* Modal de Exames */}
      {agendamento.EXAMES && (
        <ExamesModal
          isOpen={showExamesModal}
          onClose={handleCloseExames}
          exames={agendamento.EXAMES}
          nomePaciente={agendamento.NOME}
        />
      )}
    </>
  );
});
AgendamentoItem.displayName = 'AgendamentoItem';

// Restante do componente mantido igual...
const AgendamentosList: React.FC<AgendamentosListProps> = ({
  agendadosFiltrados,
  conectado,
  unidadeSelecionada
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [buscaSenha, setBuscaSenha] = useState("");
  const listRef = React.useRef<List>(null);

  // Processamento único dos dados
  const { agendamentosOrdenados, agendamentosUnicos } = useMemo(() => {
    // Remove duplicados
    const uniqueMap = new Map();
    const unicos: Scheduling[] = [];
    
    agendadosFiltrados.forEach(item => {
      if (!uniqueMap.has(item.SCHEDULINGCODE)) {
        uniqueMap.set(item.SCHEDULINGCODE, true);
        unicos.push(item);
      }
    });

    // Filtra pelo input
    const buscaLower = buscaSenha.toLowerCase();
    const filtrados = buscaSenha 
      ? unicos.filter(agendamento => 
          (agendamento.NOME && agendamento.NOME.toLowerCase().includes(buscaLower)) ||
          (agendamento.NOMEEMPRESA && agendamento.NOMEEMPRESA.toLowerCase().includes(buscaLower)) ||
          (agendamento.NOMECARGO && agendamento.NOMECARGO.toLowerCase().includes(buscaLower))
        )
      : unicos;

    // Ordena por ordem alfabética (por nome)
    const ordenados = [...filtrados].sort((a, b) => {
      const nomeA = a.NOME?.toLowerCase() || '';
      const nomeB = b.NOME?.toLowerCase() || '';
      return nomeA.localeCompare(nomeB);
    });

    return { agendamentosOrdenados: ordenados, agendamentosUnicos: unicos };
  }, [agendadosFiltrados, buscaSenha]);

  // Calcular altura dinâmica para cada item (agora fixa com espaço para o badge)
  const getItemSize = useCallback((index: number) => {
    const agendamento = agendamentosOrdenados[index];
    // Altura base fixa
    let height = 180;
    
    // Se tiver observação, adiciona altura extra fixa
    if (agendamento.OBSERVACOES) {
      height += 50; // Altura fixa para observações
    }
    
    // Se tiver exames, adiciona altura fixa para o badge
    if (agendamento.EXAMES && agendamento.EXAMES.length > 0) {
      height += 40; // Altura fixa para o badge de exames
    }
    
    return height;
  }, [agendamentosOrdenados]);

  // Resetar as alturas dos itens quando os dados mudarem
  React.useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [agendamentosOrdenados]);

  const handleItemSelect = useCallback((agendamento: Scheduling) => {
    setIsOpen(false);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setBuscaSenha(e.target.value);
  }, [setBuscaSenha]);

  const clearSearch = useCallback(() => {
    setBuscaSenha("");
  }, [setBuscaSenha]);

  const renderRow = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => (
    <AgendamentoItem
      agendamento={agendamentosOrdenados[index]}
      style={style}
      onSelect={handleItemSelect}
    />
  ), [agendamentosOrdenados, handleItemSelect]);

  return (
    <>
      <Button
        onPress={() => setIsOpen(true)}
        className="flex w-full items-center justify-center gap-2 py-2.5 rounded-xl font-semibold shadow-md bg-gradient-to-r from-[#104e35] to-[#4CAF50] text-white hover:opacity-90 focus:ring-2 focus:ring-[#104e35]"
        aria-label="Iniciar atendimento do dia"
      >
        <Calendar className="h-4 w-4" />
        <span>Atendimentos hoje</span>
        <Plus className="h-3 w-3 ml-auto" />
      </Button>

      <Drawer 
        isOpen={isOpen} 
        closeButton={false}
        placement="left" 
        onOpenChange={setIsOpen}
        size="md"
      >
        <DrawerContent className="max-w-lg mx-auto">
          <DrawerHeader className="flex flex-col border-b border-gray-200 px-5 py-4 bg-gray-50 rounded-t-xl">
            <div className="flex items-center justify-between w-full">
              <h2 className="text-xl font-bold text-gray-900">Lista de Agendamentos</h2>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {agendamentosOrdenados.filter(a => a.UNIDADEATENDIMENTO === unidadeSelecionada).length} em {unidadeSelecionada} de {agendamentosOrdenados.length} agendamento(s)
            </p>
          </DrawerHeader>
          
          <DrawerBody className="p-5 overflow-hidden bg-gray-100">
            {conectado ? (
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-500" />
                  </div>
                  <input
                    id="busca-senha"
                    type="text"
                    placeholder="Buscar por nome, empresa ou cargo..."
                    value={buscaSenha}
                    onChange={handleSearchChange}
                    className="w-full pl-11 pr-10 py-3 bg-white border border-gray-300 rounded-xl text-sm 
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                      hover:border-gray-400 transition-colors shadow-sm"
                  />
                  {buscaSenha && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <Button isIconOnly variant="light" size="sm" onPress={clearSearch} className="text-gray-500">
                        <X size={16} />
                      </Button>
                    </div>
                  )}
                </div>

                {agendamentosOrdenados.length > 0 ? (
                  <div className="bg-white rounded-xl p-1 shadow-sm">
                    <List
                      ref={listRef}
                      height={520}
                      itemCount={agendamentosOrdenados.length}
                      itemSize={getItemSize}
                      width="100%"
                    >
                      {renderRow}
                    </List>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-10 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300 shadow-sm">
                    <Search size={48} className="mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-1">Nenhum agendamento encontrado</p>
                    <p className="text-sm text-center text-gray-600">
                      {buscaSenha 
                        ? "Tente ajustar os termos da busca ou limpar os filtros."
                        : "Não há agendamentos para exibir no momento."}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-10 text-gray-500 bg-white rounded-xl shadow-sm">
                <div className="rounded-full bg-amber-100 p-4 mb-4">
                  <X size={32} className="text-amber-500" />
                </div>
                <p className="text-lg font-medium mb-1">Não conectado</p>
                <p className="text-sm text-center text-gray-600">
                  Conecte-se para visualizar os agendamentos.
                </p>
              </div>
            )}
          </DrawerBody>
          
          <DrawerFooter className="border-t border-gray-200 px-5 py-4 bg-gray-50 rounded-b-xl">
            <div className="flex gap-3 justify-end">
              <Button 
                variant="flat" 
                onPress={() => setIsOpen(false)}
                className="rounded-lg px-4"
              >
                Fechar
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default React.memo(AgendamentosList);