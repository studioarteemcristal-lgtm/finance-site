function renderizarTabela(lista = []) {
  const tbody = document.querySelector("#tabela tbody");
  if (!tbody) {
    logError("Elemento #tabela tbody não encontrado.");
    return;
  }

  tbody.innerHTML = "";

  let totalVendas = 0;
  let totalCompras = 0;

  if (!Array.isArray(lista) || lista.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="4" style="text-align:center; padding:16px;">Nenhum lançamento</td>`;
    tbody.appendChild(tr);
    return;
  }

  lista.forEach(l => {
    const tr = document.createElement("tr");

    const tipo = String(l.tipo ?? "");
    const descricao = String(l.descricao ?? "");
    const valor = Number(l.valor ?? 0);
    const data = l.data ?? "";

    // soma valores
    if (tipo === "entrada") totalVendas += valor;
    if (tipo === "saida") totalCompras += valor;

    // adiciona classe de cor
    tr.classList.add(tipo);

    tr.innerHTML = `
      <td>${escapeHtml(tipo)}</td>
      <td>${escapeHtml(descricao)}</td>
      <td>${formatCurrencyBR(valor)}</td>
      <td>${formatDateISOtoBR(data)}</td>
    `;

    tbody.appendChild(tr);
  });

  // Atualiza cards
  document.getElementById("totalVendas").innerText = formatCurrencyBR(totalVendas);
  document.getElementById("totalCompras").innerText = formatCurrencyBR(totalCompras);
  document.getElementById("totalCaixa").innerText = formatCurrencyBR(totalVendas - totalCompras);
}
