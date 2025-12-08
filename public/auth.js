// auth.js (frontend)
async function login() {
  const usuario = document.getElementById("usuario").value.trim();
  const senha = document.getElementById("senha").value.trim();
  const erro = document.getElementById("erro");
  erro.innerText = "";

  if (!usuario || !senha) {
    erro.innerText = "Preencha usuário e senha";
    return;
  }

  try {
    const resp = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, senha })
    });

    const data = await resp.json();

    if (resp.ok && data.token) {
      localStorage.setItem("token", data.token);
      window.location.href = "index.html";
    } else {
      erro.innerText = data.erro || "Usuário ou senha incorretos";
    }
  } catch (e) {
    erro.innerText = "Erro ao conectar com o servidor";
    console.error(e);
  }
}
