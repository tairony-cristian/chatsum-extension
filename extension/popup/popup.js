console.log('[ChatSum] Popup carregado');

// ============================================
// ELEMENTOS DOM
// ============================================

const btnCapturar = document.getElementById('resumir');
const btnCopiar = document.getElementById('copiarResumo');
const btnApagar = document.getElementById('apagarResumo');
const btnConfig = document.getElementById('abrirConfig');
const selectModo = document.getElementById('modoResumo');
const statusDiv = document.getElementById('status');
const resultadoPre = document.getElementById('resultado');
const contadorDiv = document.getElementById('contador');

// ============================================
// ESTADO GLOBAL DO POPUP
// ============================================

let ultimoResumoTimestamp = null;

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
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\n/g, '<br>');
    
    html = html
        .replace(/<b>PROBLEMA:<\/b>/gi, '🔴 <span style="color: #E53E3E;"><b>PROBLEMA RELATADO:</b></span>')
        .replace(/<b>ANÁLISE:<\/b>/gi, '🟡 <span style="color: #D69E2E;"><b>ANÁLISE TÉCNICA:</b></span>')
        .replace(/<b>SOLUÇÃO:<\/b>/gi, '🟢 <span style="color: #38A169;"><b>SOLUÇÃO APRESENTADA:</b></span>');
    
    return html;
}

async function carregarModoResumo() {
    const { modoResumo } = await chrome.storage.local.get('modoResumo');
    selectModo.value = modoResumo || 'ultimo_tecnico';
}

// ============================================
// ✅ FUNÇÃO DE CÓPIA
// ============================================
/**
 * Copia o resumo para clipboard em formato HTML e texto plano
 * @param {string} statusMensagem - Mensagem a exibir após copiar
 * @returns {Promise<boolean>} true se copiou com sucesso
 */
