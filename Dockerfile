FROM python:3.11-slim

WORKDIR /app

# Copiar requirements
COPY server/requirements.txt .

# Instalar dependências
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY server/ .

# Porta (Railway injeta via $PORT)
EXPOSE 8000

# Usa $PORT do Railway, fallback 8000 para local
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
