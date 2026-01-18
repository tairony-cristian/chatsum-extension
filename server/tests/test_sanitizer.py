"""
Testes para serviço de sanitização
"""

import pytest
from services.sanitizer import DataSanitizer


def test_sanitizar_telefone():
    """Testa remoção de telefone"""
    texto = "Meu telefone é (11) 98765-4321"
    resultado = DataSanitizer.sanitize(texto)
    assert "[TELEFONE_OCULTO]" in resultado
    assert "98765" not in resultado


def test_sanitizar_cpf():
    """Testa remoção de CPF"""
    texto = "CPF: 123.456.789-00"
    resultado = DataSanitizer.sanitize(texto)
    assert "[CPF_OCULTO]" in resultado


def test_sanitizar_email():
    """Testa remoção de email"""
    texto = "Envie para teste@example.com"
    resultado = DataSanitizer.sanitize(texto)
    assert "[EMAIL_OCULTO]" in resultado


def test_contains_sensitive_data():
    """Testa detecção de dados sensíveis"""
    assert DataSanitizer.contains_sensitive_data("CPF: 123.456.789-00")
    assert not DataSanitizer.contains_sensitive_data("Texto normal sem dados")


def test_sanitizar_multiplos():
    """Testa sanitização de múltiplos dados"""
    texto = "Ligue (11) 98765-4321 ou envie para teste@example.com. CPF: 123.456.789-00"
    resultado = DataSanitizer.sanitize(texto)
    assert "[TELEFONE_OCULTO]" in resultado
    assert "[EMAIL_OCULTO]" in resultado
    assert "[CPF_OCULTO]" in resultado