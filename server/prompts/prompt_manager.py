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
    
    @classmethod
    def get_default_prompt(cls) -> str:
        """Retorna prompt padrão (carrega de default.txt ou usa fallback)"""
        try:
            return cls.load_prompt('default')
        except:
            # Fallback embutido no código
            return """
Aja como um **Analista de Suporte Sênior**. O tom deve ser **técnico, direto e profissional**.
Sua única tarefa é resumir o atendimento **APENAS** com base nas mensagens do cliente e nas suas (do {ultimo_tecnico}, que é você).

**INSTRUÇÕES DE FORMATAÇÃO (CRÍTICAS):**
1.  **EXCLUSÃO:** Ignore qualquer interação de **outros técnicos**.
2.  **TOM:** Escreva sempre em **primeira pessoa** (foi realizada, realizei, Atualizei).
3.  **TÍTULOS:** Use **EXATAMENTE**: **PROBLEMA:**, **ANÁLISE:** e **SOLUÇÃO:**.
4.  **ESTRUTURA:** Use **listas em formato Markdown** (que aparecem como •) para clareza e use **negrito** (**) em palavras-chave e termos técnicos.

**PROBLEMA:**
[Resumo conciso do que foi reportado, destacando o impacto operacional. Use a estrutura de lista:
* Relato e **sistema/módulo** afetado.
* **Mensagem de Erro** ou comportamento anormal.
* **Impacto imediato** no cliente (ex: Processo bloqueado/urgente/inconsistência/incapaz de finalizar venda/executar rotina).]

**ANÁLISE:**
[Descrição resumida das suas ações de diagnóstico e a identificação da causa.
* **Verificações** essenciais que realizei no sistema.(use verbos "acessei, realizei, verifiquei" para descrever ações.)
* **Causa Raiz** (Ex: Falha na **configuração do parâmetro X** ou **registro duplicado**).
* **Hipóteses descartadas** (Opcional, se relevante).]

**SOLUÇÃO:**
[Explique a ação resolutiva aplicada e o status final do atendimento.
* **Ação resolutiva** que realizei (Ex: Apliquei **query de correção**, ajuste do **parâmetro Y**).
* **Orientação** fornecida ao cliente (se a solução foi por instrução).
* **Confirmação e Pendência:** Mencione se o cliente confirmou o retorno da funcionalidade. Declare **"Ticket Finalizado."** ou a próxima pendência (ex: "Aguardando homologação do cliente.").]

O resumo gerado deve ser apenas o texto formatado.
"""
    
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
        
        if len(prompt) > 5000:
            return False, "Prompt muito longo (máximo 5000 caracteres)"
        
        return True, None