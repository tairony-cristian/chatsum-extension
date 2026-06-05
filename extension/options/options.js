import { ESTADOS } from '../utils/states.js';

/**
 * Página de Configurações do ChatSum
 * Gerencia todas as preferências da extensão
 */

// ============================================
// ELEMENTOS DOM - ABA GERAL
// ============================================

const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const toast = document.getElementById('toast');

const modoDefaultRadios = document.querySelectorAll('input[name="modoDefault"]');
const autoCopiarCheck = document.getElementById('autoCopiar');
const notificacoesCheck = document.getElementById('notificacoes');
const btnSalvarGeral = document.getElementById('btnSalvarGeral');

// ============================================
// ELEMENTOS DOM - ABA SERVIDOR
// ============================================

const modoDesenvolvedor = document.getElementById('modoDesenvolvedor');
const serverUrl = document.getElementById('serverUrl');
const btnSalvarServidor = document.getElementById('btnSalvarServidor');
const btnTestarConexao = document.getElementById('btnTestarConexao');
const statusConexao = document.getElementById('statusConexao');
const resultadoTeste = document.getElementById('resultadoTeste');

// ============================================
// ELEMENTOS DOM - ABA PROMPTS
// ============================================

const promptSelector = document.getElementById('promptSelector');
const editorPrompt = document.getElementById('editorPrompt');
const promptCustomTextarea = document.getElementById('promptCustom');
const btnPreviewPrompt = document.getElementById('btnPreviewPrompt');
const btnResetPrompt = document.getElementById('btnResetPrompt');
const btnValidarPrompt = document.getElementById('btnValidarPrompt');
const btnSalvarPrompt = document.getElementById('btnSalvarPrompt');
const promptStatus = document.getElementById('promptStatus');

// ============================================
// ELEMENTOS DOM - ABA AVANÇADO
// ============================================

const btnResetContador = document.getElementById('btnResetContador');
const btnLimparCache = document.getElementById('btnLimparCache');
const btnExportar = document.getElementById('btnExportar');
const btnImportar = document.getElementById('btnImportar');
const fileImport = document.getElementById('fileImport');
const debugModeCheck = document.getElementById('debugMode');

// ============================================
// ELEMENTOS DOM - OUTROS
// ============================================

const btnFechar = document.getElementById('btnFechar');

/**
 * Atualiza contador de caracteres do prompt
 */
function atualizarContadorPrompt() {
  const textarea = document.getElementById('promptCustom');
  const counter  = document.getElementById('promptCharCounter');
  const countEl  = document.getElementById('promptCharCount');
  const warnEl   = document.getElementById('promptCharWarning');

  if (!textarea || !countEl) return;

  const total  = 10000;
  const usado  = textarea.value.length;
  const restam = total - usado;

  countEl.textContent = usado.toLocaleString('pt-BR');

  // Remove classes anteriores
  counter.classList.remove('warning', 'danger');
  warnEl.textContent = '';

  if (usado > total) {
    counter.classList.add('danger');
    warnEl.textContent = `⛔ ${Math.abs(restam).toLocaleString('pt-BR')} acima do limite!`;
  } else if (usado > total * 0.85) {
    // Aviso a partir de 85% (8500 chars)
    counter.classList.add('warning');
    warnEl.textContent = `⚠️ ${restam.toLocaleString('pt-BR')} restantes`;
  }
}

/**
 * Inicialização
 */
(async function init() {
  await carregarConfiguracoes();
  registrarEventListeners();
  
  // Se URL tem ?welcome=true, mostra aba Sobre
  const params = new URLSearchParams(window.location.search);
  if (params.get('welcome') === 'true') {
    switchTab('sobre');
  }
})();

/**
 * Carrega configurações salvas
 */
