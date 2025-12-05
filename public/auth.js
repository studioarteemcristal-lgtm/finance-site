const API = window.location.origin;

async function login() {
  const usuario = document.getElementById("usuario").value;
  const senha = document.getElementById("senha").value;

  const resp = await fetch(API + "/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, senha })
  });

  const dados = await resp.json();

  if (dados.token) {
    localStorage.setItem("token", dados.token);
    window.location.href = "index.html";
  } else {
    document.getElementById("erro").innerText = "Usuário ou senha incorretos";
  }
}
