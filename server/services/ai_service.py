"""
Serviço de integração com Google Gemini AI - Versão HTTP Direta
"""

import httpx
from typing import Optional
import logging
from config.settings import settings

logger = logging.getLogger(__name__)


class AIService:
    """Gerenciador de serviços de IA via HTTP direto"""
    
    def __init__(self):
        """Inicializa serviço e configura API"""
        self.api_key = settings.GEMINI_API_KEY
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"
        
        # Lista de modelos em ordem de prioridade
        self.modelos = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-pro-latest"]
        self.model_name = self.modelos[0]  # Usa o primeiro como padrão
        
        logger.info(f"[OK] Modelo configurado: {self.model_name}")
    
    def generate_summary(
        self,
        texto: str,
        prompt_template: str,
        ultimo_tecnico: str = "",
        max_retries: int = 3
    ) -> Optional[str]:
        """
        Gera resumo usando IA via API HTTP direta.
        Tenta múltiplos modelos se o primeiro falhar.
        
        Args:
            texto: Conversa a resumir
            prompt_template: Template do prompt
            ultimo_tecnico: Nome do último técnico
            max_retries: Tentativas em caso de erro
            
        Returns:
            Resumo gerado ou None em caso de erro
            
        Raises:
            QuotaExceededError: Se limite da API foi atingido
            TimeoutError: Se exceder timeout
        """
        # Formata prompt final
        prompt_personalizado = prompt_template.format(
            ultimo_tecnico=ultimo_tecnico or "o último técnico"
        )
        prompt_final = f"{prompt_personalizado}\n\n=== HISTÓRICO DO CHAT ===\n{texto}"
        
        # Tenta cada modelo na lista
        for modelo in self.modelos:
            logger.info(f"[INFO] Tentando modelo: {modelo}")
            
            for tentativa in range(1, max_retries + 1):
                try:
                    logger.info(f"[INFO] Tentativa {tentativa}/{max_retries} com {modelo}")
                    
                    # URL da API Gemini
                    url = f"{self.base_url}/models/{modelo}:generateContent"
                    
                    # Payload
                    payload = {
                        "contents": [{
                            "parts": [{"text": prompt_final}]
                        }],
                        "generationConfig": {
                            "temperature": 0.7,
                            "topK": 40,
                            "topP": 0.95,
                            "maxOutputTokens": 4096,
                        }
                    }
                    
                    # Headers
                    headers = {
                        "Content-Type": "application/json",
                    }
                    
                    # Parâmetros da URL
                    params = {
                        "key": self.api_key
                    }
                    
                    # Faz requisição HTTP POST
                    with httpx.Client(timeout=settings.REQUEST_TIMEOUT) as client:
                        response = client.post(
                            url, 
                            json=payload, 
                            headers=headers,
                            params=params
                        )
                        
                        # Verifica status
                        if response.status_code == 429:
                            logger.warning(f"[AVISO] Limite atingido no modelo {modelo}")
                            # Tenta próximo modelo
                            break
                        
                        if response.status_code == 404:
                            logger.warning(f"[AVISO] Modelo {modelo} não disponível")
                            # Tenta próximo modelo
                            break
                        
                        response.raise_for_status()
                        data = response.json()
                        
                        # Extrai texto da resposta
                        if "candidates" in data and len(data["candidates"]) > 0:
                            candidate = data["candidates"][0]
                            
                            if "content" in candidate and "parts" in candidate["content"]:
                                parts = candidate["content"]["parts"]
                                
                                if len(parts) > 0 and "text" in parts[0]:
                                    texto_resumo = parts[0]["text"].strip()
                                    
                                    if texto_resumo:
                                        logger.info(f"[OK] Resumo gerado com sucesso usando {modelo}")
                                        self.model_name = modelo  # Atualiza modelo usado
                                        return texto_resumo
                        
                        logger.warning("[AVISO] Resposta vazia do modelo")
                        
                except httpx.HTTPStatusError as e:
                    error_msg = f"Erro HTTP {e.response.status_code}"
                    logger.error(f"[ERRO] {error_msg}: {e}")
                    
                    if e.response.status_code == 429:
                        # Tenta próximo modelo
                        break
                    
                    if tentativa == max_retries:
                        # Tenta próximo modelo
                        break
                        
                except httpx.TimeoutException:
                    logger.error(f"[ERRO] Timeout na tentativa {tentativa}")
                    
                    if tentativa == max_retries:
                        # Tenta próximo modelo
                        break
                        
                except Exception as e:
                    error_str = str(e)
                    logger.error(f"[ERRO] Tentativa {tentativa}: {error_str}")
                    
                    if tentativa == max_retries:
                        # Tenta próximo modelo
                        break
        
        # Se chegou aqui, todos os modelos falharam
        raise QuotaExceededError("Todos os modelos atingiram limite ou falharam. Aguarde alguns minutos e tente novamente.")
    
    def get_model_name(self) -> str:
        """Retorna nome do modelo atual"""
        return self.model_name


# Exceções personalizadas
class QuotaExceededError(Exception):
    """Limite de quota da API foi excedido"""
    pass