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
        
        // ETAPA 1: Clicar em todos os "Carregar mais" até não restar nenhum
        await this.clicarEmCarregarMaisLoop();

        // ETAPA 2: Identificar aba ativa
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

        // ETAPA 4: Extrair dados do ticket a partir da aba ativa
        // Passa divConteudo para buscar ticket/razão social dentro da conversa correta
        const dadosTicket = this.extrairDadosTicket(abaAtiva, divConteudo);
        log(`🎫 Ticket: ${dadosTicket.numero} | Cliente: ${dadosTicket.razaoSocial}`);
        
        // ETAPA 5: Extrair mensagens
        const containers = divConteudo.querySelectorAll(
          ".message-container.sended, .message-container.received, .message-container.systemMessage"
        );
        
        if (containers.length === 0) {
          throw new Error('Nenhuma mensagem encontrada na aba ativa.');
        }
        
        log(`📨 ${containers.length} mensagens encontradas`);
        
        // ETAPA 6: Processar mensagens e identificar técnicos
        const mensagens = [];
        const tecnicosChat = [];
        
        containers.forEach((container) => {
          const nome = container.querySelector(".user")?.innerText?.trim() || "Sistema";
          const hora = container.querySelector(".time")?.innerText?.trim() || "??:??";
          
          const conteudosMensagem = Array.from(container.querySelectorAll("span.message"))
            .map(el => el.innerText?.trim())
            .filter(msg => msg && msg.length > 0);

          // ⭐ CAPTURA DE IMAGENS: apenas imagens reais enviadas como anexo no chat
          // .chat-attachment-item é o container de upload do Movidesk
          // Exclui avatares (.img-avatar), assinaturas Froala e ícones de sistema
          const imagens = Array.from(container.querySelectorAll(".chat-attachment-item img"))
            .filter(img => !img.classList.contains("img-avatar"))
            .map(img => {
              const src = img.getAttribute("src") || "";
              if (!src) return null;
              if (src.startsWith("/")) return window.location.origin + src;
              if (src.startsWith("http")) return src;
              return null;
            })
            .filter(Boolean);

          // Skip mensagem sem texto E sem imagens reais
          if (conteudosMensagem.length === 0 && imagens.length === 0) return;
          
          const conteudoCompleto = conteudosMensagem.join("\n");
          
          // Identifica técnicos que "entraram na conversa"
          if (/entrou na conversa/i.test(conteudoCompleto) && nome && nome !== "Sistema") {
            tecnicosChat.push(nome);
            log(`👤 Técnico detectado: ${nome}`);
          }
          
          // Armazena mensagem estruturada
          // Imagens do "Sistema" são notificações automáticas, não capturas reais
          mensagens.push({
            autor: nome,
            conteudo: conteudoCompleto,
            imagens: nome === "Sistema" ? [] : imagens,
            hora: hora,
            timestamp: new Date().toISOString()
          });

          if (imagens.length > 0 && nome !== "Sistema") {
            log(`🖼️ ${imagens.length} imagem(ns) capturada(s) em mensagem de ${nome}`);
          }
        });
        
        // ETAPA 7: Formatar resultado
        const ultimoTecnico = tecnicosChat.length > 0 
          ? tecnicosChat[tecnicosChat.length - 1]
          : "";
        
        const chatFormatado = mensagens
          .map(msg => {
            let linha = `[${msg.hora}] ${msg.autor}:\n${msg.conteudo}`;
            if (msg.imagens && msg.imagens.length > 0) {
              linha += `\n[IMAGENS: ${msg.imagens.join(", ")}]`;
            }
            return linha;
          })
          .join("\n\n");

        // Coleta todas as imagens do chat com autor e hora para contexto
        const todasImagens = mensagens
          .filter(msg => msg.imagens && msg.imagens.length > 0)
          .flatMap(msg => msg.imagens.map(url => ({ url, autor: msg.autor, hora: msg.hora })));
        
        log('✅ Captura Movidesk concluída com sucesso');
        log(`📊 Estatísticas: ${mensagens.length} mensagens, ${chatFormatado.length} caracteres, ${todasImagens.length} imagem(ns)`);
        
        return {
          success: true,
          chat: chatFormatado,
          ultimoTecnico: ultimoTecnico,
           todosTecnicos: tecnicosChat, 
          ticket: dadosTicket,
          imagens: todasImagens,
          metadata: {
            plataforma: this.nome,
            totalMensagens: mensagens.length,
            totalImagens: todasImagens.length,
            tamanhoBytes: new Blob([chatFormatado]).size,
            timestamp: new Date().toISOString()
          }
        };
        
      } catch (erro) {
        log(`❌ Erro na captura Movidesk: ${erro.message}`);
        throw erro;
      }
    },
    
    // ⭐ FUNÇÃO AUXILIAR: Extrai número do ticket e razão social
