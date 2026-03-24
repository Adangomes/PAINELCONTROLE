// 1. CONFIGURAÇÃO DO FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyCXA1yP1F-riNkzOX5zJs5gsQ82EzsT7Qg", 
    databaseURL: "https://myproject26-10f0e-default-rtdb.firebaseio.com/",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
// 🔐 CONFIG GERAL
const TAXA_FIXA_MENSAL = 69.90;
const DIA_VENCIMENTO = 10;
// ✅ IDs CORRIGIDOS AQUI
let parceiros = [
    { id: 'snoop_lanches', nome: "Snoop Lanches", vendas: 0, status: "PENDENTE" },
    { id: 'kings_burger', nome: "Kings Burger", vendas: 0, status: "PENDENTE" }
];
// 🚀 INICIALIZAÇÃO
function inicializar() {
    document.getElementById('data-atual').innerText = 
        new Date().toLocaleDateString('pt-BR');
    ouvirPedidosRealtime();
}
// 🔴 ESCUTA FIREBASE (CORRIGIDO)
function ouvirPedidosRealtime() {
    parceiros.forEach(p => {

        // FATURAMENTO - Melhorado para não zerar por erro de leitura
        db.ref(`faturamento_acumulado/${p.id}`).on('value', (snapshot) => {
            if (snapshot.exists()) {
                const dados = snapshot.val();
                // Verifica se o campo 'vendas' existe dentro do objeto
                p.vendas = parseFloat(dados.vendas || 0);
                console.log(`Dados recebidos para ${p.id}:`, p.vendas);
            } else {
                console.warn(`Atenção: Caminho não encontrado no Firebase para o ID: ${p.id}`);
                p.vendas = 0; 
            }
            renderizarTabela();
        });

        // STATUS
        db.ref(`configuracoes/${p.id}/ultimo_pagamento`).on('value', (snap) => {
            const ultimaData = snap.val();
            p.status = calcularStatus(ultimaData);
            renderizarTabela();
        });

    });
}

// 🧠 STATUS
function calcularStatus(dataUltimoPagamento) {
    const hoje = new Date();
    const diaAtual = hoje.getDate();

    if (!dataUltimoPagamento) return "PENDENTE";

    const dataPagto = new Date(dataUltimoPagamento);

    const meses = 
        (hoje.getFullYear() - dataPagto.getFullYear()) * 12 +
        (hoje.getMonth() - dataPagto.getMonth());

    if (meses >= 1 && diaAtual > DIA_VENCIMENTO) {
        return "PENDENTE";
    }

    return "ATIVO";
}

// 📊 RENDER
function renderizarTabela() {
    const corpo = document.getElementById('tabela-clientes');
    if (!corpo) return;

    let totalComissao = 0;
    let totalMensal = 0;

    corpo.innerHTML = parceiros.map(res => {

        const vendas = res.vendas || 0;
        const comissao = vendas * 0.10;
        const total = comissao + TAXA_FIXA_MENSAL;

        totalComissao += comissao;
        totalMensal += TAXA_FIXA_MENSAL;

        const cor = res.status === "ATIVO" ? "#27ae60" : "#e67e22";

        return `
        <tr>
            <td><strong>${res.nome}</strong></td>
            <td>R$ ${vendas.toFixed(2)}</td>
            <td style="color:#27ae60">R$ ${comissao.toFixed(2)}</td>
            <td>R$ ${TAXA_FIXA_MENSAL.toFixed(2)}</td>
            <td style="font-weight:800;color:#2ecc71">R$ ${total.toFixed(2)}</td>
            <td><span style="background:${cor};padding:5px 10px;border-radius:6px;color:#fff">${res.status}</span></td>
        <td>
            <div class="btn-group">
                <button class="btn-action" onclick="gerarPDF('${res.nome}', ${vendas})">PDF</button>
                <button class="btn-action btn-clear" onclick="darBaixaPagamento('${res.id}')">RECEBI</button>
            </div>
        </td>
        </tr>
        `;
    }).join('');

    document.getElementById('total-comissoes').innerText = `R$ ${totalComissao.toFixed(2)}`;
    document.getElementById('total-fixo').innerText = `R$ ${totalMensal.toFixed(2)}`;
    document.getElementById('total-geral').innerText = `R$ ${(totalComissao + totalMensal).toFixed(2)}`;
}

// 💰 DAR BAIXA
function darBaixaPagamento(idLoja) {
    const agora = new Date().toISOString();

    db.ref(`configuracoes/${idLoja}`).update({
        ultimo_pagamento: agora
    });

    db.ref(`faturamento_acumulado/${idLoja}`).set({
        vendas: 0
    });

    db.ref(`pedidos/${idLoja}`).remove();

    alert("Pagamento registrado!");
}

// 📄 PDF
function gerarPDF(nome, vendas) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const comissao = vendas * 0.10;
    const total = comissao + TAXA_FIXA_MENSAL;

    doc.text(`Relatório - ${nome}`, 20, 20);

    doc.text(`Vendas: R$ ${vendas.toFixed(2)}`, 20, 40);
    doc.text(`Comissão: R$ ${comissao.toFixed(2)}`, 20, 50);
    doc.text(`Mensalidade: R$ ${TAXA_FIXA_MENSAL}`, 20, 60);
    doc.text(`Total: R$ ${total.toFixed(2)}`, 20, 70);

    doc.save("relatorio.pdf");
}

// 🔐 LOGIN
const SENHA_MESTRA = "ADAN@26MYDI";

function verificarAcesso() {
    const senha = document.getElementById('admin-pass').value;

    if (senha === SENHA_MESTRA) {

        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('panel-content').style.display = 'block';

        firebase.auth().signInAnonymously()
        .then(() => {
            console.log("Logado Firebase ✅");
            inicializar();
        })
        .catch(err => {
            console.error(err);
            alert("Erro Firebase");
        });

    } else {
        alert("Senha incorreta");
    }
}

// ENTER
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') verificarAcesso();
});