async function carregarConfiguracoes() {
  const config = await chrome.storage.local.get([
    'modoResumo',
    'serverUrl',
    'modoDesenvolvedor',
    'autoCopiar',
    'notificacoes',
    'promptAtivo',
    'promptPersonalizado',
    'debugMode',
    'iaProvider'
  ]);
  
  // ABA GERAL
  const modoRadio = document.querySelector(`input[name="modoDefault"][value="${config.modoResumo || 'ultimo_tecnico'}"]`);
  if (modoRadio) modoRadio.checked = true;
  
  autoCopiarCheck.checked = config.autoCopiar || false;
  notificacoesCheck.checked = config.notificacoes !== false;

  // ABA GERAL - Provedor de IA
  const providerRadio = document.querySelector(`input[name="iaProvider"][value="${config.iaProvider || 'gemini'}"]`);
  if (providerRadio) providerRadio.checked = true;
  atualizarInfoProvider(config.iaProvider || 'gemini');

  // Listener para atualizar info ao trocar provider
  document.querySelectorAll('input[name="iaProvider"]').forEach(radio => {
    radio.addEventListener('change', (e) => atualizarInfoProvider(e.target.value));
  });
  
  // ABA SERVIDOR - Carrega checkbox modo desenvolvedor
  modoDesenvolvedor.checked = config.modoDesenvolvedor === true;
  
  // ABA SERVIDOR - Carrega URL do servidor
  serverUrl.value = config.serverUrl || '';
  
  // ABA SERVIDOR - Atualiza estado do campo URL
  atualizarEstadoServidorUrl();
  
  // ABA PROMPTS
  promptSelector.value = config.promptAtivo || 'default';
  promptCustomTextarea.value = config.promptPersonalizado || '';
  atualizarContadorPrompt();
  
  if (config.promptAtivo === 'custom') {
    editorPrompt.style.display = 'block';
  }
  
  // ABA AVANÇADO
  debugModeCheck.checked = config.debugMode || false;
}

/**
 * Registra todos os event listeners
 */
function registrarEventListeners() {
  // Navegação entre tabs
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      switchTab(tabName);
    });
  });

  // ============================================
  // EVENTOS - ABA GERAL
  // ============================================

  btnSalvarGeral.addEventListener('click', salvarConfiguracoesGerais);

  // ============================================
  // EVENTOS - ABA SERVIDOR
  // ============================================

  // Checkbox "Modo Desenvolvedor" muda
  modoDesenvolvedor.addEventListener('change', atualizarEstadoServidorUrl);

  // Campo URL muda (atualiza status)
  serverUrl.addEventListener('input', () => {
    if (!modoDesenvolvedor.checked) {
      atualizarEstadoServidorUrl();
    }
  });

  // Botão "Salvar Configurações" (Servidor)
  btnSalvarServidor.addEventListener('click', salvarConfiguracaoServidor);

  // Botão "Testar Conexão"
  btnTestarConexao.addEventListener('click', testarConexao);

  // ============================================
  // EVENTOS - ABA PROMPTS
  // ============================================

  promptSelector.addEventListener('change', (e) => {
    editorPrompt.style.display = e.target.value === 'custom' ? 'block' : 'none';
  });
  
  // Contador de caracteres em tempo real
  if (promptCustomTextarea) {
    promptCustomTextarea.addEventListener('input', atualizarContadorPrompt);
  }

  btnPreviewPrompt.addEventListener('click', previewPrompt);
  btnResetPrompt.addEventListener('click', resetPrompt);
  btnValidarPrompt.addEventListener('click', validarPrompt);
  btnSalvarPrompt.addEventListener('click', salvarPrompt);

  // ============================================
  // EVENTOS - ABA AVANÇADO
  // ============================================

  btnResetContador.addEventListener('click', resetarContador);
  btnLimparCache.addEventListener('click', limparCache);
  btnExportar.addEventListener('click', exportarConfiguracoes);
  btnImportar.addEventListener('click', () => fileImport.click());
  fileImport.addEventListener('change', importarConfiguracoes);

  // ============================================
  // EVENTOS - OUTROS
  // ============================================

  btnFechar.addEventListener('click', () => window.close());
}

/**
 * Troca de tab ativa
 */
