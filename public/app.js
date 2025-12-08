const API = window.location.origin;

let pieChart = null;
let lineChart = null;

// ==============================
// HELPERS
// ==============================
function formatCurrencyBR(value) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatDateISOtoBR(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
function normalizeTipo(t) {
  return String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function escapeHtml(s){ return String(s||"").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }

// ==============================
// AUTH + INIT
// ==============================
function verificarLogin() {
  const token = localStorage.getItem("token");
  if (!token) window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  verificarLogin();
  carregarLancamentos();

  const form = document.getElementById("formLancamento");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const editId = document.getElementById("editId").value;
      if (editId) await salvarEdicao(editId); else await adicionarLancamento();
    });
  }

  document.getElementById("btnFilter").addEventListener("click", aplicarFiltro);
  document.getElementById("btnResetFilter").addEventListener("click", async () => {
    document.getElementById("filterFrom").value = "";
    document.getElementById("filterTo").value = "";
    await carregarLancamentos();
  });

  document.getElementById("btnCancelEdit").addEventListener("click", () => {
    document.getElementById("editId").value = "";
    document.getElementById("btnCancelEdit").style.display = "none";
    document.querySelector("#formLancamento button[type=submit]").innerText = "Adicionar";
    document.getElementById("formLancamento").reset();
  });
});

// ==============================
// CARREGAR (com filtros)
// ==============================
async function carregarLancamentos() {
  const token = localStorage.getItem("token");
  const from = document.getElementById("filterFrom").value;
  const to = document.getElementById("filterTo").value;

  let url = API + "/api/lancamentos";
  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);
  if ([...params].length) url += "?" + params.toString();

  try {
    const resp = await fetch(url, { headers: { "Authorization": "Bearer " + token }});
    if (!resp.ok) { console.error("Erro ao buscar lançamentos"); return; }
    const lista = await resp.json();
    renderizarTabela(lista);
    desenharGraficos(lista);
  } catch (e) {
    console.error("Erro carregar:", e);
  }
}

// ==============================
// ADICIONAR
// ==============================
async function adicionarLancamento() {
  const tipo = document.getElementById("tipo").value;
  const descricao = document.getElementById("descricao").value.trim();
  const valor = parseFloat(document.getElementById("valor").value);
  const data = document.getElementById("data").value;
  if (!descricao || isNaN(valor) || !data) { alert("Preencha todos os campos corretamente"); return; }

  const token = localStorage.getItem("token");
  try {
    const resp = await fetch(API + "/api/lancamentos", {
      method: "POST",
      headers: { "Content-Type":"application/json", "Authorization":"Bearer " + token },
      body: JSON.stringify({ tipo, descricao, valor, data })
    });
    if (!resp.ok) {
      const erro = await resp.json();
      alert("Erro ao salvar: " + (erro.erro || "desconhecido"));
      return;
    }
    document.getElementById("formLancamento").reset();
    await carregarLancamentos();
  } catch (e) {
    alert("Erro ao conectar ao servidor");
    console.error(e);
  }
}

// ==============================
// EDITAR / SALVAR EDIÇÃO
// ==============================
function iniciarEdicaoFromRow(id, tipo, descricao, valor, data) {
  document.getElementById("editId").value = id;
  document.getElementById("tipo").value = tipo;
  document.getElementById("descricao").value = descricao;
  document.getElementById("valor").value = valor;
  document.getElementById("data").value = data;
  document.querySelector("#formLancamento button[type=submit]").innerText = "Salvar";
  document.getElementById("btnCancelEdit").style.display = "inline-block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function salvarEdicao(id) {
  const tipo = document.getElementById("tipo").value;
  const descricao = document.getElementById("descricao").value.trim();
  const valor = parseFloat(document.getElementById("valor").value);
  const data = document.getElementById("data").value;
  if (!descricao || isNaN(valor) || !data) { alert("Preencha todos os campos corretamente"); return; }

  const token = localStorage.getItem("token");
  try {
    const resp = await fetch(API + "/api/lancamentos/" + id, {
      method: "PUT",
      headers: { "Content-Type":"application/json", "Authorization":"Bearer " + token },
      body: JSON.stringify({ tipo, descricao, valor, data })
    });
    if (!resp.ok) {
      const err = await resp.json();
      alert("Erro ao editar: " + (err.erro || "desconhecido"));
      return;
    }
    document.getElementById("editId").value = "";
    document.getElementById("btnCancelEdit").style.display = "none";
    document.querySelector("#formLancamento button[type=submit]").innerText = "Adicionar";
    document.getElementById("formLancamento").reset();
    await carregarLancamentos();
  } catch (e) {
    alert("Erro ao conectar");
  }
}

