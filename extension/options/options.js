import { ESTADOS } from '../utils/states.js';

/**
 * Página de Configurações do ChatSum
 * Gerencia todas as preferências da extensão
 */

// Elementos DOM
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const toast = document.getElementById('toast');

// Elementos - Aba Geral
const modoDefaultRadios = document.querySelectorAll('input[name="modoDefault"]');
const serverUrlInput = document.getElementById('serverUrl');
const autoCopiarCheck = document.getElementById('autoCopiar');
const notificacoesCheck = document.getElementById('notificacoes');
const btnSalvarGeral = document.getElementById('btnSalvarGeral');

// Elementos - Aba Prompts
const promptSelector = document.getElementById('promptSelector');
const editorPrompt = document.getElementById('editorPrompt');
const promptCustomTextarea = document.getElementById('promptCustom');
const btnPreviewPrompt = document.getElementById('btnPreviewPrompt');
const btnResetPrompt = document.getElementById('btnResetPrompt');
const btnValidarPrompt = document.getElementById('btnValidarPrompt');
const btnSalvarPrompt = document.getElementById('btnSalvarPrompt');
const promptStatus = document.getElementById('promptStatus');

// Elementos - Aba Avançado
const btnResetContador = document.getElementById('btnResetContador');
const btnLimparCache = document.getElementById('btnLimparCache');
const btnExportar = document.getElementById('btnExportar');
const btnImportar = document.getElementById('btnImportar');
const fileImport = document.getElementById('fileImport');
const debugModeCheck = document.getElementById('debugMode');

// Elementos - Outros
const btnFechar = document.getElementById('btnFechar');

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
    'autoCopiar',
    'notificacoes',
    'promptAtivo',
    'promptPersonalizado',
    'debugMode'
  ]);
  
  // Geral
  const modoRadio = document.querySelector(`input[name="modoDefault"][value="${config.modoResumo || 'ultimo_tecnico'}"]`);
  if (modoRadio) modoRadio.checked = true;
  
  serverUrlInput.value = config.serverUrl || 'http://localhost:8000';
  autoCopiarCheck.checked = config.autoCopiar || false;
  notificacoesCheck.checked = config.notificacoes !== false; // true por padrão
  
  // Prompts
  promptSelector.value = config.promptAtivo || 'default';
  promptCustomTextarea.value = config.promptPersonalizado || '';
  
  if (config.promptAtivo === 'custom') {
    editorPrompt.style.display = 'block';
  }
  
  // Avançado
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
  
  // Aba Geral
  btnSalvarGeral.addEventListener('click', salvarConfiguracoesGerais);
  
  // Aba Prompts
  promptSelector.addEventListener('change', (e) => {
    editorPrompt.style.display = e.target.value === 'custom' ? 'block' : 'none';
  });
  
  btnPreviewPrompt.addEventListener('click', previewPrompt);
  btnResetPrompt.addEventListener('click', resetPrompt);
  btnValidarPrompt.addEventListener('click', validarPrompt);
  btnSalvarPrompt.addEventListener('click', salvarPrompt);
  
  // Aba Avançado
  btnResetContador.addEventListener('click', resetarContador);
  btnLimparCache.addEventListener('click', limparCache);
  btnExportar.addEventListener('click', exportarConfiguracoes);
  btnImportar.addEventListener('click', () => fileImport.click());
  fileImport.addEventListener('change', importarConfiguracoes);
  
  // Outros
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
 * Salva configurações gerais
 */
async function salvarConfiguracoesGerais() {
  try {
    const modoSelecionado = document.querySelector('input[name="modoDefault"]:checked').value;
    
    await chrome.storage.local.set({
      modoResumo: modoSelecionado,
      serverUrl: serverUrlInput.value.trim(),
      autoCopiar: autoCopiarCheck.checked,
      notificacoes: notificacoesCheck.checked
    });
    
    mostrarToast('✅ Configurações salvas com sucesso!', 'success');
    
  } catch (erro) {
    console.error('Erro ao salvar:', erro);
    mostrarToast('❌ Erro ao salvar configurações', 'error');
  }
}

/**
 * Preview do prompt
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
  
  // Mostra em modal ou alert
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
 * Reseta prompt para padrão
 */
async function resetPrompt() {
  const confirmar = confirm('Tem certeza que deseja restaurar o prompt padrão? Suas alterações serão perdidas.');
  
  if (!confirmar) return;
  
  // Busca prompt padrão do servidor
  try {
    const serverUrl = serverUrlInput.value.trim();
    const response = await fetch(`${serverUrl}/resumidor/prompt-default`);
    
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
 * Valida prompt personalizado
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
  
  if (prompt.length > 5000) {
    erros.push('Prompt muito longo (máximo 5000 caracteres)');
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
 * Salva prompt personalizado
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
  } catch (erro) {
       mostrarToast('❌ Erro ao salvar prompt', 'error');
  }
}

/**
 * Valida prompt customizado
 */
function validarPromptCustom(prompt) {
  if (!prompt || !prompt.trim()) {
    return [false, 'Prompt não pode estar vazio'];
  }
  
  if (prompt.length < 50) {
    return [false, 'Prompt muito curto (mínimo 50 caracteres)'];
  }
  
  if (prompt.length > 5000) {
    return [false, 'Prompt muito longo (máximo 5000 caracteres)'];
  }
 
  return [true, null];
}

/**
 * Reseta contador de requisições
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
 * Limpa todo o cache
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
 * Exporta configurações para arquivo JSON
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
 * Importa configurações de arquivo JSON
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
  return `Aja como um **Analista de Suporte Sênior**. O tom deve ser **técnico, direto e profissional**.
Sua única tarefa é resumir o atendimento **APENAS** com base nas mensagens do cliente e nas suas (do {ultimo_tecnico}, que é você).

**INSTRUÇÕES DE FORMATAÇÃO (CRÍTICAS):**
1.  **EXCLUSÃO:** Ignore qualquer interação de **outros técnicos**.
2.  **TOM:** Escreva sempre em **primeira pessoa** (foi realizada, realizei, Atualizei).
3.  **TÍTULOS:** Use **EXATAMENTE**: **PROBLEMA:**, **ANÁLISE:** e **SOLUÇÃO:**.
4.  **ESTRUTURA:** Use **listas em formato Markdown** para clareza e use **negrito** (**) em palavras-chave.

**PROBLEMA:**
[Resumo conciso do problema]

**ANÁLISE:**
[Diagnóstico e causa raiz]

**SOLUÇÃO:**
[Ação resolutiva e status final]`;
}