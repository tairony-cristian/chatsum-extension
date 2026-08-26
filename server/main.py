"""
ChatSum API - Servidor de Resumos de Atendimento
FastAPI backend para geração de resumos usando IA
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
import logging
from typing import Optional
import sys
import os
import re
from contextlib import asynccontextmanager

# Importações locais
from config.settings import settings
from models.schemas import (
    ResumoRequest,
    ResumoResponse,
    ErrorResponse,
    HealthResponse
)
from services.ai_service import (
    AIService,
    QuotaExceededError,
    DailyQuotaExceededError,
    RateLimitError,
    ServiceUnavailableError,
    ProviderNotConfiguredError,
)
from services.sanitizer import DataSanitizer
from prompts.prompt_manager import PromptManager

def filtrar_por_tecnico(texto: str, ultimo_tecnico: str, todos_tecnicos: list[str]) -> str:
    """Remove deterministicamente blocos de mensagem de técnicos que não sejam o último."""
    if not ultimo_tecnico or not todos_tecnicos:
        return texto  # sem dados suficientes, não filtra (fallback seguro)

    outros = {
        t.strip().lower() for t in todos_tecnicos
        if t.strip().lower() != ultimo_tecnico.strip().lower()
    }
    if not outros:
        return texto

    # cada bloco começa com "[hora] Autor:\n" (formato gerado pelo content.js)
    blocos = re.split(r'(?=\[\d{1,2}:\d{2}\] )', texto)
    mantidos = []
    for b in blocos:
        if not b.strip():
            continue
        try:
            autor = b.split('] ', 1)[1].split(':\n', 1)[0].strip().lower()
        except IndexError:
            mantidos.append(b)  # não conseguiu parsear, mantém por segurança
            continue
        if autor not in outros:
            mantidos.append(b)

    return "\n\n".join(mantidos).strip()

# ============================================
# CONFIGURAÇÃO DE ENCODING (Windows Fix)
# ============================================

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', line_buffering=True)

# ============================================
# CONFIGURAÇÃO DE LOGGING
# ============================================

file_handler = logging.FileHandler(settings.LOG_FILE, encoding='utf-8')
stream_handler = logging.StreamHandler(sys.stdout)
stream_handler.setLevel(getattr(logging, settings.LOG_LEVEL))
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
stream_handler.setFormatter(formatter)
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    handlers=[file_handler, stream_handler]
)
logger = logging.getLogger(__name__)

# ============================================
# INICIALIZAÇÃO DO SERVIÇO DE IA (UMA VEZ!)
# ============================================

try:
    ai_service = AIService()
    logger.info("🚀 Serviço de IA inicializado com sucesso")
except Exception as e:
    logger.critical(f"❌ Falha crítica ao inicializar IA: {e}")
    raise

# Cache do último resumo gerado
ultimo_resumo_cache: Optional[dict] = None

# ============================================
# LIFESPAN (Startup/Shutdown)
# ============================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 60)
    logger.info("🚀 ChatSum API v2.0.0 - Iniciando...")
    logger.info(f"📡 Servidor: {settings.SERVER_HOST}:{settings.SERVER_PORT}")
    logger.info(f"🤖 Provedores: Gemini / Groq / OpenAI")
    logger.info(f"📊 Rate Limit: {settings.MAX_REQUESTS_PER_DAY} req/dia")
    logger.info("=" * 60)
    yield
    logger.info("👋 ChatSum API - Encerrando...")

# ============================================
# INICIALIZAÇÃO DO FASTAPI
# ============================================

app = FastAPI(
    title="ChatSum API",
    description="API para geração de resumos de atendimentos usando IA",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# ============================================
# MIDDLEWARE CORS
# ============================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # Extensões Chrome e Railway precisam de acesso irrestrito
    allow_credentials=False,  # Deve ser False quando allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# ENDPOINTS
# ============================================

@app.get("/", response_model=dict)
async def root():
    return {
        "nome": "ChatSum API",
        "versao": "2.0.0",
        "status": "online",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="ok", modelo=ai_service.get_model_name())


@app.get("/resumidor/providers", response_model=dict)
async def listar_providers():
    """Retorna quais provedores de IA estao com API key configurada."""
    return {
        "gemini": bool(settings.GEMINI_API_KEY),
        "groq":   bool(settings.GROQ_API_KEY),
        "openai": bool(settings.OPENAI_API_KEY),
    }


@app.post(
    "/resumidor/resumir",
    response_model=ResumoResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Dados inválidos"},
        429: {"model": ErrorResponse, "description": "Limite de quota excedido"},
        500: {"model": ErrorResponse, "description": "Erro interno"}
    }
)
async def gerar_resumo(request: ResumoRequest):
    """
    Gera resumo do atendimento usando IA.

    Em caso de limite por minuto (RPM), a resposta 429 inclui:
      - Header  Retry-After: <segundos>
      - Body    { "detail": "...", "retry_after": <segundos>, "quota_type": "per_minute" }

    Em caso de limite diário, o body traz quota_type: "daily".
    """
    global ultimo_resumo_cache

    ia_provider = request.iaProvider
    logger.warning(f"📥 Nova requisição (modo: {request.modo} | IA: {ia_provider})")

    try:
        # 1. Sanitiza dados sensíveis
        texto_limpo = DataSanitizer.sanitize(request.texto)
        if DataSanitizer.contains_sensitive_data(request.texto):
            logger.warning("⚠️ Dados sensíveis foram sanitizados")

        # 1.5 Pré-filtra por técnico (apenas modo ultimo_tecnico)
        if request.modo == "ultimo_tecnico":
            texto_antes = len(texto_limpo)
            texto_limpo = filtrar_por_tecnico(texto_limpo, request.ultimoTecnico, request.todosTecnicos)
            if len(texto_limpo) != texto_antes:
                logger.info(f"🔍 Filtro por técnico aplicado: {texto_antes} → {len(texto_limpo)} chars")

        # 2. Valida tamanho
        if len(texto_limpo) < settings.MIN_CHAT_LENGTH:
            raise HTTPException(
                status_code=400,
                detail=f"Chat muito curto. Mínimo: {settings.MIN_CHAT_LENGTH} caracteres"
            )
        if len(texto_limpo) > settings.MAX_CHAT_LENGTH:
            raise HTTPException(
                status_code=400,
                detail=f"Chat muito longo. Máximo: {settings.MAX_CHAT_LENGTH} caracteres"
            )

        # 3. Seleciona prompt
        if request.promptCustom:
            valido, erro = PromptManager.validate_custom_prompt(request.promptCustom)
            if not valido:
                raise HTTPException(status_code=400, detail=f"Prompt inválido: {erro}")
            prompt_template = request.promptCustom
            logger.info("📝 Usando prompt personalizado")
        else:
            prompt_template = PromptManager.get_prompt_for_mode(request.modo)
            logger.warning(f"📝 Usando prompt padrão (modo: {request.modo})")

        # 4. Gera resumo com IA
        logger.warning(f"🤖 Gerando resumo ({len(texto_limpo)} chars) via {ia_provider}...")

        try:
            resumo = ai_service.generate_summary(
                texto=texto_limpo,
                prompt_template=prompt_template,
                ultimo_tecnico=request.ultimoTecnico,
                ia_provider=ia_provider
            )
            if not resumo:
                raise HTTPException(status_code=500, detail="IA retornou resumo vazio")

        except DailyQuotaExceededError:
            logger.warning(f"❌ Quota DIÁRIA excedida ({ia_provider})")
            return JSONResponse(
                status_code=429,
                content={
                    "detail": (
                        "Limite diário de requisições atingido. "
                        "Tente outro provedor de IA ou aguarde a renovação à meia-noite."
                    ),
                    "quota_type": "daily",
                    "retry_after": None,
                    "timestamp": datetime.now().isoformat(),
                }
            )

        except RateLimitError as e:
            retry_after = e.retry_after or 60
            logger.warning(f"❌ Limite por MINUTO ({ia_provider}). Retry em {retry_after}s")
            return JSONResponse(
                status_code=429,
                headers={"Retry-After": str(retry_after)},
                content={
                    "detail": (
                        f"Muitas requisições por minuto. "
                        f"Aguarde {retry_after} segundo(s) antes de tentar novamente."
                    ),
                    "quota_type": "per_minute",
                    "retry_after": retry_after,
                    "timestamp": datetime.now().isoformat(),
                }
            )

        except ProviderNotConfiguredError as e:
            logger.error(f"❌ Provider não configurado: {e}")
            raise HTTPException(
                status_code=400,
                detail=str(e)
            )

        except QuotaExceededError:
            logger.error("❌ Todos os modelos falharam")
            raise HTTPException(
                status_code=429,
                detail="Serviço temporariamente indisponível. Tente novamente em alguns minutos."
            )

        except ServiceUnavailableError as e:
            logger.error(f"❌ Servidor indisponível: {e}")
            raise HTTPException(
                status_code=503,
                detail=str(e)
            )

        except TimeoutError:
            logger.error("❌ Timeout ao gerar resumo")
            raise HTTPException(status_code=504, detail="Timeout ao gerar resumo. Tente novamente.")

        # 5. Prepara resposta
        timestamp_atual = datetime.now().isoformat()
        resposta = ResumoResponse(
            resumo=resumo,
            timestamp=timestamp_atual,
            ultimoTecnico=request.ultimoTecnico,
            modo=request.modo,
            iaUsada=ai_service.get_model_name() or ia_provider,
            iaSolicitada=ia_provider,
            avisoChaveGemini=ai_service.get_aviso_chave_gemini()
        )

        # 6. Armazena em cache
        ultimo_resumo_cache = resposta.model_dump()
        logger.info(f"✅ Resumo gerado com sucesso ({len(resumo)} chars) via {ai_service.get_model_name()}")
        return resposta

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"❌ Erro inesperado: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno ao processar resumo: {str(e)}"
        )


@app.get(
    "/resumidor/ultimo-resumo",
    response_model=ResumoResponse,
    responses={404: {"model": ErrorResponse, "description": "Nenhum resumo disponível"}}
)
async def obter_ultimo_resumo():
    if not ultimo_resumo_cache:
        raise HTTPException(status_code=404, detail="Nenhum resumo disponível")
    logger.warning("📤 Último resumo recuperado do cache")
    return ResumoResponse(**ultimo_resumo_cache)


@app.get("/resumidor/prompt-default", response_model=dict)
async def obter_prompt_default():
    prompt = PromptManager.get_default_prompt()
    return {"prompt": prompt, "tipo": "default", "timestamp": datetime.now().isoformat()}


@app.get("/resumidor/prompt-completo", response_model=dict)
async def obter_prompt_completo():
    prompt = PromptManager.get_prompt_completo()
    return {"prompt": prompt, "tipo": "completo", "timestamp": datetime.now().isoformat()}


@app.post("/resumidor/validar-prompt", response_model=dict)
async def validar_prompt_custom(request: Request):
    body = await request.json()
    prompt = body.get("prompt", "")
    valido, erro = PromptManager.validate_custom_prompt(prompt)
    return {"valido": valido, "erro": erro, "tamanho": len(prompt) if prompt else 0}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"❌ Exceção não tratada: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Erro interno do servidor",
            "detail": str(exc) if settings.LOG_LEVEL == "DEBUG" else "Erro inesperado",
            "timestamp": datetime.now().isoformat()
        }
    )

# ============================================
# EXECUÇÃO
# ============================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.SERVER_HOST,
        port=settings.SERVER_PORT,
        log_level=settings.LOG_LEVEL.lower(),
        reload=False,
        access_log=True
    )