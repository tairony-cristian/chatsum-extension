"""
Serviço de sanitização de dados sensíveis
Remove informações confidenciais antes de processar
"""

import re
from typing import Dict, Pattern


class DataSanitizer:
    """Limpa dados sensíveis do texto"""
    
    # Padrões de dados sensíveis (regex)
    PATTERNS: Dict[str, Pattern] = {
        'telefone': re.compile(r'\(?\d{2,3}\)?\s?\d{4,5}-?\d{4}'),
        'cpf': re.compile(r'\d{3}\.?\d{3}\.?\d{3}-?\d{2}'),
        'cnpj': re.compile(r'\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}'),
        'email': re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'),
        'ip': re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b'),
        'senha': re.compile(r'senha\s*[:=]?\s*\S+', re.IGNORECASE),
        'teamviewer': re.compile(r'teamviewer.*?\d{4,}', re.IGNORECASE),
        'anydesk': re.compile(r'anydesk.*?\d{6,}', re.IGNORECASE),
        'codigo_acesso': re.compile(r'\b\d{9}\b'),  # Códigos de 9 dígitos
        'token': re.compile(r'token\s*[:=]?\s*[A-Za-z0-9_\-\.]+', re.IGNORECASE),
        'api_key': re.compile(r'api[_-]?key\s*[:=]?\s*[A-Za-z0-9_\-\.]+', re.IGNORECASE),
    }
    
    # Substituições correspondentes
    REPLACEMENTS: Dict[str, str] = {
        'telefone': '[TELEFONE_OCULTO]',
        'cpf': '[CPF_OCULTO]',
        'cnpj': '[CNPJ_OCULTO]',
        'email': '[EMAIL_OCULTO]',
        'ip': '[IP_OCULTO]',
        'senha': '[SENHA_OCULTA]',
        'teamviewer': '[ACESSO_REMOTO_OCULTO]',
        'anydesk': '[ACESSO_REMOTO_OCULTO]',
        'codigo_acesso': '[CODIGO_OCULTO]',
        'token': '[TOKEN_OCULTO]',
        'api_key': '[API_KEY_OCULTA]',
    }
    
    @classmethod
    def sanitize(cls, texto: str) -> str:
        """
        Remove dados sensíveis do texto
        
        Args:
            texto: Texto original a ser sanitizado
            
        Returns:
            Texto com dados sensíveis substituídos
        """
        texto_limpo = texto
        
        for tipo, pattern in cls.PATTERNS.items():
            substituicao = cls.REPLACEMENTS[tipo]
            texto_limpo = pattern.sub(substituicao, texto_limpo)
        
        return texto_limpo
    
    @classmethod
    def contains_sensitive_data(cls, texto: str) -> bool:
        """
        Verifica se texto contém dados sensíveis
        
        Args:
            texto: Texto a verificar
            
        Returns:
            True se contém dados sensíveis
        """
        for pattern in cls.PATTERNS.values():
            if pattern.search(texto):
                return True
        return False