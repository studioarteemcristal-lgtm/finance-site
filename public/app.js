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

async function carregarLancamentos(from = '', to = '') {
  const token = getToken();
  if (!token) { window.location.href = "login.html"; return; }

  let url = "/api/lancamentos";
  const params = [];
  if (from) params.push(`from=${from}`);
  if (to) params.push(`to=${to}`);
  if (params.length) url += "?" + params.join("&");

  const resp = await fetch(url, {
    headers: { Authorization: "Bearer " + token }
  });

  if (!resp.ok) {
    if (tratar401(resp)) return;
    alert("Erro ao carregar lançamentos");
    return;
  }

  const lista = await resp.json();
  renderizarTabela(lista);
  atualizarCardsECharts(lista);
}

function formatCurrencyBR(valor) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function escapeHtml(s) {
  return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function renderizarTabela(lista) {
  const tbody = document.querySelector("#tabela tbody");
  tbody.innerHTML = "";

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Nenhum lançamento</td></tr>`;
    return;
  }

  lista.forEach(item => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${escapeHtml(item.tipo)}</td>
      <td>${escapeHtml(item.descricao)}</td>
      <td>${formatCurrencyBR(item.valor)}</td>
      <td>${escapeHtml(item.data)}</td>
      <td>
        <button class="btn-edit" data-id="${item.id}">Editar</button>
        <button class="btn-delete" data-id="${item.id}">Excluir</button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  document.querySelectorAll(".btn-delete").forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      if (!confirm("Deseja excluir?")) return;

      const resp = await fetch(`/api/lancamentos/${id}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + getToken() }
      });

      if (!resp.ok) { alert("Erro ao excluir"); return; }
      carregarLancamentos();
    };
  });

  document.querySelectorAll(".btn-edit").forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;

      const resp = await fetch(`/api/lancamentos/${id}`, {
        headers: { Authorization: "Bearer " + getToken() }
      });

      const item = await resp.json();

      document.getElementById("editId").value = item.id;
      document.getElementById("tipo").value = item.tipo;
      document.getElementById("descricao").value = item.descricao;
      document.getElementById("valor").value = item.valor;
      document.getElementById("data").value = item.data;

      document.getElementById("btnCancelEdit").style.display = "inline-block";
      document.querySelector("#formLancamento button[type=submit]").textContent = "Salvar";
    };
  });
}

document.getElementById("formLancamento").addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("editId").value;
  const tipo = document.getElementById("tipo").value;
  const descricao = document.getElementById("descricao").value;
  const valor = parseFloat(document.getElementById("valor").value);
  const data = document.getElementById("data").value;

  const payload = { tipo, descricao, valor, data };
  const token = getToken();

  let resp;
  if (id) {
    resp = await fetch(`/api/lancamentos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify(payload)
    });
  } else {
    resp = await fetch(`/api/lancamentos`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify(payload)
    });
  }

  if (!resp.ok) { alert("Erro ao salvar"); return; }

  document.getElementById("formLancamento").reset();
  document.getElementById("editId").value = "";
  document.getElementById("btnCancelEdit").style.display = "none";
  document.querySelector("#formLancamento button[type=submit]").textContent = "Adicionar";

  carregarLancamentos();
});

document.getElementById("btnCancelEdit").onclick = () => {
  document.getElementById("formLancamento").reset();
  document.getElementById("editId").value = "";
  document.getElementById("btnCancelEdit").style.display = "none";
  document.querySelector("#formLancamento button[type=submit]").textContent = "Adicionar";
};

document.getElementById("btnFilter").onclick = () => {
  carregarLancamentos(
    document.getElementById("filterFrom").value,
    document.getElementById("filterTo").value
  );
};

document.getElementById("btnResetFilter").onclick = () => {
  document.getElementById("filterFrom").value = "";
  document.getElementById("filterTo").value = "";
  carregarLancamentos();
};

let pieChart = null;
let lineChart = null;

function atualizarCardsECharts(lista) {
  let entradas = 0, saidas = 0;
  const byMonth = {};

  lista.forEach(l => {
    const valor = Number(l.valor);
    const tipo = l.tipo.toLowerCase();

    if (tipo === "entrada") entradas += valor;
    else saidas += valor;

    const mes = l.data.substring(0, 7);
    byMonth[mes] = (byMonth[mes] || 0) + valor;
  });

  document.getElementById("totalVendas").innerText = formatCurrencyBR(entradas);
  document.getElementById("totalCompras").innerText = formatCurrencyBR(saidas);
  document.getElementById("totalCaixa").innerText = formatCurrencyBR(entradas - saidas);

  const pieCtx = document.getElementById("pieChart");
  if (pieCtx) {
    if (pieChart) pieChart.destroy();
    pieChart = new Chart(pieCtx, {
      type: "pie",
      data: {
        labels: ["Entradas", "Saídas"],
        datasets: [
          { data: [entradas, saidas], backgroundColor: ["#3b82f6", "#ef4444"] }
        ]
      }
    });
  }

  const lineCtx = document.getElementById("lineChart");
  if (lineCtx) {
    const meses = Object.keys(byMonth).sort();
    const valores = meses.map(m => byMonth[m]);

    if (lineChart) lineChart.destroy();
    lineChart = new Chart(lineCtx, {
      type: "line",
      data: {
        labels: meses,
        datasets: [{
          label: "Movimentação (R$)",
          data: valores,
          borderColor: "#3b82f6",
          fill: false
        }]
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const token = getToken();
  if (!token) window.location.href = "login.html";
  else carregarLancamentos();
});
