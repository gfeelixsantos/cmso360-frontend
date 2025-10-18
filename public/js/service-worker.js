self.addEventListener('push', (event) => {
    let data = {};
    try {
        data = event.data.json();
    } catch (e) {
        data = { title: event.data.text(), body: 'Você tem uma nova mensagem.' };
    }

    // Função para verificar se a aplicação está visível
    const showNotification = async () => {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Aguardar 5s 


        // Obtém todos os clientes (abas/janelas) controlados por este Service Worker
        const windowClients = await self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true, // Inclui todas as abas, mesmo que ainda não estejam controladas
        });
        
        let clientIsFocused = false;
        let specificPageIsOpen = false;

        // 1. Verifica se alguma aba está em foco/visível
        for (const client of windowClients) {
            // Se estiver em foco, podemos assumir que o usuário está ativo
            if (client.focused || client.visibilityState === 'visible') {
                clientIsFocused = true;
            }
            
            // 2. Opcional: Verifica se o usuário está na PÁGINA ESPECÍFICA (Ex: chat)
            // if (client.url.includes('/chat/') && client.focused) {
            //     specificPageIsOpen = true;
            // }
        }

        // Condição para exibir a notificação:
        // Exibir APENAS SE nenhuma aba do nosso site estiver focada/visível.
        if (!clientIsFocused) { // OU !specificPageIsOpen se for o caso específico
            const title = data.title || 'Serviço de atendimento';
            const options = {
                body: data.body || 'Você tem uma atualização importante.',
                icon: data.icon || 'https://icons.veryicon.com/png/o/miscellaneous/table-shortcuts/new-employees.png',
                actions: data.actions ||  [{ action: 'close-action', title: 'Fechar', icon: '/images/close.png' }],
            };

            return self.registration.showNotification(title, options);
        }

        // Se a aplicação estiver ativa, você pode:
        // 1. Emitir um som sutil na aba focada (usando postMessage)
        // 2. Atualizar um contador de badge na interface (usando postMessage)
        console.log('Aplicação ativa. Notificação silenciada.');
        return Promise.resolve(); // Resolva sem mostrar notificação externa
    };

    event.waitUntil(showNotification());
});