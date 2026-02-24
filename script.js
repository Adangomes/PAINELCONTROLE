// CONFIGURAÇÃO DO SEU FIREBASE
const firebaseConfig = {
    databaseURL: "https://myproject26-10f0e-default-rtdb.firebaseio.com/",
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const TAXA_FIXA_MENSAL = 59.90;

// Lista de Parceiros (IDs iguais aos do seu Firebase em /pedidos/)
let parceiros = [
    { id: 'snoop_lanche', nome: "Snoop Lanches", vendas: 0, status: "Ativo" },
    { id: 'kings_burger', nome: "Kings Burger", vendas: 0, status: "Ativo" }
];

function inicializar() {
    document.getElementById('data-atual').innerText = new Date().toLocaleDateString('pt-BR');
    ouvirPedidosRealtime();
}

function ouvirPedidosRealtime() {
    parceiros.forEach(p => {
        // Escuta a pasta de pedidos de cada loja específica
        db.ref(`pedidos/${p.id}`).on('value', (snapshot) => {
            let somaVendas = 0;
            const pedidos = snapshot.val();

            if (pedidos) {
                // Percorre cada pedido e soma o campo 'total'
                Object.values(pedidos).forEach(item => {
                    somaVendas += parseFloat(item.total || 0);
                });
            }

            // Atualiza o valor no array e redesenha a tela
            p.vendas = somaVendas;
            renderizarTabela();
        });
    });
}

function renderizarTabela() {
    const corpo = document.getElementById('tabela-clientes');
    if (!corpo) return;

    let somaComissoesGeral = 0;
    let somaMensalidadesGeral = 0;

    corpo.innerHTML = parceiros.map(res => {
        const comissao = res.vendas * 0.10;
        const totalFatura = comissao + TAXA_FIXA_MENSAL;
        
        somaComissoesGeral += comissao;
        somaMensalidadesGeral += TAXA_FIXA_MENSAL;

        return `
            <tr>
                <td><strong>${res.nome}</strong></td>
                <td>R$ ${res.vendas.toFixed(2)}</td>
                <td style="color: var(--warning); font-weight: 600;">R$ ${comissao.toFixed(2)}</td>
                <td>R$ ${TAXA_FIXA_MENSAL.toFixed(2)}</td>
                <td style="font-weight: 800;">R$ ${totalFatura.toFixed(2)}</td>
                <td><span class="badge" style="background: var(--success)">${res.status}</span></td>
                <td>
                    <button class="btn-action" onclick="gerarPDF('${res.nome}', ${res.vendas})">📄 PDF</button>
                </td>
            </tr>
        `;
    }).join('');

    document.getElementById('total-comissoes').innerText = `R$ ${somaComissoesGeral.toFixed(2)}`;
    document.getElementById('total-fixo').innerText = `R$ ${somaMensalidadesGeral.toFixed(2)}`;
    document.getElementById('total-geral').innerText = `R$ ${(somaComissoesGeral + somaMensalidadesGeral).toFixed(2)}`;
}

function gerarPDF(nome, vendasBrutas) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const comissao = vendasBrutas * 0.10;
    const totalFinal = comissao + TAXA_FIXA_MENSAL;

    doc.setFontSize(22);
    doc.text("EXTRATO DE COBRANÇA", 20, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Restaurante: ${nome.toUpperCase()}`, 20, 35);
    doc.text(`Período: ${new Date().toLocaleDateString('pt-BR')}`, 20, 40);

    doc.autoTable({
        startY: 50,
        head: [['Descrição', 'Base de Cálculo', 'Total Item']],
        body: [
            ['Comissão sobre Pedidos (10%)', `Vendas: R$ ${vendasBrutas.toFixed(2)}`, `R$ ${comissao.toFixed(2)}`],
            ['Mensalidade Manutenção Sistema', 'Valor Fixo Mensal', `R$ ${TAXA_FIXA_MENSAL.toFixed(2)}`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [230, 126, 34] }
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(`TOTAL A PAGAR: R$ ${totalFinal.toFixed(2)}`, 20, finalY);
    
    doc.save(`extrato_${nome.toLowerCase().replace(/\s/g, '_')}.pdf`);
}

inicializar();
