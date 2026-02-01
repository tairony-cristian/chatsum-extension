"""
Serviço de sanitização de dados sensíveis
Remove informações confidenciais antes de processar
"""

import re
from typing import Dict, Pattern, Optional


class DataSanitizer:
    """Limpa dados sensíveis do texto"""
    
    @staticmethod
    def _eh_cpf_valido(cpf: str) -> bool:
        """
        Valida se um CPF é realmente válido usando algoritmo oficial
        
        Args:
            cpf: CPF a validar (com ou sem formatação)
            
        Returns:
            True se CPF é válido, False caso contrário
        """
        # Remove formatação
        cpf_limpo = cpf.replace('.', '').replace('-', '').replace(' ', '')
        
        # Validações básicas
        if len(cpf_limpo) != 11:
            return False
        
        if not cpf_limpo.isdigit():
            return False
        
        # Evita CPFs óbvios (11111111111, 22222222222, etc)
        if cpf_limpo == cpf_limpo[0] * 11:
            return False
        
        # Valida primeiro dígito verificador
        soma = sum(int(cpf_limpo[i]) * (10 - i) for i in range(9))
        resto = soma % 11
        digito1 = 0 if resto < 2 else 11 - resto
        
        if int(cpf_limpo[9]) != digito1:
            return False
        
        # Valida segundo dígito verificador
        soma = sum(int(cpf_limpo[i]) * (11 - i) for i in range(10))
        resto = soma % 11
        digito2 = 0 if resto < 2 else 11 - resto
        
        return int(cpf_limpo[10]) == digito2
    

    PATTERNS: Dict[str, Pattern] = {
        # Padrão de telefone específico para Brasil
       
        'telefone': re.compile(r'\(?\d{2}\)?[\s.-]9?\d{4}[\s.-]?\d{4}'),
        # CPF mais específico
        'cpf': re.compile(r'\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11}'),
        'cnpj': re.compile(r'\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}'),
        'email': re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'),
        'ip': re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b'),
        'senha': re.compile(r'senha\s*[:=]?\s*\S+', re.IGNORECASE),
        'teamviewer': re.compile(r'teamviewer.*?\d{4,}', re.IGNORECASE),
        'anydesk': re.compile(r'anydesk.*?\d{6,}', re.IGNORECASE),
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
        'token': '[TOKEN_OCULTO]',
        'api_key': '[API_KEY_OCULTA]',
    }
    
    @classmethod
    def sanitize(cls, texto: str) -> str:
        """
        Remove dados sensíveis do texto
        
        IMPORTANTE: Para CPF, apenas sanitiza se passar na validação oficial
        Isso evita falsos positivos (códigos de produto com 11 dígitos)
        
        Args:
            texto: Texto original a ser sanitizado
            
        Returns:
            Texto com dados sensíveis substituídos
        """
        texto_limpo = texto
        
        for tipo, pattern in cls.PATTERNS.items():
            substituicao = cls.REPLACEMENTS[tipo]
            
            if tipo == 'cpf':
                # Para CPF: encontra padrões E valida cada um
                for match in pattern.finditer(texto):
                    cpf_encontrado = match.group()
                    # Só substitui se passar na validação oficial do CPF
                    if cls._eh_cpf_valido(cpf_encontrado):
                        texto_limpo = texto_limpo.replace(cpf_encontrado, substituicao, 1)
            else:
                # Para outros padrões: substitui normalmente
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