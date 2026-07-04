"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Plus, Pencil, Trash2, X } from "lucide-react";
import {
  Button, Input, Textarea, Select, SelectItem,
  Card, CardBody, Chip, Switch, Divider, Tabs, Tab,
} from "@heroui/react";
import CmsoCircularLoading from "@/components/shared/CmsoCircularLoading";
import { getCurrentUser } from "@/lib/utils";
import {
  fetchRiscosConfig, createRiscoConfig, updateRiscoConfig, deleteRiscoConfig,
  IRiscoConfig, IRiscoConfigFormData, GRUPOS_RISCOS,
} from "@/lib/riscos-config/services/riscos-config.service";
import {
  normalizeRiskCode,
  normalizeRiskType,
} from "@/lib/riscos-config/utils";

const INITIAL_FORM: IRiscoConfigFormData = {
  tipo: "",
  descricao: "",
  codigos: [],
  grupo: "",
  parecer_opcoes: [],
  observacao: "",
  perigo_nome: "",
  perigo_tipo_exposicao: "",
  perigo_fonte_geradora: "",
  perigo_trajetoria_acao: "",
  perigo_tecnica_utilizada: "",
  perigo_possiveis_danos: "",
  perigo_medidas_administrativas: "",
  perigo_epc_eficaz: false,
  perigo_epc_descricao: "",
  perigo_epi_eficaz: false,
  perigo_epi_descricao: "",
  perigo_acoes_necessarias: "",
  perigo_criterio_monitoracao: "",
  perigo_observacao: "",
};

function getGrupoColor(grupo: string) {
  const cores: Record<string, string> = {
    FISICOS: "#6366f1",
    QUIMICOS: "#f59e0b",
    BIOLOGICOS: "#ef4444",
    ACIDENTES: "#44735e",
    ERGONOMICOS: "#8b5cf6",
  };
  return cores[grupo] || "#6b7280";
}

