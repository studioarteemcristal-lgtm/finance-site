const API = window.location.origin;

async function login() {
  const usuario = document.getElementById("usuario").value;
  const senha = document.getElementById("senha").value;
  const erro = document.getElementById("erro");

  erro.innerText = "";

  try {
    const resp = await fetch(API + "/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, senha })
    });

    const dados = await resp.json();

    if (resp.ok && dados.sucesso) {
      // ✅ Marca como logado (sem token)
      localStorage.setItem("logado", "true");
      window.location.href = "index.html";
    } else {
      erro.innerText = "Usuário ou senha incorretos";
    }
  } catch (e) {
    erro.innerText = "Erro ao conectar com o servidor";
  }
}
