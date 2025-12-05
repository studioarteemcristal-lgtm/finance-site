const API = window.location.origin;

// ===== LOGIN =====
async function login() {
  const usuario = document.getElementById("usuario").value;
  const senha = document.getElementById("senha").value;

  const resp = await fetch(API + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, senha })
  });

  const dados = await resp.json();

  if (dados.ok) {
    localStorage.setItem("token", dados.token);
    window.location.href = "index.html";
  } else {
    document.getElementById("erro").innerText = "Login inválido";
  }
}

// ===== TOKEN =====
function getToken() {
  return localStorage.getItem("token");
}
