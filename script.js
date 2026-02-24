// PAINEL ADMIN - SCRIPT COMPLETO COM LÓGICA DE COBRANÇA E STATUS
const firebaseConfig = {
    databaseURL: "https://myproject26-10f0e-default-rtdb.firebaseio.com/",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const TAXA_FIXA_MENSAL = 59.90;
const DIA_VENCIMENTO = 10;

// Lista de parceiros
let parceiros = [
    { id: 'snoop_lanche', nome: "Snoop Lanches", vendas: 0, status: "ATIVO" },
    { id: 'kings_burger', nome: "Kings Burger", vendas: 0, status: "ATIVO" }
];

function inicializar() {
    const dataDisplay = document.getElementById('data-atual');
    if(dataDisplay) dataDisplay.innerText = new Date().toLocaleDateString('pt-BR');
    ouvirPedidosRealtime();
}

// 1. ESCUTA PEDIDOS E STATUS EM TEMPO REAL
function ouvirPedidosRealtime() {
    parceiros.forEach(p => {
        // Escuta as vendas da loja
        db.ref(`pedidos/${p.id}`).on('value', (snapshot) => {
            let somaVendas = 0;
            const pedidos = snapshot.val();
            if (pedidos) {
                Object.values(pedidos).forEach(pedido => {
                    somaVendas += parseFloat(pedido.total || 0);
                });
            }
            p.vendas = somaVendas;

            // Escuta a data do último pagamento para definir se está ATIVO ou PENDENTE
            db.ref(`configuracoes/${p.id}/ultimo_pagamento`).on('value', (dateSnapshot) => {
                const ultimaData = dateSnapshot.val();
                p.status = calcularStatus(ultimaData);
                renderizarTabela(); // Recarrega a UI sempre que algo mudar
            });
        });
    });
}

// 2. LÓGICA DO PULO DO GATO: COR DO STATUS
function calcularStatus(dataUltimoPagamento) {
    const hoje = new Date();
    const diaAtual = hoje.getDate();
    
    // Se nunca pagou, começa como pendente para forçar o primeiro registro
    if (!dataUltimoPagamento) return "PENDENTE";

    const dataPagto = new Date(dataUltimoPagamento);
    
    // Calcula a diferença de meses entre hoje e o último pagamento
    const mesesDiferenca = (hoje.getFullYear() - dataPagto.getFullYear()) * 12 + (hoje.getMonth() - dataPagto.getMonth());

    // Se passou 1 mês e já passou do dia 10, fica Laranja
    if (mesesDiferenca >= 1 && diaAtual > DIA_VENCIMENTO) {
        return "PENDENTE";
    }
    return "ATIVO";
}

// 3. RENDERIZAÇÃO DA TABELA
function renderizarTabela() {
    const corpo = document.getElementById('tabela-clientes');
    if (!corpo) return;

    let somaComissoesGeral = 0;
    let somaMensalidadesGeral = 0;

    corpo.innerHTML = parceiros.map(res => {
        const comissao = res.vendas * 0.10;
        const totalFatura = comissao + TAXA_FIXA_MENSAL;
        const statusCor = res.status === "ATIVO" ? "#27ae60" : "#e67e22"; // Verde ou Laranja
        
        somaComissoesGeral += comissao;
        somaMensalidadesGeral += TAXA_FIXA_MENSAL;

        return `
            <tr>
                <td><strong>${res.nome}</strong></td>
                <td>R$ ${res.vendas.toFixed(2)}</td>
                <td style="color: var(--primary); font-weight: 600;">R$ ${comissao.toFixed(2)}</td>
                <td>R$ ${TAXA_FIXA_MENSAL.toFixed(2)}</td>
                <td style="font-weight: 800; color: #2ecc71;">R$ ${totalFatura.toFixed(2)}</td>
                <td><span class="badge" style="background: ${statusCor}">${res.status}</span></td>
                <td>
                    <div class="btn-group">
                        <button class="btn-action" onclick="gerarPDF('${res.nome}', ${res.vendas})">📄 PDF</button>
                        <button class="btn-action btn-clear" onclick="darBaixaPagamento('${res.id}', '${res.nome}')">✅ RECEBI</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Atualiza os cards de resumo no topo
    document.getElementById('total-comissoes').innerText = `R$ ${somaComissoesGeral.toFixed(2)}`;
    document.getElementById('total-fixo').innerText = `R$ ${somaMensalidadesGeral.toFixed(2)}`;
    document.getElementById('total-geral').innerText = `R$ ${(somaComissoesGeral + somaMensalidadesGeral).toFixed(2)}`;
}

// 4. FUNÇÃO PARA DAR BAIXA (LIMPAR E ATUALIZAR STATUS)
function darBaixaPagamento(idLoja, nomeLoja) {
    const agora = new Date().toISOString();

    Swal.fire({
        title: `Confirmar pagamento de ${nomeLoja}?`,
        text: "Isso zerará as vendas acumuladas e atualizará o status para ATIVO.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#27ae60',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, recebi tudo!',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            // Atualiza a data de pagamento no Firebase para o Status ficar Verde
            db.ref(`configuracoes/${idLoja}`).update({
                ultimo_pagamento: agora
            });

            // Limpa os pedidos para recomeçar o faturamento do zero
            db.ref(`pedidos/${idLoja}`).remove()
                .then(() => {
                    Swal.fire('Pago!', 'O faturamento foi zerado e o status está em dia.', 'success');
                });
        }
    });
}

// 5. GERADOR DE PDF
function gerarPDF(nome, vendas) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const comissao = vendas * 0.10;
    const total = comissao + TAXA_FIXA_MENSAL;

    doc.setFontSize(18);
    doc.text(`Extrato de Faturamento: ${nome}`, 20, 20);
    
    doc.autoTable({
        startY: 30,
        head: [['Descrição', 'Valor']],
        body: [
            ['Vendas Brutas Acumuladas', `R$ ${vendas.toFixed(2)}`],
            ['Comissão de Uso (10%)', `R$ ${comissao.toFixed(2)}`],
            ['Mensalidade do Sistema', `R$ ${TAXA_FIXA_MENSAL.toFixed(2)}`],
            ['TOTAL A PAGAR', `R$ ${total.toFixed(2)}`]
        ],
        theme: 'grid'
    });

    doc.save(`fatura-${nome.toLowerCase().replace(" ", "-")}.pdf`);
}

// Inicializa o script
inicializar();
