// public/app.js
(() => {
  "use strict";

  // base da API (não usa nome genérico "API" para evitar conflito)
  const API_BASE = window.location.origin + "/api";

  // =========================
  // Utilitárias
  // =========================
  function logError(...args) {
    console.error("[app.js]", ...args);
  }

  function formatCurrencyBR(value) {
    if (isNaN(value)) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  }

  function formatDateISOtoBR(dateStr) {
    // espera "YYYY-MM-DD" ou iso timestamp
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) {
      // tenta substr "YYYY-MM-DD"
      return dateStr;
    }
    return d.toLocaleDateString("pt-BR");
  }

  // =========================
  // Autenticação / Token
  // =========================
  function getTokenSeguro() {
    const token = localStorage.getItem("token");
    if (!token) {
      // Se estivermos no painel, redireciona para login.
      // Se o arquivo atual for a página de login, não redireciona.
      if (!window.location.pathname.endsWith("/login.html")) {
        window.location.href = "/login.html";
      }
      return null;
    }
    return token;
  }

  function tratarResposta401(resp) {
    if (resp.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login.html";
      return true;
    }
    return false;
  }

  // =========================
  // Carregar e renderizar lançamentos
  // =========================
  async function carregarLancamentos() {
    const token = getTokenSeguro();
    if (!token) return;

    try {
      const resp = await fetch(API_BASE + "/lancamentos", {
        headers: { Authorization: "Bearer " + token }
      });

      if (!resp.ok) {
        if (tratarResposta401(resp)) return;
        throw new Error(`Falha ao carregar: ${resp.status} ${resp.statusText}`);
      }

      const lista = await resp.json();
      renderizarTabela(lista);
    } catch (err) {
      logError("carregarLancamentos:", err);
      mostrarMensagemErro("Erro ao carregar lançamentos. Veja console.");
    }
  }

  function renderizarTabela(lista = []) {
    const tbody = document.querySelector("#tabela tbody");
    if (!tbody) {
      logError("Elemento #tabela tbody não encontrado.");
      return;
    }

    tbody.innerHTML = "";

    if (!Array.isArray(lista) || lista.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="4" style="text-align:center; padding:16px;">Nenhum lançamento</td>`;
      tbody.appendChild(tr);
      return;
    }

    lista.forEach(l => {
      const tr = document.createElement("tr");

      // segurança mínima: fallback para strings
      const tipo = String(l.tipo ?? "");
      const descricao = String(l.descricao ?? "");
      const valor = Number(l.valor ?? 0);
      const data = l.data ?? "";

      tr.innerHTML = `
        <td>${escapeHtml(tipo)}</td>
        <td>${escapeHtml(descricao)}</td>
        <td>${formatCurrencyBR(valor)}</td>
        <td>${formatDateISOtoBR(data)}</td>
      `;

      tbody.appendChild(tr);
    });
  }

  // Pequena função para evitar injeção de HTML via campos (escapa < > &)
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // =========================
  // Enviar novo lançamento
  // =========================
  async function enviarLancamento(event) {
    event.preventDefault();

    const token = getTokenSeguro();
    if (!token) return;

    const tipoEl = document.getElementById("tipo");
    const descricaoEl = document.getElementById("descricao");
    const valorEl = document.getElementById("valor");
    const dataEl = document.getElementById("data");

    if (!tipoEl || !descricaoEl || !valorEl || !dataEl) {
      logError("Campos do formulário não encontrados.");
      mostrarMensagemErro("Erro interno: formulário incompleto.");
      return;
    }

    const payload = {
      tipo: tipoEl.value,
      descricao: descricaoEl.value.trim(),
      valor: Number(valorEl.value),
      data: dataEl.value
    };

    // validações simples
    if (!payload.descricao) {
      mostrarMensagemErro("Descrição é obrigatória.");
      return;
    }
    if (isNaN(payload.valor) || payload.valor <= 0) {
      mostrarMensagemErro("Valor deve ser maior que 0.");
      return;
    }
    if (!payload.data) {
      mostrarMensagemErro("Data é obrigatória.");
      return;
    }

    try {
      const resp = await fetch(API_BASE + "/lancamentos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        if (tratarResposta401(resp)) return;
        const txt = await safeReadText(resp);
        throw new Error(`Erro ao salvar: ${resp.status} ${resp.statusText} - ${txt}`);
      }

      // sucesso: limpa form e recarrega
      descricaoEl.value = "";
      valorEl.value = "";
      // mantém a data (opcional)
      await carregarLancamentos();
      mostrarMensagemSucesso("Lançamento salvo com sucesso.");
    } catch (err) {
      logError("enviarLancamento:", err);
      mostrarMensagemErro("Falha ao salvar lançamento. Veja console.");
    }
  }

  async function safeReadText(resp) {
    try {
      return await resp.text();
    } catch {
      return "";
    }
  }

  // =========================
  // Mensagens pequenas na UI
  // =========================
  function mostrarMensagemErro(text) {
    mostrarMensagem(text, "error");
  }
  function mostrarMensagemSucesso(text) {
    mostrarMensagem(text, "success");
  }

  function mostrarMensagem(text, type = "info") {
    // tenta usar elemento #erro (se existir), senão alert()
    const el = document.getElementById("erro");
    if (el) {
      el.textContent = text;
      el.style.color = type === "error" ? "crimson" : type === "success" ? "green" : "black";
      // limpa após 4s
      setTimeout(() => {
        if (el) el.textContent = "";
      }, 4000);
      return;
    }
    // fallback
    if (type === "error") {
      console.error(text);
    } else {
      console.log(text);
    }
  }

  // =========================
  // Inicialização
  // =========================
  function attachListeners() {
    const form = document.getElementById("formLancamento");
    if (form) {
      form.addEventListener("submit", enviarLancamento);
    } else {
      logError("#formLancamento não encontrado — verifique seu HTML.");
    }
  }

  async function init() {
    attachListeners();

    // Se estiver na página de login não carregamos lançamentos
    if (window.location.pathname.endsWith("/login.html")) {
      return;
    }

    // Carrega dados apenas se token existir
    const token = getTokenSeguro();
    if (!token) return;

    await carregarLancamentos();
  }

  // Start quando DOM pronto
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Exporte nada — IIFE previne vazamento global
})();
