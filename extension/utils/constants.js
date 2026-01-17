/**
 * Constantes globais da extensão
 */

// Versão da extensão
export const VERSION = '2.0.0';

// Limites
export const LIMITES = {
  MIN_CHAT_LENGTH: 100,        // Tamanho mínimo do chat (caracteres)
  MAX_CHAT_LENGTH: 50000,      // Tamanho máximo do chat (caracteres)
  MAX_REQUESTS_PER_DAY: 50,    // Requisições máximas por dia
  POLLING_INTERVAL: 5000,      // Intervalo de polling (ms)
  LOCK_TIMEOUT: 60000,         // Timeout do lock (ms)
  REQUEST_TIMEOUT: 30000       // Timeout de requisição (ms)
};

// URLs padrão
export const URLS = {
  SERVER_DEFAULT: 'http://localhost:8000',
  DOCS: 'https://github.com/seu-usuario/chatsum-extension',
  SUPPORT: 'https://github.com/seu-usuario/chatsum-extension/issues'
};

// Chaves do Storage
export const STORAGE_KEYS = {
  // Configurações
  MODO_RESUMO: 'modoResumo',
  SERVER_URL: 'serverUrl',
  AUTO_COPIAR: 'autoCopiar',
  NOTIFICACOES: 'notificacoes',
  DEBUG_MODE: 'debugMode',
  
  // Prompts
  PROMPT_ATIVO: 'promptAtivo',
  PROMPT_PERSONALIZADO: 'promptPersonalizado',
  
  // Estado
  ESTADO: 'estado',
  ESTADO_TIMESTAMP: 'estadoTimestamp',
  
  // Dados
  CHAT_CAPTURADO: 'chatCapturado',
  ULTIMO_TECNICO: 'ultimoTecnico',
  TAB_ID_PROCESSANDO: 'tabIdProcessando',
  RESUMO_FINAL: 'resumoFinal',
  TIMESTAMP_RESUMO: 'timestampResumo',
  METADADOS_RESUMO: 'metadadosResumo',
  
  // Lock
  PROCESSING_LOCK: 'processing_lock',
  
  // Contador
  CONTADOR_REQUISICOES: 'contadorRequisicoes',
  DATA_CONTADOR: 'dataContador',
  
  // Cache
  ULTIMO_RESUMO_APAGADO: 'ultimoResumoApagado',
  RESUMO_CONTABILIZADO: 'resumoContabilizado'
};

// Mensagens de erro
export const ERROS = {
  CHAT_MUITO_CURTO: 'Chat muito curto para resumir (mínimo 100 caracteres)',
  CHAT_MUITO_LONGO: 'Chat excede o tamanho máximo permitido',
  SERVIDOR_OFFLINE: 'Não foi possível conectar ao servidor local. Verifique se está rodando.',
  QUOTA_EXCEDIDA: 'Limite diário da API atingido. Tente novamente amanhã.',
  TIMEOUT: 'Tempo limite excedido ao gerar resumo',
  CHAT_NAO_ENCONTRADO: 'Nenhum chat foi encontrado na página',
  PROCESSAMENTO_ATIVO: 'Já existe um resumo sendo processado'
};

// Notificações
export const NOTIFICACOES = {
  RESUMO_PRONTO: {
    title: 'Resumo Pronto!',
    message: 'Seu resumo foi gerado com sucesso.',
    iconUrl: '../assets/icons/icon128.png'
  },
  ERRO_GERAR: {
    title: 'Erro ao Gerar Resumo',
    message: 'Ocorreu um erro ao processar seu resumo.',
    iconUrl: '../assets/icons/icon128.png'
  }
};