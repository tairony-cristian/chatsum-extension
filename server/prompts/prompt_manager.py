"""
Gerenciador de prompts do sistema
Carrega templates e permite customização
"""

from pathlib import Path
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)


class PromptManager:
    """Gerencia prompts do sistema"""
    
    # Diretório de prompts
    PROMPTS_DIR = Path(__file__).parent
    TEMPLATES_DIR = PROMPTS_DIR / "templates"
    
    # Prompts carregados em memória
    _prompts: Dict[str, str] = {}
    
    @classmethod
    def load_prompt(cls, nome: str) -> str:
        """
        Carrega prompt do arquivo
        
        Args:
            nome: Nome do arquivo (sem extensão)
            
        Returns:
            Conteúdo do prompt
        """
        if nome in cls._prompts:
            return cls._prompts[nome]
        
        # Tenta carregar de templates/ primeiro
        arquivo_template = cls.TEMPLATES_DIR / f"{nome}.txt"
        arquivo_raiz = cls.PROMPTS_DIR / f"{nome}.txt"
        
        arquivo = arquivo_template if arquivo_template.exists() else arquivo_raiz
        
        if not arquivo.exists():
            logger.warning(f"⚠️ Prompt '{nome}' não encontrado, usando padrão")
            return cls.get_default_prompt()
        
        try:
            with open(arquivo, 'r', encoding='utf-8') as f:
                prompt = f.read()
            
            cls._prompts[nome] = prompt
            logger.info(f"✅ Prompt '{nome}' carregado de {arquivo.name}")
            return prompt
            
        except Exception as e:
            logger.error(f"❌ Erro ao carregar prompt '{nome}': {e}")
            return cls.get_default_prompt()
    
    # Fallback mínimo — usado SOMENTE se default.txt não puder ser lido do disco.
    # Não é uma cópia do prompt: é só um alerta funcional para não quebrar o serviço.
    _FALLBACK_MINIMO_DEFAULT = (
        "Aja como um Analista de Suporte Sênior. Resuma o atendimento de forma técnica, "
        "objetiva e em primeira pessoa, usando apenas mensagens do cliente e do técnico "
        "{ultimo_tecnico}. Nunca reproduza links, IPs, tokens, chaves ou identificadores "
        "de acesso remoto — descreva a ação de forma genérica. "
        "[AVISO INTERNO: templates/default.txt não pôde ser carregado — verifique o deploy.]"
    )

    @classmethod
    def get_default_prompt(cls) -> str:
        """
        Retorna prompt padrão. Fonte única de verdade: templates/default.txt
        (ou default.txt na raiz). Editar SOMENTE esse arquivo é suficiente —
        não há mais cópias deste texto no código.
        """
        if 'default' in cls._prompts:
            return cls._prompts['default']

        arquivo_template = cls.TEMPLATES_DIR / "default.txt"
        arquivo_raiz = cls.PROMPTS_DIR / "default.txt"
        arquivo = arquivo_template if arquivo_template.exists() else arquivo_raiz

        if not arquivo.exists():
            logger.error("❌ default.txt não encontrado! Usando fallback mínimo.")
            return cls._FALLBACK_MINIMO_DEFAULT

        try:
            with open(arquivo, 'r', encoding='utf-8') as f:
                prompt = f.read()
            cls._prompts['default'] = prompt
            logger.info(f"✅ Prompt 'default' carregado de {arquivo.name}")
            return prompt
        except Exception as e:
            logger.error(f"❌ Erro ao ler default.txt: {e}. Usando fallback mínimo.")
            return cls._FALLBACK_MINIMO_DEFAULT
    
    @classmethod
    def get_prompt_completo(cls) -> str:
        """Retorna prompt para modo completo (carrega de templates/completo.txt)"""
        return cls.load_prompt('completo')
    
    @classmethod
    def get_prompt_for_mode(cls, modo: str) -> str:
        """
        Retorna prompt apropriado para o modo
        
        Args:
            modo: 'ultimo_tecnico' ou 'completo'
            
        Returns:
            Template do prompt
        """
        if modo == 'completo':
            return cls.get_prompt_completo()
        else:
            return cls.get_default_prompt()
    
    @classmethod
    def validate_custom_prompt(cls, prompt: str) -> tuple[bool, Optional[str]]:
        """
        Valida prompt personalizado
        
        Args:
            prompt: Prompt customizado pelo usuário
            
        Returns:
            (é_valido, mensagem_erro)
        """
        if not prompt or not prompt.strip():
            return False, "Prompt não pode estar vazio"
        
        if len(prompt) < 50:
            return False, "Prompt muito curto (mínimo 50 caracteres)"
        
        if len(prompt) > 10000:
            return False, "Prompt muito longo (máximo 10000 caracteres)"
        
        return True, None