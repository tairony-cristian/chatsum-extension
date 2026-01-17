# 📚 Exemplos Práticos - ChatSum

Casos de uso reais e exemplos de resumos gerados.

## 📋 **Índice**

1. [Exemplo 1: Erro de Sistema](#exemplo-1-erro-de-sistema)
2. [Exemplo 2: Configuração](#exemplo-2-configuração)
3. [Exemplo 3: Integração](#exemplo-3-integração)
4. [Exemplo 4: Bug Complexo](#exemplo-4-bug-complexo)
5. [Exemplo 5: Handover](#exemplo-5-handover)

---

## 🔴 **Exemplo 1: Erro de Sistema**

### **Conversa Original:**
````
[Cliente - 10:23]: Olá, estou com problema no módulo de vendas
[Cliente - 10:23]: Quando tento finalizar uma venda aparece erro
[Cliente - 10:24]: Erro: "Falha ao processar pagamento"

[Técnico João - 10:25]: Bom dia! Vou verificar
[Técnico João - 10:25]: Pode me informar o código da venda?

[Cliente - 10:26]: VD-2025-0123

[Técnico João - 10:28]: Acessei o sistema
[Técnico João - 10:29]: Verifiquei os logs da transação
[Técnico João - 10:30]: Identifiquei o problema
[Técnico João - 10:30]: O parâmetro merchant_id estava incorreto
[Técnico João - 10:31]: Corrigi a configuração do gateway
[Técnico João - 10:32]: Por favor, teste novamente

[Cliente - 10:35]: Funcionou! Obrigado

[Técnico João - 10:35]: Ótimo! Ticket finalizado
````

### **Resumo Gerado (Modo: Último Técnico):**
````markdown
🔴 PROBLEMA RELATADO:
* Cliente reportou erro ao finalizar venda no **módulo de vendas**
* Mensagem de erro: **"Falha ao processar pagamento"**
* **Venda específica:** VD-2025-0123
* **Impacto imediato:** Processo bloqueado, impossível concluir transações

🟡 ANÁLISE TÉCNICA:
* Acessei o **sistema de vendas** e consultei logs da transação VD-2025-0123
* Verifiquei a **configuração do gateway de pagamento**
* **Causa Raiz:** Parâmetro **merchant_id** estava com valor incorreto/desatualizado

🟢 SOLUÇÃO APRESENTADA:
* Apliquei **correção na configuração** do gateway de pagamento
* Atualizei parâmetro **merchant_id** para o valor correto
* Orientei cliente a realizar nova tentativa de venda
* Cliente testou e confirmou funcionamento correto
* **Ticket Finalizado.**
````

---

## ⚙️ **Exemplo 2: Configuração**

### **Conversa Original:**
````
[Cliente - 14:15]: Preciso ajuda para configurar relatório personalizado
[Cliente - 14:15]: Não consigo encontrar a opção

[Técnico Maria - 14:16]: Olá! Vou te ajudar
[Técnico Maria - 14:17]: Acesse Relatórios > Configurações
[Técnico Maria - 14:18]: Depois clique em "Novo Relatório"

[Cliente - 14:20]: Achei! E agora?

[Técnico Maria - 14:21]: Selecione os campos que deseja visualizar
[Técnico Maria - 14:22]: Depois clique em Salvar
[Técnico Maria - 14:23]: Você pode aplicar filtros na aba "Filtros"

[Cliente - 14:25]: Perfeito! Consegui criar
[Cliente - 14:25]: Como faço para agendar envio automático?

[Técnico Maria - 14:26]: Na mesma tela, vá em "Agendamento"
[Técnico Maria - 14:27]: Defina periodicidade e destinatários
[Técnico Maria - 14:28]: Clique em "Ativar Agendamento"

[Cliente - 14:30]: Funcionou! Muito obrigado
````

### **Resumo Gerado:**
````markdown
🔴 PROBLEMA RELATADO:
* Cliente solicitou orientação para **criar relatório personalizado**
* Não conseguia localizar a funcionalidade no sistema
* Posteriormente, solicitou configuração de **envio automático**

🟡 ANÁLISE TÉCNICA:
* Verifiquei permissões do usuário - **acesso OK**
* Identifiquei que cliente necessitava apenas de **orientação de uso**
* Funcionalidade estava disponível mas não era intuitiva

🟢 SOLUÇÃO APRESENTADA:
* Orientei acesso via menu **Relatórios > Configurações > Novo Relatório**
* Instrui seleção de campos e aplicação de filtros
* Demonstrei funcionalidade de **Agendamento** para envio automático
* Configurei periodicidade e destinatários conforme solicitado
* Cliente confirmou sucesso na configuração
* **Ticket Finalizado.**
````

---

## 🔌 **Exemplo 3: Integração**

### **Conversa Original:**
````
[Cliente - 09:45]: API de integração retornando erro 401
[Cliente - 09:46]: Endpoint: /api/v2/products
[Cliente - 09:46]: {"error": "Unauthorized", "code": 401}

[Técnico Carlos - 09:48]: Bom dia
[Técnico Carlos - 09:49]: Vou verificar suas credenciais

[Cliente - 09:50]: Usei a API key do painel

[Técnico Carlos - 09:52]: Acessei o banco de dados
[Técnico Carlos - 09:53]: Sua API key está correta
[Técnico Carlos - 09:54]: Porém, verifiquei que expirou ontem
[Técnico Carlos - 09:55]: Vou regenerar para você

[Cliente - 09:56]: Pode ser

[Técnico Carlos - 09:58]: Nova key gerada: pk_live_abc123xyz
[Técnico Carlos - 09:59]: Por segurança, enviei também por email
[Técnico Carlos - 10:00]: Essa key não expira

[Cliente - 10:02]: Testei aqui, funcionou!
[Cliente - 10:03]: Está retornando os produtos corretamente
````

### **Resumo Gerado:**
````markdown
🔴 PROBLEMA RELATADO:
* Cliente reportou **erro 401 (Unauthorized)** na API de integração
* **Endpoint afetado:** /api/v2/products
* **Mensagem de erro:** {"error": "Unauthorized", "code": 401}
* **Impacto:** Impossível consumir dados via API

🟡 ANÁLISE TÉCNICA:
* Acessei **tabela de API keys** no banco de dados
* Verifiquei que a **API key do cliente estava correta** mas expirada
* **Causa Raiz:** Key expirou automaticamente após 90 dias (política padrão)
* Cliente não foi notificado da expiração iminente

🟢 SOLUÇÃO APRESENTADA:
* Regenerei **nova API key permanente**: pk_live_abc123xyz
* Enviei credenciais por **email corporativo** do cliente por segurança
* Configurei key como **não-expirável** (conforme solicitação implícita)
* Cliente testou endpoint /api/v2/products com sucesso
* Integração **restabelecida e funcionando**
* **Ticket Finalizado.**
````

---

## 🐛 **Exemplo 4: Bug Complexo (Modo Completo)**

### **Conversa Original:**
````
[Cliente - 11:00]: Sistema lento após atualização
[Cliente - 11:01]: Todas as telas demorando mais de 10 segundos

[Técnico Ana - 11:05]: Vou verificar
[Técnico Ana - 11:10]: Logs do servidor mostram alto uso de CPU
[Técnico Ana - 11:12]: Escalando para infraestrutura

[Técnico Pedro - 13:30]: Recebi o chamado
[Técnico Pedro - 13:35]: Analisei queries do banco
[Técnico Pedro - 13:40]: Encontrei query sem índice na tabela vendas
[Técnico Pedro - 13:45]: Criando índice otimizado

[Cliente - 14:00]: Melhorou um pouco mas ainda lento

[Técnico João - 14:15]: Recebi handover do Pedro
[Técnico João - 14:20]: Analisei cache Redis
[Técnico João - 14:25]: Cache estava desabilitado após atualização
[Técnico João - 14:30]: Reativei e limpei cache antigo

[Cliente - 14:35]: Agora sim! Tudo normal
````

### **Resumo Gerado (Modo: Completo):**
````markdown
🔴 PROBLEMA:
* Cliente reportou **lentidão generalizada** no sistema após atualização
* **Sintomas:** Todas as telas demorando mais de 10 segundos para carregar
* **Impacto:** Operação severamente prejudicada

🟡 HISTÓRICO DE ATENDIMENTO:

**Técnico Ana Santos:**
* Verificou **logs do servidor** - identificou alto uso de CPU
* Realizou diagnóstico inicial de infraestrutura
* Escalou para equipe de banco de dados

**Técnico Pedro Silva:**
* Analisou **queries do banco de dados** em execução
* Identificou query lenta na **tabela vendas** sem índice otimizado
* **Ação aplicada:** Criou índice composto `idx_vendas_data_status`
* Performance melhorou parcialmente mas problema persistiu

**Técnico João Oliveira:**
* Recebeu handover e continuou investigação
* Analisou configuração do **Redis (cache)**
* **Descoberta:** Cache foi desabilitado durante processo de atualização
* **Ação aplicada:** Reativou Redis e limpou cache obsoleto
* Performance **totalmente restaurada**

🟢 SOLUÇÃO FINAL:
* **Problema resolvido** através de abordagem multi-camadas:
  1. Otimização de banco de dados (índices)
  2. Reativação do sistema de cache
* Cliente confirmou que sistema voltou ao **desempenho normal**
* **Ticket Finalizado.**
* **Sugestão:** Implementar checklist pré-atualização incluindo verificação de cache
````

---

## 🔄 **Exemplo 5: Handover Entre Turnos**

### **Contexto:**
Atendimento iniciado no turno da manhã, continuado no turno da tarde.

### **Resumo Gerado para Handover:**
````markdown
📋 **HANDOVER - Ticket #5432**

🔴 **PROBLEMA ORIGINAL:**
* Cliente **Empresa XYZ Ltda** reportou falha na **sincronização de estoque**
* Produtos não atualizando entre loja física e e-commerce
* **Crítico:** Vendas duplicadas causando rupturas

🟡 **AÇÕES JÁ REALIZADAS (Turno Manhã - Técnico Maria):**

**Diagnósticos feitos:**
* ✅ Verificado conectividade API - **OK**
* ✅ Testado credenciais - **Válidas**
* ✅ Analisado logs de sincronização - **Encontrados timeouts**

**Hipóteses descartadas:**
* ❌ Problema de rede (testado com sucesso)
* ❌ Credenciais inválidas (renovadas e validadas)
* ❌ Servidor offline (status 100% uptime)

**Hipótese atual:**
* ⚠️ **Timeout de 30s insuficiente** para volume atual de produtos (15.000+)
* Cliente cresceu significativamente desde implementação inicial

**Ações pendentes:**
1. [ ] Aumentar timeout para 120s
2. [ ] Implementar sincronização em lotes (1000 produtos por vez)
3. [ ] Testar em ambiente de homologação
4. [ ] Aplicar em produção com janela de manutenção

**Configurações atualizadas:**
```json
{
  "sync_timeout": 30,        // DEVE ser alterado para 120
  "batch_size": null,        // DEVE ser definido como 1000
  "retry_attempts": 3
}
```

**Contato do cliente:**
* Nome: João Silva (TI Empresa XYZ)
* Email: joao.silva@empresaxyz.com
* Telefone: [OCULTO]
* Disponibilidade: 14h-18h

**Status atual:**
⏸️ **AGUARDANDO** aprovação do cliente para janela de manutenção

**Próximos passos (Turno Tarde):**
1. Confirmar janela de manutenção com cliente
2. Preparar script de atualização
3. Executar alterações conforme planejado
4. Monitorar primeira sincronização completa
````

---

## 💡 **Dicas de Uso dos Exemplos**

### **Para Documentação:**
Use **Modo: Último Técnico** + cole no CRM

### **Para Handover:**
Use **Modo: Completo** + envie para próximo técnico via Slack/Email

### **Para Relatórios:**
Use **Modo: Completo** + adicione múltiplos tickets em documento único

### **Para Base de Conhecimento:**
Use **Modo: Último Técnico** + adicione à Wiki com título descritivo

---

## 🎯 **Personalizando para Seu Caso**

Estes são exemplos genéricos. Você pode:

1. **Ajustar o prompt** para linguagem mais formal/informal
2. **Adicionar seções** específicas da sua empresa
3. **Incluir campos customizados** (SLA, prioridade, etc)

Veja [PROMPTS.md](PROMPTS.md) para mais detalhes.

---

<p align="center">
  💡 Use estes exemplos como referência!
</p>