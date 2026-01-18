#!/bin/bash

# Setup inicial do projeto ChatSum

set -e  # Exit on error

echo "🚀 Configurando ChatSum..."

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar Python
echo -e "${YELLOW}1. Verificando Python...${NC}"
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 não encontrado. Instale Python 3.10+"
    exit 1
fi
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
echo -e "${GREEN}✓ Python $PYTHON_VERSION${NC}"

# 2. Criar ambiente virtual
echo -e "${YELLOW}2. Criando ambiente virtual...${NC}"
cd server
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# source venv\Scripts\activate  # Windows

echo -e "${GREEN}✓ Ambiente virtual criado${NC}"

# 3. Instalar dependências
echo -e "${YELLOW}3. Instalando dependências...${NC}"
pip install --upgrade pip
pip install -r requirements-fixed.txt

echo -e "${GREEN}✓ Dependências instaladas${NC}"

# 4. Configurar .env
echo -e "${YELLOW}4. Configurando .env...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠ Arquivo .env criado. EDITE AGORA E ADICIONE GEMINI_API_KEY${NC}"
    read -p "Pressione ENTER quando .env estiver configurado..."
else
    echo -e "${GREEN}✓ .env já existe${NC}"
fi

# 5. Criar logs
echo -e "${YELLOW}5. Criando estrutura de logs...${NC}"
touch app.log

echo -e "${GREEN}✓ Logs configurados${NC}"

echo ""
echo -e "${GREEN}✅ Setup completo!${NC}"
echo ""
echo "Próximos passos:"
echo "1. Inicie o servidor: python main.py"
echo "2. Carregue a extensão no Chrome em chrome://extensions/"
echo "3. Acesse documentação em http://localhost:8000/docs"