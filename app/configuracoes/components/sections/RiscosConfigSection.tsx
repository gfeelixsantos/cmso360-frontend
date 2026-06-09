"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Plus, Pencil, Trash2 } from "lucide-react";
import {
  Button, Input, Textarea, Modal, ModalContent, ModalHeader, ModalBody,
  ModalFooter, Card, CardBody, Chip, Switch, Divider,
} from "@heroui/react";
import CmsoCircularLoading from "@/components/shared/CmsoCircularLoading";
import { getCurrentUser } from "@/lib/utils";
import {
  fetchRiscosConfig, createRiscoConfig, updateRiscoConfig, deleteRiscoConfig,
  IRiscoConfig,
} from "@/lib/riscos-config/services/riscos-config.service";

const TIPOS_SUGESTAO = [
  { value: "ALTURA", label: "Trabalho em Altura" },
  { value: "CONFINADO", label: "Espaço Confinado" },
];

export function RiscosConfigSection() {
  const [configs, setConfigs] = useState<IRiscoConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IRiscoConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [formTipo, setFormTipo] = useState("");
  const [formDescricao, setFormDescricao] = useState("");
  const [formCodigos, setFormCodigos] = useState("");
  const [error, setError] = useState<string | null>(null);

  const user = getCurrentUser();
  const isMaster = user?.perfil === "MASTER";

  const load = useCallback(async () => {
    try {
      const data = await fetchRiscosConfig();
      setConfigs(data);
    } catch (err) {
      console.error("Erro ao carregar configurações de risco:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setFormTipo("");
    setFormDescricao("");
    setFormCodigos("");
    setError(null);
    setModalOpen(true);
  }

  function openEdit(config: IRiscoConfig) {
    setEditing(config);
    setFormTipo(config.tipo);
    setFormDescricao(config.descricao);
    setFormCodigos(config.codigos.join(", "));
    setError(null);
    setModalOpen(true);
  }

  async function handleSave() {
    const codigosArray = formCodigos.split(",").map((s) => s.trim()).filter(Boolean);
    if (!formTipo.trim() || !formDescricao.trim() || codigosArray.length === 0) return;

    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await updateRiscoConfig(editing.id, {
          tipo: formTipo.trim(),
          descricao: formDescricao.trim(),
          codigos: codigosArray,
        });
      } else {
        await createRiscoConfig({
          tipo: formTipo.trim(),
          descricao: formDescricao.trim(),
          codigos: codigosArray,
        });
      }
      setModalOpen(false);
      load();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAtivo(config: IRiscoConfig) {
    try {
      await updateRiscoConfig(config.id, { ativo: !config.ativo });
      load();
    } catch (err) {
      console.error("Erro ao alterar status:", err);
    }
  }

  async function handleDelete(config: IRiscoConfig) {
    if (!confirm(`Inativar "${config.descricao}"?`)) return;
    try {
      await deleteRiscoConfig(config.id);
      load();
    } catch (err) {
      console.error("Erro ao inativar:", err);
    }
  }

  function getTipoLabel(tipo: string) {
    const found = TIPOS_SUGESTAO.find((t) => t.value === tipo);
    return found ? found.label : tipo;
  }

  if (loading) {
    return <CmsoCircularLoading title="Carregando configurações..." description="Aguarde um momento" fullHeight={false} />;
  }

  return (
    <Card className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <CardBody className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle size={28} aria-hidden="true" style={{ color: "#44735e" }} />
            <h2 className="text-xl font-semibold text-gray-800">Riscos / Pareceres</h2>
            <Chip size="sm" variant="flat">{configs.length} configurações</Chip>
          </div>
          {isMaster && (
            <Button
              color="primary"
              startContent={<Plus size={18} />}
              onPress={openCreate}
              size="sm"
              className="h-9 px-3"
              style={{ backgroundColor: "#44735e" }}
            >
              Novo
            </Button>
          )}
        </div>

        {!isMaster && (
          <p className="text-sm text-gray-400 mb-4">
            Visualização somente leitura. Apenas usuários MASTER podem gerenciar.
          </p>
        )}

        <Divider className="mb-4" />

        {configs.length === 0 && (
          <div className="text-center py-8 text-gray-400">Nenhuma configuração cadastrada.</div>
        )}

        <div className="space-y-3">
          {configs.map((config) => (
            <div
              key={config.id}
              className={`rounded-lg border px-4 py-3 ${!config.ativo ? "bg-gray-50 opacity-60" : "bg-white"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${!config.ativo ? "line-through text-gray-400" : "text-gray-900"}`}>
                      {config.descricao}
                    </span>
                    <Chip size="sm" variant="flat" className="font-mono text-[11px]">
                      {config.tipo}
                    </Chip>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {config.codigos.map((cod) => (
                      <Chip key={cod} size="sm" variant="flat" className="font-mono text-[11px]">
                        {cod}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Chip
                    size="sm"
                    variant="flat"
                    color={config.ativo ? "success" : "danger"}
                  >
                    {config.ativo ? "Ativo" : "Inativo"}
                  </Chip>
                  {isMaster && (
                    <div className="flex gap-1">
                      <Button isIconOnly size="sm" variant="light" onPress={() => openEdit(config)}>
                        <Pencil size={14} />
                      </Button>
                      <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => handleDelete(config)}>
                        <Trash2 size={14} />
                      </Button>
                      <Switch
                        isSelected={config.ativo}
                        onValueChange={() => handleToggleAtivo(config)}
                        size="sm"
                        color="primary"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardBody>

      <Modal isOpen={modalOpen} onOpenChange={setModalOpen} size="lg">
        <ModalContent>
          <ModalHeader>{editing ? "Editar Configuração" : "Nova Configuração"}</ModalHeader>
          <ModalBody>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">{error}</div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Tipo"
                placeholder="ex: ALTURA"
                value={formTipo}
                onValueChange={setFormTipo}
                isRequired
                description="Identificador único em maiúsculas"
              />
              <Input
                label="Descrição"
                placeholder="ex: Trabalho em Altura"
                value={formDescricao}
                onValueChange={setFormDescricao}
                isRequired
              />
              <div className="col-span-2">
                <Textarea
                  label="Códigos SOC (separados por vírgula)"
                  placeholder="ex: 179, 213, 252"
                  value={formCodigos}
                  onValueChange={setFormCodigos}
                  isRequired
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setModalOpen(false)}>Cancelar</Button>
            <Button
              color="primary"
              onPress={handleSave}
              isLoading={saving}
              isDisabled={!formTipo.trim() || !formDescricao.trim() || !formCodigos.trim()}
              style={{ backgroundColor: "#44735e" }}
            >
              {editing ? "Atualizar" : "Criar"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );
}
