"""
Testes para API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_root():
    """Testa endpoint raiz"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["nome"] == "ChatSum API"


def test_health():
    """Testa health check"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_resumir_valido():
    """Testa geração de resumo com dados válidos"""
    payload = {
        "texto": "Cliente: Olá, tenho um problema. " * 20,  # 100+ chars
        "ultimoTecnico": "João Silva",
        "modo": "ultimo_tecnico"
    }
    response = client.post("/resumidor/resumir", json=payload)
    # Esperado: 200 OK (se API configurada)
    # ou 403 (sem API key)
    assert response.status_code in [200, 403, 429]


def test_resumir_chat_curto():
    """Testa rejeição de chat muito curto"""
    payload = {
        "texto": "Curto",
        "modo": "ultimo_tecnico"
    }
    response = client.post("/resumidor/resumir", json=payload)
    assert response.status_code == 422  # Validação Pydantic


def test_validar_prompt():
    """Testa validação de prompt customizado"""
    payload = {
        "prompt": "Um prompt de exemplo válido " * 5
    }
    response = client.post("/resumidor/validar-prompt", json=payload)
    assert response.status_code == 200