"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card, CardBody, Select, SelectItem, Button, useDisclosure } from "@heroui/react";
import { Truck, Users } from "lucide-react";
import { HeaderApp } from "@/components/shared/HeaderApp";
import { CommitmentModal } from "@/components/shared/CommitmentModal";
import { createCommitment, getCommitments, updateCommitment, deleteCommitment } from "@/lib/commitments/commitments-api";
import { MetricsDashboard } from "@/components/analytics/dashboard";

const locales = {
  "pt-BR": ptBR,
};

const parseLocalISO = (iso: string): Date => {
  const [datePart, timePart] = iso.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  if (timePart) {
    const [h, min, s] = timePart.split(":").map(Number);
    return new Date(y, m - 1, d, h || 0, min || 0, s || 0);
  }
  return new Date(y, m - 1, d);
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function AgendaPage() {
  const router = useRouter();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [viewMode, setViewMode] = useState<"FUNCIONARIO" | "VEICULO">("FUNCIONARIO");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<any>("month");
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedParticipant, setSelectedParticipant] = useState("TODOS");
  const [showFleet, setShowFleet] = useState(false);
  const [fleetPeriod, setFleetPeriod] = useState<"HOJE" | "SEMANAL">("HOJE");
  const [showEmployees, setShowEmployees] = useState(false);
  const [employeePeriod, setEmployeePeriod] = useState<"HOJE" | "SEMANAL">("HOJE");

  const fetchEvents = useCallback(async () => {
    try {
      const data = await getCommitments();
      const mappedEvents = data.map(ev => ({
        id: ev.id,
        title: ev.title,
        type: ev.type,
        company: ev.company,
        company_contact: ev.company_contact,
        emails_comunicado: ev.emails_comunicado,
        description: ev.description,
        start_time: ev.start_time,
        end_time: ev.end_time,
        start: parseLocalISO(ev.start_time),
        end: parseLocalISO(ev.end_time),
        resourceId: ev.vehicle || undefined,
        resource: ev.vehicle || undefined,
        vehicle: ev.vehicle || undefined,
        participants: ev.participants || []
      }));
      setEvents(mappedEvents);
    } catch (error) {
      console.error("Erro ao buscar compromissos:", error);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const vehicles = [
    { id: "DOBLO_I", title: "Doblô I" },
    { id: "DOBLO_II", title: "Doblô II" },
    { id: "PICKUP", title: "Pickup" },
    { id: "UNIDADE_MOVEL", title: "Unidade Móvel" },
    { id: "UNIDADE_RAIO_X", title: "Unidade Raio-X" },
    { id: "UP", title: "Up" },
    { id: "MOBI", title: "Mobi" },
  ];

  const resources = viewMode === "VEICULO" ? vehicles : undefined;

  const allParticipants = Array.from(
    new Set(events.flatMap(ev => ev.participants || []))
  ).sort() as string[];

  const filteredEvents = events.filter(ev => {
    if (selectedParticipant === "TODOS") return true;
    return ev.participants?.includes(selectedParticipant);
  });

  const eventPropGetter = (event: any) => {
    let backgroundColor = "#6b7280";
    let borderLeft = "4px solid #4b5563";

    switch (event.type) {
      case "ASSESSORIA":
        backgroundColor = "#9333ea";
        borderLeft = "4px solid #7e22ce";
        break;
      case "IN_COMPANY":
        backgroundColor = "#16a34a";
        borderLeft = "4px solid #15803d";
        break;
      case "LEVA_E_TRAS":
        backgroundColor = "#ea580c";
        borderLeft = "4px solid #c2410c";
        break;
      case "OUTRO":
        backgroundColor = "#6b7280";
        borderLeft = "4px solid #4b5563";
        break;
      case "PERICIA":
        backgroundColor = "#dc2626";
        borderLeft = "4px solid #b91c1c";
        break;
      case "TREINAMENTO":
        backgroundColor = "#ca8a04";
        borderLeft = "4px solid #a16207";
        break;
      case "VISITA_TECNICA":
        backgroundColor = "#2563eb";
        borderLeft = "4px solid #1d4ed8";
        break;
      default:
        backgroundColor = "#6b7280";
        borderLeft = "4px solid #4b5563";
        break;
    }

    return {
      style: {
        backgroundColor,
        borderLeft,
        borderTop: "none",
        borderRight: "none",
        borderBottom: "none",
        color: "#ffffff",
        borderRadius: "5px",
        fontSize: "0.82rem",
        fontWeight: "600",
        padding: "2px 6px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
      },
    };
  };

  const CustomToolbar = ({ label, onNavigate, onView, view }: { label: string; onNavigate: (action: "PREV" | "NEXT" | "TODAY") => void; onView: (view: string) => void; view: string }) => {
    const views = [
      { key: "month", label: "Mês" },
      { key: "week", label: "Semana" },
      { key: "day", label: "Dia" },
      { key: "agenda", label: "Lista" },
    ];
    const btnClass = "px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition-colors";
    const btnActiveClass = "px-3 py-1.5 text-sm font-medium rounded-md border border-gray-800 text-white bg-gray-800 transition-colors";
    return (
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button type="button" className={btnClass} onClick={() => onNavigate("TODAY")}>Hoje</button>
          <button type="button" className={btnClass} onClick={() => onNavigate("PREV")}>{"<"}</button>
          <button type="button" className={btnClass} onClick={() => onNavigate("NEXT")}>{">"}</button>
        </div>
        <span className="text-base font-semibold text-gray-800">{label}</span>
        <div className="flex items-center gap-1">
          {views.map(v => (
            <button key={v.key} type="button" className={view === v.key ? btnActiveClass : btnClass} onClick={() => onView(v.key)}>{v.label}</button>
          ))}
        </div>
      </div>
    );
  };

  const formatTime = (date: Date) => {
    return format(date, "HH:mm");
  };

  const getWeekDays = () => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  };

  const getEventsForDay = (day: Date) => {
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0);
    const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59);
    return events.filter(ev => ev.start <= end && ev.end >= start);
  };

  const getVehicleStatusForDay = (vehicleId: string, day: Date) => {
    const dayEvents = getEventsForDay(day).filter(ev => ev.vehicle === vehicleId);
    if (dayEvents.length === 0) {
      return { status: "AVAILABLE", label: "Livre", count: 0, badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    }
    const now = new Date();
    const isToday = isSameDay(day, now);
    const active = isToday && dayEvents.find(ev => ev.start <= now && ev.end >= now);
    if (active) {
      return { status: "IN_USE", label: "Em Uso", count: dayEvents.length, badgeColor: "bg-red-50 text-red-700 border-red-200", events: dayEvents };
    }
    return { status: "RESERVED", label: `${dayEvents.length} comp.`, count: dayEvents.length, badgeColor: "bg-amber-50 text-amber-700 border-amber-200", events: dayEvents };
  };

  const getVehicleStatusForToday = (vehicleId: string) => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const vehicleEvents = events.filter(ev => 
      ev.vehicle === vehicleId && 
      ev.start <= endOfToday && 
      ev.end >= startOfToday
    );

    if (vehicleEvents.length === 0) {
      return { status: "AVAILABLE", label: "Disponível", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    }

    const now = new Date();
    const activeEvent = vehicleEvents.find(ev => ev.start <= now && ev.end >= now);

    if (activeEvent) {
      return { 
        status: "IN_USE", 
        label: "Em Uso", 
        badgeColor: "bg-red-50 text-red-700 border-red-200", 
        event: activeEvent 
      };
    }

    const nextEvent = vehicleEvents.sort((a, b) => a.start.getTime() - b.start.getTime())[0];
    return { 
      status: "RESERVED", 
      label: "Reservado Hoje", 
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200", 
      event: nextEvent 
    };
  };

  const getParticipantStatusForDay = (name: string, day: Date) => {
    const dayEvents = getEventsForDay(day).filter(ev => ev.participants?.includes(name));
    if (dayEvents.length === 0) {
      return { status: "AVAILABLE", label: "Livre", count: 0, badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    }
    const now = new Date();
    const isToday = isSameDay(day, now);
    const active = isToday && dayEvents.find(ev => ev.start <= now && ev.end >= now);
    if (active) {
      return { status: "IN_USE", label: "Ocupado", count: dayEvents.length, badgeColor: "bg-red-50 text-red-700 border-red-200", events: dayEvents };
    }
    return { status: "RESERVED", label: `${dayEvents.length} comp.`, count: dayEvents.length, badgeColor: "bg-amber-50 text-amber-700 border-amber-200", events: dayEvents };
  };

  const getParticipantStatusForToday = (name: string) => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    const dayEvents = events.filter(ev =>
      ev.participants?.includes(name) &&
      ev.start <= endOfToday &&
      ev.end >= startOfToday
    );
    if (dayEvents.length === 0) {
      return { status: "AVAILABLE", label: "Disponível", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    }
    const now = new Date();
    const active = dayEvents.find(ev => ev.start <= now && ev.end >= now);
    if (active) {
      return { status: "IN_USE", label: "Ocupado Agora", badgeColor: "bg-red-50 text-red-700 border-red-200", event: active };
    }
    const next = dayEvents.sort((a, b) => a.start.getTime() - b.start.getTime())[0];
    return { status: "RESERVED", label: "Comprometido Hoje", badgeColor: "bg-amber-50 text-amber-700 border-amber-200", event: next };
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <HeaderApp onLogout={() => router.push("/")} />
      
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agenda de Compromissos</h1>
            <p className="text-sm text-gray-500">
              Gerencie horários de funcionários e locação de veículos.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {viewMode === "FUNCIONARIO" && allParticipants.length > 0 && (
              <Select 
                label="Filtrar por Funcionário"
                className="w-56"
                size="sm"
                selectedKeys={[selectedParticipant]}
                onChange={(e) => setSelectedParticipant(e.target.value)}
                items={[{ key: "TODOS", label: "Todos os Funcionários" }, ...allParticipants.map(name => ({ key: name, label: name }))]}
              >
                {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
              </Select>
            )}
            <Select 
              label="Visualizar por"
              className="w-48"
              size="sm"
              selectedKeys={[viewMode]}
              onChange={(e) => {
                const mode = e.target.value as "FUNCIONARIO" | "VEICULO";
                setViewMode(mode);
                if (mode === "VEICULO") {
                  setCurrentView("day");
                } else {
                  setCurrentView("month");
                  setSelectedParticipant("TODOS");
                }
              }}
            >
              <SelectItem key="FUNCIONARIO">Funcionário</SelectItem>
              <SelectItem key="VEICULO">Veículo</SelectItem>
            </Select>
            <Button 
              className="bg-[#44735E] text-white font-semibold hover:bg-[#7FA830] hover:shadow-md transition-all duration-200"
              onPress={() => {
                setSelectedEvent(null);
                onOpen();
              }}
            >
              Novo Compromisso
            </Button>
          </div>
        </div>

        {/* Painel Disponibilidade de Frota */}
        <div className="mb-4">
          {/* Cabeçalho no estilo do dashboard */}
          <article
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200"
            onClick={() => setShowFleet(!showFleet)}
          >
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#44735E] text-white shadow-md">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Análise de Disponibilidade</p>
                  <p className="text-base font-bold text-gray-900">Frota de Veículos</p>
                </div>
              </div>
              <span className="text-xs text-[#44735E] font-semibold select-none">
                {showFleet ? "Recolher ▲" : "Expandir ▼"}
              </span>
            </div>
          </article>

          {showFleet && (
            <Card className="mt-3 shadow-sm border border-gray-100">
              <CardBody className="p-0">
                {/* Toggle período */}
                <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
                  <span className="text-xs text-gray-500 font-medium mr-2">Período:</span>
                  <button
                    onClick={() => setFleetPeriod("HOJE")}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                      fleetPeriod === "HOJE"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-emerald-400"
                    }`}
                  >
                    Hoje
                  </button>
                  <button
                    onClick={() => setFleetPeriod("SEMANAL")}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                      fleetPeriod === "SEMANAL"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-emerald-400"
                    }`}
                  >
                    Semanal
                  </button>
                </div>

                <div className="overflow-x-auto">
                  {fleetPeriod === "HOJE" ? (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Veículo</th>
                          <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Compromisso</th>
                          <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Responsável(is)</th>
                          <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Empresa</th>
                          <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Horário</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {vehicles.map((v) => {
                          const info = getVehicleStatusForToday(v.id);
                          return (
                            <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-5 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">{v.title}</td>
                              <td className="px-5 py-3 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${info.badgeColor}`}>
                                  {info.label}
                                </span>
                              </td>
                              <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600">{info.event ? info.event.title : "—"}</td>
                              <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600">{info.event?.participants?.join(", ") || "—"}</td>
                              <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600">{info.event?.company || "—"}</td>
                              <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-500">
                                {info.event ? <span className="font-medium text-gray-700">{formatTime(info.event.start)} – {formatTime(info.event.end)}</span> : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    (() => {
                      const weekDays = getWeekDays();
                      return (
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">Veículo</th>
                              {weekDays.map(day => (
                                <th key={day.toISOString()} className={`px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider min-w-[110px] ${
                                  isSameDay(day, new Date()) ? "text-emerald-700 bg-emerald-50" : "text-gray-500"
                                }`}>
                                  <div>{format(day, "EEE", { locale: ptBR })}</div>
                                  <div className="font-bold">{format(day, "dd/MM")}</div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {vehicles.map((v) => (
                              <tr key={v.id} className="hover:bg-gray-50/30 transition-colors">
                                <td className="px-5 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 sticky left-0 bg-white border-r border-gray-100">{v.title}</td>
                                {weekDays.map(day => {
                                  const info = getVehicleStatusForDay(v.id, day);
                                  return (
                                    <td key={day.toISOString()} className={`px-4 py-3 text-center ${
                                      isSameDay(day, new Date()) ? "bg-emerald-50/40" : ""
                                    }`}>
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${info.badgeColor}`}>
                                        {info.label}
                                      </span>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()
                  )}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Painel Disponibilidade de Funcionários */}
        <div className="mb-4">
          {/* Cabeçalho no estilo do dashboard */}
          <article
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200"
            onClick={() => setShowEmployees(!showEmployees)}
          >
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#44735E] text-white shadow-md">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Análise de Disponibilidade</p>
                  <p className="text-base font-bold text-gray-900">Funcionários / Participantes</p>
                </div>
              </div>
              <span className="text-xs text-[#44735E] font-semibold select-none">
                {showEmployees ? "Recolher ▲" : "Expandir ▼"}
              </span>
            </div>
          </article>

          {showEmployees && (
            <Card className="mt-3 shadow-sm border border-gray-100">
              <CardBody className="p-0">
                {/* Toggle período */}
                <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
                  <span className="text-xs text-gray-500 font-medium mr-2">Período:</span>
                  <button
                    onClick={() => setEmployeePeriod("HOJE")}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                      employeePeriod === "HOJE"
                        ? "bg-teal-600 text-white border-teal-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-teal-400"
                    }`}
                  >
                    Hoje
                  </button>
                  <button
                    onClick={() => setEmployeePeriod("SEMANAL")}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                      employeePeriod === "SEMANAL"
                        ? "bg-teal-600 text-white border-teal-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-teal-400"
                    }`}
                  >
                    Semanal
                  </button>
                </div>

                {allParticipants.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-400">Nenhum funcionário cadastrado em compromissos.</div>
                ) : (
                  <div className="overflow-x-auto">
                    {employeePeriod === "HOJE" ? (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Funcionário</th>
                            <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status Hoje</th>
                            <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Compromisso</th>
                            <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Empresa</th>
                            <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Horário</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {allParticipants.map((name) => {
                            const info = getParticipantStatusForToday(name);
                            return (
                              <tr key={name} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-5 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">{name}</td>
                                <td className="px-5 py-3 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${info.badgeColor}`}>
                                    {info.label}
                                  </span>
                                </td>
                                <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600">{info.event ? info.event.title : "—"}</td>
                                <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600">{info.event?.company || "—"}</td>
                                <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {info.event ? <span className="font-medium text-gray-700">{formatTime(info.event.start)} – {formatTime(info.event.end)}</span> : "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      (() => {
                        const weekDays = getWeekDays();
                        return (
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">Funcionário</th>
                                {weekDays.map(day => (
                                  <th key={day.toISOString()} className={`px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider min-w-[110px] ${
                                    isSameDay(day, new Date()) ? "text-teal-700 bg-teal-50" : "text-gray-500"
                                  }`}>
                                    <div>{format(day, "EEE", { locale: ptBR })}</div>
                                    <div className="font-bold">{format(day, "dd/MM")}</div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                              {allParticipants.map((name) => (
                                <tr key={name} className="hover:bg-gray-50/30 transition-colors">
                                  <td className="px-5 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 sticky left-0 bg-white border-r border-gray-100">{name}</td>
                                  {weekDays.map(day => {
                                    const info = getParticipantStatusForDay(name, day);
                                    return (
                                      <td key={day.toISOString()} className={`px-4 py-3 text-center ${
                                        isSameDay(day, new Date()) ? "bg-teal-50/40" : ""
                                      }`}>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${info.badgeColor}`}>
                                          {info.label}
                                        </span>
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        );
                      })()
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        {/* Legenda de Cores — ordem alfabética */}
        <div className="mb-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-3.5 flex flex-wrap items-center gap-6">
            <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Legenda de Cores:</span>
            <div className="flex flex-wrap gap-5">
              {/* Assessoria */}
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full bg-[#9333ea] shadow-sm border border-[#7e22ce]/30 flex-shrink-0" />
                <span className="text-sm font-semibold text-gray-700">Assessoria</span>
              </div>
              {/* In Company */}
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full bg-[#16a34a] shadow-sm border border-[#15803d]/30 flex-shrink-0" />
                <span className="text-sm font-semibold text-gray-700">In Company</span>
              </div>
              {/* Leva e Trás */}
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full bg-[#ea580c] shadow-sm border border-[#c2410c]/30 flex-shrink-0" />
                <span className="text-sm font-semibold text-gray-700">Leva e Trás</span>
              </div>
              {/* Outro */}
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full bg-[#6b7280] shadow-sm border border-[#4b5563]/30 flex-shrink-0" />
                <span className="text-sm font-semibold text-gray-700">Outro</span>
              </div>
              {/* Perícia */}
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full bg-[#dc2626] shadow-sm border border-[#b91c1c]/30 flex-shrink-0" />
                <span className="text-sm font-semibold text-gray-700">Perícia</span>
              </div>
              {/* Treinamento */}
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full bg-[#ca8a04] shadow-sm border border-[#a16207]/30 flex-shrink-0" />
                <span className="text-sm font-semibold text-gray-700">Treinamento</span>
              </div>
              {/* Visita Técnica */}
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full bg-[#2563eb] shadow-sm border border-[#1d4ed8]/30 flex-shrink-0" />
                <span className="text-sm font-semibold text-gray-700">Visita Técnica</span>
              </div>
            </div>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardBody className="p-0">
            <div className="h-[700px] w-full p-4">
              <Calendar
                localizer={localizer}
                events={filteredEvents}
                startAccessor="start"
                endAccessor="end"
                date={currentDate}
                view={currentView}
                onNavigate={(newDate) => setCurrentDate(newDate)}
                onView={(newView) => setCurrentView(newView)}
                onSelectEvent={(event) => {
                  setSelectedEvent(event);
                  onOpen();
                }}
                resources={resources}
                resourceIdAccessor="id"
                resourceTitleAccessor="title"
                eventPropGetter={eventPropGetter}
                components={{
                  toolbar: (tp: any) => (
                    <CustomToolbar
                      label={tp.label}
                      onNavigate={tp.onNavigate}
                      onView={(view: string) => { setCurrentView(view); tp.onView(view); }}
                      view={currentView}
                    />
                  ),
                  event: ({ event }: any) => {
                    const typeLabelMap: Record<string, string> = {
                      ASSESSORIA: "Assessoria",
                      IN_COMPANY: "In Company",
                      LEVA_E_TRAS: "Leva e Trás",
                      OUTRO: "Outro",
                      PERICIA: "Perícia",
                      TREINAMENTO: "Treinamento",
                      VISITA_TECNICA: "Visita Técnica",
                    };
                    const typeLabel = typeLabelMap[event.type] || event.type;
                    
                    if (viewMode === "FUNCIONARIO") {
                      const participantsText = event.participants && event.participants.length > 0 
                        ? event.participants.join(", ") 
                        : "Sem Participante";
                      return (
                        <div className="flex flex-col text-[11px] overflow-hidden leading-tight p-0.5">
                          <span className="font-bold truncate">{participantsText}</span>
                          <span className="opacity-95 truncate text-[10px]">{event.title} ({typeLabel})</span>
                        </div>
                      );
                    }
                    return (
                      <div className="flex flex-col text-[11px] overflow-hidden leading-tight p-0.5">
                        <span className="font-bold truncate">{event.title}</span>
                        {event.participants && event.participants.length > 0 && (
                          <span className="opacity-95 truncate text-[10px]">({event.participants.join(", ")})</span>
                        )}
                      </div>
                    );
                  }
                }}
                culture="pt-BR"
                messages={{
                  next: "Próximo",
                  previous: "Anterior",
                  today: "Hoje",
                  month: "Mês",
                  week: "Semana",
                  day: "Dia",
                  agenda: "Lista",
                  date: "Data",
                  time: "Hora",
                  event: "Evento",
                  noEventsInRange: "Não há compromissos neste período.",
                  showMore: (total) => `+ ${total} mais`
                }}
              />
            </div>
          </CardBody>
        </Card>

        <div className="mb-6">
          <MetricsDashboard events={events} vehicles={vehicles} />
        </div>

        <CommitmentModal 
          isOpen={isOpen} 
          onOpenChange={onOpenChange} 
          initialData={selectedEvent}
          onSubmit={async (data) => {
            try {
              if (selectedEvent?.id) {
                await updateCommitment(selectedEvent.id, data);
                alert("Compromisso atualizado com sucesso!");
              } else {
                await createCommitment(data);
                alert("Compromisso salvo com sucesso!");
              }
              await fetchEvents();
            } catch (err) {
              console.error(err);
              alert("Erro ao salvar compromisso.");
            }
          }}
          onDelete={async () => {
            if (selectedEvent?.id && window.confirm("Deseja realmente excluir este compromisso?")) {
              try {
                await deleteCommitment(selectedEvent.id);
                alert("Compromisso excluído!");
                await fetchEvents();
              } catch (err) {
                console.error(err);
                alert("Erro ao excluir.");
              }
            }
          }}
        />
      </main>
    </div>
  );
}
