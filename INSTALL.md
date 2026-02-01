# 📦 Guia de Instalação Completo - ChatSum

Este guia fornece instruções detalhadas para instalar e configurar o ChatSum.

## 📋 **Índice**

1. [Requisitos do Sistema](#requisitos-do-sistema)
2. [Instalação do Servidor](#instalação-do-servidor)
3. [Instalação da Extensão](#instalação-da-extensão)
4. [Configuração Inicial](#configuração-inicial)
5. [Verificação da Instalação](#verificação-da-instalação)
6. [Problemas Comuns](#problemas-comuns)

---

## 🖥️ **Requisitos do Sistema**

### **Software Necessário**

| Software | Versão Mínima | Link |
|----------|---------------|------|
| Google Chrome | 88+ | [Download](https://www.google.com/chrome/) |
| Python | 3.8+ | [Download](https://www.python.org/downloads/) |
| Git | 2.0+ | [Download](https://git-scm.com/downloads) |

### **Chave de API**

- **Google Gemini API Key** (gratuita)
  - Acesse: https://aistudio.google.com/app/apikey
  - Faça login com sua conta Google
  - Clique em "Create API Key"
  - Copie a chave gerada

---

## 🔧 **Instalação do Servidor**

### **Passo 1: Clone o Repositório**
```bash
# Via HTTPS
git clone https://github.com/tairony-cristian/chatsum-extension.git

# Ou via SSH
git clone git@github.com:tairony-cristian/chatsum-extension.git

# Entre na pasta
cd chatsum-extension
```

### **Passo 2: Configure o Ambiente Python**

#### **Windows:**
```cmd
cd server
python -m venv venv
venv\Scripts\activate
```

#### **Linux/Mac:**
```bash
cd server
python3 -m venv venv
source venv/bin/activate
```

### **Passo 3: Instale as Dependências**
```bash
# Com ambiente virtual ativado
pip install --upgrade pip
pip install -r requirements.txt
```

**Dependências instaladas:**
- `fastapi` - Framework web
- `uvicorn` - Servidor ASGI
- `google-generativeai` - SDK do Gemini
- `python-dotenv` - Gerenciador de variáveis de ambiente
- `pydantic` - Validação de dados

### **Passo 4: Configure as Variáveis de Ambiente**
```bash
# Copie o template
cp .env.example .env

# Edite o arquivo (use seu editor preferido)
nano .env  # ou vim, code, notepad++, etc.
```

**Configuração mínima do `.env`:**
```env
# OBRIGATÓRIO
GEMINI_API_KEY=SUA_CHAVE_AQUI

# OPCIONAL (valores padrão já funcionam)
SERVER_HOST=127.0.0.1
SERVER_PORT=8000
GEMINI_MODELS=gemini-2.5-flash,gemini-2.5-pro
MAX_REQUESTS_PER_DAY=20
LOG_LEVEL=INFO
```

### **Passo 5: Teste o Servidor**
```bash
# Inicie o servidor
python main.py
```

**Saída esperada:**
```
============================================================
🚀 ChatSum API v2.0.0 - Iniciando...
📡 Servidor: 127.0.0.1:8000
🤖 Modelo IA: gemini-2.5-flash
📊 Rate Limit: 20 req/dia
============================================================
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

**Teste no navegador:**
- Acesse: http://localhost:8000
- Você deve ver: `{"nome":"ChatSum API","versao":"2.0.0",...}`

**Teste a documentação:**
- Acesse: http://localhost:8000/docs
- Você verá a interface Swagger

---

## 🌐 **Instalação da Extensão**

### **Passo 1: Abra o Chrome Extensions**

1. Abra o Google Chrome
2. Digite na barra de endereço: `chrome://extensions/`
3. Ou Menu → Mais ferramentas → Extensões

### **Passo 2: Ative o Modo Desenvolvedor**

- No canto **superior direito**, ative a chave **"Modo do desenvolvedor"**

### **Passo 3: Carregue a Extensão**

1. Clique em **"Carregar sem compactação"**
2. Navegue até a pasta `chatsum-extension/extension`
3. Selecione a pasta e clique em **"Selecionar pasta"**

### **Passo 4: Fixe a Extensão**

1. Clique no ícone de **puzzle** 🧩 ao lado da barra de endereço
2. Encontre **"ChatSum"**
3. Clique no **alfinete** 📌 para fixar

**Extensão instalada com sucesso!** ✅

---

## ⚙️ **Configuração Inicial**

### **1. Primeira Abertura**

Ao clicar no ícone pela primeira vez, você verá:
- Página de **boas-vindas** com tutorial
- Contador zerado
- Modo padrão: "Último Técnico"

### **2. Acesse as Configurações**

1. Clique no ícone da extensão
2. Clique em **⚙️** (canto superior direito)
3. Ou clique com botão direito → **Opções**

### **3. Configurações Recomendadas**

#### **Aba Geral:**
```
✅ Modo Padrão: Último Técnico
✅ URL do Servidor: http://localhost:8000
✅ Notificações: Ativadas
⬜ Auto-copiar: (opcional)
```

#### **Aba Prompts:**
```
✅ Prompt Ativo: Padrão do Sistema
(Você pode personalizar depois)
```

#### **Aba Avançado:**
```
⬜ Modo Debug: (ative apenas para desenvolvimento)
```

### **4. Salve as Configurações**

Clique em **💾 Salvar** em cada aba modificada.

---

## ✅ **Verificação da Instalação**

### **Checklist de Verificação**

Execute estes testes para garantir que tudo está funcionando:

#### **1. Servidor Rodando**
```bash
# Em um terminal, verifique se o servidor responde
curl http://localhost:8000/health

# Resposta esperada:
# {"status":"ok","modelo":"gemini-2.5-flash","versao":"2.0.0"}
```

#### **2. Extensão Carregada**

- [ ] Ícone do ChatSum aparece na barra de ferramentas
- [ ] Ao clicar, abre o popup
- [ ] Não há erros no console (F12)

#### **3. Teste Funcional Completo**

1. **Abra a página de teste:**
```
   file:///caminho/para/chatsum-extension/test/test-page.html
```

2. **Clique no ícone do ChatSum**

3. **Clique em "Capturar e Resumir"**

4. **Aguarde 5-10 segundos**

5. **Verificações:**
   - [ ] Status muda para "Chat capturado"
   - [ ] Mensagem "IA gerando resumo..."
   - [ ] Resumo aparece formatado
   - [ ] Botão "Copiar" fica visível
   - [ ] Contador incrementa

**Se todos os itens estiverem ✅, sua instalação está perfeita!**

---

## 🐛 **Problemas Comuns**

### **Problema 1: "Servidor offline"**

**Sintomas:**
- Mensagem de erro ao capturar
- Status "Erro ao conectar com servidor"

**Solução:**
```bash
# 1. Verifique se o servidor está rodando
# Você deve ter um terminal com o servidor ativo

# 2. Se não estiver, inicie:
cd server
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
python main.py

# 3. Verifique a URL nas configurações da extensão
# Deve ser: http://localhost:8000
```

### **Problema 2: "Chave da API não configurada"**

**Sintomas:**
- Servidor não inicia
- Erro: "GEMINI_API_KEY não configurada"

**Solução:**
```bash
# 1. Edite o arquivo .env
nano server/.env

# 2. Adicione sua chave:
GEMINI_API_KEY=sua_chave_aqui_sem_espacos

# 3. Salve e reinicie o servidor
python main.py
```

### **Problema 3: "Chat não capturado"**

**Sintomas:**
- Erro: "Nenhuma mensagem encontrada"
- Resumo não é gerado

**Solução:**
1. **Verifique se está em uma página de chat ativa**
2. **Ative o modo debug:**
   - Configurações → Avançado → Modo Debug
   - Abra DevTools (F12)
   - Veja logs detalhados no console
3. **Use a página de teste:**
   - Abra `test/test-page.html`
   - Teste lá primeiro

### **Problema 4: "Porta 8000 já em uso"**

**Sintomas:**
- Erro ao iniciar servidor
- "Address already in use"

**Solução Windows:**
```cmd
# Encontre processo usando porta 8000
netstat -ano | findstr :8000

# Mate o processo (substitua PID pelo número encontrado)
taskkill /PID numero_do_pid /F

# Ou mude a porta no .env:
SERVER_PORT=8001
```

**Solução Linux/Mac:**
```bash
# Encontre processo
lsof -i :8000

# Mate processo
kill -9 PID

# Ou mude porta no .env:
SERVER_PORT=8001
```

### **Problema 5: Extensão não carrega**

**Sintomas:**
- Erro ao carregar extensão
- "Manifest inválido"

**Solução:**
1. **Verifique se está carregando a pasta correta:**
   - Deve ser `chatsum-extension/extension`
   - **NÃO** a pasta raiz do projeto

2. **Verifique o manifest.json:**
```bash
   # Deve existir e ser válido
   cat extension/manifest.json
```

3. **Recarregue a extensão:**
   - chrome://extensions/
   - Clique no ícone de reload 🔄

---

## 🎓 **Próximos Passos**

Instalação concluída! Agora você pode:

1. **[Ler o guia de uso](USAGE.md)** - Como usar todas as funcionalidades
2. **[Personalizar prompts](docs/PROMPTS.md)** - Customize o estilo dos resumos
3. **[Ver exemplos](docs/EXAMPLES.md)** - Casos de uso reais
4. **[Contribuir](CONTRIBUTING.md)** - Ajude a melhorar o projeto

---

## 💬 **Precisa de Ajuda?**

- 📖 [Documentação Completa](docs/)
- 🐛 [Reportar Bug](https://github.com/tairony-cristian/chatsum-extension/issues)
- 💡 [Sugerir Feature](https://github.com/tairony-cristian/chatsum-extension/issues/new)
- 📧 Email: taironycristian@yahoo.com.br

---

<p align="center">
  ✨ Bem-vindo ao ChatSum! ✨
</p>