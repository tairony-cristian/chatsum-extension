# 📖 Guia de Uso - ChatSum

Aprenda a usar todas as funcionalidades do ChatSum de forma eficiente.

## 📋 **Índice**

1. [Uso Básico](#uso-básico)
2. [Modos de Resumo](#modos-de-resumo)
3. [Prompts Personalizados](#prompts-personalizados)
4. [Dicas e Truques](#dicas-e-truques)
5. [Casos de Uso](#casos-de-uso)
6. [Atalhos](#atalhos)

---

## 🚀 **Uso Básico**

### **Passo a Passo: Primeiro Resumo**

#### **1. Abra uma conversa de suporte**

Navegue até qualquer plataforma de atendimento:
- Sistema de tickets (Zendesk, Freshdesk, etc)
- WhatsApp Web
- Chat interno da empresa
- Qualquer página com histórico de mensagens

#### **2. Abra o ChatSum**

Clique no ícone 📋 do ChatSum na barra de ferramentas do Chrome.

#### **3. Configure o modo (opcional)**

Por padrão, o modo **"Último Técnico"** está selecionado.
- ✅ **Último Técnico**: Resume apenas suas ações (recomendado para documentar)
- ⭕ **Completo**: Resume ações de todos os técnicos

#### **4. Capture o chat**

Clique no botão **"🔍 Capturar e Resumir"**

**O que acontece:**
```
⏳ Capturando chat...        (2-3 segundos)
    ↓
✅ Chat capturado!           (Pode fechar a janela)
    ↓
🤖 IA gerando resumo...      (5-10 segundos)
    ↓
✅ Resumo pronto!            (Notificação aparece)
```

#### **5. Use o resumo**

- **📋 Copiar**: Copia com formatação HTML (cola formatado no CRM)
- **🗑️ Limpar**: Remove o resumo e libera para novo
- **👁️ Visualizar**: Veja o resumo formatado na extensão

---

## 🎯 **Modos de Resumo**

### **Modo 1: Último Técnico** (Padrão)

**Quando usar:**
- ✅ Documentar ticket após atendimento
- ✅ Registrar suas ações no CRM
- ✅ Relatório individual de atendimento

**Exemplo de saída:**
```markdown
🔴 PROBLEMA RELATADO:
* Cliente reportou erro ao finalizar venda no módulo de **PDV**
* Mensagem exibida: **"Falha ao processar pagamento"**
* Impacto: **Processo bloqueado**, impossível concluir vendas

🟡 ANÁLISE TÉCNICA:
* Acessei o **banco de dados** e verifiquei logs da transação
* Identifiquei **configuração incorreta** no gateway de pagamento
* Causa Raiz: Parâmetro **merchant_id** estava desatualizado

🟢 SOLUÇÃO APRESENTADA:
* Atualizei configuração do **gateway** via query SQL
* Orientei cliente a testar nova venda
* Cliente confirmou funcionamento
* **Ticket Finalizado.**
```

### **Modo 2: Completo**

**Quando usar:**
- ✅ Handover (passar atendimento para outro técnico)
- ✅ Relatórios gerenciais
- ✅ Análise de qualidade de atendimento
- ✅ Documentação de casos complexos

**Exemplo de saída:**
```markdown
🔴 PROBLEMA:
Cliente reportou lentidão no sistema após atualização

🟡 HISTÓRICO DE ATENDIMENTO:

**Técnico Maria Santos:**
* Verificou logs do servidor
* Identificou alto uso de CPU
* Escalou para equipe de infraestrutura

**Técnico João Silva:**
* Analisou queries do banco de dados
* Encontrou índice faltante na tabela vendas
* Criou índice otimizado
* Aplicou script de correção

🟢 SOLUÇÃO FINAL:
* Performance restaurada após criação de índices
* Cliente confirmou melhora significativa
* **Ticket Finalizado.**
```

---

## 📝 **Prompts Personalizados**

### **Acessando o Editor**

1. Clique em **⚙️ Configurações**
2. Vá para aba **📝 Prompts**
3. Selecione **"Personalizado"** no dropdown
4. O editor será exibido

### **Estrutura de um Prompt**
```markdown
Aja como um [PAPEL].

**INSTRUÇÕES:**
1. [Instrução 1]
2. [Instrução 2]
3. [Instrução 3]

**SEÇÕES:**

**TÍTULO 1:**
[Descrição do que deve conter]

**TÍTULO 2:**
[Descrição do que deve conter]

Use a variável {ultimo_tecnico} para mencionar o técnico.
```

### **Variáveis Disponíveis**

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{ultimo_tecnico}` | Nome do último técnico | João Silva |
| `{data}` | Data atual (futuro) | 15/01/2025 |
| `{hora}` | Hora atual (futuro) | 14:30 |

### **Exemplo: Prompt Informal**
```markdown
Aja como um colega de trabalho resumindo um atendimento.

Use tom informal e amigável. Foque no que {ultimo_tecnico} fez pra resolver.

**O PROBLEMA:**
Conta rapidinho o que o cliente falou

**O QUE FIZ:**
Lista as ações que tomei

**RESULTADO:**
Diz se resolveu ou não
```

### **Exemplo: Prompt Técnico Detalhado**
```markdown
Aja como um Engenheiro de Software Sênior documentando um incidente.

**INCIDENT REPORT - Atendimento por {ultimo_tecnico}**

**SYMPTOM:**
* Sistema/Módulo afetado
* Error message (exact text)
* Business impact (urgency level)

**ROOT CAUSE ANALYSIS:**
* Investigation steps performed
* Logs analyzed (specific files/tables)
* Root cause identified (technical details)

**RESOLUTION:**
* Fix applied (code changes, config updates, queries)
* Verification steps
* Status: [RESOLVED | MONITORING | ESCALATED]

**FOLLOW-UP:**
* Preventive measures recommended
```

### **Validando o Prompt**

Após editar:

1. Clique em **✓ Validar**
2. Verifique se aparece: **"✅ Prompt válido!"**
3. Se houver erros, corrija conforme indicado
4. Clique em **💾 Salvar Prompt**

### **Testando o Prompt**

1. Clique em **👁️ Preview**
2. Veja como ficaria com dados de exemplo
3. Ajuste se necessário
4. Salve quando estiver satisfeito

---

## 💡 **Dicas e Truques**

### **1. Otimize a Captura**

**✅ FAÇA:**
- Mantenha apenas a conversa relevante aberta
- Role até o topo para capturar tudo
- Use em páginas com histórico completo

**❌ EVITE:**
- Capturar com filtros ativos
- Capturar conversas muito longas (>50k chars)
- Capturar múltiplas conversas simultaneamente

### **2. Economize Requisições**

O limite é **20 requisições/dia** no plano gratuito.

**Dicas:**
- ✅ Agrupe atendimentos similares
- ✅ Revise o chat antes de resumir
- ✅ Use o cache (não delete resumos à toa)
- ❌ Evite gerar múltiplos resumos do mesmo chat

**Veja seu contador:**
```
📊 Requisições hoje: 12/20
```

### **3. Copie com Formatação**

Quando clicar em **📋 Copiar**, o resumo é copiado com:
- ✅ Formatação HTML (negrito, cores)
- ✅ Emojis preservados
- ✅ Estrutura de listas

**Cole direto em:**
- Zendesk, Freshdesk (tickets)
- Google Docs, Word
- Slack, Teams (com formatação)
- Gmail, Outlook

### **4. Use Atalhos de Teclado** (futuro)

| Atalho | Ação |
|--------|------|
| `Ctrl+Shift+R` | Abrir ChatSum |
| `Enter` | Capturar (quando popup aberto) |
| `Ctrl+C` | Copiar resumo |
| `Escape` | Fechar popup |

### **5. Trabalhe com Múltiplas Abas**

**Cenário:** Você está atendendo 3 tickets ao mesmo tempo.

**Como funciona:**
1. Abra **Aba 1** (Ticket A) → Capture
2. Enquanto processa, abra **Aba 2** (Ticket B)
3. Tente capturar → **Bloqueado!** ⚠️
4. Você verá: _"Resumo em andamento em outra aba"_
5. Aguarde ou cancele o primeiro

**Motivo:** Evita conflitos e garante que cada resumo seja associado corretamente.

### **6. Debug de Problemas**

Se algo não funcionar:

1. **Ative Modo Debug:**
   - Configurações → Avançado → ☑ Modo Debug

2. **Abra DevTools:**
   - Pressione `F12` na página

3. **Console mostrará:**
```
   [ChatSum Content] ✅ Plataforma detectada: Zendesk
   [ChatSum Content] 📨 23 mensagens encontradas
   [ChatSum Content] 👤 Último técnico: João Silva
   [ChatSum Content] ✅ Chat capturado com sucesso
```

4. **Copie logs e reporte se encontrar bugs**

---

## 🎓 **Casos de Uso**

### **Caso 1: Suporte Técnico SaaS**

**Contexto:**
- Empresa de software
- Atende via Intercom
- Precisa documentar cada atendimento

**Fluxo:**
1. Cliente reporta bug
2. Técnico investiga e resolve
3. Usa ChatSum modo **"Último Técnico"**
4. Cola resumo no Jira/Linear
5. Ticket documentado em 10 segundos

**Benefício:** -80% tempo de documentação

### **Caso 2: Handover de Turno**

**Contexto:**
- Equipe 24/7 com turnos
- Atendimentos longos passam entre técnicos

**Fluxo:**
1. Técnico A trabalha 6h no ticket
2. Fim do turno, usa modo **"Completo"**
3. Envia resumo para Técnico B via Slack
4. Técnico B entende contexto rapidamente

**Benefício:** Transição suave, sem perda de contexto

### **Caso 3: Relatório Semanal**

**Contexto:**
- Gestor precisa reportar atendimentos da semana

**Fluxo:**
1. Gera resumo completo de cada ticket importante
2. Consolida em um documento
3. Apresenta para stakeholders

**Benefício:** Visibilidade clara do trabalho realizado

### **Caso 4: Base de Conhecimento**

**Contexto:**
- Empresa quer documentar soluções comuns

**Fluxo:**
1. Após resolver bug recorrente
2. Gera resumo técnico detalhado
3. Adiciona à Wiki interna
4. Próximos técnicos consultam

**Benefício:** Conhecimento compartilhado e reutilizável

---

## ⌨️ **Atalhos** (Planejados para v2.1)

### **Globais**

| Atalho | Ação |
|--------|------|
| `Ctrl+Shift+R` | Abrir ChatSum |
| `Ctrl+Shift+C` | Capturar e resumir |

### **Dentro do Popup**

| Atalho | Ação |
|--------|------|
| `Enter` | Confirmar ação |
| `Escape` | Fechar popup |
| `Ctrl+C` | Copiar resumo |
| `Ctrl+K` | Abrir configurações |

### **Página de Configurações**

| Atalho | Ação |
|--------|------|
| `Ctrl+S` | Salvar configurações |
| `Ctrl+R` | Resetar para padrão |

---

## 🎨 **Personalizando a Experiência**

### **Temas** (Futuro)

Atualmente apenas tema padrão. Em breve:
- 🌞 Tema Claro
- 🌙 Tema Escuro
- 🎨 Temas Personalizados

### **Notificações**

Configure em **Configurações → Geral**:
```
☑ Mostrar notificações quando resumo estiver pronto
```

**Tipos de notificação:**
- ✅ Resumo gerado
- ❌ Erro ao gerar
- ⚠️ Quota atingida

---

## 📊 **Monitorando Uso**

### **Contador de Requisições**

Visível no popup:
```
📊 Requisições hoje: 12
```

**Reseta automaticamente:**
- Todo dia às 00:00 (horário local)

**Para resetar manualmente:**
- Configurações → Avançado → Resetar Contador

### **Histórico** (Futuro - v2.2)

Em breve você poderá:
- Ver últimos 10 resumos
- Buscar por data
- Exportar histórico

---

## 🆘 **Precisa de Ajuda?**

### **Suporte Rápido**

1. **Leia o [Troubleshooting](INSTALL.md#problemas-comuns)**
2. **Veja [Examples](EXAMPLES.md)** com casos reais
3. **Ative Modo Debug** e analise logs

### **Reportar Problemas**

- 🐛 [Issues no GitHub](https://github.com/tairony-cristian/chatsum-extension/issues)
- 📧 Email: taironycristian@yahoo.com.br
- 💬 Discussões: [GitHub Discussions](https://github.com/tairony-cristian/chatsum-extension/discussions)

---

## 🎉 **Dicas Finais**

1. **Comece simples**: Use modo padrão primeiro
2. **Experimente**: Teste prompts diferentes
3. **Compartilhe**: Ajude colegas a usar
4. **Contribua**: Reporte bugs e sugira melhorias
5. **Otimize**: Ajuste para seu fluxo de trabalho

---

<p align="center">
  Aproveite o ChatSum! 🚀
</p>