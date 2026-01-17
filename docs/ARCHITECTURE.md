# 🏗️ Arquitetura do ChatSum

Documentação técnica da arquitetura do sistema.

## 📋 **Visão Geral**

ChatSum é composto por dois componentes principais:

1. **Chrome Extension** (Frontend)
   - Interface do usuário
   - Captura de conteúdo
   - Gerenciamento de estado

2. **FastAPI Server** (Backend)
   - Processamento de IA
   - Sanitização de dados
   - Gerenciamento de prompts

---

## 🎨 **Diagrama de Arquitetura**
````
┌─────────────────────────────────────────────────────────────┐
│                        Chrome Browser                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    Extension                            │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │ │
│  │  │  Popup   │  │ Options  │  │ Content  │             │ │
│  │  │   UI     │  │   Page   │  │  Script  │             │ │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘             │ │
│  │       │             │              │                    │ │
│  │       └─────────────┴──────────────┘                    │ │
│  │                     │                                   │ │
│  │           ┌─────────▼─────────┐                        │ │
│  │           │  Background        │                        │ │
│  │           │  Service Worker    │                        │ │
│  │           └─────────┬──────────┘                        │ │
│  │                     │                                   │ │
│  │           ┌─────────▼─────────┐                        │ │
│  │           │  Chrome Storage    │                        │ │
│  │           └────────────────────┘                        │ │
│  └──────────────────────┬─────────────────────────────────┘ │
└─────────────────────────┼─────────────────────────────────────┘
                          │ HTTP/REST
                          ▼
        ┌─────────────────────────────────────┐
        │      FastAPI Server (Local)         │
        │  ┌──────────────────────────────┐   │
        │  │        Main.py (API)         │   │
        │  └──────────┬───────────────────┘   │
        │             │                        │
        │    ┌────────┴────────┐              │
        │    │                 │              │
        │    ▼                 ▼              │
        │  ┌────────┐    ┌──────────┐        │
        │  │  AI    │    │Sanitizer │        │
        │  │Service │    │ Service  │        │
        │  └───┬────┘    └──────────┘        │
        │      │                              │
        │      │                              │
        └──────┼──────────────────────────────┘
               │ API Call
               ▼
        ┌────────────────┐
        │  Google Gemini │
        │      API       │
        └────────────────┘
````

---

## 🔌 **Componentes da Extensão**

### **1. Popup (Interface Principal)**

**Responsabilidades:**
- Exibir status atual
- Capturar ação do usuário
- Mostrar resumo gerado
- Gerenciar UI/UX

**Tecnologias:**
- HTML5 + CSS3
- JavaScript ES6+ (Modules)

**Arquivos:**
````
popup/
├─ popup.html    # Estrutura
├─ popup.js      # Lógica
└─ popup.css     # Estilo
````

### **2. Background Service Worker**

**Responsabilidades:**
- Gerenciar requisições HTTP
- Processar em background
- Notificações do sistema
- Gerenciar badges

**Lifecycle:**
````
Install → Activate → Listen → Process → Sleep
````

**Persistência:**
- Usa `chrome.storage.local`
- Não mantém estado em memória

### **3. Content Script**

**Responsabilidades:**
- Acessar DOM da página
- Capturar mensagens
- Detectar plataforma
- Extrair metadados

**Injection:**
````javascript
"content_scripts": [{
  "matches": ["<all_urls>"],
  "js": ["content/content.js"]
}]
````

### **4. Options Page**

**Responsabilidades:**
- Configurações do usuário
- Editor de prompts
- Importar/Exportar config

---

## 🐍 **Componentes do Servidor**

### **1. FastAPI Application**

**main.py** - Aplicação principal

**Endpoints:**
````
GET  /                      # Info da API
GET  /health               # Health check
POST /resumidor/resumir     # Gerar resumo
GET  /resumidor/ultimo-resumo  # Buscar último
GET  /resumidor/prompt-default  # Prompt padrão
POST /resumidor/validar-prompt  # Validar custom
````

### **2. AI Service**

**Responsabilidades:**
- Inicializar modelo Gemini
- Gerar resumos
- Retry logic
- Error handling

**Fluxo:**
````
Prompt + Chat → Format → Send to Gemini → Parse → Return
````

### **3. Sanitizer Service**

**Responsabilidades:**
- Remover dados sensíveis
- Aplicar regex patterns
- Validar segurança

**Dados removidos:**
- Telefones, CPF/CNPJ
- Emails, IPs
- Senhas, Tokens
- Códigos de acesso

### **4. Prompt Manager**

**Responsabilidades:**
- Carregar prompts de arquivos
- Gerenciar templates
- Validar prompts customizados

---

## 🔄 **Fluxo de Dados**

### **Fluxo Completo de Resumo**
````
1. User Action
   ↓
