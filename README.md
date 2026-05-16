# 📋 ChatSum - Resumidor Inteligente de Atendimentos

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Chrome](https://img.shields.io/badge/chrome-extension-orange.svg)

> Extensão Chrome que gera resumos técnicos automáticos de conversas de suporte usando Inteligência Artificial (Gemini, Groq ou OpenAI).

---

## 🎯 Características Principais

- ✨ **Resumo Automático** — Gera resumos técnicos profissionais com um clique
- 🤖 **Multi-IA** — Suporte a Gemini, Groq e OpenAI com fallback automático
- 📜 **Histórico** — Últimos 10 resumos salvos com navegação ◀ ▶
- 🎫 **Auto-extração** — Captura razão social e número do ticket automaticamente do Movidesk
- 📝 **Prompts Personalizáveis** — Customize o estilo dos resumos (limite 10.000 chars)
- 🔄 **Carregar mais automático** — Clica em todos os botões "Carregar mais" do chat
- 🔒 **Seguro** — Sanitização automática de dados sensíveis
- ☁️ **Nuvem ou Local** — Funciona com servidor Railway ou localhost

---

## 📖 Como Usar

1. Abra um ticket no **Movidesk**
2. Clique no ícone 📋 do ChatSum na barra do Chrome
3. Selecione o **Modo** (Último Técnico ou Completo) e o **Provedor de IA**
4. Clique em **"🔍 Capturar e Resumir"**
5. Aguarde 5-15 segundos
6. Clique em **"📋 Copiar com Formatação"** e cole no seu sistema de chamados

---

## 🔒 Segurança

A extensão remove automaticamente os dados abaixo antes de enviar para a IA:

- ✅ Telefones e CPF/CNPJ
- ✅ E-mails
- ✅ Endereços IP
- ✅ Códigos de acesso remoto (AnyDesk, TeamViewer)
- ✅ Tokens e API Keys
- ✅ Senhas

> ❌ **NUNCA** commite o arquivo `.env` — use `.env.example` como template.

---

## 📊 Limitações

| Item | Limite |
|---|---|
| Requisições diárias — Gemini gratuito | 20/dia |
| Requisições diárias — Groq gratuito | Generoso (varia) |
| Tamanho máximo do chat | 50.000 caracteres |
| Tamanho máximo do prompt personalizado | 10.000 caracteres |
| Resumos no histórico | 10 itens |

---

## 📚 Documentação

- [📦 INSTALL.md](INSTALL.md) — Instalação completa (Railway e servidor local)
- [📖 USAGE.md](USAGE.md) — Como usar todas as funcionalidades
- [🏗️ ARCHITECTURE.md](ARCHITECTURE.md) — Detalhes técnicos
- [🔌 API.md](API.md) — Referência dos endpoints

---

## 📝 Changelog

### v2.0.0
- ✨ Suporte a múltiplos provedores de IA (Gemini, Groq, OpenAI)
- 📜 Aba de histórico com os últimos 10 resumos
- 🎫 Extração automática de razão social e ticket do Movidesk
- 🔄 Clique automático em todos os botões "Carregar mais"
- 📝 Editor de prompt com contador de caracteres (limite 10.000)
- ☁️ Suporte a deploy no Railway
- 🛡️ Fallback automático entre provedores de IA

### v1.0.0
- 🎉 Lançamento inicial
- 📋 Captura básica de chat
- 🤖 Integração com Google Gemini

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 👤 Autor

**Tairony Cristian**
- GitHub: [@tairony-cristian](https://github.com/tairony-cristian)
- LinkedIn: [tairony-cristian-folgado](https://www.linkedin.com/in/tairony-cristian-folgado/)
- Email: taironycristian@yahoo.com.br

---

<p align="center">
  Feito com ❤️ para a comunidade de suporte técnico
</p>