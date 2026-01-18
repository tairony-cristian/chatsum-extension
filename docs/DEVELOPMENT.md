# 🛠️ Guia de Desenvolvimento

## Ambiente Local

### Setup Inicial
```bash
# Backend
cd server
cp .env.example .env
# Edite .env e adicione GEMINI_API_KEY
pip install -r requirements-fixed.txt
python main.py

# Frontend
# Abra Chrome
# Acesse chrome://extensions/
# Ative "Modo de desenvolvedor"
# Clique "Carregar extensão sem empacotamento"
# Selecione pasta extension/
```

### Estrutura de Pastas
- `extension/` - Código da extensão Chrome
- `server/` - API FastAPI
- `docs/` - Documentação
- `tests/` - Testes

### Arquitetura
[Ver ARCHITECTURE.md]

### Stack Tecnológico
- **Frontend:** JavaScript (Vanilla), Chrome Extension API, CSS3
- **Backend:** FastAPI, Python 3.10+
- **IA:** Google Gemini 2.5 Flash
- **Storage:** Chrome Storage API, Memória

## Desenvolvimento

### Adicionar Nova Feature
1. Criar branch: git checkout -b feature/nome
2. Implementar mudanças
3. Adicionar testes
4. Submeter PR

### Debugging
- **Extension:** DevTools em chrome://extensions/
- **Backend:** Logs em app.log
- **API:** Swagger em http://localhost:8000/docs

## Testing
```bash
pytest tests/ -v
```

## Deployment
Ver scripts/ (build.sh, deploy.sh)