2. Popup: capturar()
   ↓
3. Content Script: extrairChat()
   ↓
4. Popup: salvarStorage()
   ↓
5. Background: detectarEstadoCAPTURED()
   ↓
6. Background: enviarParaServidor()
   ↓
7. Server: /resumidor/resumir
   ↓
8. Server: sanitizar()
   ↓
9. Server: aiService.generate()
   ↓
10. Google Gemini API
   ↓
11. Server: retornarResumo()
   ↓
12. Background: salvarResultado()
   ↓
13. Background: notificarUsuario()
   ↓
14. Popup: exibirResumo()
````

### **Estados da Aplicação**
````
IDLE
  ↓ [user click]
CAPTURING
  ↓ [chat captured]
CAPTURED
  ↓ [background starts]
SENDING
  ↓ [request sent]
PROCESSING
  ↓ [AI generating]
DONE
  ↓ [user clears]
IDLE
````

---

## 💾 **Armazenamento de Dados**

### **Chrome Storage (Local)**
````javascript
{
  // Configurações
  modoResumo: "ultimo_tecnico",
  serverUrl: "http://localhost:8000",
  promptAtivo: "default",
  promptPersonalizado: "...",
  
  // Estado
  estado: "DONE",
  estadoTimestamp: "2025-01-15T10:30:00Z",
  
  // Dados temporários
  chatCapturado: "...",
  ultimoTecnico: "João Silva",
  tabIdProcessando: 123456,
  
  // Resultado
  resumoFinal: "...",
  timestampResumo: "2025-01-15T10:31:00Z",
  metadadosResumo: {...},
  
  // Lock
  processing_lock: {
    timestamp: 1705316400000,
    tabId: 123456,
    requestId: "uuid-..."
  },
  
  // Contador
  contadorRequisicoes: 12,
  dataContador: "2025-01-15"
}
````

### **Servidor (Memória)**
````python
# Cache em memória (não persistente)
ultimo_resumo_cache = {
    "resumo": "...",
    "timestamp": "...",
    "ultimoTecnico": "...",
    "modo": "..."
}
````

---

## 🔒 **Segurança**

### **1. Sanitização de Dados**

**Regex Patterns:**
````python
PATTERNS = {
    'telefone': r'\(?\d{2,3}\)?\s?\d{4,5}-?\d{4}',
    'cpf': r'\d{3}\.?\d{3}\.?\d{3}-?\d{2}',
    'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    # ... mais patterns
}
````

### **2. Variáveis de Ambiente**
````bash
# NUNCA commitar
.env

# Sempre incluir
.env.example
````

### **3. CORS**
````python
allow_origins = [
    "chrome-extension://*",
    "http://localhost:8000"
]
````

---

## ⚡ **Performance**

### **Otimizações Implementadas**

1. **Cache de Prompts**
````python
   _prompts: Dict[str, str] = {}  # Carrega uma vez
````

2. **Lazy Loading**
   - Content script só executa quando necessário
   - Background worker dorme quando inativo

3. **Rate Limiting**
   - Contador local
   - Validação no cliente

4. **Timeouts**
````python
   REQUEST_TIMEOUT = 30  # segundos
   LOCK_TIMEOUT = 60     # segundos
````

---

## 🧪 **Testes**

### **Estratégia de Testes**
````
Backend (Python)
├─ Testes Unitários (pytest)
│  ├─ test_ai_service.py
│  ├─ test_sanitizer.py
│  └─ test_api.py
└─ Testes de Integração
   └─ test_integration.py

Frontend (JavaScript)
├─ Testes Manuais
│  └─ test/test-page.html
└─ Testes E2E (futuro)
   └─ Puppeteer/Playwright
````

---

## 📦 **Deployment**

### **Extensão Chrome**
````bash
# Build
cd extension
zip -r chatsum-v2.0.0.zip . -x "*.git*"

# Publish
# Upload para Chrome Web Store
````

### **Servidor Local**
````bash
# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000
````

---

## 🔮 **Roadmap Técnico**

### **v2.1 (Q1 2025)**
- [ ] Suporte para Manifest V3 completo
- [ ] Testes automatizados E2E
- [ ] Websockets para notificações real-time

### **v2.2 (Q2 2025)**
- [ ] Histórico de resumos (DB local)
- [ ] Modo offline (cache)
- [ ] Multi-idioma (i18n)

### **v3.0 (Q3 2025)**
- [ ] Cloud sync (Firebase)
- [ ] API pública
- [ ] Plugin para VS Code

---

## 📚 **Referências**

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Google Gemini API](https://ai.google.dev/docs)
- [Manifest V3 Migration](https://developer.chrome.com/docs/extensions/mv3/intro/)

---

<p align="center">
  📐 Arquitetura detalhada do ChatSum
</p>