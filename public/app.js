// app.js (frontend)
const API = window.location.origin;

function getToken() {
  return localStorage.getItem("token");
}

function tratar401(resp) {
  if (resp.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "login.html";
    return true;
  }
  return false;
}

async function carregarLancamentos(from='', to='') {
  const token = getToken();
  if (!token) { window.location.href = "login.html"; return; }

  let url = "/api/lancamentos";
  const params = [];
  if (from) params.push(`from=${encodeURIComponent(from)}`);
  if (to) params.push(`to=${encodeURIComponent(to)}`);
  if (params.length) url += "?" + params.join("&");

  const resp = await fetch(url, {
    headers: { Authorization: "Bearer " + token }
  });

  if (!resp.ok) {
    if (tratar401(resp)) return;
    console.error("Erro ao carregar lançamentos");
    return;
  }
  const lista = await resp.json();
  renderizarTabela(lista);
  atualizarCardsECharts(lista);
}

function formatCurrencyBR(value) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function escapeHtml(s) {
  return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function renderizarTabela(lista) {
  const tbody = document.querySelector("#tabela tbody");
  if (!tbody) return;

  tbody.innerHTML = "";
  if (!Array.isArray(lista) || lista.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5" style="text-align:center;padding:16px;">Nenhum lançamento</td>`;
    tbody.appendChild(tr);
    return;
  }

  lista.forEach(item => {
    const tr = document.createElement("tr");
    tr.classList.add((item.tipo||"").toLowerCase());
    tr.innerHTML = `
      <td>${escapeHtml(item.tipo)}</td>
      <td>${escapeHtml(item.descricao)}</td>
      <td>${formatCurrencyBR(item.valor)}</td>
      <td>${escapeHtml(item.data)}</td>
      <td>
        <button data-id="${item.id}" class="btn-edit">Editar</button>
        <button data-id="${item.id}" class="btn-delete">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // listeners de ações
  document.querySelectorAll(".btn-delete").forEach(b => {
    b.addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;
      if (!confirm("Confirmar exclusão?")) return;
      const token = getToken();
      const resp = await fetch(`/api/lancamentos/${id}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token }
      });
      if (!resp.ok) {
        if (tratar401(resp)) return;
        alert("Erro ao excluir");
        return;
      }
      carregarLancamentos();
    });
  });

  document.querySelectorAll(".btn-edit").forEach(b => {
    b.addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;
      const token = getToken();
      const resp = await fetch(`/api/lancamentos/${id}`, {
        headers: { Authorization: "Bearer " + token }
      });
      if (!resp.ok) { if (tratar401(resp)) return; alert("Erro ao buscar"); return; }
      const item = await resp.json();
      // preencher form para editar
      document.getElementById("editId").value = item.id;
      document.getElementById("tipo").value = item.tipo;
      document.getElementById("descricao").value = item.descricao;
      document.getElementById("valor").value = item.valor;
      document.getElementById("data").value = item.data;
      document.getElementById("btnCancelEdit").style.display = "inline-block";
      document.querySelector("#formLancamento button[type=submit]").textContent = "Salvar";
    });
  });
}

async function adicionarOuAtualizar(event) {
  event.preventDefault();
  const id = document.getElementById("editId").value;
  const tipo = document.getElementById("tipo").value;
  const descricao = document.getElementById("descricao").value.trim();
  const valor = parseFloat(document.getElementById("valor").value);
  const data = document.getElementById("data").value;

  const token = getToken();
  if (!token) { window.location.href = "login.html"; return; }

  const payload = { tipo, descricao, valor, data };

  if (id) {
    // atualizar
    const resp = await fetch(`/api/lancamentos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) { if (tratar401(resp)) return; alert("Erro ao atualizar"); return; }
    // limpa modo edição
    document.getElementById("editId").value = "";
    document.getElementById("btnCancelEdit").style.display = "none";
    document.querySelector("#formLancamento button[type=submit]").textContent = "Adicionar";
  } else {
    // criar
    const resp = await fetch("/api/lancamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) { if (tratar401(resp)) return; alert("Erro ao salvar"); return; }
  }

  document.getElementById("formLancamento").reset();
  carregarLancamentos();
}

// cancelar edição
document.getElementById("btnCancelEdit")?.addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("editId").value = "";
  document.getElementById("formLancamento").reset();
  document.getElementById("btnCancelEdit").style.display = "none";
  document.querySelector("#formLancamento button[type=submit]").textContent = "Adicionar";
});

// filtros
document.getElementById("btnFilter")?.addEventListener("click", (e) => {
  const from = document.getElementById("filterFrom").value;
  const to = document.getElementById("filterTo").value;
  carregarLancamentos(from, to);
});
document.getElementById("btnResetFilter")?.addEventListener("click", (e) => {
  document.getElementById("filterFrom").value = "";
  document.getElementById("filterTo").value = "";
  carregarLancamentos();
});

// gráfico (Chart.js) — atualiza com os dados
let pieChart = null;
let lineChart = null;

function atualizarCardsECharts(lista) {
  let totalVendas = 0;
  let totalCompras = 0;
  const byMonth = {}; // YYYY-MM -> total

  lista.forEach(l => {
    const tipo = (l.tipo || "").toLowerCase();
    const valor = Number(l.valor) || 0;
    if (tipo === "entrada") totalVendas += valor;
    else if (tipo === "saida") totalCompras += valor;

    // agrupamento por mês
    if (l.data) {
      const m = l.data.slice(0,7); // YYYY-MM
      byMonth[m] = (byMonth[m] || 0) + valor;
    }
  });

  const totalCaixa = totalVendas - totalCompras;
  document.getElementById("totalVendas")?.innerText = formatCurrencyBR(totalVendas);
  document.getElementById("totalCompras")?.innerText = formatCurrencyBR(totalCompras);
  document.getElementById("totalCaixa")?.innerText = formatCurrencyBR(totalCaixa);

  // pie chart (entradas x saídas)
  const pieCtx = document.getElementById("pieChart");
  if (pieCtx) {
    const data = [totalVendas, totalCompras];
    if (pieChart) {
      pieChart.data.datasets[0].data = data;
      pieChart.update();
    } else {
      pieChart = new Chart(pieCtx.getContext("2d"), {
        type: "pie",
        data: {
          labels: ["Entradas","Saídas"],
          datasets: [{ data, backgroundColor: ["#3b82f6","#fb7185"] }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }
  }

  // line chart: meses
  const lineCtx = document.getElementById("lineChart");
  if (lineCtx) {
    const months = Object.keys(byMonth).sort();
    const vals = months.map(m => byMonth[m]);
    if (lineChart) {
      lineChart.data.labels = months;
      lineChart.data.datasets[0].data = vals;
      lineChart.update();
    } else {
      lineChart = new Chart(lineCtx.getContext("2d"), {
        type: "line",
        data: {
          labels: months,
          datasets: [{
            label: "Fluxo (R$)",
            data: vals,
            fill: false,
            borderColor: "#3b82f6",
            tension: 0.2
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }
  }
}

// inicialização
document.addEventListener("DOMContentLoaded", () => {
  // se estamos na página index.html carregamos dados
  if (window.location.pathname.endsWith("index.html") || window.location.pathname === "/") {
    const token = getToken();
    if (!token) { window.location.href = "login.html"; return; }

    // hook do form
    document.getElementById("formLancamento")?.addEventListener("submit", adicionarOuAtualizar);

    // carregar inicialmente
    carregarLancamentos();
  }
});
