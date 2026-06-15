console.log('[ChatSum] Popup carregado');

// ============================================
// ELEMENTOS DOM
// ============================================

const btnCapturar = document.getElementById('resumir');
const btnCopiar = document.getElementById('copiarResumo');
const btnApagar = document.getElementById('apagarResumo');
const btnConfig = document.getElementById('abrirConfig');
const selectModo = document.getElementById('modoResumo');
const selectIa = document.getElementById('iaProvider');
const statusDiv = document.getElementById('status');
const resultadoPre = document.getElementById('resultado');
const contadorDiv = document.getElementById('contador');

// ============================================
// ELEMENTOS DOM - HISTÓRICO
// ============================================

const tabResumir      = document.getElementById('tabResumir');
const tabHistorico    = document.getElementById('tabHistorico');
const abaResumir      = document.getElementById('abaResumir');
const abaHistorico    = document.getElementById('abaHistorico');
const historicoVazio  = document.getElementById('historicoVazio');
const historicoCont   = document.getElementById('historicoConteudo');
const historicoIndice = document.getElementById('historicoIndice');
const btnHistAnt      = document.getElementById('btnHistAnterior');
const btnHistProx     = document.getElementById('btnHistProximo');
const histRazaoSocial = document.getElementById('histRazaoSocial');
const histTicket      = document.getElementById('histTicket');
const histIA          = document.getElementById('histIA');
const histHora        = document.getElementById('histHora');
const histResumo      = document.getElementById('histResumo');
const btnCopiarHist   = document.getElementById('btnCopiarHist');

// ============================================
// ESTADO GLOBAL DO POPUP
// ============================================

let ultimoResumoTimestamp = null;
let historicoAtual = [];   // Array com os últimos 10 resumos
let indiceHist = 0;        // Índice do resumo sendo visualizado (0 = mais recente)
let countdownInterval = null;  // Controla o timer regressivo
let providersCache = null;     // Cache de provedores configurados

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function setStatus(texto, tipo = 'info') {
    console.log(`[Status] ${texto}`);
    statusDiv.textContent = texto;
    statusDiv.className = `status status-${tipo}`;
}

function obterDataHoje() {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
}

async function atualizarContador() {
    const dataHoje = obterDataHoje();
    const data = await chrome.storage.local.get(['contadorRequisicoes', 'dataContador']);

    let contador = data.contadorRequisicoes || 0;
    const dataArmazenada = data.dataContador;

    if (dataArmazenada !== dataHoje) {
        contador = 0;
        await chrome.storage.local.set({
            contadorRequisicoes: 0,
            dataContador: dataHoje
        });
    }

    contadorDiv.textContent = `📊 Requisições hoje: ${contador}`;
}

async function incrementarContador() {
    const dataHoje = obterDataHoje();
    const data = await chrome.storage.local.get(['contadorRequisicoes', 'dataContador']);

    let contador = data.contadorRequisicoes || 0;
    const dataArmazenada = data.dataContador;

    if (dataArmazenada !== dataHoje) {
        contador = 0;
    }

    contador++;

    await chrome.storage.local.set({
        contadorRequisicoes: contador,
        dataContador: dataHoje
    });

    contadorDiv.textContent = `📊 Requisições hoje: ${contador}`;
}

function formatarResumo(resumo) {
    let html = resumo
        .replace(/\*\*(.*?)\*\*/gs, '<b>$1</b>')
        .replace(/\n/g, '<br>');

    html = html
        .replace(/<b>PROBLEMA:<\/b>/gi, '🔴 <span style="color: #E53E3E;"><b>PROBLEMA RELATADO:</b></span>')
        .replace(/<b>ANÁLISE:<\/b>/gi, '🟡 <span style="color: #D69E2E;"><b>ANÁLISE TÉCNICA:</b></span>')
        .replace(/<b>SOLUÇÃO:<\/b>/gi, '🟢 <span style="color: #38A169;"><b>SOLUÇÃO APRESENTADA:</b></span>');

    return html;
}

async function carregarModoResumo() {
    const data = await chrome.storage.local.get(['modoResumo', 'iaProvider']);
    selectModo.value = data.modoResumo || 'ultimo_tecnico';
    if (selectIa) selectIa.value = data.iaProvider || 'gemini';
}