function switchTab(tabName) {
  tabButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  
  tabContents.forEach(content => {
    content.classList.toggle('active', content.id === `tab-${tabName}`);
  });
}

/**
 * Atualiza estado do campo "URL do Servidor"
 * Desativa se modo desenvolvedor está marcado
 * Ativa se modo desenvolvedor está desmarcado
 */
function atualizarEstadoServidorUrl() {
  if (modoDesenvolvedor.checked) {
    // Modo desenvolvedor MARCADO → desativa campo URL
    serverUrl.disabled = true;
    serverUrl.style.opacity = '0.5';
    statusConexao.innerHTML = `
      <div style="padding: 8px; background: #e8f5e9; border-left: 4px solid #4caf50; color: #2e7d32;">
        ✅ Modo Desenvolvedor ativado<br>
        <strong>Usando: http://localhost:8000</strong>
      </div>
    `;
    console.log('[Modo] Desenvolvedor ATIVADO - usando localhost:8000');
  } else {
    // Modo desenvolvedor DESMARCADO → ativa campo URL
    serverUrl.disabled = false;
    serverUrl.style.opacity = '1';
    
    if (serverUrl.value.trim()) {
      statusConexao.innerHTML = `
        <div style="padding: 8px; background: #e3f2fd; border-left: 4px solid #2196f3; color: #1565c0;">
          ℹ️ Modo Produção<br>
          <strong>URL Configurada: ${serverUrl.value.trim()}</strong>
        </div>
      `;
    } else {
      statusConexao.innerHTML = `
        <div style="padding: 8px; background: #fff3e0; border-left: 4px solid #ff9800; color: #e65100;">
          ⚠️ Modo Produção sem URL<br>
          <strong>Configure a URL do servidor acima</strong>
        </div>
      `;
    }
    
    console.log('[Modo] Desenvolvedor DESATIVADO - usando URL remota');
  }
}

/**
 * Salva configurações gerais (ABA GERAL)
 */
async function salvarConfiguracoesGerais() {
  try {
    const modoSelecionado = document.querySelector('input[name="modoDefault"]:checked').value;
    const iaProviderSelecionado = document.querySelector('input[name="iaProvider"]:checked')?.value || 'gemini';
    
    await chrome.storage.local.set({
      modoResumo: modoSelecionado,
      autoCopiar: autoCopiarCheck.checked,
      notificacoes: notificacoesCheck.checked,
      iaProvider: iaProviderSelecionado
    });
    
    mostrarToast('✅ Configurações gerais salvas com sucesso!', 'success');
    console.log('[Config] Geral salva | IA:', iaProviderSelecionado);
    
  } catch (erro) {
    console.error('Erro ao salvar:', erro);
    mostrarToast('❌ Erro ao salvar configurações', 'error');
  }
}

/**
 * Salva configurações do servidor (ABA SERVIDOR)
 * Valida:
 * - Se NOT modo desenvolvedor E URL vazio → erro
 * - Se modo desenvolvedor → limpa URL
 */
async function salvarConfiguracaoServidor() {
  try {
    const modoDevMarcado = modoDesenvolvedor.checked;
    const urlRemota = serverUrl.value.trim();
    
    // 🔍 VALIDAÇÃO
    if (!modoDevMarcado && !urlRemota) {
      mostrarToast('❌ Configure a URL do servidor ou ative Modo Desenvolvedor', 'error');
      return;
    }
    
    // 💾 SALVAR
    await chrome.storage.local.set({
      modoDesenvolvedor: modoDevMarcado,
      serverUrl: modoDevMarcado ? '' : urlRemota
    });
    
    mostrarToast('✅ Configurações do servidor salvas com sucesso!', 'success');
    console.log('[Config] Servidor - Modo Dev:', modoDevMarcado, '| URL:', urlRemota || 'localhost');
    
    // 🔄 Atualiza status
    atualizarEstadoServidorUrl();
    
  } catch (erro) {
    console.error('Erro ao salvar configurações do servidor:', erro);
    mostrarToast('❌ Erro ao salvar configurações', 'error');
  }
}

