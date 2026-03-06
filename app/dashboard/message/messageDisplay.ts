export interface Message {
  id: string;
  title: string;
  content: string;
  date: string;
  isImportant?: boolean;
}

// Função para buscar mensagem atual (deve ser substituída por chamada à API)
const getCurrentMessage = async (): Promise<Message | null> => {
  try {
    return {
      id: `msg_${new Date().getTime()}`,
      title: "CMSO 360 - Atualizações Fevereiro 2026",
      content: `ATUALIZAÇÕES IMPLEMENTADAS:

• Aproveitamento de exames do mesmo ASO dentro de 30 dias.
• Atendimento credenciadas não será possível realizar upload de exames.
• Finalização de ultrassom via tela de relatório.
• Impressão do relatório de atendimento.
• Parecer altura com cinto > 100kg.
• Sincronização SOC página de relatório (beta).
• Upload de anexos no relatório.
• Visualização das audiomerias anteriores do funcionário.

`,
      date: new Date().toLocaleDateString("pt-BR"),
      isImportant: false,
    };
  } catch (error) {
    console.error("Erro ao buscar mensagem:", error);

    return null;
  }
};

export { getCurrentMessage };