async function copiarResumoParaClipboard(statusMensagem = '📋 Resumo copiado!') {
    try {
        const htmlContent = resultadoPre.innerHTML;
        
        if (!htmlContent) {
            console.log('[ChatSum] Sem conteúdo para copiar');
            return false;
        }
        
        // Converte HTML para texto limpo (fallback)
        const textoLimpo = htmlContent
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<b>(.*?)<\/b>/gi, '$1')
            .replace(/<span[^>]*>(.*?)<\/span>/gi, '$1')
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .trim();
        
        // Prepara HTML completo com estilos inline
        const htmlCompleto = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; font-size: 13px; color: #333; line-height: 1.6;">
    ${htmlContent}
</body>
</html>
        `.trim();
        
        // Copia nos dois formatos
        const blob = new Blob([htmlCompleto], { type: 'text/html' });
        const textBlob = new Blob([textoLimpo], { type: 'text/plain' });
        
        const clipboardItem = new ClipboardItem({
            'text/html': blob,
            'text/plain': textBlob
        });
        
        await navigator.clipboard.write([clipboardItem]);
        
        console.log('[ChatSum] Resumo copiado para clipboard!');
        return true;
        
    } catch (err) {
        console.error('[ChatSum] Erro ao copiar:', err);
        
        // Fallback: copia apenas texto limpo
        try {
            const htmlContent = resultadoPre.innerHTML;
            const textoLimpo = htmlContent
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<[^>]*>/g, '')
                .trim();
            
            await navigator.clipboard.writeText(textoLimpo);
            console.log('[ChatSum] Resumo copiado (texto simples) para clipboard!');
            return true;
        } catch (fallbackErr) {
            console.error('[ChatSum] Falha no fallback também:', fallbackErr);
            return false;
        }
    }
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
// EVENTO: ABRIR CONFIGURAÇÕES
// ============================================

btnConfig.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
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
        
        // Pega modo selecionado
        const modo = selectModo.value;
        console.log('[ChatSum] Modo selecionado:', modo);
        
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
                setStatus('✅ Chat capturado! Enviando para IA...', 'ok');
                
                // Salvar chat em progresso IMEDIATAMENTE
                // Assim, mesmo se popup fechar, há backup do chat
                await chrome.storage.local.set({
                    chatEmProcessamento: response.chat,
                    ultimoTecnicoEmProcessamento: response.ultimoTecnico || '',
                    modoEmProcessamento: modo,
                    timestampProcessamento: new Date().toISOString()
                });
                console.log('[ChatSum] Chat salvo em progresso (backup)');

                try {
                    const config = await chrome.storage.local.get([
                        'promptAtivo',
                        'promptPersonalizado',
                        'autoCopiar'
                    ]);

                    const payloadResumo = {
                        texto: response.chat,
                        ultimoTecnico: response.ultimoTecnico || '',
                        modo: modo
                    };

                    // ✅ Adiciona prompt custom SE selecionado
                    if (config.promptAtivo === 'custom' && config.promptPersonalizado) {
                        payloadResumo.promptCustom = config.promptPersonalizado;
                    }

                    const serverResponse = await fetch('http://localhost:8000/resumidor/resumir', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payloadResumo)
                    });
                    
                    console.log('[ChatSum] Status servidor:', serverResponse.status);
                    
                    if (serverResponse.status === 429) {
                        setStatus('⚠️ Limite diário da API atingido', 'erro');
                        btnCapturar.disabled = false;
                        return;
                    }
                    
                    if (!serverResponse.ok) {
                        const errorText = await serverResponse.text();
                        console.error('[ChatSum] Erro servidor:', errorText);
                        setStatus(`❌ Erro do servidor (${serverResponse.status})`, 'erro');
                        btnCapturar.disabled = false;
                        return;
                    }
                    
                    const result = await serverResponse.json();
                    console.log('[ChatSum] Resumo recebido:', result.resumo.length, 'caracteres');

                    if (result.resumo) {
                        // Formata para exibição
                        const htmlFormatado = formatarResumo(result.resumo);
                        resultadoPre.innerHTML = htmlFormatado;
                        resultadoPre.scrollTop = 0;
                        
                        btnCapturar.style.display = 'none';
                        btnCopiar.style.display = 'inline-block';
                        btnApagar.style.display = 'inline-block';
                        setStatus('✅ Resumo gerado com sucesso!', 'ok');
                        
                        await incrementarContador();
                        
                        // Salvar resumo COMPLETO (não em progresso)
                        const agora = new Date().toISOString();
                        await chrome.storage.local.set({
                            ultimoResumo: htmlFormatado,              // Versão HTML para exibição
                            ultimoResumoOriginal: result.resumo,      // Versão markdown para copiar
                            timestampResumo: result.timestamp || agora, // Data do resumo
                            ultimoTecnico: result.ultimoTecnico || response.ultimoTecnico || '',
                            modoResumo: modo,
                            // Limpar backups em progresso após sucesso
                            chatEmProcessamento: null,
                            ultimoTecnicoEmProcessamento: null,
                            modoEmProcessamento: null,
                            timestampProcessamento: null
                        });
                        
                        // Rastrear timestamp para validação
                        ultimoResumoTimestamp = result.timestamp || agora;
                        
                        console.log('[ChatSum] Resumo salvo com sucesso no storage');

                        // ✅ AUTO-COPIAR: Usar função única
                        if (config.autoCopiar) {
                            console.log('[ChatSum] Auto-copiar ativado, copiando resumo...');
                            const sucesso = await copiarResumoParaClipboard('📋 Copiado automaticamente!');
                            
                            if (sucesso) {
                                setStatus('📋 Copiado automaticamente!', 'ok');
                                setTimeout(() => setStatus('✅ Resumo gerado com sucesso!', 'ok'), 2000);
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
    // ✅ Usar função única de cópia
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
    await chrome.storage.local.remove(['ultimoResumo', 'timestampResumo']);
    
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
    
    // Primeiro, tenta carregar resumo principal
    const dados = await chrome.storage.local.get([
        'ultimoResumo',
        'ultimoResumoOriginal',
        'timestampResumo',
        'chatEmProcessamento',
        'ultimoTecnicoEmProcessamento',
        'modoEmProcessamento',
        'timestampProcessamento'
    ]);
    
    console.log('[ChatSum] Dados recuperados do storage:', {
        temResumo: !!dados.ultimoResumo,
        temBackupChat: !!dados.chatEmProcessamento,
        temTimestamp: !!dados.timestampResumo
    });
    
    // PRIORIDADE 1: Se tem resumo completo, usar
    if (dados.ultimoResumo) {
        console.log('[ChatSum] Carregando resumo principal');
        resultadoPre.innerHTML = dados.ultimoResumo;
        btnCapturar.style.display = 'none';
        btnCopiar.style.display = 'inline-block';
        btnApagar.style.display = 'inline-block';
        setStatus('✅ Último resumo carregado', 'ok');
        ultimoResumoTimestamp = dados.timestampResumo;
    } 
    //  PRIORIDADE 2: Se tem backup de chat em processamento, recuperar e avisar
    else if (dados.chatEmProcessamento) {
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
        
        // Tentar recuperar resumo do servidor automaticamente após 5 segundos
        setTimeout(async () => {
            console.log('[ChatSum] Tentando recuperar resumo do servidor...');
            try {
                const response = await fetch('http://localhost:8000/resumidor/ultimo-resumo');
                if (response.ok) {
                    const result = await response.json();
                    const htmlFormatado = formatarResumo(result.resumo);
                    resultadoPre.innerHTML = htmlFormatado;
                    btnCapturar.style.display = 'none';
                    btnCopiar.style.display = 'inline-block';
                    btnApagar.style.display = 'inline-block';
                    setStatus('✅ Resumo recuperado do servidor!', 'ok');
                    
                    // Salvar no storage
                    await chrome.storage.local.set({
                        ultimoResumo: htmlFormatado,
                        ultimoResumoOriginal: result.resumo,
                        timestampResumo: result.timestamp,
                        chatEmProcessamento: null,
                        ultimoTecnicoEmProcessamento: null,
                        modoEmProcessamento: null,
                        timestampProcessamento: null
                    });
                }
            } catch (err) {
                console.error('[ChatSum] Não conseguiu recuperar do servidor:', err);
            }
        }, 5000);
    } 
    // PRIORIDADE 3: Nada salvo, esperar novo resumo
    else {
        console.log('[ChatSum] Nenhum resumo encontrado, aguardando ação');
        setStatus('Aguardando ação...', 'info');
    }
    
    console.log('[ChatSum] Inicialização completa');
})();