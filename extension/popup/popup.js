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
                
                try {
                    console.log('[ChatSum] Enviando para servidor com modo:', modo);
                    
                    const serverResponse = await fetch('http://localhost:8000/resumidor/resumir', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            texto: response.chat,
                            ultimoTecnico: response.ultimoTecnico || '',
                            modo: modo
                        })
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
                        
                        // Salva AMBOS: HTML formatado E markdown original
                        await chrome.storage.local.set({
                            ultimoResumo: htmlFormatado,          // Para exibição
                            ultimoResumoOriginal: result.resumo,  // Para copiar (NOVO!)
                            timestampResumo: result.timestamp || new Date().toISOString()
                        });
                        
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
    try {
        const htmlContent = resultadoPre.innerHTML;
        
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
        
        setStatus('📋 Resumo copiado!', 'ok');
        setTimeout(() => setStatus('', 'info'), 2000);
        
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
            setStatus('📋 Copiado (texto simples)', 'ok');
            setTimeout(() => setStatus('', 'info'), 2000);
        } catch (fallbackErr) {
            setStatus('❌ Erro ao copiar', 'erro');
        }
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
    
    const { ultimoResumo } = await chrome.storage.local.get('ultimoResumo');
    
    if (ultimoResumo) {
        resultadoPre.innerHTML = ultimoResumo;
        btnCapturar.style.display = 'none';
        btnCopiar.style.display = 'inline-block';
        btnApagar.style.display = 'inline-block';
        setStatus('Último resumo carregado', 'info');
    } else {
        setStatus('Aguardando ação...', 'info');
    }
    
    console.log('[ChatSum] Inicialização completa');
})();