"use client";

import { useState } from "react";
import {
  Users,
  ShieldAlert,
  Search,
  RefreshCw,
  Trash2,
  Pencil,
  Power,
  PowerOff,
} from "lucide-react";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Tooltip,
  Switch,
} from "@heroui/react";
import CmsoCircularLoading from "@/components/shared/CmsoCircularLoading";

import { useUsers, User } from "@/lib/config/useUsers";
import { NEST_URL } from "@/config/constants";
import { IUserInfo } from "@/lib/user/interfaces/IUser";

const PERFIS = [
  "ADMINISTRATIVO",
  "ATENDIMENTO",
  "CONVIDADO",
  "ENFERMAGEM",
  "FONOAUDIOLOGIA",
  "LABORATÓRIO",
  "MASTER",
  "MÉDICO",
  "PSICÓLOGO",
  "RADIOLOGIA",
  "RECEPÇÃO",
];

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

interface UsuariosSectionProps {
  user: IUserInfo;
}

export function UsuariosSection({ user }: UsuariosSectionProps) {
  const isMaster = user.perfil === "MASTER";
  const { users, loading, refetch } = useUsers();
  const [search, setSearch] = useState("");
  const [filterPerfil, setFilterPerfil] = useState<string>("");

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    perfil: "",
    conselho: "",
    uf_conselho: "",
    registro_conselho: "",
    ativo: true,
  });
  const [saving, setSaving] = useState(false);
  const [resyncing, setResyncing] = useState<string | null>(null);
  const [excludeConfirm, setExcludeConfirm] = useState<{
    codigo: string;
    nome: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.nome.toLowerCase().includes(search.toLowerCase()) ||
      u.codigo.includes(search);
    const matchPerfil = !filterPerfil || u.perfil === filterPerfil;
    return matchSearch && matchPerfil;
  });

  function openEdit(user: User) {
    setEditingUser(user);
    setEditForm({
      nome: user.nome,
      email: user.email || "",
      telefone: user.telefone || "",
      perfil: user.perfil,
      conselho: user.conselho || "",
      uf_conselho: user.uf_conselho || "",
      registro_conselho: user.registro_conselho || "",
      ativo: user.ativo,
    });
  }

  async function handleSaveEdit() {
    if (!editingUser) return;
    setSaving(true);
    setError(null);
    try {
      await fetch(`${NEST_URL}users/${editingUser.codigo}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-auth-user": JSON.stringify(user),
        },
        body: JSON.stringify({
          nome: editForm.nome,
          email: editForm.email || null,
          telefone: editForm.telefone || null,
          perfil: editForm.perfil,
          conselho: editForm.conselho || null,
          uf_conselho: editForm.uf_conselho || null,
          registro_conselho: editForm.registro_conselho || null,
          ativo: editForm.ativo,
        }),
      });
      setEditingUser(null);
      refetch();
    } catch (err) {
      console.error("Erro ao atualizar usuário:", err);
      setError("Erro ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  }

  async function handleResync(codigo: string) {
    setResyncing(codigo);
    setError(null);
    try {
      const res = await fetch("/api/users/resync-soc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Erro ao re-sincronizar");
      }
      refetch();
    } catch (err: any) {
      console.error("Erro ao re-sincronizar:", err);
      setError(err.message || "Falha ao re-sincronizar com SOC.");
    } finally {
      setResyncing(null);
    }
  }

  async function handleExclude(codigo: string) {
    try {
      await fetch(`${NEST_URL}users/${codigo}/anonymize`, {
        method: "DELETE",
        headers: {
          "x-auth-user": JSON.stringify(user),
        },
      });
      setExcludeConfirm(null);
      refetch();
    } catch (err) {
      console.error("Erro ao excluir usuário:", err);
    }
  }

  async function handleToggleActive(user: User) {
    try {
      await fetch(`${NEST_URL}users/${user.codigo}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-auth-user": JSON.stringify(user),
        },
        body: JSON.stringify({ ativo: !user.ativo }),
      });
      refetch();
    } catch (err) {
      console.error("Erro ao atualizar usuário:", err);
    }
  }

  function formatDate(dateStr?: string) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("pt-BR");
  }

  if (loading) {
    return <CmsoCircularLoading title="Carregando profissionais..." description="Aguarde um momento" fullHeight={false} />;
  }

  return (
    <>
      <Card className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <CardBody className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <ShieldAlert size={28} aria-hidden="true" style={{ color: "#44735e" }} />
            <h2 className="text-xl font-semibold text-gray-800">Profissionais</h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
              <button className="ml-2 underline" onClick={() => setError(null)}>Fechar</button>
            </div>
          )}

          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Buscar por nome ou código..."
              startContent={<Search size={18} className="text-gray-400" />}
              value={search}
              onValueChange={setSearch}
              className="max-w-xs"
            />
            <Select
              placeholder="Filtrar por perfil"
              selectedKeys={filterPerfil ? [filterPerfil] : []}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0] as string;
                setFilterPerfil(val || "");
              }}
              className="max-w-xs"
            >
              {PERFIS.map((p) => (
                <SelectItem key={p}>{p}</SelectItem>
              ))}
            </Select>
          </div>

          <Table aria-label="Usuários do sistema">
            <TableHeader>
              <TableColumn>CÓDIGO</TableColumn>
              <TableColumn>NOME</TableColumn>
              <TableColumn>PERFIL</TableColumn>
              <TableColumn>CONSELHO</TableColumn>
              <TableColumn>ÚLTIMO LOGIN</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>AÇÕES</TableColumn>
            </TableHeader>
            <TableBody emptyContent="Nenhum usuário encontrado">
              {filtered.map((u) => (
                <TableRow key={u.codigo}>
                  <TableCell className="font-mono text-sm">{u.codigo}</TableCell>
                  <TableCell className="font-medium">{u.nome}</TableCell>
                  <TableCell>
                    <Chip variant="flat" size="sm">
                      {u.perfil}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    {u.conselho ? `${u.conselho} ${u.uf_conselho || ""}` : "-"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(u.ultimo_login)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={u.ativo ? "success" : "danger"}
                      variant="flat"
                      size="sm"
                    >
                      {u.ativo ? "Ativo" : "Inativo"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {isMaster ? (
                        <>
                          <Tooltip content="Editar cadastro" placement="bottom">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onPress={() => openEdit(u)}
                            >
                              <Pencil size={16} />
                            </Button>
                          </Tooltip>
                          <Tooltip content="Re-sincronizar dados do SOC" placement="bottom">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              isLoading={resyncing === u.codigo}
                              onPress={() => handleResync(u.codigo)}
                            >
                              <RefreshCw size={16} />
                            </Button>
                          </Tooltip>
                          <Tooltip content="Desativar / Ativar" placement="bottom">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color={u.ativo ? "warning" : "success"}
                              onPress={() => handleToggleActive(u)}
                            >
                              {u.ativo ? <PowerOff size={16} /> : <Power size={16} />}
                            </Button>
                          </Tooltip>
                          <Tooltip content="Excluir (anonimizar dados)" placement="bottom">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="danger"
                              onPress={() =>
                                setExcludeConfirm({ codigo: u.codigo, nome: u.nome })
                              }
                            >
                              <Trash2 size={16} />
                            </Button>
                          </Tooltip>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {u.perfil}
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <Modal
        isOpen={!!editingUser}
        onOpenChange={() => setEditingUser(null)}
        size="lg"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>Editar Usuário</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <Input
                label="Nome"
                value={editForm.nome}
                onValueChange={(v) => setEditForm((f) => ({ ...f, nome: v }))}
                isRequired
              />
              <Input
                label="Email"
                type="email"
                value={editForm.email}
                onValueChange={(v) => setEditForm((f) => ({ ...f, email: v }))}
              />
              <Input
                label="Telefone"
                value={editForm.telefone}
                onValueChange={(v) => setEditForm((f) => ({ ...f, telefone: v }))}
              />
              <Select
                label="Perfil"
                selectedKeys={editForm.perfil ? [editForm.perfil] : []}
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0] as string;
                  if (val) setEditForm((f) => ({ ...f, perfil: val }));
                }}
              >
                {PERFIS.map((p) => (
                  <SelectItem key={p}>{p}</SelectItem>
                ))}
              </Select>
              <Input
                label="Conselho"
                value={editForm.conselho}
                onValueChange={(v) => setEditForm((f) => ({ ...f, conselho: v }))}
                placeholder="CRM, COREN, etc"
              />
              <Select
                label="UF Conselho"
                selectedKeys={editForm.uf_conselho ? [editForm.uf_conselho] : []}
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0] as string;
                  if (val) setEditForm((f) => ({ ...f, uf_conselho: val }));
                }}
              >
                {UFS.map((uf) => (
                  <SelectItem key={uf}>{uf}</SelectItem>
                ))}
              </Select>
              <Input
                label="Registro Conselho"
                value={editForm.registro_conselho}
                onValueChange={(v) => setEditForm((f) => ({ ...f, registro_conselho: v }))}
                placeholder="Número do registro"
              />
              <div className="flex items-center gap-3 pt-2">
                <Switch
                  isSelected={editForm.ativo}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, ativo: v }))}
                  color="success"
                >
                  <span className="text-sm font-medium text-gray-700">Ativo</span>
                </Switch>
                <Chip
                  size="sm"
                  variant="flat"
                  color={editForm.ativo ? "success" : "danger"}
                >
                  {editForm.ativo ? "Ativo" : "Inativo"}
                </Chip>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setEditingUser(null)}>
              Cancelar
            </Button>
            <Button
              color="primary"
              onPress={handleSaveEdit}
              isLoading={saving}
              style={{ backgroundColor: "#44735e" }}
            >
              Salvar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={!!excludeConfirm}
        onOpenChange={() => setExcludeConfirm(null)}
        size="sm"
      >
        <ModalContent>
          <ModalHeader className="text-danger">Confirmar Exclusão</ModalHeader>
          <ModalBody>
            <p className="text-sm text-gray-600">
              Esta ação irá <strong>anonimizar definitivamente</strong> os dados
              pessoais de <strong>{excludeConfirm?.nome}</strong> (código{" "}
              {excludeConfirm?.codigo}).
            </p>
            <p className="text-sm text-gray-500 mt-2">
              O nome, CPF, email, telefone e conselho serão substituídos por
              valores anônimos. O código do usuário será preservado para
              integridade de prontuários e auditoria (LGPD Art. 16, I).
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setExcludeConfirm(null)}>
              Cancelar
            </Button>
            <Button
              color="danger"
              onPress={() => excludeConfirm && handleExclude(excludeConfirm.codigo)}
            >
              Confirmar Exclusão
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
