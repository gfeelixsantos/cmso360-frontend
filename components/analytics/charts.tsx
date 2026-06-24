"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface MonthlyData {
  month: string;
  compromissos: number;
}

export interface VehicleData {
  name: string;
  compromissos: number;
}

export interface EmployeeData {
  name: string;
  compromissos: number;
}

export function DistributionByTypeChart({ data }: { data: ChartData[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
          <span className="text-blue-600 text-xs font-bold">Pie</span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Distribuição por Tipo</h3>
          <p className="text-xs text-gray-500">{total} compromissos no total</p>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={100} paddingAngle={2} dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || "#6b7280"} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm text-xs">
                      <p className="font-semibold text-gray-900">{payload[0].name}</p>
                      <p className="text-gray-600">{payload[0].value} compromissos ({Math.round(((payload[0].value as number) / total) * 100)}%)</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-gray-100">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5 text-xs">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="font-medium text-gray-700">{item.name}</span>
            <span className="text-gray-400">({item.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VolumeByMonthChart({ data }: { data: MonthlyData[] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
          <span className="text-green-600 text-xs font-bold">Bar</span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Volume por Mês</h3>
          <p className="text-xs text-gray-500">Últimos 6 meses</p>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm text-xs">
                      <p className="font-semibold text-gray-900">{label}</p>
                      <p className="text-green-600 font-semibold">{payload[0].value} compromissos</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="compromissos" fill="#44735E" radius={[3, 3, 0, 0]} barSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CommitmentsByVehicleChart({ data }: { data: VehicleData[] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
          <span className="text-purple-600 text-xs font-bold">Bar</span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Compromissos por Veículo</h3>
          <p className="text-xs text-gray-500">Distribuição de uso da frota</p>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#374151" }} width={100} axisLine={false} tickLine={false} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm text-xs">
                      <p className="font-semibold text-gray-900">{label}</p>
                      <p className="text-purple-600 font-semibold">{payload[0].value} compromissos</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="compromissos" fill="#7C3AED" radius={[0, 3, 3, 0]} barSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function TopEmployeesChart({ data }: { data: EmployeeData[] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
          <span className="text-amber-600 text-xs font-bold">Bar</span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Funcionários Mais Acionados</h3>
          <p className="text-xs text-gray-500">Top 10 por participação</p>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: "#374151" }}
              width={60}
              tickFormatter={(value: string) => value.split(" ").map((w: string) => w.charAt(0)).join("")}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm text-xs">
                      <p className="font-semibold text-gray-900">{label}</p>
                      <p className="text-amber-600 font-semibold">{payload[0].value} participações</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="compromissos" fill="#D97706" radius={[0, 3, 3, 0]} barSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
