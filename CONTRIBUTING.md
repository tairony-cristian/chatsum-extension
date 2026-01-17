# 🤝 Guia de Contribuição - ChatSum

Obrigado por considerar contribuir com o ChatSum! Este documento fornece diretrizes para contribuições.

## 📋 **Índice**

1. [Código de Conduta](#código-de-conduta)
2. [Como Contribuir](#como-contribuir)
3. [Reportando Bugs](#reportando-bugs)
4. [Sugerindo Features](#sugerindo-features)
5. [Pull Requests](#pull-requests)
6. [Padrões de Código](#padrões-de-código)
7. [Estrutura de Commits](#estrutura-de-commits)

---

## 📜 **Código de Conduta**

### **Nosso Compromisso**

Este projeto adota o [Contributor Covenant](https://www.contributor-covenant.org/) como código de conduta.

**Resumo:**
- ✅ Seja respeitoso e inclusivo
- ✅ Aceite críticas construtivas
- ✅ Foque no melhor para a comunidade
- ❌ Não tolere assédio ou discriminação

### **Reportando Violações**

Email: conduct@seudominio.com

---

## 🛠️ **Como Contribuir**

### **Tipos de Contribuição**

Aceitamos contribuições em várias formas:

1. **🐛 Correção de Bugs**
2. **✨ Novas Features**
3. **📝 Documentação**
4. **🎨 Melhorias de UI/UX**
5. **🧪 Testes**
6. **🌍 Traduções**
7. **💡 Ideias e Sugestões**

### **Primeiros Passos**

#### **1. Fork o Repositório**
```bash
# Clique em "Fork" no GitHub
# Depois clone seu fork:
git clone https://github.com/SEU-USUARIO/chatsum-extension.git
cd chatsum-extension
```

#### **2. Configure o Upstream**
```bash
git remote add upstream https://github.com/usuario-original/chatsum-extension.git
git fetch upstream
```

#### **3. Crie uma Branch**
```bash
# Para nova feature:
git checkout -b feature/minha-feature

# Para correção de bug:
git checkout -b bugfix/corrige-problema-x

# Para documentação:
git checkout -b docs/melhora-readme
```

#### **4. Faça Suas Alterações**

- Siga os [padrões de código](#padrões-de-código)
- Adicione testes se aplicável
- Atualize documentação se necessário

#### **5. Teste Localmente**
```bash
# Backend
cd server
pytest tests/

# Frontend
# Carregue a extensão no Chrome e teste manualmente
```

#### **6. Commit e Push**
```bash
git add .
git commit -m "feat: adiciona nova funcionalidade X"
git push origin feature/minha-feature
```

#### **7. Abra um Pull Request**

1. Vá para seu fork no GitHub
2. Clique em "Compare & pull request"
3. Preencha o template (veja abaixo)
4. Aguarde review

---

## 🐛 **Reportando Bugs**

### **Antes de Reportar**

- ✅ Verifique se o bug já foi reportado nas [Issues](https://github.com/seu-usuario/chatsum-extension/issues)
- ✅ Teste na versão mais recente
- ✅ Verifique se não é um problema de configuração

### **Template de Bug Report**
```markdown
**Descrição do Bug**
Uma descrição clara e concisa do que é o bug.

**Como Reproduzir**
Passos para reproduzir o comportamento:
1. Vá para '...'
2. Clique em '...'
3. Veja o erro

**Comportamento Esperado**
Descrição do que deveria acontecer.

**Screenshots**
Se aplicável, adicione screenshots.

**Ambiente:**
 - OS: [ex. Windows 11]
 - Chrome Version: [ex. 120.0]
 - Extensão Version: [ex. 2.0.0]
 - Python Version: [ex. 3.11]

**Logs**
```
Cole aqui logs relevantes (ative modo debug)
```

**Contexto Adicional**
Qualquer outra informação relevante.
```

---

## ✨ **Sugerindo Features**

### **Template de Feature Request**
```markdown
**Descrição da Feature**
Descrição clara do que você gostaria de adicionar.

**Problema que Resolve**
Explique qual problema esta feature resolveria.

**Solução Proposta**
Como você imagina que funcionaria?

**Alternativas Consideradas**
Outras formas de resolver o mesmo problema.

**Complexidade Estimada**
- [ ] Baixa (poucas horas)
- [ ] Média (1-2 dias)
- [ ] Alta (1+ semana)

**Benefício para Usuários**
Como isso melhoraria a experiência?
```

---

## 🔀 **Pull Requests**

### **Checklist do PR**

Antes de abrir o PR, verifique:

- [ ] Código segue os padrões do projeto
- [ ] Commits seguem o padrão Conventional Commits
- [ ] Testes adicionados/atualizados (se aplicável)
- [ ] Documentação atualizada (se aplicável)
- [ ] Sem erros de lint
- [ ] Testado localmente
- [ ] Branch atualizada com `develop`

### **Template de Pull Request**
```markdown
## Descrição
Breve descrição das mudanças.

## Tipo de Mudança
- [ ] 🐛 Bug fix
- [ ] ✨ Nova feature
- [ ] 💥 Breaking change
- [ ] 📝 Documentação
- [ ] 🎨 UI/UX

## Motivação e Contexto
Por que essa mudança é necessária?

## Como Foi Testado?
Descreva os testes que executou.

## Screenshots (se aplicável)
Adicione screenshots das mudanças visuais.

## Checklist
- [ ] Meu código segue os padrões do projeto
- [ ] Revisei meu próprio código
- [ ] Comentei partes complexas
- [ ] Atualizei a documentação
- [ ] Minhas mudanças não geram novos warnings
- [ ] Adicionei testes
- [ ] Todos os testes passam localmente

## Issues Relacionadas
Closes #123
Relates to #456
```

### **Processo de Review**

1. **Automático**: CI roda testes
2. **Manual**: Maintainer revisa código
3. **Feedback**: Você ajusta se necessário
4. **Aprovação**: PR é mergeado

**Tempo de resposta esperado:** 2-5 dias úteis

---

## 📐 **Padrões de Código**

### **Python (Backend)**

#### **Style Guide**

- Seguimos **PEP 8**
- Use **type hints**
- Docstrings em **Google Style**
```python
def funcao_exemplo(param1: str, param2: int) -> bool:
    """
    Breve descrição da função.
    
    Args:
        param1: Descrição do parâmetro 1
        param2: Descrição do parâmetro 2
        
    Returns:
        Descrição do retorno
        
    Raises:
        ValueError: Quando param2 é negativo
    """
    if param2 < 0:
        raise ValueError("param2 deve ser positivo")
    
    return True
```

#### **Linting**
```bash
# Instale ferramentas
pip install black isort flake8 mypy

# Execute
black server/
isort server/
flake8 server/
mypy server/
```

#### **Nomes**
```python
# Variáveis e funções: snake_case
minha_variavel = "valor"
def minha_funcao():
    pass

# Classes: PascalCase
class MinhaClasse:
    pass

# Constantes: UPPER_CASE
MAX_TIMEOUT = 30
```

### **JavaScript (Frontend)**

#### **Style Guide**

- **ES6+** syntax
- **camelCase** para variáveis/funções
- **PascalCase** para classes
- **UPPER_CASE** para constantes
- Use **const** e **let**, nunca **var**
```javascript
// ✅ BOM
const minhaConstante = 10;
let minhaVariavel = "valor";

function minhaFuncao() {
  return true;
}

class MinhaClasse {
  constructor() {}
}

// ❌ EVITE
var x = 10;  // Não use var
function MinhaFuncao() {}  // Funções em camelCase
```

#### **Comentários**
```javascript
/**
 * Descrição da função
 * @param {string} param1 - Descrição
 * @param {number} param2 - Descrição
 * @returns {boolean} Descrição do retorno
 */
function exemploFuncao(param1, param2) {
  // Comentário inline quando necessário
  return true;
}
```

### **CSS**
```css
/* Use BEM para nomenclatura */
.bloco {}
.bloco__elemento {}
.bloco--modificador {}

/* Organize propriedades */
.classe {
  /* Posicionamento */
  position: relative;
  top: 0;
  
  /* Box model */
  display: flex;
  width: 100px;
  padding: 10px;
  
  /* Visual */
  background: white;
  color: black;
  
  /* Texto */
  font-size: 14px;
  
  /* Outros */
  transition: all 0.3s;
}
```

---

## 📝 **Estrutura de Commits**

### **Conventional Commits**

Usamos [Conventional Commits](https://www.conventionalcommits.org/).

**Formato:**
```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[rodapé opcional]
```

### **Tipos**

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| `feat` | Nova feature | `feat(popup): adiciona modo escuro` |
| `fix` | Correção de bug | `fix(content): corrige captura no WhatsApp` |
| `docs` | Documentação | `docs(readme): atualiza guia de instalação` |
| `style` | Formatação | `style(css): ajusta espaçamento do botão` |
| `refactor` | Refatoração | `refactor(api): simplifica validação` |
| `test` | Testes | `test(server): adiciona testes unitários` |
| `chore` | Tarefas | `chore(deps): atualiza dependências` |
| `perf` | Performance | `perf(background): otimiza polling` |

### **Exemplos**
```bash
# Feature simples
git commit -m "feat: adiciona suporte para Slack"

# Bug fix com escopo
git commit -m "fix(popup): corrige contador não resetando"

# Breaking change
git commit -m "feat(api)!: muda estrutura de resposta

BREAKING CHANGE: O campo 'resumo' agora está em 'data.summary'"

# Com issue relacionada
git commit -m "fix: corrige erro de timeout

Closes #123"
```

### **Regras**

- ✅ Primeira linha: máximo 72 caracteres
- ✅ Use imperativo: "adiciona" não "adicionado"
- ✅ Primeira letra minúscula
- ✅ Sem ponto final
- ✅ Corpo e rodapé separados por linha em branco

---

## 🧪 **Testes**

### **Backend (Python)**
```bash
# Rodar todos os testes
pytest

# Com coverage
pytest --cov=server tests/

# Teste específico
pytest tests/test_ai_service.py
```

### **Frontend (Manual)**

1. Carregue extensão no Chrome
2. Abra `test/test-page.html`
3. Execute fluxo completo
4. Verifique console (sem erros)

---

## 🌍 **Traduções**

Interessado em traduzir o ChatSum?

1. Crie `extension/_locales/SEU_IDIOMA/messages.json`
2. Traduza as strings
3. Teste localmente
4. Abra PR

**Idiomas desejados:**
- 🇪🇸 Espanhol
- 🇬🇧 Inglês
- 🇫🇷 Francês
- 🇩🇪 Alemão

---

## ❓ **Dúvidas?**

- 💬 [GitHub Discussions](https://github.com/seu-usuario/chatsum-extension/discussions)
- 📧 Email: dev@seudominio.com

---

<p align="center">
  Obrigado por contribuir! 💙
</p>