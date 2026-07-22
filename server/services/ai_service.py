"""
Serviço de integração com múltiplos provedores de IA
Suporta: Google Gemini, Groq e OpenAI (GPT)
"""

import httpx
import json
import re
import time
from typing import Optional
import logging
from config.settings import settings

logger = logging.getLogger(__name__)


def _is_auth_key_gemini(api_key: str) -> bool:
    """
    Detecta o tipo de chave do Gemini.
    - Auth key (novo formato):      começa com 'AQ.'
    - Standard key (formato antigo): começa com 'AIza'

    Chaves AIza continuam válidas e não têm desligamento agendado — o que
    mudou foi apenas que o Console do Google Cloud passou a emitir novas
    chaves vinculadas a uma Service Account, gerando o prefixo AQ. As duas
    formas de autenticação (?key= vs x-goog-api-key) continuam necessárias
    porque os dois formatos de chave usam mecanismos diferentes.
    """
    return api_key.startswith("AQ.")


# ─────────────────────────────────────────────
# Helpers para parsing de erros do Gemini
# ─────────────────────────────────────────────

def _parse_retry_after(response_body: str) -> Optional[int]:
    """Extrai retry_delay em segundos da resposta 429 do Gemini."""
    try:
        data = json.loads(response_body)
        for detail in data.get("error", {}).get("details", []):
            retry_delay = detail.get("retryDelay", "")
            if retry_delay:
                match = re.search(r"(\d+)", str(retry_delay))
                if match:
                    return int(match.group(1))
    except Exception:
        pass

    match = re.search(r"retry_delay\s*\{[^}]*seconds:\s*(\d+)", response_body)
    if match:
        return int(match.group(1))

    match = re.search(r"retry in (\d+)", response_body, re.IGNORECASE)
    if match:
        return int(match.group(1)) + 1

    return None


def _is_daily_quota(response_body: str) -> bool:
    """Retorna True se o 429 for de cota DIÁRIA."""
    return "PerDay" in response_body or "per_day" in response_body.lower()


# ─────────────────────────────────────────────
# Serviço principal
# ─────────────────────────────────────────────