/**
 * Testa conexão com o servidor configurado
 * Mostra resultado em tempo real
 */
async function testarConexao() {
  try {
    resultadoTeste.innerHTML = '⏳ Testando conexão...';
    btnTestarConexao.disabled = true;
    
    // 1. Obter URL configurada
    const urlServidor = await obterUrlServidor();
    
    console.log('[Teste] Testando URL:', urlServidor);
    
    // 2. Fazer requisição
    const response = await fetch(`${urlServidor}/health`, {
      method: 'GET',
      timeout: 10000
    });
    
    if (response.ok) {
      const data = await response.json();
      
      resultadoTeste.innerHTML = `
        <div style="padding: 12px; background: #e8f5e9; border: 1px solid #4caf50; border-radius: 4px; color: #2e7d32;">
          <strong>✅ Conexão Bem-sucedida!</strong><br>
          <small>Servidor: ${urlServidor}</small><br>
          <small>Status: ${data.status}</small><br>
          <small>Modelo: ${data.modelo}</small>
        </div>
      `;
      
      mostrarToast('✅ Servidor respondendo normalmente!', 'success');
      console.log('[Teste] Sucesso - Servidor OK');
      
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
    
  } catch (erro) {
    console.error('[Teste] Erro:', erro);
    
    resultadoTeste.innerHTML = `
      <div style="padding: 12px; background: #ffebee; border: 1px solid #f44336; border-radius: 4px; color: #c62828;">
        <strong>❌ Erro ao conectar!</strong><br>
        <small>${erro.message}</small><br>
        <small>Verifique a URL e se o servidor está rodando.</small>
      </div>
    `;
    
    mostrarToast('❌ Não foi possível conectar ao servidor', 'error');
  } finally {
    btnTestarConexao.disabled = false;
  }
}

/**
 * Obtém URL do servidor baseado nas configurações
 * Mesma lógica que popup.js usa
 */
async function obterUrlServidor() {
  try {
    const config = await chrome.storage.local.get([
      'modoDesenvolvedor',
      'serverUrl'
    ]);
    
    // 🔧 Se modo desenvolvedor marcado → localhost
    if (config.modoDesenvolvedor === true) {
      console.log('[URL] Modo Desenvolvedor: localhost');
      return 'http://localhost:8000';
    }
    
    // 🌐 Se URL configurada → usa URL
    if (config.serverUrl?.trim()) {
      console.log('[URL] Usando URL remota:', config.serverUrl);
      return config.serverUrl.trim();
    }
    
    // ⚠️ Fallback
    console.warn('[URL] Nenhuma URL configurada, usando localhost');
    return 'http://localhost:8000';
    
  } catch (erro) {
    console.error('[URL] Erro:', erro);
    return 'http://localhost:8000';
  }
}

/**
 * Preview do prompt (ABA PROMPTS)
 */
function previewPrompt() {
  const prompt = promptCustomTextarea.value;
  
  if (!prompt.trim()) {
    mostrarToast('⚠️ Prompt está vazio', 'warning');
    return;
  }
  
  // Substitui variáveis para preview
  const preview = prompt
    .replace(/{ultimo_tecnico}/g, 'João Silva (exemplo)')
    .replace(/{data}/g, new Date().toLocaleDateString('pt-BR'))
    .replace(/{hora}/g, new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  
  // Mostra em modal
  const modal = window.open('', 'Preview do Prompt', 'width=600,height=400,scrollbars=yes');
  modal.document.write(`
    <html>
      <head>
        <title>Preview do Prompt</title>
        <style>
          body { font-family: monospace; padding: 20px; white-space: pre-wrap; }
          h2 { color: #cc0000; }
        </style>
      </head>
      <body>
        <h2>📋 Preview do Prompt</h2>
        <p>${preview}</p>
      </body>
    </html>
  `);
}

/**
 * Reseta prompt para padrão (ABA PROMPTS)
 */
async function resetPrompt() {
  const confirmar = confirm('Tem certeza que deseja restaurar o prompt padrão? Suas alterações serão perdidas.');
  
  if (!confirmar) return;
  
  // Busca prompt padrão do servidor
  try {
    const urlServidor = await obterUrlServidor();
    const response = await fetch(`${urlServidor}/resumidor/prompt-default`);
    
    if (response.ok) {
      const data = await response.json();
      promptCustomTextarea.value = data.prompt;
      mostrarToast('✅ Prompt padrão restaurado', 'success');
    } else {
      // Fallback: usa prompt padrão embutido
      promptCustomTextarea.value = getPromptPadraoFallback();
      mostrarToast('✅ Prompt padrão restaurado (offline)', 'success');
    }
    
  } catch (erro) {
    console.error('Erro ao buscar prompt:', erro);
    promptCustomTextarea.value = getPromptPadraoFallback();
    mostrarToast('✅ Prompt padrão restaurado (fallback)', 'success');
  }
}

/**
 * Valida prompt personalizado (ABA PROMPTS)
 */
function validarPrompt() {
  const prompt = promptCustomTextarea.value;
  
  // Validações
  const erros = [];
  
  if (!prompt.trim()) {
    erros.push('Prompt não pode estar vazio');
  }
  
  if (prompt.length < 50) {
    erros.push('Prompt muito curto (mínimo 50 caracteres)');
  }
  
  if (prompt.length > 10000) {
    erros.push('Prompt muito longo (máximo 10000 caracteres)');
  }
  
  // Mostra resultado
  if (erros.length > 0) {
    promptStatus.innerHTML = `
      <div style="color: #e63946;">
        ❌ <strong>Erros encontrados:</strong>
        <ul>${erros.map(e => `<li>${e}</li>`).join('')}</ul>
      </div>
    `;
    mostrarToast('❌ Prompt inválido', 'error');
  } else {
    promptStatus.innerHTML = `
      <div style="color: #2a9d8f;">
        ✅ <strong>Prompt válido!</strong> Pronto para salvar.
      </div>
    `;
    mostrarToast('✅ Prompt válido!', 'success');
  }
}

/**
 * Salva prompt personalizado (ABA PROMPTS)
 */
async function salvarPrompt() {
  const promptAtivo = promptSelector.value;
  const promptPersonalizado = promptCustomTextarea.value;
  
  // Valida se escolheu custom mas não preencheu
  if (promptAtivo === 'custom') {
    const [valido, erro] = validarPromptCustom(promptPersonalizado);
    if (!valido) {
      mostrarToast(`❌ ${erro}`, 'error');
      return;
    }
  }
  
  try {
    await chrome.storage.local.set({
      promptAtivo: promptAtivo,
      promptPersonalizado: promptPersonalizado
    });
    
    mostrarToast('✅ Prompt salvo com sucesso!', 'success');
    promptStatus.innerHTML = '';
    
  } catch (erro) {
    console.error('Erro ao salvar prompt:', erro);
    mostrarToast('❌ Erro ao salvar prompt', 'error');
  }
}

/**
 * Valida prompt customizado
 * Nota: {ultimo_tecnico} é OPCIONAL
 * O chat é enviado automaticamente junto com o prompt personalizado
 */
function validarPromptCustom(prompt) {
  if (!prompt || !prompt.trim()) {
    return [false, 'Prompt não pode estar vazio'];
  }
  
  if (prompt.length < 50) {
    return [false, 'Prompt muito curto (mínimo 50 caracteres)'];
  }
  
  if (prompt.length > 10000) {
    return [false, 'Prompt muito longo (máximo 10000 caracteres)'];
  }
  
  return [true, null];
}

/**
 * Reseta contador de requisições (ABA AVANÇADO)
 */
async function resetarContador() {
  const confirmar = confirm('Deseja resetar o contador de requisições?');
  if (!confirmar) return;
  
  await chrome.storage.local.set({
    contadorRequisicoes: 0,
    dataContador: obterDataHoje()
  });
  
  mostrarToast('✅ Contador resetado', 'success');
}

/**
 * Limpa todo o cache (ABA AVANÇADO)
 */
async function limparCache() {
  const confirmar = confirm(
    'Isso irá remover todos os resumos salvos e resetar as configurações. Continuar?'
  );
  
  if (!confirmar) return;
  
  await chrome.storage.local.clear();
  await carregarConfiguracoes();
  
  mostrarToast('✅ Cache limpo com sucesso', 'success');
}

/**
 * Exporta configurações para arquivo JSON (ABA AVANÇADO)
 */
async function exportarConfiguracoes() {
  const config = await chrome.storage.local.get(null);
  
  // Remove dados sensíveis
  delete config.chatCapturado;
  delete config.resumoFinal;
  
  const blob = new Blob([JSON.stringify(config, null, 2)], {
    type: 'application/json'
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chatsum-config-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
  mostrarToast('✅ Configurações exportadas', 'success');
}

/**
 * Importa configurações de arquivo JSON (ABA AVANÇADO)
 */
async function importarConfiguracoes(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    const text = await file.text();
    const config = JSON.parse(text);
    
    await chrome.storage.local.set(config);
    await carregarConfiguracoes();
    
    mostrarToast('✅ Configurações importadas com sucesso', 'success');
    
  } catch (erro) {
    console.error('Erro ao importar:', erro);
    mostrarToast('❌ Arquivo inválido', 'error');
  }
  
  // Limpa input
  event.target.value = '';
}

/**
 * Mostra toast de notificação
 */
function mostrarToast(mensagem, tipo = 'info') {
  toast.textContent = mensagem;
  toast.className = `toast toast-${tipo} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

/**
 * Obtém data de hoje no formato YYYY-MM-DD
 */
function obterDataHoje() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
}

/**
 * Prompt padrão fallback (caso servidor esteja offline)
 */
function getPromptPadraoFallback() {
  return `Aja como um **Analista de Suporte Sênior**. Tom: **técnico, direto, objetivo e profissional**.

Resuma o atendimento usando **APENAS** as mensagens do cliente e do técnico **{ultimo_tecnico}**.

━━━━━━━━━━━━━━━━━━━━
REGRAS
━━━━━━━━━━━━━━━━━━━━

**ESCRITA**
* **FILTRO OBRIGATÓRIO:** Use APENAS mensagens onde o remetente é exatamente **{ultimo_tecnico}** e mensagens do cliente. Qualquer mensagem de outro remetente deve ser completamente ignorada — não descreva, não mencione, não resuma.
* Escreva em **primeira pessoa** ("realizei", "verifiquei", "instalei") — NUNCA use "verificou-se", "foi realizado" ou terceira pessoa.
* Se a ação foi executada pelo cliente sob orientação, escreva: "Orientei o cliente a..." ou "O cliente realizou... conforme orientação."
* NÃO invente, deduza ou crie informações não presentes no chat. Se não estiver claro, OMITA.
* Retorne SOMENTE o texto formatado. Sem introduções, explicações ou títulos alterados.

**O QUE INCLUIR**
* Apenas ações efetivamente concluídas com resultado confirmado.
* Se o cliente não soube responder ou não tinha a informação → omita a tentativa.
* Se o técnico perguntou e não obteve retorno → omita.
* Preserve termos técnicos: XML, NFC-e, SPED, PDV, NCM, contingência, supervisores, cadastro, reinstalação.
* Não substitua procedimentos específicos por descrições genéricas.

**MÚLTIPLAS MÁQUINAS / PDVs**
* Descreva ações de cada ambiente separadamente, identificando pelo nome ou número do chat.
* Errado: "Instalei o sistema nas máquinas." → Correto: item separado para cada máquina.

**RASTREAMENTO DE DEMANDAS**
* Antes de escrever a solução, verifique internamente cada demanda mencionada:
  - Concluída (com ou sem confirmação) → resolvida.
  - Causa raiz corrigida → considerar resolvida (ex: divergências de XML corrigidas = SPED liberado).
  - Iniciada sem conclusão → pendente.
  - Mencionada mas não iniciada → pendente.
* Se houver qualquer pendência → use status parcial.

**STATUS FINAL**
* Cliente agradeceu sem novas solicitações → **Ticket Finalizado.**
* Cliente confirmou explicitamente → mencione: "Cliente validou o funcionamento." + **Ticket Finalizado.**
* Cliente não respondeu após conclusão → **Ticket Finalizado.**
* Qualquer demanda incompleta → status parcial obrigatório.

**FORMATAÇÃO**
* Títulos EXATAMENTE: 🔴 PROBLEMA RELATADO: / 🟡 ANÁLISE TÉCNICA: / 🟢 SOLUÇÃO APRESENTADA:
* Múltiplos problemas → separe dentro do mesmo resumo, nunca gere tickets separados.
* Use **negrito** obrigatoriamente em TODAS as seções:
  - Nomes de sistemas e módulos: **SGLinear**, **PDV**, **Godex**, **cotação web**, **SGRLinear**
  - Erros e mensagens de erro: **erro de comunicação**, **driver não encontrado**
  - Ações técnicas importantes: **instalei o driver**, **recriei os XML**, **abri os supervisores**
  - Parâmetros e configurações: **parâmetro X**, **configuração automática**
  - Status finais: **Ticket Finalizado.**, **Parcialmente resolvido.**
* Listas sempre com "*".

━━━━━━━━━━━━━━━━━━━━
AUTO-VERIFICAÇÃO (execute antes de retornar)
━━━━━━━━━━━━━━━━━━━━

Antes de retornar o resumo, revise cada item e elimine se:
* O cliente disse que NÃO SABIA ou NÃO TINHA a informação solicitada.
* É uma solicitação ou pergunta feita ao cliente, não uma ação técnica realizada.
* A ação foi executada pelo cliente, não pelo técnico (→ trocar para "O cliente realizou ...").
* A mesma ação de máquinas diferentes foi consolidada em uma frase só (→ separar por máquina).

━━━━━━━━━━━━━━━━━━━━
ESTRUTURA
━━━━━━━━━━━━━━━━━━━━

🔴 PROBLEMA RELATADO:
* Sistema/módulo afetado, erro ou comportamento anormal, impacto no cliente.

🟡 ANÁLISE TÉCNICA:
* Descreva as ações em sequência lógica, sem separar por "Para o problema X:".
* Verificações concluídas, diagnósticos, causa identificada (só se explícita no chat).
* Use frases completas e descritivas: "Acessei a máquina via acesso remoto e verifiquei o **Fechamento de Caixa**, identificando que a diferença de **R$ 25,99** era decorrente de lançamento manual incorreto."

🟢 SOLUÇÃO APRESENTADA:
* Descreva as soluções em sequência lógica, sem separar por "Para o problema X:".
* Ações resolutivas, orientações, confirmação de funcionamento, pendências.
* Finalize: **Ticket Finalizado.** / **Parcialmente resolvido.** / **Aguardando novo contato.** / **Demanda pendente para próximo atendimento.**`;
}

/**
 * Atualiza info do provider selecionado (ABA GERAL)
 */
function atualizarInfoProvider(provider) {
  const el = document.getElementById('iaProviderInfo');
  if (!el) return;

  const infos = {
    gemini: 'Configure <strong>GEMINI_API_KEY</strong> no arquivo <code>.env</code> do servidor.',
    groq:   'Configure <strong>GROQ_API_KEY</strong> no arquivo <code>.env</code>. Obtenha em <a href="https://console.groq.com/keys" target="_blank">console.groq.com</a>',
    openai: 'Configure <strong>OPENAI_API_KEY</strong> no arquivo <code>.env</code>. Obtenha em <a href="https://platform.openai.com/api-keys" target="_blank">platform.openai.com</a>'
  };

  el.innerHTML = `<p class="provider-hint">${infos[provider] || ''}</p>`;
}