async function obterServerUrl() {
    try {
        const config = await chrome.storage.local.get(['modoDesenvolvedor', 'serverUrl']);

        // Modo desenvolvedor marcado → localhost
        if (config.modoDesenvolvedor === true) {
            console.log('[Servidor] Modo Desenvolvedor: localhost');
            return 'http://localhost:8000';
        }

        // URL remota configurada
        if (config.serverUrl && config.serverUrl.trim()) {
            console.log('[Servidor] Usando URL configurada:', config.serverUrl);
            return config.serverUrl.trim();
        }

        // Fallback
        console.log('[Servidor] Usando localhost (padrão)');
        return 'http://localhost:8000';
    } catch (erro) {
        console.error('[Servidor] Erro ao obter URL:', erro);
        return 'http://localhost:8000';
    }
}

// ============================================
// FUNÇÃO DE CÓPIA
// ============================================

/**
 * Copia o resumo para clipboard em formato HTML e texto plano.
 * Se a configuração "copiarImagens" estiver ativa, inclui as imagens abaixo do resumo.
 * @returns {Promise<boolean>} true se copiou com sucesso
 */
async function copiarResumoParaClipboard() {
    try {
        const htmlContent = resultadoPre.innerHTML;

        if (!htmlContent) {
            console.log('[ChatSum] Sem conteúdo para copiar');
            return false;
        }

        // Verifica se deve incluir imagens
        const config = await chrome.storage.local.get(['copiarImagens', 'imagensCapturadas']);
        const incluirImagens = config.copiarImagens || false;
        const imagens = config.imagensCapturadas || [];

        // Monta bloco de imagens se necessário
        let htmlImagens = '';
        let textoImagens = '';
        if (incluirImagens && imagens.length > 0) {
            htmlImagens = `
<hr style="margin: 16px 0; border: none; border-top: 1px solid #ddd;">
<p style="margin: 8px 0; font-weight: bold; color: #555;">📎 Imagens do Chat (${imagens.length}):</p>
<div style="display: flex; flex-direction: column; gap: 12px; margin-top: 8px;">
` + imagens.map(img => `
  <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 6px; background: #fafafa;">
    <small style="color: #888; display: block; margin-bottom: 4px;">[${img.hora || ''}] ${img.autor || ''}</small>
    <img src="${img.url}" alt="Imagem do chat" style="max-width: 480px; max-height: 400px; display: block; border-radius: 2px;">
  </div>`).join('') + `
</div>`;
            textoImagens = '\n\n--- IMAGENS DO CHAT ---\n' +
                imagens.map(img => `[${img.hora || ''}] ${img.autor || ''}: ${img.url}`).join('\n');
            console.log(`[ChatSum] Incluindo ${imagens.length} imagem(ns) no clipboard`);
        }

        // Converte HTML para texto limpo (fallback)
        const textoLimpo = htmlContent
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<b>(.*?)<\/b>/gi, '$1')
            .replace(/<span[^>]*>(.*?)<\/span>/gi, '$1')
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .trim() + textoImagens;

        // Prepara HTML completo com estilos inline
        const htmlCompleto = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; font-size: 13px; color: #333; line-height: 1.6;">
    ${htmlContent}
    ${htmlImagens}
</body>
</html>
        `.trim();

        // Copia nos dois formatos
        const blob = new Blob([htmlCompleto], { type: 'text/html' });
        const textBlob = new Blob([textoLimpo], { type: 'text/plain' });

        await navigator.clipboard.write([
            new ClipboardItem({ 'text/html': blob, 'text/plain': textBlob })
        ]);

        console.log('[ChatSum] Resumo copiado para clipboard!');
        return true;

    } catch (err) {
        console.error('[ChatSum] Erro ao copiar:', err);

        // Fallback: copia apenas texto limpo
        try {
            const textoLimpo = resultadoPre.innerHTML
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<[^>]*>/g, '')
                .trim();
            await navigator.clipboard.writeText(textoLimpo);
            console.log('[ChatSum] Resumo copiado (texto simples)');
            return true;
        } catch (fallbackErr) {
            console.error('[ChatSum] Falha no fallback também:', fallbackErr);
            return false;
        }
    }
}

// ============================================
// COUNTDOWN REGRESSIVO (limite por minuto)
// ============================================

/**
 * Inicia contador regressivo no status.
 * Bloqueia o botão e libera automaticamente ao fim.
 * @param {number} segundos - Tempo a aguardar
 */
function iniciarCountdown(segundos) {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }

    btnCapturar.disabled = true;
    let restante = segundos;

    function atualizar() {
        if (restante <= 0) {
            clearInterval(countdownInterval);
            countdownInterval = null;
            btnCapturar.disabled = false;
            setStatus('✅ Pronto! Pode tentar novamente.', 'ok');
            return;
        }
        setStatus(`⏳ Aguarde ${restante}s para tentar novamente...`, 'aviso');
        restante--;
    }

    atualizar();
    countdownInterval = setInterval(atualizar, 1000);
}

// ============================================
// ENVIO COM RETRY TRANSPARENTE (502 / timeout)
// ============================================

/**
 * Envia para servidor com retry automático apenas para falhas de rede (502, timeout).
 * Erros de quota (429) são tratados separadamente com mensagens distintas.
 *
 * @param {string} serverUrl - URL base do servidor
 * @param {Object} payload - Dados a enviar
 * @returns {Promise<Response|null>} Response em caso de sucesso, null em caso de falha
 */
async function enviarParaServidor(serverUrl, payload) {
    const MAX_TENTATIVAS = 3;
    const AGUARDO_MS = 2000;

    console.log('[ChatSum] Iniciando envio (máx 3 tentativas para erros de rede)');

    for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
        try {
            console.log(`[ChatSum] Tentativa ${tentativa}/${MAX_TENTATIVAS}...`);

            if (tentativa > 1) {
                console.log(`[ChatSum] Aguardando ${AGUARDO_MS}ms...`);
                await new Promise(r => setTimeout(r, AGUARDO_MS));
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const response = await fetch(`${serverUrl}/resumidor/resumir`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            console.log(`[ChatSum] Status: ${response.status}`);

            // ✅ Sucesso
            if (response.ok) {
                console.log(`[ChatSum] Sucesso na tentativa ${tentativa}`);
                return response;
            }

            // ── QUOTA / RATE LIMIT (429) ─────────────────────────────
            // Não retenta — trata imediatamente com mensagem adequada
            if (response.status === 429) {
                let errorData = {};
                try { errorData = await response.json(); } catch (_) {}

                const quotaType = errorData.quota_type || 'unknown';
                const retryAfter = errorData.retry_after || null;

                if (quotaType === 'daily') {
                    console.error('[ChatSum] Limite DIÁRIO atingido');
                    resultadoPre.innerHTML = `
                        <div style="padding:12px;background:#fff5f5;border:1px solid #fc8181;border-radius:6px;color:#c53030;font-size:13px;line-height:1.6;">
                            <strong>🚫 Limite diário atingido</strong><br><br>
                            O plano gratuito da Google AI permite <strong>20 requisições por dia</strong>.<br>
                            O limite será renovado à meia-noite.<br><br>
                            <strong>Opções:</strong><br>
                            • Aguarde até amanhã<br>
                            • Troque para <strong>Groq</strong> ou <strong>GPT</strong> no seletor de IA
                        </div>`;
                    setStatus('🚫 Limite diário atingido. Tente Groq ou GPT!', 'erro');
                    btnCapturar.disabled = false;

                } else if (quotaType === 'per_minute' && retryAfter) {
                    console.warn(`[ChatSum] Limite por MINUTO. Aguardando ${retryAfter}s`);
                    resultadoPre.innerHTML = `
                        <div style="padding:12px;background:#fffbeb;border:1px solid #f6ad55;border-radius:6px;color:#7b341e;font-size:13px;line-height:1.6;">
                            <strong>⏳ Muitas requisições por minuto</strong><br><br>
                            O botão será liberado automaticamente quando puder tentar novamente.
                        </div>`;
                    iniciarCountdown(retryAfter);

                } else {
                    console.error('[ChatSum] 429 sem quota_type identificado');
                    setStatus('⚠️ Limite da API atingido. Tente outro provedor de IA.', 'erro');
                    btnCapturar.disabled = false;
                }

                return null;
            }

            // ── ERRO DE GATEWAY (502) — retenta ──────────────────────
            if (response.status === 502 && tentativa < MAX_TENTATIVAS) {
                console.warn(`[ChatSum] HTTP 502 — tentando novamente...`);
                continue;
            }

            // ── OUTROS ERROS HTTP ─────────────────────────────────────
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);

        } catch (erro) {
            if (erro.name === 'AbortError') {
                console.warn(`[ChatSum] Timeout na tentativa ${tentativa}`);
                if (tentativa < MAX_TENTATIVAS) continue;
            }

            if (tentativa === MAX_TENTATIVAS) {
                console.error('[ChatSum] Falha após todas as tentativas:', erro.message);
                setStatus('❌ Erro ao conectar com servidor', 'erro');
                return null;
            }

            console.warn(`[ChatSum] Tentativa ${tentativa} falhou: ${erro.message}`);
        }
    }

    setStatus('❌ Erro ao conectar com servidor', 'erro');
    return null;
}

// ============================================
// VERIFICAÇÃO DE PROVIDER DISPONÍVEL
// ============================================

async function carregarProviders() {
    try {
        const serverUrl = await obterServerUrl();
        const response = await fetch(`${serverUrl}/resumidor/providers`, {
            signal: AbortSignal.timeout(5000)
        });
        if (response.ok) {
            providersCache = await response.json();
            console.log('[ChatSum] Providers disponíveis:', providersCache);
        }
    } catch (err) {
        console.warn('[ChatSum] Não foi possível verificar providers:', err.message);
        providersCache = null;
    }
}

function verificarProviderSelecionado(provider) {
    if (!providersCache) return; // servidor offline, deixa passar

    const nomes = { gemini: 'Google Gemini', groq: 'Groq', openai: 'OpenAI (GPT)' };
    const configurado = providersCache[provider];

    if (!configurado) {
        const nome = nomes[provider] || provider;
        const links = {
            gemini: '<a href="https://aistudio.google.com/apikey" target="_blank" style="color:#6d4c00;">aistudio.google.com</a>',
            groq:   '<a href="https://console.groq.com/keys" target="_blank" style="color:#6d4c00;">console.groq.com</a>',
            openai: '<a href="https://platform.openai.com/api-keys" target="_blank" style="color:#6d4c00;">platform.openai.com</a>'
        };
        resultadoPre.innerHTML = `
            <div style="padding:12px;background:#fff8e1;border:1px solid #ffc107;border-radius:6px;color:#6d4c00;font-size:13px;line-height:1.7;">
                <strong>⚠️ Nenhuma chave API configurada para ${nome}</strong><br><br>
                Adicione no arquivo <code>.env</code> do servidor e reinicie:<br>
                <code>${{ gemini: 'GEMINI_API_KEY', groq: 'GROQ_API_KEY', openai: 'OPENAI_API_KEY' }[provider]}=sua_chave</code>
                &mdash; ${links[provider] || ''}<br><br>
                Ou selecione outra IA disponível para gerar o resumo.
            </div>`;
        btnCapturar.disabled = true;
        setStatus('⚠️ IA sem chave configurada.', 'erro');
    } else {
        // Limpa aviso se havia um e o provider agora está ok
        if (resultadoPre.innerHTML.includes('Nenhuma chave API configurada')) {
            resultadoPre.innerHTML = '';
        }
        btnCapturar.disabled = false;
        const nomeCurto = { gemini: 'Gemini', groq: 'Groq', openai: 'GPT' };
        setStatus(`IA: ${nomeCurto[provider] || provider}`, 'info');
    }
}

// ============================================
// HISTÓRICO DE RESUMOS
// ============================================

const MAX_HISTORICO = 10;

/**
 * Salva novo resumo no histórico (máximo 10, mais recente primeiro)
 */
async function salvarNoHistorico(resumoHtml, resumoOriginal, ticket) {
    const data = await chrome.storage.local.get('historicoResumos');
    let hist = data.historicoResumos || [];

    // Evita duplicatas: verifica se o resumo já existe no histórico
    // Compara os primeiros 200 chars do texto original
    const assinatura = (resumoOriginal || '').substring(0, 200);
    const jaExiste = hist.some(item =>
        (item.resumoOriginal || '').substring(0, 200) === assinatura
    );

    if (jaExiste) {
        console.log('[Histórico] Resumo já existe no histórico, ignorando duplicata.');
        return;
    }

    const agora = new Date();
    const item = {
        resumoHtml,
        resumoOriginal,
        razaoSocial: ticket?.razaoSocial || '',
        numero: ticket?.numero || '',
        iaUsada: ticket?.iaUsada || 'gemini',
        hora: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        data: agora.toLocaleDateString('pt-BR'),
        timestamp: agora.toISOString()
    };

    // Adiciona no início (mais recente primeiro) e limita a 10
    hist.unshift(item);
    if (hist.length > MAX_HISTORICO) hist = hist.slice(0, MAX_HISTORICO);

    await chrome.storage.local.set({ historicoResumos: hist });
    historicoAtual = hist;
    console.log(`[Histórico] Salvo. Total: ${hist.length}`);
}

/**
 * Carrega histórico do storage
 */
async function carregarHistorico() {
    const data = await chrome.storage.local.get('historicoResumos');
    historicoAtual = data.historicoResumos || [];
    indiceHist = 0;
}

/**
 * Renderiza o item atual do histórico na aba
 */
function renderizarHistorico() {
    if (historicoAtual.length === 0) {
        historicoVazio.style.display = 'block';
        historicoCont.style.display = 'none';
        return;
    }

    historicoVazio.style.display = 'none';
    historicoCont.style.display = 'block';

    const item = historicoAtual[indiceHist];
    const total = historicoAtual.length;

    // Índice (ex: 1 / 5)
    historicoIndice.textContent = `${indiceHist + 1} / ${total}`;

    // Navegação
    btnHistAnt.disabled = indiceHist <= 0;
    btnHistProx.disabled = indiceHist >= total - 1;

    // Metadados
    histRazaoSocial.textContent = item.razaoSocial || '—';
    histTicket.textContent = item.numero ? `#${item.numero}` : '—';
    histIA.textContent = { gemini: '✨ Gemini', groq: '⚡ Groq', openai: '🧠 GPT' }[item.iaUsada] || item.iaUsada;
    histHora.textContent = `${item.data} ${item.hora}`;

    // Resumo — re-aplica formatação a partir do texto original
    // Garante que o HTML completo seja renderizado mesmo que o resumoHtml salvo esteja incompleto
    if (item.resumoOriginal) {
        histResumo.innerHTML = formatarResumo(item.resumoOriginal);
    } else {
        histResumo.innerHTML = item.resumoHtml || '';
    }
}

