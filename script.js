// PAINEL ADMIN - SCRIPT.JS (VERSÃO FINAL)
const firebaseConfig = {
    databaseURL: "https://myproject26-10f0e-default-rtdb.firebaseio.com/",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const TAXA_FIXA_MENSAL = 59.90;

// Lista de parceiros REAIS
let parceiros = [
    { id: 'snoop_lanche', nome: "Snoop Lanches", vendas: 0, status: "ATIVO" },
    { id: 'kings_burger', nome: "Kings Burger", vendas: 0, status: "ATIVO" }
];

function inicializar() {
    const dataDisplay = document.getElementById('data-atual');
    if(dataDisplay) dataDisplay.innerText = new Date().toLocaleDateString('pt-BR');
    
    ouvirPedidosRealtime();
}

// A MÁGICA ACONTECE AQUI: Ouve o Firebase e calcula tudo sozinho
function ouvirPedidosRealtime() {
    parceiros.forEach(p => {
        // Entra na pasta pedidos/ID_DA_LOJA
        db.ref(`pedidos/${p.id}`).on('value', (snapshot) => {
            let somaVendas = 0;
            const pedidos = snapshot.val();

            if (pedidos) {
                // Percorre cada pedido dentro da pasta da loja
                Object.values(pedidos).forEach(pedido => {
                    // Soma o campo 'total' de cada pedido enviado pelo site
                    somaVendas += parseFloat(pedido.total || 0);
                });
            }

            // Atualiza os dados da loja na memória e redesenha a tabela
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
        const comissao = res.vendas * 0.10; // CÁLCULO DOS 10%
        const totalFatura = comissao + TAXA_FIXA_MENSAL;
        
        somaComissoesGeral += comissao;
        somaMensalidadesGeral += TAXA_FIXA_MENSAL;

        return `
            <tr>
                <td><strong>${res.nome}</strong></td>
                <td>R$ ${res.vendas.toFixed(2)}</td>
                <td style="color: var(--primary); font-weight: 600;">R$ ${comissao.toFixed(2)}</td>
                <td>R$ ${TAXA_FIXA_MENSAL.toFixed(2)}</td>
                <td style="font-weight: 800; color: #2ecc71;">R$ ${totalFatura.toFixed(2)}</td>
                <td><span class="badge">ATIVO</span></td>
                <td>
                    <button class="btn-action" onclick="gerarPDF('${res.nome}', ${res.vendas})">📄 PDF</button>
                </td>
            </tr>
        `;
    }).join('');

    // Atualiza os Cards de resumo no topo
    document.getElementById('total-comissoes').innerText = `R$ ${somaComissoesGeral.toFixed(2)}`;
    document.getElementById('total-fixo').innerText = `R$ ${somaMensalidadesGeral.toFixed(2)}`;
    document.getElementById('total-geral').innerText = `R$ ${(somaComissoesGeral + somaMensalidadesGeral).toFixed(2)}`;
}

// FUNÇÃO PARA O PDF DO EXTRATO
function gerarPDF(nome, vendas) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const comissao = vendas * 0.10;
    const total = comissao + TAXA_FIXA_MENSAL;

    doc.setFontSize(18);
    doc.text(`Faturamento: ${nome}`, 20, 20);
    
    doc.autoTable({
        startY: 30,
        head: [['Descrição', 'Valor']],
        body: [
            ['Vendas Brutas', `R$ ${vendas.toFixed(2)}`],
            ['Comissão (10%)', `R$ ${comissao.toFixed(2)}`],
            ['Mensalidade Sistema', `R$ ${TAXA_FIXA_MENSAL.toFixed(2)}`],
            ['TOTAL A PAGAR', `R$ ${total.toFixed(2)}`]
        ],
        theme: 'grid'
    });

    doc.save(`extrato-${nome.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}

// Inicia o sistema
inicializar();
