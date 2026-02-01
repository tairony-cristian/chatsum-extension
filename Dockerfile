FROM python:3.11-slim

WORKDIR /app

# Copiar requirements
COPY server/requirements.txt .

# Instalar dependências
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY server/ .

# Expor porta
EXPOSE 8000

# Comando para iniciar
CMD ["python", "main.py"]