/**
 * Atualiza campo editável do histórico e salva no storage
 */
async function editarCampoHistorico(campo, valor) {
    if (historicoAtual.length === 0) return;
    historicoAtual[indiceHist][campo] = valor;
    await chrome.storage.local.set({ historicoResumos: historicoAtual });
}

// ============================================
// EVENTO: MUDANÇA DE MODO
// ============================================

selectModo.addEventListener('change', async () => {
    const modo = selectModo.value;
    await chrome.storage.local.set({ modoResumo: modo });
    console.log('[ChatSum] Modo alterado para:', modo);
    setStatus(`Modo: ${modo === 'ultimo_tecnico' ? 'Último Técnico' : 'Completo'}`, 'info');
});

// ============================================
// EVENTO: MUDANÇA DE PROVEDOR DE IA
// ============================================

if (selectIa) {
    selectIa.addEventListener('change', async () => {
        const ia = selectIa.value;
        await chrome.storage.local.set({ iaProvider: ia });
        console.log('[ChatSum] IA alterada para:', ia);
        verificarProviderSelecionado(ia);
    });
}

// ============================================
// EVENTO: ABRIR CONFIGURAÇÕES
// ============================================

btnConfig.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
});

// ============================================
// EVENTOS: ABAS E HISTÓRICO
// ============================================

