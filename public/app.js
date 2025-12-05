const API = window.location.origin + "/api";

// ✅ Proteção: se não existir token, volta pro login
function getTokenSeguro() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login.html";
    return null;
  }
  return token;
}

// ================================
// ✅ CARREGAR LANÇAMENTOS
// ================================
function carregarLancamentos() {
  const token = getTokenSeguro();
  if (!token) return;

  fetch(API + "/lancamentos", {
    headers: { Authorization: "Bearer " + token }
  })
    .then(r => {
      if (!r.ok) {
        if (r.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login.html";
        }
        throw new Error("Erro ao carregar lançamentos");
      }
      return r.json();
    })
    .then(lista => {
      const tbody = document.querySelector("#tabela tbody");
      tbody.innerHTML = "";

      lista.forEach(l => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${l.tipo}</td>
          <td>${l.descricao}</td>
          <td>R$ ${Number(l.valor).toFixed(2)}</td>
          <td>${l.data}</td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch(err => console.error("Erro:", err));
}

// ================================
// ✅ ENVIAR LANÇAMENTO
// ================================
document.getElementById("formLancamento").addEventListener("submit", e => {
  e.preventDefault();

  const token = getTokenSeguro();
  if (!token) return;

  const data = {
    tipo: document.getElementById("tipo").value,
    descricao: document.getElementById("descricao").value,
    valor: Number(document.getElementById("valor").value),
    data: document.getElementById("data").value
  };

  fetch(API + "/lancamentos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify(data)
  })
    .then(r => {
      if (!r.ok) {
        if (r.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login.html";
        }
        throw new Error("Erro ao salvar lançamento");
      }
      return r.json();
    })
    .then(() => carregarLancamentos())
    .catch(err => console.error("Erro:", err));
});

// ✅ Carrega automaticamente ao abrir o painel
carregarLancamentos();
