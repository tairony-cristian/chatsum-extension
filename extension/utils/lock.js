const LOCK_KEY = 'processing_lock';
const LOCK_TIMEOUT = 60000; // 1 minuto

/**
 * Estrutura do Lock
 * @typedef {Object} ProcessingLock
 * @property {number} timestamp - Quando foi criado
 * @property {number} tabId - ID da aba que iniciou
 * @property {string} requestId - ID único da requisição
 */

/**
 * Tenta adquirir lock de processamento
 * @param {number} tabId - ID da aba atual
 * @returns {Promise<{success: boolean, lock?: ProcessingLock}>}
 */
export async function tentarAquirirLock(tabId) {
  const { [LOCK_KEY]: lock } = await chrome.storage.local.get(LOCK_KEY);
  const agora = Date.now();
  
  // Verifica se lock existe e ainda é válido
  if (lock && (agora - lock.timestamp) < LOCK_TIMEOUT) {
    return { success: false, lock };
  }
  
  // Adquire novo lock
  const novoLock = {
    timestamp: agora,
    tabId: tabId,
    requestId: crypto.randomUUID()
  };
  
  await chrome.storage.local.set({ [LOCK_KEY]: novoLock });
  
  return { success: true, lock: novoLock };
}

/**
 * Libera o lock de processamento
 */
export async function liberarLock() {
  await chrome.storage.local.remove(LOCK_KEY);
  console.log('[Lock] Liberado');
}

/**
 * Obtém informações do lock atual
 * @returns {Promise<ProcessingLock|null>}
 */
export async function obterLock() {
  const { [LOCK_KEY]: lock } = await chrome.storage.local.get(LOCK_KEY);
  return lock || null;
}

/**
 * Verifica se a aba atual possui o lock
 * @param {number} tabId
 * @returns {Promise<boolean>}
 */
export async function possuiLock(tabId) {
  const lock = await obterLock();
  return lock && lock.tabId === tabId;
}