// Troca de aba
[tabResumir, tabHistorico].forEach(tab => {
    tab.addEventListener('click', () => {
        const isHistorico = tab.dataset.tab === 'historico';
        tabResumir.classList.toggle('active', !isHistorico);
        tabHistorico.classList.toggle('active', isHistorico);
        abaResumir.classList.toggle('active', !isHistorico);
        abaHistorico.classList.toggle('active', isHistorico);
        if (isHistorico) renderizarHistorico();
    });
});

// Navegação ◀ ▶
btnHistAnt.addEventListener('click', () => {
    if (indiceHist > 0) { indiceHist--; renderizarHistorico(); }
});
btnHistProx.addEventListener('click', () => {
    if (indiceHist < historicoAtual.length - 1) { indiceHist++; renderizarHistorico(); }
});

// Edição inline — razão social
histRazaoSocial.addEventListener('click', () => {
    const atual = histRazaoSocial.textContent === '—' ? '' : histRazaoSocial.textContent;
    const novo = prompt('Editar razão social:', atual);
    if (novo !== null) {
        histRazaoSocial.textContent = novo || '—';
        editarCampoHistorico('razaoSocial', novo);
    }
});

// Edição inline — ticket
histTicket.addEventListener('click', () => {
    const atual = histTicket.textContent.replace('#', '').trim();
    const novo = prompt('Editar número do ticket:', atual === '—' ? '' : atual);
    if (novo !== null) {
        histTicket.textContent = novo ? `#${novo}` : '—';
        editarCampoHistorico('numero', novo);
    }
});

