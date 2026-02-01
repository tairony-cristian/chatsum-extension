"""
ChatSum API - Servidor de Resumos de Atendimento
FastAPI backend para geração de resumos usando IA

🚀 DEPLOYMENT NOTES:
───────────────────
Este arquivo foi otimizado para funcionar tanto localmente quanto no Railway.

MODO LOCAL (Desenvolvimento):
- Log Level: WARNING (economiza espaço)
- Porta: 8000 (padrão)
- Host: 127.0.0.1
- Comando: python main.py

MODO RAILWAY (Produção):
- Log Level: WARNING (configurado no .env)
- Porta: Lida de PORT do Procfile/ambiente
- Host: 0.0.0.0 (Railway exige)
- CORS: Habilitado para chrome-extension://
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
import logging
from typing import Optional
import sys
import os
from contextlib import asynccontextmanager

# Importações locais
from config.settings import settings
from models.schemas import (
    ResumoRequest, 
    ResumoResponse, 
    ErrorResponse, 
    HealthResponse
)
from services.ai_service import AIService, QuotaExceededError
from services.sanitizer import DataSanitizer
from prompts.prompt_manager import PromptManager

# ============================================
# CONFIGURAÇÃO DE ENCODING (Windows Fix)
# ============================================

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'
    import io
    
    # Configura stdout e stderr
    sys.stdout = io.TextIOWrapper(
        sys.stdout.buffer, 
        encoding='utf-8',
        line_buffering=True
    )
    sys.stderr = io.TextIOWrapper(
        sys.stderr.buffer, 
        encoding='utf-8',
        line_buffering=True
    )

# ============================================
# CONFIGURAÇÃO DE LOGGING
# ============================================

#  LOG LEVEL OTIMIZADO:
file_handler = logging.FileHandler(
    settings.LOG_FILE,
    encoding='utf-8'
)

# Cria handler para console com encoding UTF-8
stream_handler = logging.StreamHandler(sys.stdout)
stream_handler.setLevel(getattr(logging, settings.LOG_LEVEL))

# Configura formatação
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
file_handler.setFormatter(formatter)
stream_handler.setFormatter(formatter)

# Configura logger root
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    handlers=[file_handler, stream_handler]
)
logger = logging.getLogger(__name__)

# ============================================
# INICIALIZAÇÃO DO SERVIÇO DE IA
# ============================================

try:
    ai_service = AIService()
    logger.warning(f"✓ Serviço de IA inicializado com sucesso")
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
    """Gerencia startup e shutdown da aplicação"""
    # STARTUP
    logger.warning("=" * 60)
    logger.warning("🚀 ChatSum API v2.0.0 - Iniciando...")
    logger.warning(f"🔡 Servidor: {settings.SERVER_HOST}:{settings.SERVER_PORT}")
    logger.warning(f"🤖 Modelo IA: {ai_service.get_model_name()}")
    logger.warning(f"📊 Rate Limit: {settings.MAX_REQUESTS_PER_DAY} req/dia")
    logger.warning("=" * 60)
    
    yield  # Aplicação roda aqui
    
    # SHUTDOWN
    logger.warning("👋 ChatSum API - Encerrando...")

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

# ⚠️ IMPORTANTE: CORS configurado apenas para extension Chrome
# Não adicione localhost:3000 ou outros URLs de desenvolvimento aqui
# Use modoDesenvolvedor no popup para testar localmente

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# ENDPOINTS
# ============================================

@app.get("/", response_model=dict)
async def root():
    """Endpoint raiz - Informações da API"""
    return {
        "nome": "ChatSum API",
        "versao": "2.0.0",
        "status": "online",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Verifica saúde do serviço
    
    Returns:
        Status do servidor e modelo em uso
    """
    return HealthResponse(
        status="ok",
        modelo=ai_service.get_model_name()
    )


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
    Gera resumo do atendimento usando IA
    
    Args:
        request: Dados do chat e configurações
        
    Returns:
        Resumo gerado pela IA
        
    Raises:
        HTTPException: Em caso de erro de validação ou processamento
    """
    global ultimo_resumo_cache
    
    logger.warning(f"📥 Nova requisição de resumo (modo: {request.modo})")
    
    try:
        # 1. Sanitiza dados sensíveis
        texto_limpo = DataSanitizer.sanitize(request.texto)
        
        if DataSanitizer.contains_sensitive_data(request.texto):
            logger.warning("⚠️ Dados sensíveis foram sanitizados")
        
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
            # Valida prompt customizado
            valido, erro = PromptManager.validate_custom_prompt(request.promptCustom)
            if not valido:
                raise HTTPException(status_code=400, detail=f"Prompt inválido: {erro}")
            
            prompt_template = request.promptCustom
            logger.warning("📝 Usando prompt personalizado")
        else:
            # Usa prompt baseado no modo
            prompt_template = PromptManager.get_prompt_for_mode(request.modo)
            logger.warning(f"📝 Usando prompt padrão (modo: {request.modo})")
        
        # 4. Gera resumo com IA
        logger.warning(f"🤖 Gerando resumo ({len(texto_limpo)} chars)...")
        
        try:
            resumo = ai_service.generate_summary(
                texto=texto_limpo,
                prompt_template=prompt_template,
                ultimo_tecnico=request.ultimoTecnico
            )
            
            if not resumo:
                raise HTTPException(
                    status_code=500,
                    detail="IA retornou resumo vazio"
                )
            
        except QuotaExceededError:
            logger.warning("❌ Quota da API excedida")
            raise HTTPException(
                status_code=429,
                detail="Limite diário da API atingido. Tente novamente amanhã ou faça upgrade do plano."
            )
        
        except TimeoutError:
            logger.warning("❌ Timeout ao gerar resumo")
            raise HTTPException(
                status_code=504,
                detail="Timeout ao gerar resumo. Tente novamente."
            )
        
        # 5. Prepara resposta
        timestamp_atual = datetime.now().isoformat()
        
        resposta = ResumoResponse(
            resumo=resumo,
            timestamp=timestamp_atual,
            ultimoTecnico=request.ultimoTecnico,
            modo=request.modo
        )
        
        # 6. Armazena em cache
        ultimo_resumo_cache = resposta.model_dump()
        
        logger.warning(f"✅ Resumo gerado com sucesso ({len(resumo)} chars)")
        
        return resposta
        
    except HTTPException:
        raise
        
    except Exception as e:
        logger.warning(f"✅ Erro inesperado: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno ao processar resumo: {str(e)}"
        )


@app.get(
    "/resumidor/ultimo-resumo",
    response_model=ResumoResponse,
    responses={
        404: {"model": ErrorResponse, "description": "Nenhum resumo disponível"}
    }
)
async def obter_ultimo_resumo():
    """
    Recupera o último resumo gerado
    
    Returns:
        Último resumo do cache
        
    Raises:
        HTTPException: Se não há resumo disponível
    """
    if not ultimo_resumo_cache:
        raise HTTPException(
            status_code=404,
            detail="Nenhum resumo disponível"
        )
    
    logger.warning("📤 Último resumo recuperado do cache")
    return ResumoResponse(**ultimo_resumo_cache)


@app.get("/resumidor/prompt-default", response_model=dict)
async def obter_prompt_default():
    """Retorna o prompt padrão do sistema"""
    prompt = PromptManager.get_default_prompt()
    
    return {
        "prompt": prompt,
        "tipo": "default",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/resumidor/prompt-completo", response_model=dict)
async def obter_prompt_completo():
    """Retorna o prompt para modo completo"""
    prompt = PromptManager.get_prompt_completo()
    
    return {
        "prompt": prompt,
        "tipo": "completo",
        "timestamp": datetime.now().isoformat()
    }


@app.post("/resumidor/validar-prompt", response_model=dict)
async def validar_prompt_custom(request: Request):
    """Valida um prompt personalizado"""
    body = await request.json()
    prompt = body.get("prompt", "")
    
    valido, erro = PromptManager.validate_custom_prompt(prompt)
    
    return {
        "valido": valido,
        "erro": erro,
        "tamanho": len(prompt) if prompt else 0
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handler global de exceções não tratadas"""
    logger.warning(f"❌ Exceção não tratada: {exc}")
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Erro interno do servidor",
            "detail": str(exc) if settings.LOG_LEVEL == "DEBUG" else "Erro inesperado",
            "timestamp": datetime.now().isoformat()
        }
    )

# ============================================
# EXECUÇÃO (DESENVOLVIMENTO LOCAL)
# ============================================

#  PARA DESENVOLVIMENTO LOCAL:
#
# Se desejar rodar este arquivo diretamente:
#   python main.py
#
# O servidor iniciará em http://localhost:8000
#
#  PARA PRODUCTION (RAILWAY):
#
# O Railway usa o Procfile que contém:
#   web: uvicorn main:app --host 0.0.0.0 --port $PORT
#
# Não execute diretamente em production!

if __name__ == "__main__":
    import uvicorn
    
    #  DESENVOLVIMENTO APENAS
    # Para production, use o comando no Procfile
    
    uvicorn.run(
        app,
        host=settings.SERVER_HOST,
        port=settings.SERVER_PORT,
        log_level=settings.LOG_LEVEL.lower(),
        reload=False,
        access_log=False  # 🎯 Desabilitado para economizar logs
    )