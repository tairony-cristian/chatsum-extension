/**
 * Content Script - ChatSum
 * Responsável por capturar o conteúdo do chat da página
 * Suporta múltiplas plataformas de atendimento
 */

// Configuração de debug (será substituída pela configuração do usuário)
let DEBUG_MODE = false;

/**
 * Plataformas de chat suportadas
 * Cada plataforma tem seletores específicos para mensagens e técnicos
 */
const PLATAFORMAS = {
  // Genérico (tenta detectar estruturas comuns)
  generico: {
    nome: 'Chat Genérico',
    detectar: () => true, // Sempre disponível como fallback
    seletores: {
      mensagens: [
        '[class*="message"]',
        '[class*="msg"]',
        '[class*="chat-message"]',
        '[data-message-id]',
        '.message-content',
        '.chat-msg'
      ],
      tecnico: [
        '[class*="author"]',
        '[class*="sender"]',
        '[class*="user-name"]',
        '[data-author]',
        '.message-author',
        '.sender-name'
      ]
    }
  },
  
  // Zendesk
  zendesk: {
    nome: 'Zendesk',
    detectar: () => {
      return document.querySelector('[data-garden-id*="zendesk"]') !== null ||
             window.location.hostname.includes('zendesk.com');
    },
    seletores: {
      mensagens: [
        '[data-test-id="ticket-comment-content"]',
        '.comment-body',
        '[data-comment-id]'
      ],
      tecnico: [
        '[data-test-id="ticket-comment-author"]',
        '.comment-author',
        '[data-author-id]'
      ]
    }
  },
  
  // Freshdesk
  freshdesk: {
    nome: 'Freshdesk',
    detectar: () => {
      return window.location.hostname.includes('freshdesk.com') ||
             document.querySelector('[data-test-id*="freshdesk"]') !== null;
    },
    seletores: {
      mensagens: [
        '.note-content',
        '[data-test-id="conversation-message"]',
        '.conversation-content'
      ],
      tecnico: [
        '.note-author',
        '[data-test-id="message-author"]',
        '.author-name'
      ]
    }
  },
  
  // Intercom
  intercom: {
    nome: 'Intercom',
    detectar: () => {
      return window.location.hostname.includes('intercom.com') ||
             document.querySelector('[class*="intercom"]') !== null;
    },
    seletores: {
      mensagens: [
        '[data-conversation-part-id]',
        '.conversation__message',
        '.intercom-comment-body'
      ],
      tecnico: [
        '.conversation__author',
        '[data-author-id]',
        '.comment__author'
      ]
    }
  },
  
  // WhatsApp Web
  whatsapp: {
    nome: 'WhatsApp Web',
    detectar: () => {
      return window.location.hostname.includes('web.whatsapp.com');
    },
    seletores: {
      mensagens: [
        '[data-pre-plain-text]',
        '.message-in .selectable-text',
        '.message-out .selectable-text'
      ],
      tecnico: [
        '[data-pre-plain-text]', // Contém nome e hora
        '._11JPr' // Nome do contato (pode mudar)
      ]
    }
  }
};

/**
 * Detecta qual plataforma está sendo usada
 * @returns {Object} Objeto da plataforma detectada
 */
function detectarPlataforma() {
  for (const [key, plataforma] of Object.entries(PLATAFORMAS)) {
    if (key !== 'generico' && plataforma.detectar()) {
      log(`✅ Plataforma detectada: ${plataforma.nome}`);
      return plataforma;
    }
  }
  
  log('⚠️ Plataforma não reconhecida, usando modo genérico');
  return PLATAFORMAS.generico;
}

/**
 * Tenta encontrar elementos usando múltiplos seletores
 * @param {Array<string>} seletores - Lista de seletores CSS
 * @returns {NodeList|null} Elementos encontrados
 */
function buscarComSeletores(seletores) {
  for (const seletor of seletores) {
    try {
      const elementos = document.querySelectorAll(seletor);
      if (elementos.length > 0) {
        log(`✅ Encontrados ${elementos.length} elementos com: ${seletor}`);
        return elementos;
      }
    } catch (erro) {
      log(`⚠️ Seletor inválido: ${seletor}`);
    }
  }
  return null;
}

/**
 * Extrai texto limpo de um elemento
 * @param {HTMLElement} elemento - Elemento DOM
 * @returns {string} Texto limpo
 */
function extrairTexto(elemento) {
  if (!elemento) return '';
  
  // Remove scripts e styles
  const clone = elemento.cloneNode(true);
  clone.querySelectorAll('script, style').forEach(el => el.remove());
  
  // Pega texto e limpa
  let texto = clone.textContent || clone.innerText || '';
  texto = texto.trim().replace(/\s+/g, ' ');
  
  return texto;
}

/**
 * Identifica o último técnico que participou
 * @param {Array} mensagens - Array de objetos de mensagem
 * @returns {string} Nome do último técnico
 */