// Copiar resumo do histórico
btnCopiarHist.addEventListener('click', async () => {
    if (historicoAtual.length === 0) return;
    const item = historicoAtual[indiceHist];

    // Usa resumoOriginal (markdown completo) para texto limpo
    // e resumoHtml para formato rico
    const textoLimpo = item.resumoOriginal || '';
    const htmlCompleto = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;font-size:13px;color:#333;line-height:1.6;">
${item.resumoHtml || ''}
</body></html>`.trim();

    try {
        const blob = new Blob([htmlCompleto], { type: 'text/html' });
        const textBlob = new Blob([textoLimpo], { type: 'text/plain' });
        await navigator.clipboard.write([
            new ClipboardItem({ 'text/html': blob, 'text/plain': textBlob })
        ]);
    } catch {
        // Fallback: copia texto limpo
        try {
            await navigator.clipboard.writeText(textoLimpo);
        } catch (err) {
            console.error('[Histórico] Erro ao copiar:', err);
            return;
        }
    }

    const original = btnCopiarHist.textContent;
    btnCopiarHist.textContent = '✅ Copiado!';
    setTimeout(() => { btnCopiarHist.textContent = original; }, 2000);
});

// ============================================
// EVENTO: CAPTURAR E RESUMIR
// ============================================

btnCapturar.addEventListener('click', async () => {
    console.log('[ChatSum] Botão capturar clicado');

    try {
        btnCapturar.disabled = true;
        resultadoPre.innerHTML = '';
        btnCopiar.style.display = 'none';
        btnApagar.style.display = 'none';
        setStatus('⏳ Capturando chat...', 'info');

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log('[ChatSum] Aba atual:', tab.id, tab.url);

        const modo = selectModo.value;
        const iaProvider = selectIa ? selectIa.value : 'gemini';
        console.log('[ChatSum] Modo selecionado:', modo, '| IA:', iaProvider);

        chrome.tabs.sendMessage(
            tab.id,
            { action: 'coletarChat' },
            async (response) => {
                console.log('[ChatSum] Resposta do content script:', response);

                if (chrome.runtime.lastError) {
                    console.error('[ChatSum] Erro runtime:', chrome.runtime.lastError);
                    setStatus('❌ Erro: ' + chrome.runtime.lastError.message, 'erro');
                    btnCapturar.disabled = false;
                    return;
                }

                if (!response) {
                    console.error('[ChatSum] Resposta vazia');
                    setStatus('❌ Sem resposta do content script', 'erro');
                    btnCapturar.disabled = false;
                    return;
                }

                if (!response.success) {
                    console.error('[ChatSum] Captura falhou:', response.chat);
                    setStatus('❌ ' + response.chat, 'erro');
                    btnCapturar.disabled = false;
                    return;
                }

                if (response.chat.length < 50) {
                    setStatus('❌ Chat muito curto (mínimo 50 caracteres)', 'erro');
                    btnCapturar.disabled = false;
                    return;
                }

                console.log('[ChatSum] Chat capturado:', response.chat.length, 'caracteres');
                setStatus('⏳ Chat capturado! Enviando para IA...', 'info');

                // Salvar chat em progresso como backup
                await chrome.storage.local.set({
                    chatEmProcessamento: response.chat,
                    ultimoTecnicoEmProcessamento: response.ultimoTecnico || '',
                    modoEmProcessamento: modo,
                    timestampProcessamento: new Date().toISOString(),
                    imagensCapturadas: response.imagens || []
                });
                console.log('[ChatSum] Chat salvo em progresso (backup) | Imagens:', (response.imagens || []).length);

                try {
                    const config = await chrome.storage.local.get([
                        'promptAtivo',
                        'promptPersonalizado',
                        'autoCopiar',
                        'copiarImagens',
                        'imagensCapturadas'
                    ]);

                    const payloadResumo = {
                        texto: response.chat,
                        ultimoTecnico: response.ultimoTecnico || '',
                        modo: modo,
                        iaProvider: iaProvider
                    };

                    // Adiciona prompt custom se selecionado
                    if (config.promptAtivo === 'custom' && config.promptPersonalizado) {
                        payloadResumo.promptCustom = config.promptPersonalizado;
                    }

                    const serverUrl = await obterServerUrl();
                    const serverResponse = await enviarParaServidor(serverUrl, payloadResumo);

                    if (!serverResponse) {
                        btnCapturar.disabled = false;
                        return;
                    }

                    const result = await serverResponse.json();
                    console.log('[ChatSum] Resumo recebido:', result.resumo.length, 'caracteres');

                    if (result.resumo) {
                        const htmlFormatado = formatarResumo(result.resumo);
                        resultadoPre.innerHTML = htmlFormatado;
                        resultadoPre.scrollTop = 0;

                        btnCapturar.style.display = 'none';
                        btnCopiar.style.display = 'inline-block';
                        btnApagar.style.display = 'inline-block';

                        // Verifica se houve fallback de IA
                        const iaUsada = result.iaUsada || iaProvider;
                        const iaSolicitada = result.iaSolicitada || iaProvider;
                        const nomeIA = { gemini: 'Gemini', groq: 'Groq', openai: 'GPT (OpenAI)' };

                        if (iaUsada !== iaSolicitada) {
                            setStatus(`⚠️ Resumo gerado via ${nomeIA[iaUsada] || iaUsada} (fallback — ${nomeIA[iaSolicitada] || iaSolicitada} indisponível)`, 'aviso');
                        } else {
                            setStatus(`✅ Resumo gerado com sucesso via ${nomeIA[iaUsada] || iaUsada}!`, 'ok');
                        }

                        await incrementarContador();

                        // Salvar resumo completo no storage
                        const agora = new Date().toISOString();
                        await chrome.storage.local.set({
                            ultimoResumo: htmlFormatado,
                            ultimoResumoOriginal: result.resumo,
                            timestampResumo: result.timestamp || agora,
                            ultimoTecnico: result.ultimoTecnico || response.ultimoTecnico || '',
                            modoResumo: modo,
                            // Preserva imagensCapturadas para uso no clipboard
                            // Limpa backups em progresso após sucesso
                            chatEmProcessamento: null,
                            ultimoTecnicoEmProcessamento: null,
                            modoEmProcessamento: null,
                            timestampProcessamento: null
                        });

                        ultimoResumoTimestamp = result.timestamp || agora;
                        console.log('[ChatSum] Resumo salvo com sucesso no storage');

                        // Salva no histórico
                        await salvarNoHistorico(htmlFormatado, result.resumo, {
                            razaoSocial: response.ticket?.razaoSocial || '',
                            numero: response.ticket?.numero || '',
                            iaUsada: iaUsada
                        });

                        // Auto-copiar se configurado
                        if (config.autoCopiar) {
                            console.log('[ChatSum] Auto-copiar ativado...');
                            const sucesso = await copiarResumoParaClipboard();
                            if (sucesso) {
                                setStatus('📋 Copiado automaticamente!', 'ok');
                                setTimeout(() => setStatus(`✅ Resumo gerado via ${nomeIA[iaUsada] || iaUsada}!`, 'ok'), 2000);
                            }
                        }

                    } else {
                        setStatus('❌ Resumo vazio', 'erro');
                        btnCapturar.disabled = false;
                    }

                } catch (fetchError) {
                    console.error('[ChatSum] Erro ao conectar com servidor:', fetchError);
                    setStatus('❌ Servidor offline. Inicie o servidor Python!', 'erro');
                    btnCapturar.disabled = false;
                }
            }
        );

    } catch (error) {
        console.error('[ChatSum] Erro geral:', error);
        setStatus('❌ Erro: ' + error.message, 'erro');
        btnCapturar.disabled = false;
    }
});

// ============================================
// EVENTO: COPIAR RESUMO
// ============================================

btnCopiar.addEventListener('click', async () => {
    const sucesso = await copiarResumoParaClipboard();
    if (sucesso) {
        setStatus('📋 Resumo copiado!', 'ok');
        setTimeout(() => setStatus('', 'info'), 2000);
    } else {
        setStatus('❌ Erro ao copiar', 'erro');
    }
});

// ============================================
// EVENTO: APAGAR RESUMO
// ============================================

btnApagar.addEventListener('click', async () => {
    await chrome.storage.local.remove(['ultimoResumo', 'timestampResumo', 'imagensCapturadas']);

    resultadoPre.innerHTML = '';
    btnCapturar.style.display = 'inline-block';
    btnCapturar.disabled = false;
    btnCopiar.style.display = 'none';
    btnApagar.style.display = 'none';
    setStatus('Resumo apagado. Pronto para novo resumo.', 'info');
});

// ============================================
// INICIALIZAÇÃO
// ============================================

(async function init() {
    console.log('[ChatSum] Inicializando popup');

    await carregarModoResumo();
    await atualizarContador();
    await carregarProviders();
    await carregarHistorico();
    if (selectIa) verificarProviderSelecionado(selectIa.value);

    const dados = await chrome.storage.local.get([
        'chatEmProcessamento',
        'ultimoTecnicoEmProcessamento',
        'modoEmProcessamento',
        'timestampProcessamento'
    ]);

    console.log('[ChatSum] Verificando chat em processamento:', !!dados.chatEmProcessamento);

    // PRIORIDADE 1: Aba Resumir sempre começa limpa — histórico fica na aba Histórico
    setStatus('Aguardando ação...', 'info');

    // PRIORIDADE 2: Chat em processamento (fallback)
    if (dados.chatEmProcessamento) {
        console.log('[ChatSum] Recuperando chat em processamento (fallback)');
        resultadoPre.innerHTML = `
            <div style="padding: 15px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; color: #856404;">
                <strong>⚠️ Processamento Interrompido</strong><br><br>
                Seu chat foi capturado e está sendo processado pelo servidor.
                <br><br>
                <strong>O que fazer:</strong>
                <ol>
                    <li>Aguarde alguns segundos</li>
                    <li>Feche e reabra a extensão</li>
                    <li>O resumo deve aparecer quando pronto</li>
                </ol>
                <br>
                <small>Se não aparecer em 1 minuto, tente novamente.</small>
            </div>
        `;
        btnCapturar.style.display = 'inline-block';
        btnCopiar.style.display = 'none';
        btnApagar.style.display = 'none';
        setStatus('⏳ Aguardando resultado do servidor...', 'info');

        // Tenta recuperar resumo do servidor após 5 segundos
        setTimeout(async () => {
            console.log('[ChatSum] Tentando recuperar resumo do servidor...');
            try {
                const serverUrl = await obterServerUrl();
                const response = await fetch(`${serverUrl}/resumidor/ultimo-resumo`);
                if (response.ok) {
                    const result = await response.json();
                    const htmlFormatado = formatarResumo(result.resumo);
                    resultadoPre.innerHTML = htmlFormatado;
                    btnCapturar.style.display = 'none';
                    btnCopiar.style.display = 'inline-block';
                    btnApagar.style.display = 'inline-block';
                    setStatus('✅ Resumo recuperado do servidor!', 'ok');

                    await chrome.storage.local.set({
                        ultimoResumo: htmlFormatado,
                        ultimoResumoOriginal: result.resumo,
                        timestampResumo: result.timestamp,
                        chatEmProcessamento: null,
                        ultimoTecnicoEmProcessamento: null,
                        modoEmProcessamento: null,
                        timestampProcessamento: null
                    });

                    // Salva no histórico o resumo recuperado do servidor
                    await salvarNoHistorico(htmlFormatado, result.resumo, {
                        razaoSocial: '',
                        numero: '',
                        iaUsada: result.iaUsada || result.modelo || 'gemini'
                    });
                }
            } catch (err) {
                console.error('[ChatSum] Não conseguiu recuperar do servidor:', err);
            }
        }, 5000);
    }
    // PRIORIDADE 3: Nada pendente
    else {
        console.log('[ChatSum] Nenhum chat em processamento');
    }

    console.log('[ChatSum] Inicialização completa');
})();