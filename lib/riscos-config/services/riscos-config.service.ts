export interface IRiscoConfig {
  id: string;
  tipo: string;
  descricao: string;
  codigos: string[];
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface IRiscoConfigFormData {
  tipo: string;
  descricao: string;
  codigos: string[];
}

export async function fetchRiscosConfig(): Promise<IRiscoConfig[]> {
  const res = await fetch('/api/riscos-config');
  if (!res.ok) throw new Error('Falha ao carregar configurações de risco');
  return res.json();
}

export async function createRiscoConfig(data: IRiscoConfigFormData): Promise<IRiscoConfig> {
  const res = await fetch('/api/riscos-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erro ao criar configuração de risco' }));
    throw new Error(err.message || 'Erro ao criar configuração de risco');
  }
  return res.json();
}

export async function updateRiscoConfig(id: string, data: Partial<IRiscoConfigFormData & { ativo: boolean }>): Promise<IRiscoConfig> {
  const res = await fetch(`/api/riscos-config/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erro ao atualizar configuração de risco' }));
    throw new Error(err.message || 'Erro ao atualizar configuração de risco');
  }
  return res.json();
}

export async function deleteRiscoConfig(id: string): Promise<void> {
  const res = await fetch(`/api/riscos-config/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erro ao excluir configuração de risco' }));
    throw new Error(err.message || 'Erro ao excluir configuração de risco');
  }
}
