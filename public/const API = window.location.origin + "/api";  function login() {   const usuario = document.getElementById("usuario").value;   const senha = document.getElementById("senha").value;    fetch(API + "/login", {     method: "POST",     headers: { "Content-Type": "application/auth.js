const API = window.location.origin + "/api";

function login() {
  const usuario = document.getElementById("usuario").value;
  const senha = document.getElementById("senha").value;

  fetch(API + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, senha })
  })
    .then(r => r.json())
    .then(d => {
      if (d.token) {
        localStorage.setItem("token", d.token);
        window.location.href = "index.html";
      } else {
        document.getElementById("erro").innerText = "Login inválido";
      }
    });
}

function getToken() {
  return localStorage.getItem("token");
}

if (!getToken() && !location.href.includes("login.html")) {
  location.href = "login.html";
}
