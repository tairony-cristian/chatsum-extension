# 🔌 API Reference

## Endpoints

### 1. GET /
Informações da API

**Response:**
```json
{
  "nome": "ChatSum API",
  "versao": "2.0.0",
  "status": "online",
  "docs": "/docs"
}
```

### 2. GET /health
Health check do servidor

**Response:**
```json
{
  "status": "ok",
  "modelo": "gemini-2.5-flash",
  "versao": "2.0.0"
}
```

### 3. POST /resumidor/resumir
**Gera resumo do atendimento**

**Request:**
```json
{
  "texto": "string (100-50000 chars)",
  "ultimoTecnico": "string (opcional)",
  "modo": "ultimo_tecnico | completo",
  "promptCustom": "string (opcional)"
}
```

**Response:**
```json
{
  "resumo": "string",
  "timestamp": "ISO 8601",
  "ultimoTecnico": "string",
  "modo": "string"
}
```

**Erros:**
- `400` - Dados inválidos
- `429` - Quota excedida
- `500` - Erro interno

### 4. GET /resumidor/ultimo-resumo
Recupera último resumo gerado

### 5. GET /resumidor/prompt-default
Retorna prompt padrão

### 6. GET /resumidor/prompt-completo
Retorna prompt modo completo

### 7. POST /resumidor/validar-prompt
Valida prompt personalizado

## Rate Limiting
- Máximo: 50 requisições/dia
- Por cliente: IP + User-Agent

## Autenticação
Nenhuma (localhost apenas)

## CORS
Permite: chrome-extension://*