// Usa a aba ativa (li.tab-li.active) como âncora para garantir dados corretos
extrairDadosTicket: function(abaAtiva, divConteudo) {

  // ─────────────────────────────────────────
  // NÚMERO DO TICKET
  // ─────────────────────────────────────────
  let numero = '';

  // Fonte 1: id da aba ativa
  // Exemplo: id="tab1271186"
  if (abaAtiva) {
    const idMatch = abaAtiva.id.match(/^tab(\d+)$/);

    if (idMatch) {
      numero = idMatch[1];
    }
  }

  // Fonte 2: data-tab-group
  if (!numero && abaAtiva) {

    const link = abaAtiva.querySelector('a[data-tab-group]');

    if (link) {
      numero = link.dataset.tabGroup || '';
    }
  }

  // Fonte 3: mensagem automática do chat
  if (!numero && divConteudo) {

    const walker = document.createTreeWalker(
      divConteudo,
      NodeFilter.SHOW_TEXT
    );

    let node;

    while ((node = walker.nextNode())) {

      const match = node.textContent.match(
        /Esta conversa vai gerar o ticket\s+(\d+)/i
      );

      if (match) {
        numero = match[1];
        break;
      }
    }
  }

  // ─────────────────────────────────────────
  // RAZÃO SOCIAL
  // ─────────────────────────────────────────
  let razaoSocial = '';

  // =========================================================
  // FONTE 1 (PRIORIDADE MÁXIMA)
  // span.md-select-client-name
  // =========================================================
  if (divConteudo) {

    const el = divConteudo.querySelector(
      'span.md-select-client-name'
    );

    if (el) {

      const texto = el.textContent?.trim();

      if (
        texto &&
        texto.length > 2 &&
        texto !== 'Tairony Cristian'
      ) {
        razaoSocial = texto;
      }
    }
  }

  // =========================================================
  // FONTE 2
  // breadcrumb do ticket ativo
  // =========================================================
  if (!razaoSocial && numero) {

    const ticketLi = document.querySelector(
      `ol.ticket-breadcrumb li.ticket[data-id="${numero}"]`
    );

    if (ticketLi) {

      const ol = ticketLi.closest('ol');

      const clientSpan = ol?.querySelector(
        'li.client span.breadcrumb-item'
      );

      if (clientSpan) {

        const clone = clientSpan.cloneNode(true);

        // Remove ícones
        clone.querySelectorAll('i').forEach(i => i.remove());

        const texto = clone.textContent?.trim();

        if (
          texto &&
          texto.length > 2 &&
          !/^\d+$/.test(texto)
        ) {
          razaoSocial = texto;
        }
      }
    }
  }

  // =========================================================
  // FONTE 3
  // createdBy.action-email-popover-active
  // =========================================================
  if (!razaoSocial && divConteudo) {

    const el = divConteudo.querySelector(
      '.createdBy.action-email-popover-active'
    );

    if (el) {

      const texto = el.textContent?.trim();

      if (
        texto &&
        texto.length > 2 &&
        texto !== 'Tairony Cristian' &&
        !texto.includes('@')
      ) {
        razaoSocial = texto;
      }
    }
  }

  // =========================================================
  // FONTE 4
  // Qualquer "user" que esteja em MAIÚSCULO
  // =========================================================
  if (!razaoSocial && divConteudo) {

    const users = divConteudo.querySelectorAll('.user');

    for (const user of users) {

      const texto = user.textContent?.trim();

      if (
        texto &&
        texto === texto.toUpperCase() &&
        texto.length > 5
      ) {
        razaoSocial = texto;
        break;
      }
    }
  }

  // =========================================================
  // FALLBACK FINAL
  // =========================================================
  if (!razaoSocial) {
    razaoSocial = 'Cliente não identificado';
  }

  log(`🎫 Ticket: #${numero} | Cliente: ${razaoSocial}`);

  return {
    numero,
    razaoSocial
  };
},

    // ⭐ FUNÇÃO AUXILIAR: Clicar em todos os botões "Carregar mais"
    clicarEmCarregarMais: async function() {
      return new Promise((resolve) => {
        resolve(); // resolve imediatamente, o loop é async abaixo
      });
    },

    // ⭐ LOOP REAL: Clica em todos os botões "Carregar mais" até não restar nenhum
    clicarEmCarregarMaisLoop: async function() {
      const AGUARDO_MS = 3000;
      const MAX_CLIQUES = 30;
      let totalCliques = 0;

      while (totalCliques < MAX_CLIQUES) {
        const xpath = "//button[contains(text(), 'Carregar mais')]";
        const botao = document.evaluate(xpath, document, null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

        if (!botao || botao.offsetParent === null) {
          log(`✅ Sem mais botões 'Carregar mais'. Cliques: ${totalCliques}`);
          break;
        }
        totalCliques++;
        log(`🔘 Clique ${totalCliques} em 'Carregar mais'...`);
        botao.click();
        await new Promise(r => setTimeout(r, AGUARDO_MS));
      }
      if (totalCliques >= MAX_CLIQUES) log(`⚠️ Limite de ${MAX_CLIQUES} cliques atingido.`);
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

  if (request.action === 'colarNaDocumentacao') {
    (async () => {
      try {
        const htmlResumo = request.html || '';
        if (!htmlResumo) {
          sendResponse({ success: false, erro: 'HTML vazio' });
          return;
        }

        // Aguarda o editor Froala aparecer e estar pronto para receber foco.
        // O Movidesk é SPA: o fr-element pode ser inserido no DOM mas ainda
        // não estar inicializado pelo Froala. Por isso usamos polling com intervalo
        // em vez de só MutationObserver (que dispara cedo demais).
        const editorSelector = '#ticket-description-container .fr-element[contenteditable="true"]';

        const editor = await new Promise((resolve) => {
          let tentativas = 0;
          const MAX_TENTATIVAS = 40; // 40 × 250ms = 10 segundos

          const intervalo = setInterval(() => {
            tentativas++;
            const el = document.querySelector(editorSelector);

            if (el) {
              clearInterval(intervalo);
              log(`✅ Editor encontrado após ${tentativas} tentativa(s)`);
              resolve(el);
              return;
            }

            if (tentativas >= MAX_TENTATIVAS) {
              clearInterval(intervalo);
              log('❌ Editor não encontrado após 10s de espera');
              resolve(null);
            }
          }, 250);
        });

        if (!editor) {
          log('❌ Editor de documentação não encontrado após aguardar');
          sendResponse({ success: false, erro: 'Editor não encontrado. Abra a aba de documentação do ticket.' });
          return;
        }

        // Foca no editor para ativar o Froala
        editor.focus();

        // Cria um div temporário com o HTML do resumo + separador
        const separador = '<hr style="border:none;border-top:1px solid #ddd;margin:12px 0;">';
        const htmlParaColar = `<div>${htmlResumo}${separador}</div>`;

        // Move o cursor para o início absoluto do editor
        const range = document.createRange();
        const sel = window.getSelection();
        range.setStart(editor, 0);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);

        // Injeta via execCommand (compatível com Froala/contenteditable)
        const sucesso = document.execCommand('insertHTML', false, htmlParaColar);

        if (sucesso) {
          log('✅ Resumo colado na documentação com sucesso');
          // Dispara evento input para o Froala detectar a mudança
          editor.dispatchEvent(new Event('input', { bubbles: true }));
          editor.dispatchEvent(new Event('keyup', { bubbles: true }));
          sendResponse({ success: true });
        } else {
          // Fallback: inserção direta no DOM antes do primeiro filho
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = htmlParaColar;
          const fragment = document.createDocumentFragment();
          while (tempDiv.firstChild) fragment.appendChild(tempDiv.firstChild);
          editor.insertBefore(fragment, editor.firstChild);
          editor.dispatchEvent(new Event('input', { bubbles: true }));
          log('✅ Resumo colado via fallback DOM');
          sendResponse({ success: true });
        }

      } catch (err) {
        log('❌ Erro ao colar na documentação: ' + err.message);
        sendResponse({ success: false, erro: err.message });
      }
    })();
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