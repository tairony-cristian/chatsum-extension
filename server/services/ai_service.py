"""
Serviço de integração com Google Gemini AI
Usa apenas Google SDK para máxima compatibilidade
"""

import logging
from typing import Optional
from config.settings import settings
from datetime import datetime

logger = logging.getLogger(__name__)

try:
    from google import generativeai as genai
except ImportError:
    raise ImportError("google-generativeai não instalado: pip install google-generativeai")


class AIService:
    """Gerenciador de serviços de IA via Google SDK"""
    
    def __init__(self):
        """Inicializa serviço e configura API"""
        self.api_key = settings.GEMINI_API_KEY
        
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY não configurada")
        
        try:
            genai.configure(api_key=self.api_key)
            self.model_name = "gemini-2.5-flash"
            logger.warning("[OK] Google SDK inicializado")
        except Exception as e:
            logger.critical(f"[ERRO] Falha ao inicializar Google SDK: {e}")
            raise

    def _interpolar_prompt(self, prompt_template: str, ultimo_tecnico: str = "") -> str:
        """Interpola variáveis no prompt de forma segura"""
        resultado = prompt_template.replace(
            '{ultimo_tecnico}',
            ultimo_tecnico or "o último técnico"
        ).replace(
            '{data}',
            datetime.now().strftime("%d/%m/%Y")
        ).replace(
            '{hora}',
            datetime.now().strftime("%H:%M")
        )
        return resultado

    def generate_summary(
        self,
        texto: str,
        prompt_template: str,
        ultimo_tecnico: str = "",
        max_retries: int = 3
    ) -> Optional[str]:
        """
        Gera resumo usando IA
        
        Args:
            texto: Conversa a resumir
            prompt_template: Template do prompt
            ultimo_tecnico: Nome do último técnico
            max_retries: Tentativas em caso de erro
            
        Returns:
            Resumo gerado ou None em caso de erro
            
        Raises:
            QuotaExceededError: Se limite da API foi atingido
        """
        
        prompt_personalizado = self._interpolar_prompt(
            prompt_template,
            ultimo_tecnico=ultimo_tecnico
        )
        prompt_final = f"{prompt_personalizado}\n\n=== HISTORICO DO CHAT ===\n{texto}"
        
        for tentativa in range(1, max_retries + 1):
            try:
                logger.info(f"[INFO] Tentativa {tentativa}/{max_retries}")
                
                model = genai.GenerativeModel(self.model_name)
                response = model.generate_content(prompt_final)
                
                if response.text:
                    logger.warning(f"[OK] Resumo gerado com sucesso")
                    return response.text
                else:
                    logger.warning("[AVISO] Resposta vazia do modelo")
                    
            except Exception as e:
                error_msg = str(e)
                logger.warning(f"[AVISO] Tentativa {tentativa}: {error_msg}")
                
                if tentativa == max_retries:
                    if "429" in error_msg or "quota" in error_msg.lower():
                        raise QuotaExceededError(
                            "Limite de quota atingido. Aguarde alguns minutos e tente novamente."
                        )
                    else:
                        raise QuotaExceededError(
                            f"Erro ao gerar resumo: {error_msg}"
                        )
        
        return None

    def get_model_name(self) -> str:
        """Retorna nome do modelo atual"""
        return self.model_name


class QuotaExceededError(Exception):
    """Limite de quota da API foi excedido ou erro na geração"""
    pass