// ==============================
// EXCLUIR
// ==============================
async function excluirLancamento(id) {
  if (!confirm("Confirma exclusão?")) return;
  const token = localStorage.getItem("token");
  try {
    const resp = await fetch(API + "/api/lancamentos/" + id, {
      method: "DELETE",
      headers: { "Authorization":"Bearer " + token }
    });
    if (!resp.ok) {
      const err = await resp.json();
      alert("Erro ao excluir: " + (err.erro || "desconhecido"));
      return;
    }
    await carregarLancamentos();
  } catch (e) {
    alert("Erro ao conectar");
  }
}

// ==============================
// FILTRO
// ==============================
async function aplicarFiltro() {
  await carregarLancamentos();
}

// ==============================
// RENDER TABELA
// ==============================
function renderizarTabela(lista = []) {
  const tbody = document.querySelector("#tabela tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  let totalVendas = 0, totalCompras = 0;

  if (!Array.isArray(lista) || lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:16px;">Nenhum lançamento</td></tr>`;
    document.getElementById("totalVendas").innerText = formatCurrencyBR(0);
    document.getElementById("totalCompras").innerText = formatCurrencyBR(0);
    document.getElementById("totalCaixa").innerText = formatCurrencyBR(0);
    return;
  }

  lista.forEach(l => {
    const id = l.id;
    const tipo = l.tipo || "";
    const descricao = l.descricao || "";
    const valor = Number(l.valor || 0);
    const data = l.data || "";

    const tipoN = normalizeTipo(tipo);
    if (tipoN === "entrada") totalVendas += valor;
    if (tipoN === "saida") totalCompras += valor;

    const tr = document.createElement("tr");
    tr.classList.add(tipoN);
    tr.innerHTML = `
      <td>${escapeHtml(tipo)}</td>
      <td>${escapeHtml(descricao)}</td>
      <td>${formatCurrencyBR(valor)}</td>
      <td>${formatDateISOtoBR(data)}</td>
      <td>
        <button class="btn small" onclick='iniciarEdicaoFromRow(${id}, ${JSON.stringify(tipo)}, ${JSON.stringify(descricao)}, ${JSON.stringify(valor)}, ${JSON.stringify(data)})'>Editar</button>
        <button class="btn small danger" onclick='excluirLancamento(${id})'>Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("totalVendas").innerText = formatCurrencyBR(totalVendas);
  document.getElementById("totalCompras").innerText = formatCurrencyBR(totalCompras);
  document.getElementById("totalCaixa").innerText = formatCurrencyBR(totalVendas - totalCompras);
}

// ==============================
// GRÁFICOS (Chart.js)
// ==============================
function desenharGraficos(lista = []) {
  // pie: total entrada x saida
  let totalEntr = 0, totalSaida = 0;
  lista.forEach(l => {
    const tipo = normalizeTipo(l.tipo);
    const valor = Number(l.valor || 0);
    if (tipo === "entrada") totalEntr += valor;
    else if (tipo === "saida") totalSaida += valor;
  });

  const pieCtx = document.getElementById("pieChart").getContext("2d");
  if (pieChart) pieChart.destroy();
  pieChart = new Chart(pieCtx, {
    type: "pie",
    data: {
      labels: ["Entradas", "Saídas"],
      datasets: [{ data: [totalEntr, totalSaida] }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  // line: agrupado por mês-ano
  const mapa = {}; // "2025-12" -> total (entradas - saídas) or total movement
  lista.slice().reverse().forEach(l => {
    const dt = l.data || "";
    if (!dt) return;
    const [y,m] = dt.split("-");
    const key = `${y}-${m}`;
    if (!mapa[key]) mapa[key] = 0;
    mapa[key] += Number(l.valor || 0) * (normalizeTipo(l.tipo) === "saida" ? -1 : 1);
  });

  const labels = Object.keys(mapa).sort();
  const dataLine = labels.map(k => mapa[k]);

  const lineCtx = document.getElementById("lineChart").getContext("2d");
  if (lineChart) lineChart.destroy();
  lineChart = new Chart(lineCtx, {
    type: "line",
    data: { labels, datasets: [{ label: "Fluxo (R$)", data: dataLine, fill:false }] },
    options: { responsive:true, maintainAspectRatio:false }
  });
}
