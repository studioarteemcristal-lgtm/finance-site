async function login() {
  const usuario = document.getElementById("usuario").value.trim();
  const senha = document.getElementById("senha").value.trim();
  const erro = document.getElementById("erro");

  erro.innerText = "";

  try {
    const resp = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, senha })
    });

    const dados = await resp.json();

    if (resp.ok && dados.token) {
      // Salva token e marca login
      localStorage.setItem("token", dados.token);
      localStorage.setItem("logado", "true");

      window.location.href = "index.html";
    } else {
      erro.innerText = dados.erro || "Usuário ou senha incorretos";
    }
  } catch (e) {
    erro.innerText = "Erro ao conectar com o servidor";
  }
}
