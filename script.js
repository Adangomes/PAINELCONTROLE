const firebaseConfig = {
    databaseURL: "https://myproject26-10f0e-default-rtdb.firebaseio.com/",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const TAXA_FIXA_MENSAL = 59.90;

let parceiros = [
    { id: 'snoop_lanche', nome: "Snoop Lanches", vendas: 0, status: "ATIVO" },
    { id: 'kings_burger', nome: "Kings Burger", vendas: 0, status: "ATIVO" }
];

function inicializar() {
    document.getElementById('data-atual').innerText = new Date().toLocaleDateString('pt-BR');
    ouvirPedidosRealtime();
}

function ouvirPedidosRealtime() {
    parceiros.forEach(p => {
        db.ref(`pedidos/${p.id}`).on('value', (snapshot) => {
            let somaVendas = 0;
            const pedidos = snapshot.val();
            if (pedidos) {
                Object.values(pedidos).forEach(item => {
                    somaVendas += parseFloat(item.total || 0);
                });
            }
            p.vendas = somaVendas;
            renderizarTabela();
        });
    });
}

function renderizarTabela() {
    const corpo = document.getElementById('tabela-clientes');
    let somaComissoes = 0;
    let somaMensalidades = 0;

    corpo.innerHTML = parceiros.map(res => {
        const comissao = res.vendas * 0.10;
        const totalFatura = comissao + TAXA_FIXA_MENSAL;
        somaComissoes += comissao;
        somaMensalidades += TAXA_FIXA_MENSAL;

        return `
            <tr>
                <td><strong>${res.nome}</strong></td>
                <td>R$ ${res.vendas.toFixed(2)}</td>
                <td style="color: var(--primary); font-weight: 600;">R$ ${comissao.toFixed(2)}</td>
                <td>R$ ${TAXA_FIXA_MENSAL.toFixed(2)}</td>
                <td style="font-weight: 800;">R$ ${totalFatura.toFixed(2)}</td>
                <td><span class="badge">${res.status}</span></td>
                <td><button class="btn-action" onclick="gerarPDF('${res.nome}', ${res.vendas})">📄 PDF</button></td>
            </tr>
        `;
    }).join('');

    document.getElementById('total-comissoes').innerText = `R$ ${somaComissoes.toFixed(2)}`;
    document.getElementById('total-fixo').innerText = `R$ ${somaMensalidades.toFixed(2)}`;
    document.getElementById('total-geral').innerText = `R$ ${(somaComissoes + somaMensalidades).toFixed(2)}`;
}

function gerarPDF(nome, vendasBrutas) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const comissao = vendasBrutas * 0.10;
    const totalFinal = comissao + TAXA_FIXA_MENSAL;

    doc.setFontSize(20);
    doc.text("EXTRATO DE COBRANÇA", 20, 25);
    doc.setFontSize(10);
    doc.text(`Cliente: ${nome}`, 20, 35);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 40);

    doc.autoTable({
        startY: 50,
        head: [['Descrição', 'Base', 'Total']],
        body: [
            ['Comissão (10%)', `R$ ${vendasBrutas.toFixed(2)}`, `R$ ${comissao.toFixed(2)}`],
            ['Mensalidade', 'Fixo', `R$ ${TAXA_FIXA_MENSAL.toFixed(2)}`]
        ],
        headStyles: { fillColor: [230, 126, 34] }
    });

    doc.text(`TOTAL: R$ ${totalFinal.toFixed(2)}`, 20, doc.lastAutoTable.finalY + 10);
    doc.save(`extrato_${nome}.pdf`);
}

inicializar();