class AIService:
    """Gerenciador de IA com suporte a Gemini, Groq e OpenAI"""

    MAX_RETRIES_SERVER_ERROR = 3
    RETRY_DELAY_SECONDS = 5

    def __init__(self):
        self._validar_chaves()
        self.ultimo_modelo_usado = None
        self.aviso_chave_gemini = None
        logger.info("[OK] AIService inicializado com suporte a Gemini, Groq e OpenAI")

    def get_aviso_chave_gemini(self) -> Optional[str]:
        """Retorna aviso de migração de chave do Gemini (se aplicável na última chamada)."""
        return self.aviso_chave_gemini

    def _validar_chaves(self):
        """Valida que ao menos uma API key está configurada"""
        disponiveis = []
        if settings.GEMINI_API_KEY:
            disponiveis.append("Gemini")
        if settings.GROQ_API_KEY:
            disponiveis.append("Groq")
        if settings.OPENAI_API_KEY:
            disponiveis.append("OpenAI")

        if not disponiveis:
            raise ValueError(
                "Nenhuma API key configurada! "
                "Configure ao menos uma no arquivo .env:\n"
                "  GEMINI_API_KEY  -> aistudio.google.com/apikey\n"
                "  GROQ_API_KEY    -> console.groq.com/keys\n"
                "  OPENAI_API_KEY  -> platform.openai.com/api-keys"
            )
        logger.info(f"[OK] Provedores disponíveis: {', '.join(disponiveis)}")

    def generate_summary(
        self,
        texto: str,
        prompt_template: str,
        ultimo_tecnico: str = "",
        ia_provider: str = "gemini"
    ) -> Optional[str]:
        """
        Gera resumo usando o provedor solicitado.
        Se o provedor não tiver chave ou falhar, faz fallback para o próximo disponível.

        Raises:
            DailyQuotaExceededError: Limite diário atingido
            RateLimitError: Limite por minuto — inclui retry_after
            ServiceUnavailableError: Servidor indisponível após todas as tentativas
            TimeoutError: Timeout na requisição
        """
        # Interpolação segura — evita KeyError se o chat tiver { }
        prompt_personalizado = prompt_template.replace(
            "{ultimo_tecnico}", ultimo_tecnico or "o último técnico"
        )
        prompt_final = f"{prompt_personalizado}\n\n=== HISTÓRICO DO CHAT ===\n{texto}"

        ordem = self._montar_ordem_providers(ia_provider)

        ultimo_erro = None
        for provider in ordem:
            logger.info(f"[INFO] Tentando provedor: {provider}")
            try:
                resultado = self._chamar_provider(provider, prompt_final)
                if resultado:
                    self.ultimo_modelo_usado = provider
                    return resultado
            except ProviderNotConfiguredError:
                logger.warning(f"[AVISO] {provider} sem API key, pulando...")
                continue
            except (DailyQuotaExceededError, RateLimitError, ServiceUnavailableError, TimeoutError):
                # Propaga erros específicos sem tentar fallback automático
                raise
            except Exception as e:
                logger.warning(f"[AVISO] {provider} falhou: {e}, tentando próximo...")
                ultimo_erro = e
                continue

        if ultimo_erro:
            raise ultimo_erro

        raise QuotaExceededError("Todos os provedores falharam.")

    def _montar_ordem_providers(self, preferido: str) -> list:
        todos = ["gemini", "groq", "openai"]
        return [preferido] + [p for p in todos if p != preferido]

    def _chamar_provider(self, provider: str, prompt: str) -> Optional[str]:
        if provider == "gemini":
            return self._chamar_gemini(prompt)
        elif provider == "groq":
            return self._chamar_groq(prompt)
        elif provider == "openai":
            return self._chamar_openai(prompt)
        raise ValueError(f"Provider desconhecido: {provider}")

    # ── GEMINI ──────────────────────────────────

    def _chamar_gemini(self, prompt: str) -> Optional[str]:
        if not settings.GEMINI_API_KEY:
            raise ProviderNotConfiguredError("GEMINI_API_KEY não configurada")

        base_url = "https://generativelanguage.googleapis.com/v1beta"
        modelos = getattr(settings, 'GEMINI_MODELS', ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-pro-latest'])

        # ⭐ Suporte aos dois formatos de chave do Gemini:
        # - Auth key (AQ...)       -> autenticação via header x-goog-api-key
        # - Standard key (AIza...) -> autenticação via query param ?key= (formato antigo)
        chave_eh_auth = _is_auth_key_gemini(settings.GEMINI_API_KEY)

        if chave_eh_auth:
            request_headers = {
                "Content-Type": "application/json",
                "x-goog-api-key": settings.GEMINI_API_KEY,
            }
            request_params = {}
        else:
            request_headers = {"Content-Type": "application/json"}
            request_params = {"key": settings.GEMINI_API_KEY}

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.7,
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": 8192,
                "thinkingConfig": {      # ← dentro do generationConfig
                    "thinkingBudget": 0
                }
            }
        }

        for modelo in modelos:
            for tentativa in range(1, self.MAX_RETRIES_SERVER_ERROR + 1):
                try:
                    if tentativa > 1:
                        logger.warning(f"[Gemini] Tentativa {tentativa} com {modelo}")

                    url = f"{base_url}/models/{modelo}:generateContent"
                    with httpx.Client(timeout=settings.REQUEST_TIMEOUT) as client:
                        response = client.post(
                            url, json=payload,
                            headers=request_headers,
                            params=request_params
                        )

                    if response.status_code >= 400:
                        logger.error(f"[Gemini] Status {response.status_code}: {response.text[:300]}")

                    if response.status_code == 401:
                        tipo_chave = "Auth (AQ...)" if chave_eh_auth else "Standard (AIza...)"
                        raise ProviderNotConfiguredError(
                            f"Gemini rejeitou a chave configurada (tipo detectado: {tipo_chave}). "
                            "Verifique se a GEMINI_API_KEY é válida e não expirou/foi revogada."
                        )

                    if response.status_code == 429:
                        body = response.text
                        retry_after = _parse_retry_after(body)
                        if _is_daily_quota(body):
                            raise DailyQuotaExceededError("Limite diário de requisições atingido.")
                        raise RateLimitError("Muitas requisições por minuto.", retry_after=retry_after)

                    if response.status_code in (502, 503):
                        if tentativa < self.MAX_RETRIES_SERVER_ERROR:
                            time.sleep(self.RETRY_DELAY_SECONDS)
                            continue
                        raise ServiceUnavailableError("Servidor Gemini indisponível.")

                    if response.status_code == 404:
                        logger.warning(f"[Gemini] Modelo {modelo} não encontrado, tentando próximo")
                        break  # próximo modelo

                    response.raise_for_status()
                    data = response.json()

                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        response_parts = [
                            p["text"] for p in parts
                            if "text" in p and not p.get("thought", False)
                        ]
                        texto = " ".join(response_parts).strip()
                        if texto:
                            logger.info(f"[Gemini] OK com {modelo}")
                            return texto

                except (DailyQuotaExceededError, RateLimitError, ServiceUnavailableError, ProviderNotConfiguredError):
                    raise
                except httpx.TimeoutException:
                    if tentativa == self.MAX_RETRIES_SERVER_ERROR:
                        raise TimeoutError("Timeout ao chamar API do Gemini.")
                    time.sleep(self.RETRY_DELAY_SECONDS)
                except Exception as e:
                    logger.error(f"[Gemini] Erro: {e}")
                    raise

        return None

    # ── GROQ ────────────────────────────────────

    def _chamar_groq(self, prompt: str) -> Optional[str]:
        if not settings.GROQ_API_KEY:
            raise ProviderNotConfiguredError("GROQ_API_KEY não configurada")

        url = "https://api.groq.com/openai/v1/chat/completions"
        # ⭐ ATUALIZAÇÃO (jul/2026): llama-3.3-70b-versatile foi descontinuado pela Groq
        # e será decomissionado em 16/08/2026. Substituído pelos modelos recomendados
        # no aviso oficial da Groq: GPT OSS 120B e Qwen3.6 27B.
        # llama-3.1-8b-instant mantido como fallback rápido/barato (ainda em produção).
        modelos = ["openai/gpt-oss-120b", "qwen/qwen3.6-27b", "llama-3.1-8b-instant"]

        for modelo in modelos:
            for tentativa in range(1, self.MAX_RETRIES_SERVER_ERROR + 1):
                try:
                    payload = {
                        "model": modelo,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.7,
                        "max_tokens": 4096,
                    }
                    with httpx.Client(timeout=settings.REQUEST_TIMEOUT) as client:
                        response = client.post(
                            url, json=payload,
                            headers={
                                "Content-Type": "application/json",
                                "Authorization": f"Bearer {settings.GROQ_API_KEY}"
                            }
                        )

                    if response.status_code == 429:
                        retry_after = int(response.headers.get("retry-after", 60))
                        raise RateLimitError("Groq: muitas requisições.", retry_after=retry_after)

                    if response.status_code in (400, 404):
                        logger.warning(f"[Groq] Modelo {modelo} indisponível ({response.status_code})")
                        break

                    if response.status_code in (502, 503):
                        if tentativa < self.MAX_RETRIES_SERVER_ERROR:
                            time.sleep(self.RETRY_DELAY_SECONDS)
                            continue
                        raise ServiceUnavailableError("Servidor Groq indisponível.")

                    response.raise_for_status()
                    texto = self._extrair_openai_format(response.json())
                    if texto:
                        logger.info(f"[Groq] OK com {modelo}")
                        return texto

                except (RateLimitError, ServiceUnavailableError):
                    raise
                except httpx.TimeoutException:
                    if tentativa == self.MAX_RETRIES_SERVER_ERROR:
                        raise TimeoutError("Timeout ao chamar API do Groq.")
                    time.sleep(self.RETRY_DELAY_SECONDS)
                except Exception as e:
                    logger.error(f"[Groq] Erro: {e}")
                    raise

        return None

    # ── OPENAI ──────────────────────────────────

    def _chamar_openai(self, prompt: str) -> Optional[str]:
        if not settings.OPENAI_API_KEY:
            raise ProviderNotConfiguredError("OPENAI_API_KEY não configurada")

        url = "https://api.openai.com/v1/chat/completions"
        modelos = ["gpt-4o-mini", "gpt-3.5-turbo"]

        for modelo in modelos:
            for tentativa in range(1, self.MAX_RETRIES_SERVER_ERROR + 1):
                try:
                    payload = {
                        "model": modelo,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.7,
                        "max_tokens": 4096,
                    }
                    with httpx.Client(timeout=settings.REQUEST_TIMEOUT) as client:
                        response = client.post(
                            url, json=payload,
                            headers={
                                "Content-Type": "application/json",
                                "Authorization": f"Bearer {settings.OPENAI_API_KEY}"
                            }
                        )

                    if response.status_code == 429:
                        retry_after = int(response.headers.get("retry-after", 60))
                        raise RateLimitError("OpenAI: muitas requisições.", retry_after=retry_after)

                    if response.status_code in (400, 404):
                        logger.warning(f"[OpenAI] Modelo {modelo} indisponível ({response.status_code})")
                        break

                    if response.status_code in (502, 503):
                        if tentativa < self.MAX_RETRIES_SERVER_ERROR:
                            time.sleep(self.RETRY_DELAY_SECONDS)
                            continue
                        raise ServiceUnavailableError("Servidor OpenAI indisponível.")

                    response.raise_for_status()
                    texto = self._extrair_openai_format(response.json())
                    if texto:
                        logger.info(f"[OpenAI] OK com {modelo}")
                        return texto

                except (RateLimitError, ServiceUnavailableError):
                    raise
                except httpx.TimeoutException:
                    if tentativa == self.MAX_RETRIES_SERVER_ERROR:
                        raise TimeoutError("Timeout ao chamar API da OpenAI.")
                    time.sleep(self.RETRY_DELAY_SECONDS)
                except Exception as e:
                    logger.error(f"[OpenAI] Erro: {e}")
                    raise

        return None

    def _extrair_openai_format(self, data: dict) -> Optional[str]:
        choices = data.get("choices", [])
        if choices:
            return choices[0].get("message", {}).get("content", "").strip() or None
        return None

    def get_model_name(self) -> str:
        return self.ultimo_modelo_usado or "nenhum"


# ─────────────────────────────────────────────
# Exceções personalizadas
# ─────────────────────────────────────────────

class DailyQuotaExceededError(Exception):
    """Limite DIÁRIO da API atingido"""
    pass


class RateLimitError(Exception):
    """Limite por MINUTO atingido. retry_after: segundos para aguardar."""
    def __init__(self, message: str, retry_after: Optional[int] = None):
        super().__init__(message)
        self.retry_after = retry_after


class ServiceUnavailableError(Exception):
    """Servidor indisponível após todas as tentativas"""
    pass


class ProviderNotConfiguredError(Exception):
    """Provedor sem API key configurada"""
    pass


# Mantido para compatibilidade com imports existentes
class QuotaExceededError(Exception):
    pass