export function RiscosConfigSection() {
  const [configs, setConfigs] = useState<IRiscoConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<IRiscoConfigFormData>(INITIAL_FORM);
  const [formCodigosStr, setFormCodigosStr] = useState("");
  const [formParecerStr, setFormParecerStr] = useState("");
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

  function handleOpenCreate() {
    setCreatingNew(true);
    setExpandedId(null);
    setForm(INITIAL_FORM);
    setFormCodigosStr("");
    setFormParecerStr("");
    setError(null);
  }

  function handleOpenEdit(config: IRiscoConfig) {
    setCreatingNew(false);
    setExpandedId(config.id);
    setForm({
      tipo: config.tipo,
      descricao: config.descricao,
      codigos: config.codigos,
      grupo: config.grupo || "",
      parecer_opcoes: config.parecer_opcoes ?? [],
      observacao: config.observacao || "",
      perigo_nome: config.perigo_nome || "",
      perigo_tipo_exposicao: config.perigo_tipo_exposicao || "",
      perigo_fonte_geradora: config.perigo_fonte_geradora || "",
      perigo_trajetoria_acao: config.perigo_trajetoria_acao || "",
      perigo_tecnica_utilizada: config.perigo_tecnica_utilizada || "",
      perigo_possiveis_danos: config.perigo_possiveis_danos || "",
      perigo_medidas_administrativas: config.perigo_medidas_administrativas || "",
      perigo_epc_eficaz: config.perigo_epc_eficaz || false,
      perigo_epc_descricao: config.perigo_epc_descricao || "",
      perigo_epi_eficaz: config.perigo_epi_eficaz || false,
      perigo_epi_descricao: config.perigo_epi_descricao || "",
      perigo_acoes_necessarias: config.perigo_acoes_necessarias || "",
      perigo_criterio_monitoracao: config.perigo_criterio_monitoracao || "",
      perigo_observacao: config.perigo_observacao || "",
    });
    setFormCodigosStr(config.codigos.join(", "));
    setFormParecerStr((config.parecer_opcoes ?? []).join(", "));
    setError(null);
  }

  function handleClose() {
    setExpandedId(null);
    setCreatingNew(false);
    setError(null);
  }

  function updateField<K extends keyof IRiscoConfigFormData>(key: K, value: IRiscoConfigFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    const codigosArray = Array.from(
      new Set(
        formCodigosStr
          .split(",")
          .map(normalizeRiskCode)
          .filter(Boolean),
      ),
    );
    const parecerOpcoes = Array.from(
      new Set(
        formParecerStr
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    );
    if (!form.descricao.trim() || codigosArray.length === 0 || !form.grupo) return;

    setSaving(true);
    setError(null);
    try {
      const payload: IRiscoConfigFormData = {
        ...form,
        tipo: normalizeRiskType(form.tipo),
        codigos: codigosArray,
        parecer_opcoes: parecerOpcoes.length > 0 ? parecerOpcoes : undefined,
      };

      if (creatingNew) {
        await createRiscoConfig(payload);
      } else if (expandedId) {
        await updateRiscoConfig(expandedId, payload);
      }
      handleClose();
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

  function renderForm() {
    const isExpanded = creatingNew || expandedId !== null;
    if (!isExpanded) return null;

    const isEdit = expandedId !== null;
    const editingConfig = isEdit ? configs.find(c => c.id === expandedId) : null;

    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50/30 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border-b border-blue-200">
          <span className="text-sm font-semibold text-blue-800">
            {creatingNew ? "Nova Configuração" : `Editando: ${editingConfig?.descricao}`}
          </span>
          <Button isIconOnly size="sm" variant="light" onPress={handleClose}>
            <X size={16} />
          </Button>
        </div>

        {error && (
          <div className="mx-4 mt-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        <div className="p-4">
          <Tabs aria-label="Configuração do risco">
            <Tab key="config" title="Configuração">
              <div className="grid grid-cols-2 gap-4 pt-4">
                <Input
                  label="Tipo"
                  placeholder="ex: ALTURA"
                  value={form.tipo}
                  onValueChange={(v) => updateField("tipo", v)}
                  description="Identificador único em maiúsculas. Opcional — usado apenas para pareceres especiais (ALTURA, CONFINADO)."
                />
                <Select
                  label="Grupo"
                  placeholder="Selecione o grupo"
                  selectedKeys={form.grupo ? [form.grupo] : []}
                  onSelectionChange={(keys) => updateField("grupo", Array.from(keys)[0] as string || "")}
                  isRequired
                >
                  {GRUPOS_RISCOS.map((g) => (
                    <SelectItem key={g.value}>{g.label}</SelectItem>
                  ))}
                </Select>
                <div className="col-span-2">
                  <Input
                    label="Descrição"
                    placeholder="ex: Trabalho em Altura"
                    value={form.descricao}
                    onValueChange={(v) => updateField("descricao", v)}
                    isRequired
                  />
                </div>
                <div className="col-span-2">
                  <Textarea
                    label="Códigos SOC (separados por vírgula)"
                    placeholder="ex: 179, 213, 252"
                    value={formCodigosStr}
                    onValueChange={setFormCodigosStr}
                    isRequired
                  />
                </div>
                <div className="col-span-2">
                  <Textarea
                    label="Opções de Parecer (separadas por vírgula)"
                    placeholder="ex: APTO PARA TRABALHO EM ALTURA, INAPTO"
                    value={formParecerStr}
                    onValueChange={setFormParecerStr}
                    description="Cada opção vira um item no select do prontuário."
                  />
                </div>
                <div className="col-span-2">
                  <Textarea
                    label="Observação"
                    placeholder="Observações internas sobre este risco..."
                    value={form.observacao || ""}
                    onValueChange={(v) => updateField("observacao", v)}
                  />
                </div>
              </div>
            </Tab>
            <Tab key="perigo" title="Perigo">
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="col-span-2">
                  <Input
                    label="Nome do Perigo"
                    placeholder="ex: Queda de Altura"
                    value={form.perigo_nome || ""}
                    onValueChange={(v) => updateField("perigo_nome", v)}
                  />
                </div>
                <Input
                  label="Tipo de Exposição"
                  placeholder="ex: Intermitente"
                  value={form.perigo_tipo_exposicao || ""}
                  onValueChange={(v) => updateField("perigo_tipo_exposicao", v)}
                />
                <Input
                  label="Fonte Geradora"
                  placeholder="ex: Processo Produtivo"
                  value={form.perigo_fonte_geradora || ""}
                  onValueChange={(v) => updateField("perigo_fonte_geradora", v)}
                />
                <Input
                  label="Trajetória / Meio de Propagação"
                  placeholder="ex: Ar"
                  value={form.perigo_trajetoria_acao || ""}
                  onValueChange={(v) => updateField("perigo_trajetoria_acao", v)}
                />
                <Input
                  label="Técnica Utilizada"
                  placeholder="ex: Avaliação Qualitativa"
                  value={form.perigo_tecnica_utilizada || ""}
                  onValueChange={(v) => updateField("perigo_tecnica_utilizada", v)}
                />
                <div className="col-span-2">
                  <Textarea
                    label="Possíveis Danos à Saúde"
                    placeholder="ex: Contusões, luxações, fraturas"
                    value={form.perigo_possiveis_danos || ""}
                    onValueChange={(v) => updateField("perigo_possiveis_danos", v)}
                  />
                </div>
                <div className="col-span-2">
                  <Textarea
                    label="Medidas Administrativas"
                    placeholder="ex: Treinamento, Ordem de Serviço"
                    value={form.perigo_medidas_administrativas || ""}
                    onValueChange={(v) => updateField("perigo_medidas_administrativas", v)}
                  />
                </div>
                <div className="col-span-2 flex gap-4 items-end">
                  <div className="flex items-center gap-2">
                    <Switch
                      isSelected={form.perigo_epc_eficaz || false}
                      onValueChange={(v) => updateField("perigo_epc_eficaz", v)}
                      size="sm"
                    />
                    <span className="text-xs font-medium">EPC Eficaz?</span>
                  </div>
                  <Input
                    label="Descrição EPC"
                    placeholder="ex: N/A"
                    className="flex-1"
                    value={form.perigo_epc_descricao || ""}
                    onValueChange={(v) => updateField("perigo_epc_descricao", v)}
                  />
                </div>
                <div className="col-span-2 flex gap-4 items-end">
                  <div className="flex items-center gap-2">
                    <Switch
                      isSelected={form.perigo_epi_eficaz || false}
                      onValueChange={(v) => updateField("perigo_epi_eficaz", v)}
                      size="sm"
                    />
                    <span className="text-xs font-medium">EPI Eficaz?</span>
                  </div>
                  <Input
                    label="Descrição EPI + CA"
                    placeholder="ex: Calçado de segurança CA: 36.1982"
                    className="flex-1"
                    value={form.perigo_epi_descricao || ""}
                    onValueChange={(v) => updateField("perigo_epi_descricao", v)}
                  />
                </div>
                <div className="col-span-2">
                  <Textarea
                    label="Ações Necessárias e Prioridades"
                    placeholder="ex: Manter o controle existente (P1)"
                    value={form.perigo_acoes_necessarias || ""}
                    onValueChange={(v) => updateField("perigo_acoes_necessarias", v)}
                  />
                </div>
                <div className="col-span-2">
                  <Textarea
                    label="Critério para Monitoração da Exposição"
                    placeholder="ex: Monitoramento periódico não necessário"
                    value={form.perigo_criterio_monitoracao || ""}
                    onValueChange={(v) => updateField("perigo_criterio_monitoracao", v)}
                  />
                </div>
                <div className="col-span-2">
                  <Textarea
                    label="Observação do Perigo"
                    placeholder="Notas normativas"
                    value={form.perigo_observacao || ""}
                    onValueChange={(v) => updateField("perigo_observacao", v)}
                  />
                </div>
              </div>
            </Tab>
          </Tabs>
        </div>

        <div className="flex justify-end gap-2 px-4 pb-4">
          <Button variant="flat" onPress={handleClose} size="sm">
            Cancelar
          </Button>
          <Button
            color="primary"
            onPress={handleSave}
            isLoading={saving}
            isDisabled={!form.descricao.trim() || !formCodigosStr.trim() || !form.grupo}
            size="sm"
            style={{ backgroundColor: "#44735e" }}
          >
            {creatingNew ? "Criar" : "Atualizar"}
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <CmsoCircularLoading fullHeight={false} />;
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
          {isMaster && !creatingNew && expandedId === null && (
            <Button
              color="primary"
              startContent={<Plus size={18} />}
              onPress={handleOpenCreate}
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

        {configs.length === 0 && !creatingNew && (
          <div className="text-center py-8 text-gray-400">Nenhuma configuração cadastrada.</div>
        )}

        <div className="space-y-3">
          {renderForm()}

          {configs.map((config) => {
            const isEditing = expandedId === config.id && !creatingNew;

            return (
              <div
                key={config.id}
                className={`rounded-lg border transition-colors ${
                  isEditing ? "border-blue-200 bg-blue-50/30" :
                  !config.ativo ? "bg-gray-50 opacity-60" : "bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-semibold ${!config.ativo ? "line-through text-gray-400" : "text-gray-900"}`}>
                        {config.descricao}
                      </span>
                      <Chip size="sm" variant="flat" className="font-mono text-[11px]">
                        {config.tipo}
                      </Chip>
                      {config.grupo && (
                        <Chip
                          size="sm"
                          variant="flat"
                          style={{ backgroundColor: `${getGrupoColor(config.grupo)}20`, color: getGrupoColor(config.grupo) }}
                          className="text-[11px] font-medium"
                        >
                          {config.grupo}
                        </Chip>
                      )}
                      {config.perigo_nome && (
                        <Chip size="sm" variant="flat" color="warning" className="text-[11px]">
                          Perigo
                        </Chip>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {config.codigos.map((cod) => (
                        <Chip key={cod} size="sm" variant="flat" className="font-mono text-[11px]">
                          {cod}
                        </Chip>
                      ))}
                    </div>
                    {config.parecer_opcoes && config.parecer_opcoes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {config.parecer_opcoes.map((op, i) => (
                          <Chip key={i} size="sm" variant="flat" className="text-[11px]">
                            {op}
                          </Chip>
                        ))}
                      </div>
                    )}
                    {config.perigo_nome && (
                      <p className="text-[11px] text-gray-500">
                        <span className="font-medium">Perigo:</span> {config.perigo_nome}
                        {config.perigo_possiveis_danos && (
                          <span className="text-gray-400"> — {config.perigo_possiveis_danos}</span>
                        )}
                      </p>
                    )}
                    {config.observacao && (
                      <p className="text-[11px] text-gray-400 italic">{config.observacao}</p>
                    )}
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
                        <Button isIconOnly size="sm" variant="light" onPress={() => handleOpenEdit(config)}>
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
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
