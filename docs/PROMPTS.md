# 📝 Guia de Prompts

## Prompts Padrão

### 1. Último Técnico (default.txt)
Resume apenas as ações do último técnico que atendeu.

**Quando usar:** Handover simples, relatórios de ação

### 2. Completo (completo.txt)
Resume todas as ações de todos os técnicos envolvidos.

**Quando usar:** Histórico completo, escalações, análise

## Criar Prompt Customizado

### Variáveis Disponíveis
- `{ultimo_tecnico}` - Nome do técnico
- `{data}` - Data atual
- `{hora}` - Hora atual

### Exemplo
Gere um resumo em HTML...
Técnico: {ultimo_tecnico}
Data: {data}

### Validações
- Mínimo: 50 caracteres
- Máximo: 5000 caracteres
- Obrigatório: {ultimo_tecnico}

### Best Practices
1. Seja específico
2. Use formatação clara
3. Defina o tom esperado
4. Liste seções esperadas

## Troubleshooting

### Resumo vazio
- Chat muito curto (mín 100 chars)
- Prompt muito restritivo
- Falha na API Gemini

### Resumo irrelevante
- Prompt não está claro
- Chat sem estrutura clara
- Adaptar prompt para seu formato