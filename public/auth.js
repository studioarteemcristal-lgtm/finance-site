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

    let dados;
    try {
      dados = await resp.json();
    } catch {
      erro.innerText = "Resposta inválida do servidor";
      return;
    }

    if (resp.ok && dados.sucesso) {
      // marca como logado
      localStorage.setItem("logado", "true");

      // redireciona para página principal
      window.location.href = "index.html";
    } else {
      erro.innerText = "Usuário ou senha incorretos";
    }
  } catch (e) {
    erro.innerText = "Erro ao conectar com o servidor";
  }
}
