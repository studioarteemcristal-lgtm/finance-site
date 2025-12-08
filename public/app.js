const API = window.location.origin;

// ==============================
// VERIFICAR LOGIN
// ==============================
function verificarLogin() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
  }
}

// ==============================
// CARREGAR LANÇAMENTOS
// ==============================
async function carregarLancamentos() {
  const token = localStorage.getItem("token");

  try {
    const resp = await fetch(API + "/api/lancamentos", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    if (!resp.ok) {
      console.error("Erro ao buscar lançamentos");
      return;
    }

    const lista = await resp.json();
    renderizarTabela(lista);

  } catch (e) {
    console.error("Erro ao conectar:", e);
  }
}

// ==============================
// ADICIONAR LANÇAMENTO
// ==============================
async function adicionarLancamento() {
  const tipo = document.getElementById("tipo").value;
  const descricao = document.getElementById("descricao").value;
  const valor = parseFloat(document.getElementById("valor").value);
  const data = document.getElementById("data").value;

  const token = localStorage.getItem("token");

  try {
    const resp = await fetch(API + "/api/lancamentos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ tipo, descricao, valor, data })
    });

    if (!resp.ok) {
      alert("Erro ao salvar");
      return;
    }

    await carregarLancamentos();

  } catch (e) {
    alert("Erro ao conectar ao servidor");
  }
}

// ==============================
// EVENTOS
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("index.html")) {
    verificarLogin();
    carregarLancamentos();

    // ⬇⬇⬇ CORREÇÃO: OUVIR SUBMIT DO FORMULÁRIO ⬇⬇⬇
    document.getElementById("formLancamento")
      ?.addEventListener("submit", (e) => {
        e.preventDefault();
        adicionarLancamento();
      });
  }
});

// ==============================
// TABELA E CÁLCULOS
// ==============================
function renderizarTabela(lista = []) {
  const tbody = document.querySelector("#tabela tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  let totalVendas = 0;
  let totalCompras = 0;

  if (!Array.isArray(lista) || lista.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="4" style="text-align:center; padding:16px;">Nenhum lançamento</td>`;
    tbody.appendChild(tr);
    return;
  }

  lista.forEach(l => {
    const tr = document.createElement("tr");

    const tipo = String(l.tipo ?? "");
    const descricao = String(l.descricao ?? "");
    const valor = Number(l.valor ?? 0);
    const data = l.data ?? "";

    if (tipo === "entrada") totalVendas += valor;
    if (tipo === "saida") totalCompras += valor;

    tr.classList.add(tipo);

    tr.innerHTML = `
      <td>${escapeHtml(tipo)}</td>
      <td>${escapeHtml(descricao)}</td>
      <td>${formatCurrencyBR(valor)}</td>
      <td>${formatDateISOtoBR(data)}</td>
    `;

    tbody.appendChild(tr);
  });

  // Atualiza cards, se existirem
  if (document.getElementById("totalVendas"))
      document.getElementById("totalVendas").innerText = formatCurrencyBR(totalVendas);

  if (document.getElementById("totalCompras"))
      document.getElementById("totalCompras").innerText = formatCurrencyBR(totalCompras);

  if (document.getElementById("totalCaixa"))
      document.getElementById("totalCaixa").innerText = formatCurrencyBR(totalVendas - totalCompras);
}

// ==============================
// FUNÇÕES AUXILIARES
// ==============================
function escapeHtml(text) {
  const map = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function formatCurrencyBR(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatDateISOtoBR(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
