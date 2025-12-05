const API = window.location.origin + "/api";

function carregarLancamentos() {
  fetch(API + "/lancamentos", {
    headers: { Authorization: "Bearer " + getToken() }
  })
    .then(r => r.json())
    .then(lista => {
      const tbody = document.querySelector("#tabela tbody");
      tbody.innerHTML = "";

      lista.forEach(l => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${l.tipo}</td>
          <td>${l.descricao}</td>
          <td>R$ ${l.valor.toFixed(2)}</td>
          <td>${l.data}</td>
        `;
        tbody.appendChild(tr);
      });
    });
}

document.getElementById("formLancamento").addEventListener("submit", e => {
  e.preventDefault();

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
      Authorization: "Bearer " + getToken()
    },
    body: JSON.stringify(data)
  }).then(() => carregarLancamentos());
});

carregarLancamentos();
