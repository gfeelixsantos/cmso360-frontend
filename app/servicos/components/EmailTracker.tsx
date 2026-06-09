"use client";

import { useMemo, useState } from "react";
import {
  addToast,
  Badge,
  Button,
  Chip,
  Input,
  Select,
  SelectItem,
  Spinner,
} from "@heroui/react";
import {
  Mail,
  MailCheck,
  MailX,
  MailQuestion,
  Search,
  RotateCw,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";

import { useAsoTracking } from "@/hooks/useAsoTracking";

type EmailFilter = "todos" | "enviado" | "pendente" | "falha";

export const EmailTracker: React.FC = () => {
  const { data, loading, error, refetch } = useAsoTracking({
    limit: 200,
    autoRefresh: true,
    refreshInterval: 15000,
  });

  const [filter, setFilter] = useState<EmailFilter>("todos");
  const [searchQuery, setSearchQuery] = useState("");

  const stats = useMemo(() => {
    if (!data?.items) return { total: 0, enviados: 0, pendentes: 0, falha: 0 };

    const items = data.items;
    const enviados = items.filter((i) => i.emailSent === true).length;
    const falha = items.filter((i) => i.status === "FALHA" && i.emailSent !== true).length;
    const pendentes = items.length - enviados - falha;

    return {
      total: items.length,
      enviados,
      pendentes,
      falha,
    };
  }, [data]);

  const filteredItems = useMemo(() => {
    if (!data?.items) return [];

    let items = data.items;

    if (filter === "enviado") {
      items = items.filter((i) => i.emailSent === true);
    } else if (filter === "pendente") {
      items = items.filter((i) => i.emailSent !== true && i.status !== "FALHA");
    } else if (filter === "falha") {
      items = items.filter((i) => i.status === "FALHA" && i.emailSent !== true);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      items = items.filter(
        (i) =>
          i.nomeFuncionario?.toLowerCase().includes(q) ||
          i.nomeEmpresa?.toLowerCase().includes(q) ||
          i.schedulingId?.toLowerCase().includes(q),
      );
    }

    return items;
  }, [data, filter, searchQuery]);

  const handleRefresh = () => {
    refetch();
    addToast({
      title: "Atualizado",
      description: "Lista de emails atualizada.",
      severity: "success",
      color: "foreground",
      variant: "flat",
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-default-200 bg-white p-5 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, delay: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-default-500">Total</p>
              <p className="mt-1 text-2xl font-bold text-default-900">
                {stats.total}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Mail className="h-6 w-6" />
            </div>
          </div>
        </motion.div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-default-200 bg-white p-5 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-default-500">Enviados</p>
              <p className="mt-1 text-2xl font-bold text-green-600">
                {stats.enviados}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <MailCheck className="h-6 w-6" />
            </div>
          </div>
        </motion.div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-default-200 bg-white p-5 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-default-500">Pendentes</p>
              <p className="mt-1 text-2xl font-bold text-yellow-600">
                {stats.pendentes}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600">
              <MailQuestion className="h-6 w-6" />
            </div>
          </div>
        </motion.div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-default-200 bg-white p-5 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-default-500">Com Falha</p>
              <p className="mt-1 text-2xl font-bold text-red-600">
                {stats.falha}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <MailX className="h-6 w-6" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-2xl border border-default-200 bg-white p-1 shadow-sm">
          {(["todos", "enviado", "pendente", "falha"] as const).map((key) => (
            <button
              key={key}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                filter === key
                  ? "bg-primary text-white shadow-sm"
                  : "text-default-600 hover:bg-default-100"
              }`}
              onClick={() => setFilter(key)}
            >
              {key === "todos" && "Todos"}
              {key === "enviado" && "Enviados"}
              {key === "pendente" && "Pendentes"}
              {key === "falha" && "Com Falha"}
            </button>
          ))}
        </div>

        <Input
          className="max-w-xs"
          placeholder="Buscar por funcionário, empresa ou ID..."
          size="sm"
          startContent={<Search className="h-4 w-4 text-default-400" />}
          value={searchQuery}
          onValueChange={setSearchQuery}
        />

        <Button
          isIconOnly
          size="sm"
          variant="flat"
          onPress={handleRefresh}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-default-200 bg-white shadow-sm">
        {loading && !data ? (
          <div className="flex flex-col items-center justify-center py-16 text-default-500">
            <Spinner color="primary" size="lg" />
            <p className="mt-3 text-sm">Carregando...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-danger">
            <MailX className="mb-3 h-10 w-10" />
            <p className="text-sm font-medium">Erro ao carregar dados</p>
            <p className="mt-1 text-xs text-default-500">{error.message}</p>
            <Button
              className="mt-4"
              color="primary"
              size="sm"
              variant="flat"
              onPress={handleRefresh}
            >
              Tentar novamente
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-default-400">
            <MailQuestion className="mb-3 h-10 w-10 text-default-300" />
            <p className="text-sm font-medium">
              {filter === "todos"
                ? "Nenhum ASO encontrado."
                : `Nenhum ASO com status "${filter}" encontrado.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-default-200 bg-default-50/60">
                  <th className="px-4 py-3 font-semibold text-default-600">
                    Funcionário
                  </th>
                  <th className="px-4 py-3 font-semibold text-default-600">
                    Empresa
                  </th>
                  <th className="hidden px-4 py-3 font-semibold text-default-600 md:table-cell">
                    Tipo
                  </th>
                  <th className="hidden px-4 py-3 font-semibold text-default-600 sm:table-cell">
                    Data
                  </th>
                  <th className="px-4 py-3 font-semibold text-default-600">
                    Status Email
                  </th>
                  <th className="hidden px-4 py-3 font-semibold text-default-600 lg:table-cell">
                    Etapa ASO
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => (
                  <motion.tr
                    key={item.schedulingId}
                    animate={{ opacity: 1 }}
                    className="border-b border-default-100 transition-colors hover:bg-default-50/50"
                    initial={{ opacity: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-default-900">
                        {item.nomeFuncionario}
                      </p>
                      <p className="text-xs text-default-500">
                        {item.schedulingId?.slice(-8)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-default-700">
                      {item.nomeEmpresa}
                    </td>
                    <td className="hidden px-4 py-3 text-default-600 md:table-cell">
                      {item.tipoExame}
                    </td>
                    <td className="hidden px-4 py-3 text-default-600 sm:table-cell">
                      {item.dataAgendamento}
                    </td>
                    <td className="px-4 py-3">
                      {item.emailSent === true ? (
                        <Chip
                          color="success"
                          size="sm"
                          variant="flat"
                        >
                          Enviado
                        </Chip>
                      ) : item.status === "FALHA" ? (
                        <Chip
                          color="danger"
                          size="sm"
                          variant="flat"
                        >
                          Falha
                        </Chip>
                      ) : (
                        <Chip
                          color="warning"
                          size="sm"
                          variant="flat"
                        >
                          Pendente
                        </Chip>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            item.status === "LIBERADO"
                              ? "bg-green-500"
                              : item.status === "FALHA"
                                ? "bg-red-500"
                                : item.status === "PROCESSANDO" ||
                                    item.status === "DIGITALIZADA"
                                  ? "bg-blue-500"
                                  : "bg-yellow-500"
                          }`}
                        />
                        <span className="text-xs text-default-600">
                          {item.etapa}
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between border-t border-default-200 px-4 py-3 text-xs text-default-500">
              <span>
                Mostrando {filteredItems.length} de {data?.total || 0} ASOs
              </span>
              <span className="flex items-center gap-1">
                <RotateCw className="h-3 w-3" />
                Atualiza a cada 15s
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
