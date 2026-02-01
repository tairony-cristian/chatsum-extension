"""
Modelos Pydantic para validação de dados
Garante tipos corretos e validações automáticas
"""

from pydantic import BaseModel, Field, ConfigDict, validator
from typing import Optional, Literal
from datetime import datetime


class ResumoRequest(BaseModel):
    """Requisição de geração de resumo"""
    
    texto: str = Field(
        ...,
        min_length=100,
        max_length=50000,
        description="Texto do chat a ser resumido"
    )
    
    ultimoTecnico: Optional[str] = Field(
        default="",
        max_length=100,
        description="Nome do último técnico que atendeu"
    )
    
    modo: Literal["completo", "ultimo_tecnico"] = Field(
        default="ultimo_tecnico",
        description="Modo de resumo: completo ou apenas último técnico"
    )
    
    promptCustom: Optional[str] = Field(
        default=None,
        max_length=2000,
        description="Prompt personalizado (opcional)"
    )
    
    iaProvider: Literal["gemini", "groq", "openai"] = Field(
        default="gemini",
        description="Provedor de IA: gemini, groq ou openai"
    )
    
    @validator('texto')
    def validar_texto(cls, v):
        """Valida que texto não está vazio após strip"""
        if not v.strip():
            raise ValueError("Texto não pode estar vazio")
        return v.strip()
    
    @validator('ultimoTecnico')
    def limpar_tecnico(cls, v):
        """Remove espaços extras do nome"""
        return v.strip() if v else ""


class ResumoResponse(BaseModel):
    """Resposta com resumo gerado"""
    
    resumo: str = Field(..., description="Resumo gerado pela IA")
    timestamp: str = Field(..., description="Data/hora da geraÃ§Ã£o")
    ultimoTecnico: str = Field(..., description="TÃ©cnico que atendeu")
    modo: str = Field(..., description="Modo usado para gerar")
    iaUsada: str = Field(default="gemini", description="Provedor de IA que gerou o resumo")
    iaSolicitada: str = Field(default="gemini", description="Provedor de IA solicitado pelo cliente")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "resumo": "**PROBLEMA:** Cliente reportou erro ao...",
                "timestamp": "2025-01-14T10:30:00",
                "ultimoTecnico": "João Silva",
                "modo": "ultimo_tecnico"
            }
        }
    )


class ErrorResponse(BaseModel):
    """Resposta de erro padronizada"""
    
    error: str = Field(..., description="Mensagem de erro")
    detail: Optional[str] = Field(None, description="Detalhes adicionais")
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class HealthResponse(BaseModel):
    """Resposta do health check"""
    
    status: Literal["ok", "error"] = Field(..., description="Status do serviço")
    modelo: str = Field(..., description="Modelo de IA em uso")
    versao: str = Field(default="2.0.0", description="Versão da API")