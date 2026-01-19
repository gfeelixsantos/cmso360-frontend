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
      title: "CMSO 360 Atualizações - Janeiro 2026",
      content: `
        
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

/*
• Melhoria na comunicação entre salas de atendimentos
• Limpeza do banco de audios diariamente, garantindo chamada correta no painel
• Visualização da situação do exame no card compacto
• Exportação do relatório em CSV
• Validação aprimorada ficha clínica: peso, altura e PA
• Correção DUM em ficha clínica
* Exclusão de tickets pela recepção

*/
