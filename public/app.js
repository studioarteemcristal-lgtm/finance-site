// ============================
// PAINEL FINANCEIRO — APP.JS
// ============================

// Lista de lançamentos armazenados
let lancamentos = JSON.parse(localStorage.getItem("lancamentos")) || [];

// Referências de elementos do DOM
let tabelaBody, tipo, descricao, valor, dataLanc, editId, btnCancelEdit;

// Gráficos
let pieChart = null;
let lineChart = null;


// ============================
// INICIALIZAÇÃO
// ============================
document.addEventListener("DOMContentLoaded", () => {
    // Mapear elementos
    tabelaBody = document.querySelector("#tabela tbody");
    tipo = document.getElementById("tipo");
    descricao = document.getElementById("descricao");
    valor = document.getElementById("valor");
    dataLanc = document.getElementById("data");
    editId = document.getElementById("editId");
    btnCancelEdit = document.getElementById("btnCancelEdit");

    // Eventos
    document.getElementById("formLancamento").addEventListener("submit", salvarLancamento);
    btnCancelEdit.addEventListener("click", cancelarEdicao);

    document.getElementById("btnFilter").addEventListener("click", aplicarFiltro);
    document.getElementById("btnResetFilter").addEventListener("click", limparFiltro);

    // Atualizar interface
    atualizarTabela(lancamentos);
    atualizarDashboard();
    atualizarGraficos();
});


// ============================
// SALVAR OU EDITAR LANÇAMENTO
// ============================
function salvarLancamento(e) {
    e.preventDefault();

    const novo = {
        id: editId.value ? Number(editId.value) : Date.now(),
        tipo: tipo.value,
        descricao: descricao.value,
        valor: parseFloat(valor.value),
        data: dataLanc.value
    };

    if (!novo.data) {
        alert("Selecione uma data!");
        return;
    }

    if (editId.value) {
        // Edição
        lancamentos = lancamentos.map(l => (l.id === novo.id ? novo : l));
    } else {
        // Novo lançamento
        lancamentos.push(novo);
    }

    // Salvar
    localStorage.setItem("lancamentos", JSON.stringify(lancamentos));

    // Atualizar interface
    atualizarTabela(lancamentos);
    atualizarDashboard();
    atualizarGraficos();

    // Resetar formulário
    document.getElementById("formLancamento").reset();
    editId.value = "";
    btnCancelEdit.style.display = "none";
}


// ============================
// CANCELAR EDIÇÃO
// ============================
function cancelarEdicao() {
    editId.value = "";
    document.getElementById("formLancamento").reset();
    btnCancelEdit.style.display = "none";
}


// ============================
// CARREGAR TABELA
// ============================
function atualizarTabela(lista) {
    tabelaBody.innerHTML = "";

    lista.forEach(l => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${l.tipo === "entrada" ? "Entrada" : "Saída"}</td>
            <td>${l.descricao}</td>
            <td>R$ ${l.valor.toFixed(2)}</td>
            <td>${formatarData(l.data)}</td>
            <td>
                <button class="btn-edit" onclick="editar(${l.id})">Editar</button>
                <button class="btn-delete" onclick="excluir(${l.id})">Excluir</button>
            </td>
        `;

        tabelaBody.appendChild(tr);
    });
}


// ============================
// EDITAR LANÇAMENTO
// ============================
function editar(id) {
    const lanc = lancamentos.find(l => l.id === id);
    if (!lanc) return;

    editId.value = lanc.id;
    tipo.value = lanc.tipo;
    descricao.value = lanc.descricao;
    valor.value = lanc.valor;
    dataLanc.value = lanc.data;

    btnCancelEdit.style.display = "inline-block";
}


// ============================
// EXCLUIR LANÇAMENTO
// ============================
function excluir(id) {
    if (!confirm("Deseja excluir este lançamento?")) return;

    lancamentos = lancamentos.filter(l => l.id !== id);
    localStorage.setItem("lancamentos", JSON.stringify(lancamentos));

    atualizarTabela(lancamentos);
    atualizarDashboard();
    atualizarGraficos();
}


// ============================
// DASHBOARD (CARDS)
// ============================
function atualizarDashboard() {
    const entradas = lancamentos
        .filter(l => l.tipo === "entrada")
        .reduce((t, l) => t + l.valor, 0);

    const saídas = lancamentos
        .filter(l => l.tipo === "saida")
        .reduce((t, l) => t + l.valor, 0);

    document.getElementById("totalVendas").innerText = `R$ ${entradas.toFixed(2)}`;
    document.getElementById("totalCompras").innerText = `R$ ${saídas.toFixed(2)}`;
    document.getElementById("totalCaixa").innerText = `R$ ${(entradas - saídas).toFixed(2)}`;
}


// ============================
// FILTRO POR DATA
// ============================
function aplicarFiltro() {
    const de = document.getElementById("filterFrom").value;
    const ate = document.getElementById("filterTo").value;

    let filtrados = lancamentos;

    if (de) filtrados = filtrados.filter(l => l.data >= de);
    if (ate) filtrados = filtrados.filter(l => l.data <= ate);

    atualizarTabela(filtrados);
}

function limparFiltro() {
    document.getElementById("filterFrom").value = "";
    document.getElementById("filterTo").value = "";
    atualizarTabela(lancamentos);
}


// ============================
// GRÁFICOS (CHART.JS)
// ============================
function atualizarGraficos() {
    const entradas = lancamentos
        .filter(l => l.tipo === "entrada")
        .reduce((t, l) => t + l.valor, 0);

    const saídas = lancamentos
        .filter(l => l.tipo === "saida")
        .reduce((t, l) => t + l.valor, 0);

    // Gráfico de Pizza
    const pieCtx = document.getElementById("pieChart").getContext("2d");

    if (pieChart) pieChart.destroy();

    pieChart = new Chart(pieCtx, {
        type: "pie",
        data: {
            labels: ["Entradas", "Saídas"],
            datasets: [{
                data: [entradas, saídas]
            }]
        }
    });

    // Gráfico de Linha — Total por dia
    const movimentoPorDia = {};

    lancamentos.forEach(l => {
        if (!movimentoPorDia[l.data]) movimentoPorDia[l.data] = 0;
        movimentoPorDia[l.data] += l.tipo === "entrada" ? l.valor : -l.valor;
    });

    const datas = Object.keys(movimentoPorDia).sort();
    const valores = datas.map(d => movimentoPorDia[d]);

    const lineCtx = document.getElementById("lineChart").getContext("2d");

    if (lineChart) lineChart.destroy();

    lineChart = new Chart(lineCtx, {
        type: "line",
        data: {
            labels: datas.map(formatarData),
            datasets: [{
                label: "Movimentação",
                data: valores
            }]
        }
    });
}


// ============================
// FUNÇÕES ÚTEIS
// ============================
function formatarData(dataISO) {
    const [ano, mes, dia] = dataISO.split("-");
    return `${dia}/${mes}/${ano}`;
}
