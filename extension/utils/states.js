/**
 * Estados possíveis da aplicação
 * @enum {string}
 */
export const ESTADOS = {
  IDLE: 'idle',                    // Aguardando ação do usuário
  CAPTURING: 'capturing',          // Capturando chat (popup aberto)
  CAPTURED: 'captured',            // Chat capturado, pronto para enviar
  SENDING: 'sending',              // Enviando para servidor
  PROCESSING: 'processing',        // IA gerando resumo
  POLLING: 'polling',              // Buscando resultado do servidor
  DONE: 'done',                    // Resumo pronto
  ERROR: 'error'                   // Erro em alguma etapa
};

/**
 * Obtém o estado atual do storage
 * @returns {Promise<string>}
 */
export async function obterEstado() {
  const { estado } = await chrome.storage.local.get('estado');
  return estado || ESTADOS.IDLE;
}

/**
 * Define novo estado e metadados opcionais
 * @param {string} novoEstado - Estado da enum ESTADOS
 * @param {Object} [metadados={}] - Dados adicionais (erro, timestamp, etc)
 */
export async function setEstado(novoEstado, metadados = {}) {
  console.log(`[Estado] ${novoEstado}`, metadados);
  
  await chrome.storage.local.set({
    estado: novoEstado,
    estadoTimestamp: new Date().toISOString(),
    ...metadados
  });
  
  // Dispara evento para listeners
  chrome.runtime.sendMessage({
    type: 'STATE_CHANGED',
    estado: novoEstado,
    metadados
  }).catch(() => {
    // Ignora erro se não há listeners
  });
}

/**
 * Verifica se está em estado de processamento
 * @returns {Promise<boolean>}
 */
export async function estaProcessando() {
  const estado = await obterEstado();
  return [
    ESTADOS.CAPTURING,
    ESTADOS.SENDING,
    ESTADOS.PROCESSING,
    ESTADOS.POLLING
  ].includes(estado);
}