// auth.js — login simples que recebe token e salva em localStorage
async function login() {
  const usuario = document.getElementById("usuario").value.trim();
  const senha = document.getElementById("senha").value.trim();
  const erroEl = document.getElementById("erro");

  erroEl.textContent = "";

  try {
    const resp = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, senha })
    });

    const dados = await resp.json();
    if (resp.ok && dados.token) {
      localStorage.setItem("token", dados.token);
      window.location.href = "index.html";
    } else {
      erroEl.textContent = dados.erro || "Usuário ou senha incorretos";
    }
  } catch (e) {
    erroEl.textContent = "Erro ao conectar com o servidor";
    console.error(e);
  }
}

window.login = login;
