"""
Testes para serviço de IA
"""

import pytest
from services.ai_service import AIService
from prompts.prompt_manager import PromptManager


@pytest.fixture
def ai_service():
    """Fixture para AIService"""
    return AIService()


def test_ai_service_init(ai_service):
    """Testa inicialização do serviço"""
    assert ai_service.api_key
    assert ai_service.model_name in ai_service.modelos


def test_get_model_name(ai_service):
    """Testa obtenção do nome do modelo"""
    modelo = ai_service.get_model_name()
    assert isinstance(modelo, str)
    assert len(modelo) > 0


@pytest.mark.skip(reason="Requer API key válida")
def test_generate_summary(ai_service):
    """Testa geração de resumo (requer API)"""
    texto = "Cliente: Olá, tenho problema. " * 20
    prompt = PromptManager.get_default_prompt()
    
    resultado = ai_service.generate_summary(
        texto=texto,
        prompt_template=prompt,
        ultimo_tecnico="João"
    )
    
    assert resultado is not None
    assert len(resultado) > 0
    assert "PROBLEMA" in resultado.upper()