// PAINEL ADMIN - SCRIPT.JS
const firebaseConfig = {
    databaseURL: "https://myproject26-10f0e-default-rtdb.firebaseio.com/",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const TAXA_FIXA_MENSAL = 59.90;

// Lista de parceiros atualizada com o novo restaurante
let parceiros = [
    { id: 'snoop_lanche', nome: "Snoop Lanches", vendas: 0, status: "ATIVO" },
    { id: 'kings_burger', nome: "Kings Burger", vendas: 0, status: "ATIVO" },
    { id: 'adan_tattoo', nome: "Adan Tattoo", vendas: 0, status: "ATIVO" }
];

function inicializar() {
    document.getElementById('data-atual').innerText = new Date().toLocaleDateString('pt-BR');
    ouvirPedidosRealtime();
}

function ouvirPedidosRealtime() {
    parceiros.forEach(p => {
        // Escuta a pasta específica de cada restaurante
        db.ref(`pedidos/${p.id}`).on('value', (snapshot) => {
            let somaVendas = 0;
            const pedidos = snapshot.val();

            if (pedidos) {
                Object.values(pedidos).forEach(item => {
                    // Soma garantindo que pegue o valor do campo 'total'
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
                <td style="color: var(--primary); font-weight: 600;">R$ ${comissao.toFixed(2)}</td>
                <td>R$ ${TAXA_FIXA_MENSAL.toFixed(2)}</td>
                <td style="font-weight: 800;">R$ ${totalFatura.toFixed(2)}</td>
                <td><span class="badge">${res.status}</span></td>
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

// Reutilize a função gerarPDF que te mandei antes aqui embaixo...
inicializar();
