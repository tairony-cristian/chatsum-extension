import { ESTADOS, setEstado, obterEstado } from './utils/states.js';
import { liberarLock } from './utils/lock.js';
import { StorageHelper } from './utils/storage.js';
import { URLS, LIMITES, NOTIFICACOES } from './utils/constants.js';

// Configuração do servidor (vem do .env via options)
let SERVER_URL = 'http://localhost:8000';

/**
 * Inicialização do Service Worker
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('[Background] Extensão instalada pela primeira vez');
    
    // Define estado inicial
    await setEstado(ESTADOS.IDLE);
    
    // Abre página de boas-vindas
    chrome.tabs.create({ 
      url: chrome.runtime.getURL('options/options.html?welcome=true') 
    });
  }
  
  if (details.reason === 'update') {
    console.log('[Background] Extensão atualizada');
    // Limpa estados antigos se necessário
    await limparEstadosAntigos();
  }
});

/**
 * Listener de mudanças no storage
 * Reage quando estado muda para CAPTURED
 */
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== 'local') return;
  
  // Se chat foi capturado, inicia processamento
  if (changes.estado?.newValue === ESTADOS.CAPTURED) {
    console.log('[Background] Chat capturado, iniciando processamento');
    await processarResumo();
  }
});

/**
 * Processa o resumo após captura
 */
async function processarResumo() {
  try {
    // Busca dados capturados
    const data = await chrome.storage.local.get([
      'chatCapturado',
      'ultimoTecnico',
      'tabIdProcessando',
      'modoResumo',
      'promptAtivo',
      'promptPersonalizado',
      'usarPromptPersonalizado'
    ]);
    
    if (!data.chatCapturado) {
      throw new Error('Chat não encontrado no storage');
    }
    
    await setEstado(ESTADOS.SENDING);
    
    // Prepara payload
    const payload = {
      texto: data.chatCapturado,
      ultimoTecnico: data.ultimoTecnico || '',
      modo: data.modoResumo || 'ultimo_tecnico',
    };
    if (data.promptAtivo === 'custom' && data.promptPersonalizado) {
    payload.promptCustom = data.promptPersonalizado;
    }
    
    console.log('[Background] Enviando para servidor...', {
      tamanhoChat: payload.texto.length,
      modo: payload.modo,
      customPrompt: !!payload.promptCustom
    });
    
    // Envia para servidor
    const response = await fetch(`${SERVER_URL}/resumidor/resumir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    const resultado = await response.json();
    
    if (resultado.resumo) {
      // Sucesso!
      await chrome.storage.local.set({
        resumoFinal: resultado.resumo,
        timestampResumo: resultado.timestamp,
        metadadosResumo: {
          tecnico: data.ultimoTecnico,
          modo: payload.modo,
          geradoEm: new Date().toISOString()
        }
      });
      
      await setEstado(ESTADOS.DONE);
      
      // Badge de notificação
      await atualizarBadge(data.tabIdProcessando, '✓', '#2a9d8f');
      
      // Notificação
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/icons/icon128.png',
        title: 'Resumo Pronto!',
        message: 'Seu resumo foi gerado com sucesso.'
      });
      
    } else {
      throw new Error('Resposta sem resumo');
    }
    
  } catch (erro) {
    console.error('[Background] Erro ao processar:', erro);
    
    await setEstado(ESTADOS.ERROR, {
      erro: erro.message,
      timestamp: new Date().toISOString()
    });
    
    // Badge de erro
    const { tabIdProcessando } = await chrome.storage.local.get('tabIdProcessando');
    await atualizarBadge(tabIdProcessando, '✗', '#e63946');
    
  } finally {
    // Sempre libera o lock
    await liberarLock();
  }
}

/**
 * Atualiza badge da extensão
 */
async function atualizarBadge(tabId, text, color) {
  if (!tabId) return;
  
  await chrome.action.setBadgeText({ text, tabId });
  await chrome.action.setBadgeBackgroundColor({ color, tabId });
}

/**
 * Limpa estados antigos/corrompidos
 */
async function limparEstadosAntigos() {
  const estado = await obterEstado();
  
  // Se estava em processamento, reseta
  if ([ESTADOS.SENDING, ESTADOS.PROCESSING, ESTADOS.POLLING].includes(estado)) {
    await setEstado(ESTADOS.IDLE);
    await liberarLock();
  }
}

/**
 * Listener de mensagens do popup/content
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CANCEL_PROCESSING') {
    cancelarProcessamento().then(() => {
      sendResponse({ success: true });
    });
    return true; // Async response
  }
  
  if (message.type === 'GET_SERVER_URL') {
    chrome.storage.local.get('serverUrl').then(({ serverUrl }) => {
      sendResponse({ url: serverUrl || SERVER_URL });
    });
    return true;
  }
});

/**
 * Cancela processamento em andamento
 */
async function cancelarProcessamento() {
  console.log('[Background] Cancelando processamento');
  
  await setEstado(ESTADOS.IDLE);
  await liberarLock();
  
  // Limpa dados
  await chrome.storage.local.remove([
    'chatCapturado',
    'tabIdProcessando',
    'resumoFinal'
  ]);
  
  // Remove badge
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs[0]) {
    await chrome.action.setBadgeText({ text: '', tabId: tabs[0].id });
  }
}

console.log('[Background] Service Worker iniciado');