function identificarUltimoTecnico(mensagens) {
  if (!mensagens || mensagens.length === 0) {
    return '';
  }
  
  // Filtra mensagens que têm autor (excluindo mensagens do cliente)
  const mensagensComAutor = mensagens.filter(msg => msg.autor && msg.autor.trim());
  
  if (mensagensComAutor.length === 0) {
    return '';
  }
  
  // Pega o último autor (mais recente)
  const ultimoAutor = mensagensComAutor[mensagensComAutor.length - 1].autor;
  
  log(`👤 Último técnico identificado: ${ultimoAutor}`);
  return ultimoAutor;
}

/**
 * Captura mensagens da plataforma detectada
 * @returns {Object} Resultado com chat e metadados
 */
function capturarChat() {
  try {
    log('🔍 Iniciando captura do chat...');
    
    // Detecta plataforma
    const plataforma = detectarPlataforma();
    
    // Busca mensagens
    const elementosMensagens = buscarComSeletores(plataforma.seletores.mensagens);
    
    if (!elementosMensagens || elementosMensagens.length === 0) {
      throw new Error('Nenhuma mensagem encontrada na página. Certifique-se de estar em uma conversa de chat.');
    }
    
    log(`📨 ${elementosMensagens.length} mensagens encontradas`);
    
    // Processa mensagens
    const mensagens = [];
    const elementosTecnicos = buscarComSeletores(plataforma.seletores.tecnico);
    
    elementosMensagens.forEach((msgElement, index) => {
      const conteudo = extrairTexto(msgElement);
      
      if (!conteudo) return; // Skip mensagens vazias
      
      // Tenta identificar autor
      let autor = '';
      if (elementosTecnicos && elementosTecnicos[index]) {
        autor = extrairTexto(elementosTecnicos[index]);
      }
      
      mensagens.push({
        autor: autor,
        conteudo: conteudo,
        timestamp: new Date().toISOString() // Timestamp da captura
      });
    });
    
    // Valida resultado
    if (mensagens.length === 0) {
      throw new Error('Nenhuma mensagem válida foi capturada.');
    }
    
    // Formata chat para envio
    const chatFormatado = mensagens
      .map(msg => {
        if (msg.autor) {
          return `[${msg.autor}]: ${msg.conteudo}`;
        }
        return msg.conteudo;
      })
      .join('\n\n');
    
    // Identifica último técnico
    const ultimoTecnico = identificarUltimoTecnico(mensagens);
    
    log('✅ Chat capturado com sucesso');
    log(`📊 Estatísticas: ${mensagens.length} mensagens, ${chatFormatado.length} caracteres`);
    
    return {
      success: true,
      chat: chatFormatado,
      ultimoTecnico: ultimoTecnico,
      metadata: {
        plataforma: plataforma.nome,
        totalMensagens: mensagens.length,
        tamanhoBytes: new Blob([chatFormatado]).size,
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (erro) {
    log(`❌ Erro ao capturar chat: ${erro.message}`);
    
    return {
      success: false,
      chat: `Erro: ${erro.message}`,
      ultimoTecnico: '',
      metadata: {
        erro: erro.message
      }
    };
  }
}

/**
 * Logger condicional (apenas se debug ativado)
 * @param {string} mensagem - Mensagem para log
 */
function log(mensagem) {
  if (DEBUG_MODE) {
    console.log(`[ChatSum Content] ${mensagem}`);
  }
}

/**
 * Listener de mensagens da extensão
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  log('📬 Mensagem recebida do popup');
  
  if (request.action === 'coletarChat') {
    // Captura o chat
    const resultado = capturarChat();
    
    // Envia resposta
    sendResponse(resultado);
    
    return true; // Mantém canal aberto para resposta assíncrona
  }
  
  if (request.action === 'enableDebug') {
    DEBUG_MODE = request.enabled;
    log(`🐛 Modo debug ${DEBUG_MODE ? 'ativado' : 'desativado'}`);
    sendResponse({ success: true });
    return true;
  }
  
  if (request.action === 'detectPlatform') {
    const plataforma = detectarPlataforma();
    sendResponse({
      success: true,
      plataforma: plataforma.nome
    });
    return true;
  }
});

// Inicialização
(function init() {
  // Carrega configuração de debug do storage
  chrome.storage.local.get(['debugMode'], (result) => {
    DEBUG_MODE = result.debugMode || false;
    log('🚀 Content script inicializado');
  });
  
  // Injeta indicador visual (opcional - apenas em debug)
  if (DEBUG_MODE) {
    const indicator = document.createElement('div');
    indicator.id = 'chatsum-indicator';
    indicator.textContent = '📋 ChatSum Ativo';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #cc0000;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: bold;
      z-index: 999999;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      font-family: Arial, sans-serif;
    `;
    document.body.appendChild(indicator);
    
    // Remove após 3 segundos
    setTimeout(() => {
      indicator.remove();
    }, 3000);
  }
})();