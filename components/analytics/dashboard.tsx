"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { Users, Truck, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { DistributionByTypeChart, VolumeByMonthChart, CommitmentsByVehicleChart, TopEmployeesChart } from "./charts";

export interface MetricsDashboardProps {
  events: any[];
  vehicles: { id: string; title: string }[];
}

export function MetricsDashboard({ events, vehicles }: MetricsDashboardProps) {
  const now = useMemo(() => new Date(), []);
  const todayStart = useMemo(() => new Date(now.getFullYear(), now.getMonth(), now.getDate()), [now]);
  const monthStart = useMemo(() => new Date(now.getFullYear(), now.getMonth(), 1), [now]);
  const weekStart = useMemo(() => {
    const d = new Date(now);
    d.setDate(now.getDate() - now.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }, [now]);

  const totalEvents = events.length;
  const todayEvents = events.filter((e: any) => e.start >= todayStart && e.start < new Date(todayStart.getTime() + 86400000)).length;
  const thisMonthEvents = events.filter((e: any) => e.start >= monthStart).length;
  const thisWeekEvents = events.filter((e: any) => e.start >= weekStart).length;

  const occupiedNow = events.filter((e: any) => e.start <= now && e.end >= now).length;
  const utilizationRate = vehicles.length > 0 ? Math.round((occupiedNow / vehicles.length) * 100) : 0;

  const vehicleCounts: Record<string, number> = events.reduce((acc: Record<string, number>, e: any) => {
    if (e.vehicle) acc[e.vehicle] = (acc[e.vehicle] || 0) + 1;
    return acc;
  }, {});
  const sortedVehicles = (Object.entries(vehicleCounts) as [string, number][]).sort(([, a], [, b]) => b - a);
  const mostUsedVehicleId = sortedVehicles[0]?.[0];
  const mostUsedVehicleCount = sortedVehicles[0]?.[1] || 0;

  const employeeCounts: Record<string, number> = events.reduce((acc: Record<string, number>, e: any) => {
    if (e.participants) e.participants.forEach((p: string) => { acc[p] = (acc[p] || 0) + 1; });
    return acc;
  }, {});
  const sortedEmployees = (Object.entries(employeeCounts) as [string, number][]).sort(([, a], [, b]) => b - a);
  const mostActiveEmployee = sortedEmployees[0]?.[0];
  const mostActiveEmployeeCount = sortedEmployees[0]?.[1] || 0;

  const vehicleLabelMap: Record<string, string> = {
    UNIDADE_MOVEL: "Unidade Móvel", UNIDADE_RAIO_X: "Unidade Raio-X",
    DOBLO_I: "Doblô I", DOBLO_II: "Doblô II", UP: "Up", PICKUP: "Pickup", MOBI: "Mobi"
  };

  const nextEvents = events
    .filter((e: any) => new Date(e.start) > now)
    .sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 5);

  const getColorForType = (type: string) => {
    const map: Record<string, string> = { EXAME: "#16a34a", TREINAMENTO: "#ca8a04", VISITA_TECNICA: "#2563eb", PERICIA: "#dc2626", OUTRO: "#6b7280" };
    return map[type] || "#6b7280";
  };

  const chartData = useMemo(() => {
    const counts: Record<string, number> = events.reduce((acc: Record<string, number>, e: any) => { acc[e.type || "OUTRO"] = (acc[e.type || "OUTRO"] || 0) + 1; return acc; }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value, color: getColorForType(name) }));
  }, [events]);

  const monthlyData = useMemo(() => {
    const months: { month: string; compromissos: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
      const count = events.filter((e: any) => { const ed = new Date(e.start); return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear(); }).length;
      months.push({ month: `${label}`, compromissos: count });
    }
    return months;
  }, [events, now]);

  const vehicleChartData = useMemo(() => {
    return sortedVehicles.map(([id, count]) => ({ name: vehicleLabelMap[id] || id.replace(/_/g, " "), compromissos: count as number }));
  }, [sortedVehicles]);

  const employeeChartData = useMemo(() => {
    return sortedEmployees.slice(0, 10).map(([name, count]) => ({ name, compromissos: count as number }));
  }, [sortedEmployees]);

  const getStatusColor = (rate: number) => rate >= 80 ? "text-red-600" : rate >= 60 ? "text-amber-600" : "text-green-600";
  const getStatusBg = (rate: number) => rate >= 80 ? "bg-red-100" : rate >= 60 ? "bg-amber-100" : "bg-green-100";

  return (
    <div className="space-y-4">
      {/* Linha de métricas rápidas — estilo barra compacta */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
          <div className="p-5 text-center">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total</p>
            <p className="text-3xl font-bold text-gray-900">{totalEvents}</p>
            <p className="text-xs text-gray-400 mt-0.5">compromissos</p>
          </div>
          <div className="p-5 text-center">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Este Mês</p>
            <p className="text-3xl font-bold text-gray-900">{thisMonthEvents}</p>
            <p className="text-xs text-gray-400 mt-0.5">{monthStart.toLocaleDateString('pt-BR', { month: 'long' })}</p>
          </div>
          <div className="p-5 text-center">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Esta Semana</p>
            <p className="text-3xl font-bold text-gray-900">{thisWeekEvents}</p>
            <p className="text-xs text-gray-400 mt-0.5">Seg–Dom</p>
          </div>
          <div className="p-5 text-center">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Hoje</p>
            <p className="text-3xl font-bold text-gray-900">{todayEvents}</p>
            <p className="text-xs text-gray-400 mt-0.5">{format(now, "dd/MM")}</p>
          </div>
        </div>
      </div>

      {/* Destaques chave — layout horizontal com ícones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Utilização da Frota */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl ${getStatusBg(utilizationRate)} flex items-center justify-center flex-shrink-0`}>
            {utilizationRate >= 80 ? <XCircle className={`h-6 w-6 ${getStatusColor(utilizationRate)}`} /> : 
             utilizationRate >= 60 ? <AlertCircle className={`h-6 w-6 ${getStatusColor(utilizationRate)}`} /> : 
             <CheckCircle className={`h-6 w-6 ${getStatusColor(utilizationRate)}`} />}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Frota em Uso Agora</p>
            <p className={`text-2xl font-bold ${getStatusColor(utilizationRate)}`}>{utilizationRate}%</p>
            <p className="text-xs text-gray-500 mt-0.5">{occupiedNow} de {vehicles.length} veículos ocupados</p>
          </div>
        </div>

        {/* Veículo Mais Demandado */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Truck className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Veículo Líder</p>
            <p className="text-2xl font-bold text-gray-900 truncate">{mostUsedVehicleId ? vehicleLabelMap[mostUsedVehicleId] || mostUsedVehicleId.replace(/_/g, " ") : "—"}</p>
            <p className="text-xs text-gray-500 mt-0.5">{mostUsedVehicleCount} compromissos registrados</p>
          </div>
        </div>

        {/* Funcionário Mais Acionado */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Users className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Funcionário Destaque</p>
            <p className="text-2xl font-bold text-gray-900 truncate">{mostActiveEmployee || "—"}</p>
            <p className="text-xs text-gray-500 mt-0.5">{mostActiveEmployeeCount} participações</p>
          </div>
        </div>
      </div>

      {/* Próximos Compromissos */}
      {nextEvents.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <Clock className="h-5 w-5 text-[#44735E]" />
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Próximos Compromissos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-50">
              <tbody className="divide-y divide-gray-50">
                {nextEvents.map((ev: any) => {
                  const start = new Date(ev.start);
                  const isHoje = start.toDateString() === now.toDateString();
                  const isAmanha = start.toDateString() === new Date(now.getTime() + 86400000).toDateString();
                  const badge = ev.type === "EXAME" ? "Exame" : ev.type === "TREINAMENTO" ? "Trein." : ev.type === "VISITA_TECNICA" ? "Visita" : ev.type === "PERICIA" ? "Perícia" : "Outro";
                  const badgeColor = ev.type === "EXAME" ? "bg-green-100 text-green-700" : ev.type === "TREINAMENTO" ? "bg-amber-100 text-amber-700" : ev.type === "VISITA_TECNICA" ? "bg-blue-100 text-blue-700" : ev.type === "PERICIA" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700";
                  return (
                    <tr key={ev.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
                          {isHoje && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">HOJE</span>}
                          {isAmanha && <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">AMANHÃ</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">{ev.title}</td>
                      <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          {format(start, "dd/MM")} às {format(start, "HH:mm")}
                        </div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600">{ev.participants?.slice(0, 2).join(", ")}{ev.participants?.length > 2 ? ` +${ev.participants.length - 2}` : ""}</td>
                      <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-500">{(ev.vehicle && vehicleLabelMap[ev.vehicle]) || ev.vehicle?.replace(/_/g, " ") || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <DistributionByTypeChart data={chartData} />
        <VolumeByMonthChart data={monthlyData} />
        <CommitmentsByVehicleChart data={vehicleChartData} />
        <TopEmployeesChart data={employeeChartData} />
      </div>
    </div>
  );
}
