"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { addToast, Button, Input, Select, SelectItem, Spinner, Tooltip, Pagination } from "@heroui/react";
import {
  Search,
  RotateCw,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Inbox,
  User,
  Clock,
  Building,
  Activity,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { NEST_TICKETS_ALL_URL, UNIDADES_ATENDIMENTO } from "@/config/constants";
import { getCurrentUser } from "@/lib/utils";

// Interface baseada no Supabase
export interface Ticket {
  id: number;
  emissao: string;
  numero: number;
  prefixo: string;
  ativo: boolean;
  preferencial: boolean;
  preferencialTipo?: string | null;
  status: string;
  unidade: string;
  sala?: string | null;
  atendente?: string | null;
  exame?: string | null;
  profissional?: string | null;
  grupo?: string | null;
  nome?: string | null;
  cpf?: string | null;
  updatedAt?: string | null;
  deleted?: string | null;
}

export const TicketsMonitor: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const [selectedUnidade, setSelectedUnidade] = useState<string>("ALL");
  const [activityFilter, setActivityFilter] = useState<string>("ACTIVE");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTicket, setExpandedTicket] = useState<number | null>(null);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasDataRef = useRef(false);

  const fetchTickets = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      if (!hasDataRef.current) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      const currentUser = getCurrentUser();
      const headers: Record<string, string> = {};
      if (currentUser) {
        headers["x-auth-user"] = JSON.stringify(currentUser);
      }

      // Constrói URL com unidade se selecionada
      let url = NEST_TICKETS_ALL_URL;
      if (selectedUnidade && selectedUnidade !== "ALL") {
        url += `?unidade=${encodeURIComponent(selectedUnidade)}`;
      }

      const response = await fetch(url, {
        signal: controller.signal,
        headers,
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data = (await response.json()) as Ticket[];
      setTickets(data);
      hasDataRef.current = true;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      setError(err as Error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedUnidade]);

  // Recarrega ao trocar a unidade
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Auto-refresh a cada 15 segundos
  useEffect(() => {
    const interval = setInterval(fetchTickets, 15000);
    return () => {
      clearInterval(interval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchTickets]);

  const handleRefresh = () => {
    fetchTickets();
    addToast({
      title: "Atualizado",
      description: "Tickets atualizados com sucesso.",
      severity: "success",
      color: "foreground",
      variant: "flat",
    });
  };

  const toggleTicket = (id: number) => {
    setExpandedTicket(expandedTicket === id ? null : id);
  };

  // Filtragem local baseada na busca e status de atividade
  const filteredTickets = useMemo(() => {
    if (!tickets) return [];

    let result = tickets;

    // Filtro por Ativo/Inativo
    if (activityFilter === "ACTIVE") {
      result = result.filter((t) => t.ativo);
    } else if (activityFilter === "INACTIVE") {
      result = result.filter((t) => !t.ativo);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((t) => {
        const ticketCode = `${t.prefixo || ""}${t.numero || ""}`.toLowerCase();
        const nomePatient = (t.nome || "").toLowerCase();
        const cpfPatient = (t.cpf || "").replace(/\D/g, "");
        const cleanQuery = q.replace(/\D/g, "");

        return (
          ticketCode.includes(q) ||
          nomePatient.includes(q) ||
          (cleanQuery && cpfPatient.includes(cleanQuery))
        );
      });
    }

    return result;
  }, [tickets, searchQuery, activityFilter]);

  // Resetar a página quando os filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedUnidade, activityFilter]);

  // Paginação dos tickets
  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTickets.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTickets, currentPage]);

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);

  // Estatísticas calculadas
  const stats = useMemo(() => {
    if (!tickets) return { total: 0, waiting: 0, calling: 0, service: 0, finalized: 0 };
    
    const total = tickets.length;
    const waiting = tickets.filter(t => t.status === "AGUARDANDO" && t.ativo).length;
    const calling = tickets.filter(t => t.status === "EM CHAMADA" && t.ativo).length;
    const service = tickets.filter(t => t.status === "EM ATENDIMENTO" && t.ativo).length;
    const finalized = tickets.filter(t => t.status === "FINALIZADO" || !t.ativo).length;

    return { total, waiting, calling, service, finalized };
  }, [tickets]);

  const getStatusColor = (status: string, active: boolean) => {
    if (!active) return "bg-gray-400";
    switch (status) {
      case "AGUARDANDO":
        return "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]";
      case "EM CHAMADA":
        return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse";
      case "EM ATENDIMENTO":
        return "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]";
      case "FINALIZADO":
        return "bg-gray-500";
      default:
        return "bg-emerald-500";
    }
  };

  const getStatusLabel = (status: string, active: boolean) => {
    if (!active) return "Inativo / Processado";
    return status.charAt(0) + status.slice(1).toLowerCase().replace("_", " ");
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return "—";
    try {
      return new Date(isoString).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="rounded-xl bg-gradient-to-br from-[#2a4d3d] to-[#1e382c] p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#b8d864]" />
              Tickets Emitidos (Supabase)
            </h3>
            <p className="mt-1 text-sm text-white/70">
              Acompanhamento e gestão de senhas geradas hoje em tempo real
            </p>
          </div>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            className="text-white/70 hover:text-white"
            onPress={handleRefresh}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Stats Cards with Tooltips */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Tooltip
          color="foreground"
          content="Quantidade total de senhas emitidas hoje, independente de estarem ativas ou finalizadas."
          placement="bottom"
        >
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm cursor-help relative group"
          >
            <div className="flex items-center justify-between text-gray-500">
              <p className="text-xs font-medium">Total Emitidos</p>
              <HelpCircle className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="mt-1 text-2xl font-bold text-[#44735E]">{stats.total}</p>
          </motion.div>
        </Tooltip>

        <Tooltip
          color="foreground"
          content="Pacientes que retiraram senha e estão na fila de espera para atendimento."
          placement="bottom"
        >
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm cursor-help relative group"
          >
            <div className="flex items-center justify-between text-gray-500">
              <p className="text-xs font-medium">Aguardando</p>
              <HelpCircle className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="mt-1 text-2xl font-bold text-blue-600">{stats.waiting}</p>
          </motion.div>
        </Tooltip>

        <Tooltip
          color="foreground"
          content="Senhas que foram chamadas no painel e estão se deslocando para a sala."
          placement="bottom"
        >
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm cursor-help relative group"
          >
            <div className="flex items-center justify-between text-gray-500">
              <p className="text-xs font-medium">Em Chamada</p>
              <HelpCircle className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="mt-1 text-2xl font-bold text-amber-600">{stats.calling}</p>
          </motion.div>
        </Tooltip>

        <Tooltip
          color="foreground"
          content="Pacientes que estão em atendimento ativo com a recepção ou área clínica."
          placement="bottom"
        >
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm cursor-help relative group"
          >
            <div className="flex items-center justify-between text-gray-500">
              <p className="text-xs font-medium">Em Atendimento</p>
              <HelpCircle className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="mt-1 text-2xl font-bold text-green-600">{stats.service}</p>
          </motion.div>
        </Tooltip>

        <Tooltip
          color="foreground"
          content="Senhas que já foram inativadas, finalizadas ou canceladas no dia."
          placement="bottom"
        >
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm cursor-help relative group"
          >
            <div className="flex items-center justify-between text-gray-500">
              <p className="text-xs font-medium">Processados/Fim</p>
              <HelpCircle className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="mt-1 text-2xl font-bold text-gray-500">{stats.finalized}</p>
          </motion.div>
        </Tooltip>
      </div>

      {/* Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
        <div>
          <Input
            size="sm"
            placeholder="Buscar senha, nome ou CPF..."
            startContent={<Search className="h-4 w-4 text-gray-400" />}
            value={searchQuery}
            onValueChange={setSearchQuery}
            isClearable
            onClear={() => setSearchQuery("")}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 shrink-0">Unidade:</span>
          <Select
            size="sm"
            selectedKeys={[selectedUnidade]}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;
              if (selected) {
                setSelectedUnidade(selected);
                setExpandedTicket(null);
              }
            }}
            aria-label="Filtrar por unidade"
          >
            {[
              { key: "ALL", label: "Todas as Unidades" },
              ...UNIDADES_ATENDIMENTO.map((unit) => ({ key: unit, label: unit })),
            ].map((item) => (
              <SelectItem key={item.key}>{item.label}</SelectItem>
            ))}
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 shrink-0">Status:</span>
          <Select
            size="sm"
            selectedKeys={[activityFilter]}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;
              if (selected) {
                setActivityFilter(selected);
                setExpandedTicket(null);
              }
            }}
            aria-label="Filtrar por atividade"
          >
            <SelectItem key="ACTIVE">Somente Ativos (Default)</SelectItem>
            <SelectItem key="INACTIVE">Somente Inativos / Finalizados</SelectItem>
            <SelectItem key="ALL">Todos os Status</SelectItem>
          </Select>
        </div>
      </div>

      {/* Ticket List */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
        {loading && tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Spinner color="success" size="lg" />
            <p className="mt-3 text-sm">Carregando tickets do Supabase...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-red-500 px-4">
            <AlertTriangle className="mb-3 h-10 w-10" />
            <p className="text-sm font-medium">Erro ao carregar tickets</p>
            <p className="mt-1 text-xs text-gray-400 text-center max-w-md">{error.message}</p>
            <Button
              className="mt-4"
              color="success"
              size="sm"
              variant="flat"
              onPress={fetchTickets}
            >
              Tentar novamente
            </Button>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Inbox className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm font-medium">
              {searchQuery
                ? "Nenhum ticket corresponde aos critérios de busca."
                : "Nenhum ticket encontrado nos filtros selecionados."}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {paginatedTickets.map((ticket, index) => {
                const isExpanded = expandedTicket === ticket.id;
                const hasName = !!ticket.nome;

                return (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    {/* Row Header */}
                    <div
                      className={`cursor-pointer transition-all duration-150 p-4 flex items-center justify-between gap-4 ${
                        isExpanded ? "bg-emerald-50/40" : "hover:bg-gray-50"
                      }`}
                      onClick={() => toggleTicket(ticket.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Status Indicator */}
                        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${getStatusColor(ticket.status, ticket.ativo)}`} />

                        {/* Ticket Prefix + Number Badge */}
                        <span className="flex items-center justify-center font-bold text-sm bg-emerald-100 text-emerald-800 rounded-lg px-2.5 py-1 min-w-[50px]">
                          {ticket.prefixo || ""}{ticket.numero}
                        </span>

                        {/* Patient Name / Identification */}
                        <div className="min-w-0 flex flex-col">
                          <span className={`text-sm font-semibold truncate ${hasName ? "text-gray-800" : "text-gray-400 italic"}`}>
                            {ticket.nome || "Não identificado (Totem)"}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                            <Building className="h-3.5 w-3.5" /> {ticket.unidade}
                            {ticket.preferencial && (
                              <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.2 rounded-sm ml-2">
                                Preferencial {ticket.preferencialTipo ? `(${ticket.preferencialTipo})` : ""}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Hour & Status Badge */}
                        <div className="text-right hidden sm:block">
                          <span className="text-xs text-gray-400 block">{formatTime(ticket.emissao)}</span>
                          <span className="text-[10px] font-semibold text-gray-500 mt-1 block">
                            {getStatusLabel(ticket.status, ticket.ativo)}
                          </span>
                        </div>

                        {/* Chevron */}
                        <div className="text-gray-400 shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Detail Panel */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="bg-gray-50/50 border-t border-gray-100 px-6 py-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                            {/* Col 1: Paciente e Documentos */}
                            <div className="space-y-2">
                              <h5 className="font-semibold text-[#44735E] border-b border-gray-200 pb-1 flex items-center gap-1.5">
                                <User className="h-4 w-4" /> Identificação
                              </h5>
                              <div>
                                <span className="text-xs text-gray-400 block">Nome do Paciente</span>
                                <span className="font-medium text-gray-700">{ticket.nome || "—"}</span>
                              </div>
                              <div>
                                <span className="text-xs text-gray-400 block">CPF</span>
                                <span className="font-medium text-gray-700">
                                  {ticket.cpf ? ticket.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : "—"}
                                </span>
                              </div>
                              <div>
                                <span className="text-xs text-gray-400 block">Preferencial</span>
                                <span className="font-medium text-gray-700">
                                  {ticket.preferencial ? `Sim (${ticket.preferencialTipo || "Não especificado"})` : "Não"}
                                </span>
                              </div>
                            </div>

                            {/* Col 2: Atendimento e Status */}
                            <div className="space-y-2">
                              <h5 className="font-semibold text-[#44735E] border-b border-gray-200 pb-1 flex items-center gap-1.5">
                                <Activity className="h-4 w-4" /> Fluxo & Status
                              </h5>
                              <div>
                                <span className="text-xs text-gray-400 block">Status Atual</span>
                                <span className="font-medium text-gray-700 flex items-center gap-1.5 mt-0.5">
                                  <span className={`h-2 w-2 rounded-full ${getStatusColor(ticket.status, ticket.ativo)}`} />
                                  {getStatusLabel(ticket.status, ticket.ativo)}
                                </span>
                              </div>
                              <div>
                                <span className="text-xs text-gray-400 block">Sala / Local</span>
                                <span className="font-medium text-gray-700">{ticket.sala || "—"}</span>
                              </div>
                              <div>
                                <span className="text-xs text-gray-400 block">Grupo do Painel</span>
                                <span className="font-medium text-gray-700">{ticket.grupo || "—"}</span>
                              </div>
                            </div>

                            {/* Col 3: Profissional e Horários */}
                            <div className="space-y-2">
                              <h5 className="font-semibold text-[#44735E] border-b border-gray-200 pb-1 flex items-center gap-1.5">
                                <Clock className="h-4 w-4" /> Atendimento & Tempos
                              </h5>
                              <div>
                                <span className="text-xs text-gray-400 block">Operador / Atendente</span>
                                <span className="font-medium text-gray-700">{ticket.atendente || "—"}</span>
                              </div>
                              <div>
                                <span className="text-xs text-gray-400 block">Exame & Especialidade</span>
                                <span className="font-medium text-gray-700">{ticket.exame || "—"}</span>
                              </div>
                              <div>
                                <span className="text-xs text-gray-400 block">Profissional Clínico</span>
                                <span className="font-medium text-gray-700">{ticket.profissional || "—"}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <div>
                                  <span className="text-[10px] text-gray-400 block">Emissão</span>
                                  <span className="text-xs font-medium text-gray-600">{formatTime(ticket.emissao)}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-gray-400 block">Última Ação</span>
                                  <span className="text-xs font-medium text-gray-600">{formatTime(ticket.updatedAt || undefined)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center py-4 border-t border-gray-100 bg-gray-50/50">
                <Pagination
                  total={totalPages}
                  page={currentPage}
                  onChange={setCurrentPage}
                  color="success"
                  size="sm"
                  showControls
                />
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-xs text-gray-400 bg-white">
          <span>
            Exibindo {paginatedTickets.length} de {filteredTickets.length} ticket{filteredTickets.length !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1">
            <RotateCw className="h-3 w-3" />
            Atualiza a cada 15s
          </span>
        </div>
      </div>
    </div>
  );
};
