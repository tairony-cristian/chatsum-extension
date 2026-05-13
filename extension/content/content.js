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
  // ============================================
  // MOVIDESK - Suporte Específico e Otimizado
  // ============================================
  movidesk: {
    nome: 'Movidesk',
    detectar: () => {
      // Detecta por URL ou elementos específicos do Movidesk
      return window.location.hostname.includes('movidesk.com') ||
             document.querySelector('li.tab-li.active') !== null;
    },
    // ⭐ FUNÇÃO ESPECIAL PARA MOVIDESK (não usa a genérica)
    capturar: async function() {
      try {
        log('🔍 Iniciando captura específica do Movidesk...');
        
        // ETAPA 1: Clicar em "Carregar mais" (aguarda todas as mensagens)
        await this.clicarEmCarregarMais();
        
        // ETAPA 2: Validar aba ativa
        const abaAtiva = document.querySelector("li.tab-li.active");
        if (!abaAtiva) {
          throw new Error('Aba ativa não encontrada. Certifique-se de estar em uma conversa.');
        }
        
        log(`✅ Aba ativa encontrada: ${abaAtiva.id}`);
        
        // ETAPA 3: Obter conteúdo da aba ativa
        const idAba = abaAtiva.id;
        const idConteudo = idAba.replace("tab", "tab-pane");
        const divConteudo = document.querySelector(`#${idConteudo}`);
        
        if (!divConteudo) {
          throw new Error('Conteúdo do chat não encontrado na aba ativa.');
        }
        
        // ETAPA 4: Extrair mensagens
        const containers = divConteudo.querySelectorAll(
          ".message-container.sended, .message-container.received, .message-container.systemMessage"
        );
        
        if (containers.length === 0) {
          throw new Error('Nenhuma mensagem encontrada na aba ativa.');
        }
        
        log(`📨 ${containers.length} mensagens encontradas`);
        
        // ETAPA 5: Processar mensagens e identificar técnicos
        const mensagens = [];
        const tecnicosChat = [];
        
        containers.forEach((container, index) => {
          const nome = container.querySelector(".user")?.innerText?.trim() || "Sistema";
          const hora = container.querySelector(".time")?.innerText?.trim() || "??:??";
          
          const conteudosMensagem = Array.from(container.querySelectorAll("span.message"))
            .map(el => el.innerText?.trim())
            .filter(msg => msg && msg.length > 0);
          
          if (conteudosMensagem.length === 0) return; // Skip se vazio
          
          const conteudoCompleto = conteudosMensagem.join("\n");
          
          // Identifica técnicos que "entraram na conversa"
          if (/entrou na conversa/i.test(conteudoCompleto) && nome && nome !== "Sistema") {
            tecnicosChat.push(nome);
            log(`👤 Técnico detectado: ${nome}`);
          }
          
          // Armazena mensagem estruturada
          mensagens.push({
            autor: nome,
            conteudo: conteudoCompleto,
            hora: hora,
            timestamp: new Date().toISOString()
          });
        });
        
        // ETAPA 6: Formatar resultado
        const ultimoTecnico = tecnicosChat.length > 0 
          ? tecnicosChat[tecnicosChat.length - 1]
          : "";
        
        const chatFormatado = mensagens
          .map(msg => `[${msg.hora}] ${msg.autor}:\n${msg.conteudo}`)
          .join("\n\n");
        
        log('✅ Captura Movidesk concluída com sucesso');
        log(`📊 Estatísticas: ${mensagens.length} mensagens, ${chatFormatado.length} caracteres`);
        
        return {
          success: true,
          chat: chatFormatado,
          ultimoTecnico: ultimoTecnico,
          metadata: {
            plataforma: this.nome,
            totalMensagens: mensagens.length,
            tamanhoBytes: new Blob([chatFormatado]).size,
            timestamp: new Date().toISOString()
          }
        };
        
      } catch (erro) {
        log(`❌ Erro na captura Movidesk: ${erro.message}`);
        throw erro;
      }
    },
    
    // ⭐ FUNÇÃO AUXILIAR: Clicar em todos os botões "Carregar mais"
    // Repete até não existir mais nenhum botão na página
    clicarEmCarregarMais: async function() {
      const AGUARDO_APOS_CLIQUE_MS = 3000; // Aguarda 3s após cada clique para carregar mensagens
      const MAX_CLIQUES = 5;              // Limite de segurança (evita loop infinito)
      let totalCliques = 0;

      log("🔘 Iniciando cliques em 'Carregar mais'...");

      while (totalCliques < MAX_CLIQUES) {
        // Busca o botão "Carregar mais" visível
        const xpath = "//button[contains(text(), 'Carregar mais')]";
        const botao = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;

        // Se não encontrou botão visível, encerra o loop
        if (!botao || botao.offsetParent === null) {
          log(`✅ Nenhum botão 'Carregar mais' restante. Total de cliques: ${totalCliques}`);
          break;
        }

        // Clica no botão e aguarda o carregamento
        totalCliques++;
        log(`🔘 Clique ${totalCliques}: carregando mais mensagens...`);
        botao.click();

        // Aguarda as mensagens carregarem antes de procurar o próximo botão
        await new Promise(r => setTimeout(r, AGUARDO_APOS_CLIQUE_MS));
      }

      if (totalCliques >= MAX_CLIQUES) {
        log(`⚠️ Limite de ${MAX_CLIQUES} cliques atingido.`);
      }
    }
  },
  
  // ============================================
  // OUTRAS PLATAFORMAS - Modo Genérico
  // ============================================
  
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
 * ⭐ MUDANÇA: Detecta Movidesk com PRIORIDADE
 * @returns {Object} Objeto da plataforma detectada
 */
function detectarPlataforma() {
  // PRIORIDADE 1: Movidesk (mais específico)
  if (PLATAFORMAS.movidesk.detectar()) {
    log(`✅ Plataforma detectada: ${PLATAFORMAS.movidesk.nome}`);
    return PLATAFORMAS.movidesk;
  }
  
  // PRIORIDADE 2: Outras plataformas
  for (const [key, plataforma] of Object.entries(PLATAFORMAS)) {
    if (key !== 'generico' && key !== 'movidesk' && plataforma.detectar()) {
      log(`✅ Plataforma detectada: ${plataforma.nome}`);
      return plataforma;
    }
  }
  
  // FALLBACK: Modo genérico
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
 * Identifica o último técnico que participou (para plataformas genéricas)
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
 * ⭐ MUDANÇA: Agora chama a função específica de cada plataforma
 * @returns {Object} Resultado com chat e metadados
 */
async function capturarChat() {
  try {
    log('🔍 Iniciando captura do chat...');
    
    // Detecta plataforma
    const plataforma = detectarPlataforma();
    
    // ⭐ MUDANÇA: Se a plataforma tem função "capturar" própria (como Movidesk), usa ela
    if (plataforma.capturar && typeof plataforma.capturar === 'function') {
      log(`📋 Usando método de captura específico para ${plataforma.nome}`);
      return await plataforma.capturar();
    }
    
    // ⭐ FALLBACK: Usa método genérico para outras plataformas
    log('📋 Usando método de captura genérico');
    
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
 * ⭐ MUDANÇA: Agora suporta funções assíncronas
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  log('📬 Mensagem recebida do popup');
  
  if (request.action === 'coletarChat') {
    // ⭐ MUDANÇA: Agora é assíncrono
    (async () => {
      const resultado = await capturarChat();
      sendResponse(resultado);
    })();
    
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