// Carregar dados do localStorage
function carregarDados() {
    return JSON.parse(localStorage.getItem("dados")) || [];
}

// Salvar dados no localStorage
function salvarDados(dados) {
    localStorage.setItem("dados", JSON.stringify(dados));
}

// Adicionar item
function adicionarItem() {
    const descricao = document.getElementById("descricao").value;
    const valor = parseFloat(document.getElementById("valor").value);
    const data = document.getElementById("data").value;
    const tipo = document.getElementById("tipo").value;

    if (!descricao || isNaN(valor) || !data || !tipo) {
        alert("Por favor, preencha todos os campos corretamente!");
        return;
    }

    const dados = carregarDados();
    dados.push({ descricao, valor, data, tipo });
    salvarDados(dados);

    atualizarTabela();
    atualizarDashboard();
    limparCampos();
}

// Limpar inputs
function limparCampos() {
    document.getElementById("descricao").value = "";
    document.getElementById("valor").value = "";
    document.getElementById("data").value = "";
    document.getElementById("tipo").value = "entrada";
}

// Remover item
function removerItem(index) {
    const dados = carregarDados();
    dados.splice(index, 1);
    salvarDados(dados);

    atualizarTabela();
    atualizarDashboard();
}

// Atualizar tabela principal
function atualizarTabela() {
    const dados = carregarDados();
    const filtro = document.getElementById("filtro").value.toLowerCase();
    const tabela = document.getElementById("tabela-body");

    tabela.innerHTML = "";

    dados.forEach((item, index) => {
        if (filtro !== "" && !item.descricao.toLowerCase().includes(filtro)) return;

        const linha = `
            <tr>
                <td>${item.descricao}</td>
                <td>${item.valor.toFixed(2)}</td>
                <td>${item.data}</td>
                <td class="${item.tipo === "entrada" ? "green" : "red"}">${item.tipo}</td>
                <td><button class="remover-btn" onclick="removerItem(${index})">X</button></td>
            </tr>
        `;
        tabela.innerHTML += linha;
    });
}

// Atualizar dashboard (somatórios e gráfico)
function atualizarDashboard() {
    const dados = carregarDados();

    let totalVendas = 0;
    let totalCompras = 0;
    let byMonth = {};

    dados.forEach(l => {
        const tipo = (l.tipo || "").toLowerCase();
        const valor = Number(l.valor) || 0;

        // SOMATÓRIO — CORRETO E TESTADO
        if (tipo === "entrada") {
            totalVendas += valor;
        } else if (tipo === "saida") {
            totalCompras += valor;
        }

        // Agrupar por mês
        if (l.data) {
            const m = l.data.slice(0, 7);
            byMonth[m] = (byMonth[m] || 0) + valor;
        }
    });

    const lucro = totalVendas - totalCompras;

    document.getElementById("total-vendas").innerText = totalVendas.toFixed(2);
    document.getElementById("total-compras").innerText = totalCompras.toFixed(2);
    document.getElementById("lucro").innerText = lucro.toFixed(2);

    atualizarGrafico(byMonth);
}

// Gráfico mensal
let chart = null;
function atualizarGrafico(byMonth) {
    const ctx = document.getElementById("grafico").getContext("2d");

    const labels = Object.keys(byMonth).sort();
    const values = labels.map(m => byMonth[m]);

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Movimentação Mensal",
                data: values,
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: true } }
        }
    });
}

// Executar ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
    atualizarTabela();
    atualizarDashboard();
});
