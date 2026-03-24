# Plano de Implementação - Identidade Canônica nas Transições de Exame

## Objetivo
Garantir que as ações críticas (ex.: `schedulings/exame/update`, `schedulings/finish`) usem identidade confiável do usuário logado, sem depender de dados mutáveis do frontend (`payload.profissional`), e sem quebrar o fluxo atual.

## Contexto Atual (auditado)
- O login do frontend valida credencial via Supabase e monta `userInfo` a partir do SOC.
- O frontend hoje envia `profissional` no body para o backend.
- Existem pontos do frontend enviando `profissional` como objeto e outros como string (inconsistência).
- O backend atual usa `payload.profissional` como fonte principal em `updateExam`.

## Estratégia de Menor Impacto
Aplicar migração em 3 fases, mantendo compatibilidade retroativa até estabilizar:

1. **Fase 1 (Backend compatível, sem ruptura)**
2. **Fase 2 (Frontend migra chamadas críticas para BFF/proxy interno)**
3. **Fase 3 (Hardening: backend exige identidade assinada)**

---

## Arquitetura Alvo

### Fonte de verdade de identidade
- Identidade do usuário deve vir de credencial assinada no servidor (cookie/token assinado), nunca do body enviado pelo cliente.

### Prioridade de resolução do profissional no backend
1. Identidade autenticada (`authUser`) validada por assinatura.
2. Fallback legado: `payload.profissional` (compatibilidade temporária).
3. Fallback técnico controlado (dados já persistidos no exame/SOC) para reemissão e casos antigos.

### Regra funcional
- Se houver `authUser` válido, ele deve prevalecer para auditoria e decisões.
- `payload.profissional` passa a ser considerado apenas legado temporário.

---

## Fase 1 - Backend Compatível (executar primeiro)

### Escopo
- Não quebrar clientes existentes.
- Aceitar identidade autenticada quando disponível.
- Manter fallback legado.

### Implementação
1. Criar middleware/guard leve para extrair identidade autenticada (ex.: `authUser`) de token/cabeçalho assinado.
2. No controller de rotas críticas (`/schedulings/exame/update`, `/schedulings/finish`), receber `@Req()` e repassar `authUser` para o service.
3. No service, implementar `resolveProfessionalContext(...)`:
   - entrada: `authUser`, `payload.profissional`, contexto do exame/scheduling;
   - saída: `resolvedProfessional`, `source` (`AUTH`, `PAYLOAD`, `FALLBACK`).
4. Persistir metadado de auditoria (log estruturado e, se possível, campo técnico):
   - `identitySource`, `authCodigo`, `payloadCodigo`, `resolvedCodigo`, `mismatch`.
5. Manter comportamento atual quando `authUser` não existir.

### Critério de aceite da Fase 1
- Nenhuma rota existente quebra.
- Fluxo atual continua operando com frontend legado.
- Logs mostram claramente a origem da identidade.

---

## Fase 2 - Frontend com Proxy Interno (BFF)

### Escopo
- Reduzir confiança em payload do browser.
- Encaminhar requisições críticas por API route do frontend.

### Implementação
1. Criar rota interna no frontend (ex.: `app/api/schedulings/exame/update/route.ts`) que:
   - lê cookie de autenticação HttpOnly;
   - valida/decodifica identidade no servidor;
   - encaminha para backend com cabeçalho assinado de identidade.
2. Atualizar telas para usar a rota interna em vez de chamar backend diretamente.
3. Padronizar `profissional` no frontend como objeto `IUserInfo` (eliminar fallback string).

### Critério de aceite da Fase 2
- Chamadas críticas passam pelo BFF.
- Payload de `profissional` no cliente fica consistente.
- Sem alteração perceptível para usuário final.

---

## Fase 3 - Hardening (somente após estabilidade)

### Escopo
- Tornar obrigatório `authUser` em rotas críticas.
- Remover dependência funcional de `payload.profissional`.

### Implementação
1. Habilitar feature flag de enforcement (`AUTH_IDENTITY_ENFORCEMENT=true`).
2. Em mismatch entre `authUser` e payload, bloquear com erro explícito (4xx) e log.
3. Remover fallback legado após janela de observação.

### Critério de aceite da Fase 3
- 100% das transições críticas com identidade assinada.
- Zero uso funcional de `payload.profissional` legado.

---

## Matriz de Impacto e Risco

- **Fase 1**: baixo risco, sem quebra esperada.
- **Fase 2**: baixo-médio risco (integração BFF), controlável com rollout gradual.
- **Fase 3**: médio risco se houver clientes antigos; exigir telemetria antes.

---

## Observabilidade Obrigatória

Registrar por operação crítica:
- `route`
- `schedulingId`
- `examCodes/grupo`
- `authUser.codigo`
- `payload.profissional.codigo`
- `resolvedProfessional.codigo`
- `identitySource`
- `mismatch`
- `result` (success/fail)

Painel mínimo recomendado:
- % por `identitySource`
- quantidade de `mismatch`
- erros 4xx/5xx por rota crítica

---

## Rollback

1. Manter flag de enforcement desligada por padrão.
2. Em incidente, retornar para modo compatível (`auth opcional + fallback payload`).
3. Não remover código legado antes de 2 ciclos completos sem mismatch crítico.

---

## Checklist de Execução (prático)

### Backend
- [ ] Adicionar extração de `authUser`.
- [ ] Implementar resolução canônica do profissional com prioridade.
- [ ] Integrar na `updateExam` e `finishScheduling`.
- [ ] Adicionar logs estruturados e flag de enforcement.
- [ ] Cobrir com testes unitários de cenários: auth ok, auth ausente, mismatch, fallback.

### Frontend
- [ ] Criar rotas BFF para endpoints críticos.
- [ ] Migrar chamadas de atendimento e relatório para BFF.
- [ ] Garantir `profissional` sempre objeto enquanto legado existir.
- [ ] Remover fallback string (`"Desconhecido"`) nas chamadas críticas.

### Validação final
- [ ] Fluxo de atendimento normal sem regressão.
- [ ] Reemissão de exame sem regressão.
- [ ] Logs com `identitySource` populado.
- [ ] Nenhum erro novo de contrato entre frontend/backend.

---

## Decisão Arquitetural Recomendada
Para menor impacto imediato: **implementar Fase 1 primeiro** (backend compatível + auditoria), depois migrar frontend gradualmente (Fase 2), e somente então endurecer regra (Fase 3).

Isso entrega segurança progressiva sem interromper a operação atual.
