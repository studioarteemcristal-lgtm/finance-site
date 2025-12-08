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

    document.getElementById("btnAdicionar")
      ?.addEventListener("click", adicionarLancamento);
  }
});

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
