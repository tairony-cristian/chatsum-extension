
/**
 * Helpers para gerenciamento do chrome.storage
 * Simplifica operações comuns de storage
 */

export const StorageHelper = {
  /**
   * Obtém valor do storage com fallback
   * @param {string} key - Chave
   * @param {*} defaultValue - Valor padrão
   * @returns {Promise<*>}
   */
  async get(key, defaultValue = null) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key] !== undefined ? result[key] : defaultValue);
      });
    });
  },
  
  /**
   * Obtém múltiplas chaves
   * @param {Array<string>} keys - Array de chaves
   * @param {Object} defaults - Valores padrão
   * @returns {Promise<Object>}
   */
  async getMultiple(keys, defaults = {}) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (result) => {
        const merged = { ...defaults, ...result };
        resolve(merged);
      });
    });
  },
  
  /**
   * Define valor no storage
   * @param {string} key - Chave
   * @param {*} value - Valor
   * @returns {Promise<void>}
   */
  async set(key, value) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  },
  
  /**
   * Define múltiplos valores
   * @param {Object} items - Objeto com chaves e valores
   * @returns {Promise<void>}
   */
  async setMultiple(items) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(items, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  },
  
  /**
   * Remove chave do storage
   * @param {string|Array<string>} keys - Chave(s) a remover
   * @returns {Promise<void>}
   */
  async remove(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.remove(keys, resolve);
    });
  },
  
  /**
   * Limpa todo o storage
   * @returns {Promise<void>}
   */
  async clear() {
    return new Promise((resolve) => {
      chrome.storage.local.clear(resolve);
    });
  },
  
  /**
   * Listener de mudanças no storage
   * @param {Function} callback - Callback(changes, area)
   */
  onChange(callback) {
    chrome.storage.onChanged.addListener(callback);
  },
  
  /**
   * Debug: mostra todo o conteúdo do storage
   * @returns {Promise<Object>}
   */
  async debug() {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, (items) => {
        console.log('🗄️ Storage completo:', items);
        resolve(items);
      });
    });
  }
};