"""
Teste de geração de resumo real via Gemini API (Chaves AQ... e AIza...)
"""

import httpx
import pytest
from config.settings import settings


def test_gemini_resumo_real():
    """
    Gera um resumo de chat real no Gemini detectando o tipo de chave automaticamente.
    """
    api_key = settings.GEMINI_API_KEY
    assert api_key, "⚠️ GEMINI_API_KEY não foi encontrada no arquivo .env"

    base_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

    # Configura dinamicamente de acordo com o prefixo da chave
    if api_key.startswith("AQ."):
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": api_key,
        }
        params = {}
        tipo_chave = "Auth (AQ...)"
    else:
        headers = {"Content-Type": "application/json"}
        params = {"key": api_key}
        tipo_chave = "Standard (AIza...)"

    print(f"\n[TESTE] Validando chave do tipo: {tipo_chave}")

    # Histórico de chat simulado para resumo
    historico_chat = (
        "Cliente: Olá, bom dia! Estou com problemas para acessar o sistema desde hoje cedo.\n"
        "Atendente: Olá! Qual erro aparece na sua tela ao tentar o login?\n"
        "Cliente: Aparece 'Erro 500 - Conexão recusada com o banco de dados'.\n"
        "Atendente: Entendido. Reiniciei o serviço de banco no servidor central. Pode testar agora?\n"
        "Cliente: Perfeito! Consegui acessar aqui. Muito obrigado pelo atendimento rápido!"
    )

    prompt = f"Faça um resumo curto e objetivo do atendimento a seguir, destacando o problema e a solução:\n\n{historico_chat}"

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 1000
        }
    }

    # Request HTTP com timeout confortável de 30s
    with httpx.Client(timeout=30.0) as client:
        response = client.post(
            base_url,
            json=payload,
            headers=headers,
            params=params,
        )

    if response.status_code != 200:
        print(f"\n❌ Erro na API do Gemini ({response.status_code}): {response.text}")

    assert response.status_code == 200, f"Falha na API com chave {tipo_chave}: status {response.status_code}"

    data = response.json()
    assert "candidates" in data, "Resposta da API não contém a chave 'candidates'"

    # Extrai o texto gerado pela IA
    resumo_gerado = data["candidates"][0]["content"]["parts"][0]["text"]

    print("\n" + "="*50)
    print(f"📝 RESUMO GERADO PELA IA (Chave {tipo_chave}):")
    print("="*50)
    print(resumo_gerado)
    print("="*50 + "\n")

    assert len(resumo_gerado.strip()) > 0, "O resumo retornado veio vazio"