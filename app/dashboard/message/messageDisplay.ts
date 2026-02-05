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
      title: "CMSO 360 - Atualizações Janeiro 2026",
      content: `ATUALIZAÇÕES IMPLEMENTADAS:

• Aproveitamento de exames do mesmo ASO dentro de 30 dias.
• Atendimento credenciadas não será possível realizar upload de exames
• Correção DUM em ficha clínica
• Dinamometria Escapular com lado direito e esquerdo
• Exclusão de tickets pela recepção
• Exportação do relatório em CSV
• Filtrar por atendente na tela de relatório
• Inclusão de total de atendimentos (manhã, tarde e indefinido) no relatório
• Inclusão do campo "Unidade Móvel" na seleção de salas
• Limpeza do banco de áudios diariamente (06:30 e 12:45) para chamada correta no painel
• Observação para funcionário PCD
• Tipo preferencial no totem e visualização de salas/recepção
• Validação aprimorada ficha clínica: peso, altura e PA
• Visualização da situação do exame no card compacto (ao lado da sala atendimento)

Todas as melhorias visam melhorar a experiência dos usuários e a eficiência do sistema. 
Agradecemos o feedback contínuo para aprimorar nossos serviços.

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