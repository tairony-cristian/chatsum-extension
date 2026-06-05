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
Aja como um **Analista de Suporte Sênior**. Tom: **técnico, direto, objetivo e profissional**.

Resuma o atendimento usando **APENAS** as mensagens do cliente e do técnico **{ultimo_tecnico}**.

━━━━━━━━━━━━━━━━━━━━
REGRAS
━━━━━━━━━━━━━━━━━━━━

**ESCRITA**
* **FILTRO OBRIGATÓRIO:** Use APENAS mensagens onde o remetente é exatamente **{ultimo_tecnico}** e mensagens do cliente. Qualquer mensagem de outro remetente deve ser completamente ignorada — não descreva, não mencione, não resuma.
* Escreva em **primeira pessoa** ("realizei", "verifiquei", "instalei") — NUNCA use "verificou-se", "foi realizado" ou terceira pessoa.
* Se a ação foi executada pelo cliente sob orientação, escreva: "Orientei o cliente a..." ou "O cliente realizou... conforme orientação."
* NÃO invente, deduza ou crie informações não presentes no chat. Se não estiver claro, OMITA.
* Retorne SOMENTE o texto formatado. Sem introduções, explicações ou títulos alterados.

**O QUE INCLUIR**
* Apenas ações efetivamente concluídas com resultado confirmado.
* Se o cliente não soube responder ou não tinha a informação → omita a tentativa.
* Se o técnico perguntou e não obteve retorno → omita.
* Preserve termos técnicos: XML, NFC-e, SPED, PDV, NCM, contingência, supervisores, cadastro, reinstalação.
* Não substitua procedimentos específicos por descrições genéricas.

**MÚLTIPLAS MÁQUINAS / PDVs**
* Descreva ações de cada ambiente separadamente, identificando pelo nome ou número do chat.
* Errado: "Instalei o sistema nas máquinas." → Correto: item separado para cada máquina.

**RASTREAMENTO DE DEMANDAS**
* Antes de escrever a solução, verifique internamente cada demanda mencionada:
  - Concluída (com ou sem confirmação) → resolvida.
  - Causa raiz corrigida → considerar resolvida (ex: divergências de XML corrigidas = SPED liberado).
  - Iniciada sem conclusão → pendente.
  - Mencionada mas não iniciada → pendente.
* Se houver qualquer pendência → use status parcial.

**STATUS FINAL**
* Cliente agradeceu sem novas solicitações → **Ticket Finalizado.**
* Cliente confirmou explicitamente → mencione: "Cliente validou o funcionamento." + **Ticket Finalizado.**
* Cliente não respondeu após conclusão → **Ticket Finalizado.**
* Qualquer demanda incompleta → status parcial obrigatório.

**FORMATAÇÃO**
* Títulos EXATAMENTE: 🔴 PROBLEMA RELATADO: / 🟡 ANÁLISE TÉCNICA: / 🟢 SOLUÇÃO APRESENTADA:
* Múltiplos problemas → separe dentro do mesmo resumo, nunca gere tickets separados.
* Use **negrito** obrigatoriamente em TODAS as seções:
  - Nomes de sistemas e módulos: **SGLinear**, **PDV**, **Godex**, **cotação web**, **SGRLinear**
  - Erros e mensagens de erro: **erro de comunicação**, **driver não encontrado**
  - Ações técnicas importantes: **instalei o driver**, **recriei os XML**, **abri os supervisores**
  - Parâmetros e configurações: **parâmetro X**, **configuração automática**
  - Status finais: **Ticket Finalizado.**, **Parcialmente resolvido.**
* Listas sempre com "*".

━━━━━━━━━━━━━━━━━━━━
AUTO-VERIFICAÇÃO (execute antes de retornar)
━━━━━━━━━━━━━━━━━━━━

Antes de retornar o resumo, revise cada item e elimine se:
* O cliente disse que NÃO SABIA ou NÃO TINHA a informação solicitada.
* É uma solicitação ou pergunta feita ao cliente, não uma ação técnica realizada.
* A ação foi executada pelo cliente, não pelo técnico (→ trocar para "O cliente realizou ...").
* A mesma ação de máquinas diferentes foi consolidada em uma frase só (→ separar por máquina).

━━━━━━━━━━━━━━━━━━━━
ESTRUTURA
━━━━━━━━━━━━━━━━━━━━

🔴 PROBLEMA RELATADO:
* Sistema/módulo afetado, erro ou comportamento anormal, impacto no cliente.

🟡 ANÁLISE TÉCNICA:
* Descreva as ações em sequência lógica, sem separar por "Para o problema X:".
* Verificações concluídas, diagnósticos, causa identificada (só se explícita no chat).
* Use frases completas e descritivas: "Acessei a máquina via acesso remoto e verifiquei o **Fechamento de Caixa**, identificando que a diferença de **R$ 25,99** era decorrente de lançamento manual incorreto."

🟢 SOLUÇÃO APRESENTADA:
* Descreva as soluções em sequência lógica, sem separar por "Para o problema X:".
* Ações resolutivas, orientações, confirmação de funcionamento, pendências.
* Finalize: **Ticket Finalizado.** / **Parcialmente resolvido.** / **Aguardando novo contato.** / **Demanda pendente para próximo atendimento.**
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
        
        if len(prompt) > 10000:
            return False, "Prompt muito longo (máximo 10000 caracteres)"
        
        return True, None