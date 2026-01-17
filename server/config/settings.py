"""
Configurações do servidor - Carrega variáveis do .env
Nunca exponha dados sensíveis diretamente no código!
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from typing import List

# Carrega .env da raiz do projeto server
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')


class Settings:
    """Classe de configuração centralizada"""
    
    # API Keys (NUNCA commitar!)
    GEMINI_API_KEY: str = os.getenv('GEMINI_API_KEY', '')
    
    # Servidor
    SERVER_HOST: str = os.getenv('SERVER_HOST', '127.0.0.1')
    SERVER_PORT: int = int(os.getenv('SERVER_PORT', '8000'))
    
    # Modelos disponíveis (ordem de prioridade)
    GEMINI_MODELS: List[str] = os.getenv(
        'GEMINI_MODELS',
        'gemini-2.5-flash,gemini-2.5-pro,gemini-pro-latest'
    ).split(',')
    
    # Rate Limiting
    MAX_REQUESTS_PER_DAY: int = int(os.getenv('MAX_REQUESTS_PER_DAY', '50'))
    
    # Timeouts
    REQUEST_TIMEOUT: int = int(os.getenv('REQUEST_TIMEOUT', '30'))
    
    # Logging
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE: str = os.getenv('LOG_FILE', 'app.log')
    
    # CORS (endpoints permitidos)
    ALLOWED_ORIGINS: List[str] = [
        "chrome-extension://*",  # Extensões Chrome
        "http://localhost:8000"   # Dev local
    ]
    
    # Validações
    MIN_CHAT_LENGTH: int = 100  # Tamanho mínimo do chat
    MAX_CHAT_LENGTH: int = 50000  # Tamanho máximo (50k chars)
    
    @classmethod
    def validate(cls):
        """Valida configurações obrigatórias"""
        if not cls.GEMINI_API_KEY:
            raise ValueError(
                "❌ GEMINI_API_KEY não configurada! "
                "Edite o arquivo .env e adicione sua chave."
            )
        
        print("✅ Configurações carregadas com sucesso")
        print(f"   - Modelos: {', '.join(cls.GEMINI_MODELS)}")
        print(f"   - Rate Limit: {cls.MAX_REQUESTS_PER_DAY} req/dia")


# Instância global de configurações
settings = Settings()

# Valida na importação
settings.validate()