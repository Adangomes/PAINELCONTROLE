const TAXA_FIXA_MENSAL = 59.90;

// Simulação de banco de dados
const parceiros = [
    { id: 1, nome: "Snoop Lanches", vendas: 4500.00, status: "Ativo" },
    { id: 2, nome: "Pizzaria do Bairro", vendas: 2800.00, status: "Pendente" },
    { id: 3, nome: "Burguer King Local", vendas: 7200.00, status: "Ativo" },
    { id: 4, nome: "Açaí do Porto", vendas: 950.00, status: "Atrasado" }
];

function inicializar() {
    const dataElement = document.getElementById('data-atual');
    if(dataElement) dataElement.innerText = new Date().toLocaleDateString('pt-BR');
    renderizarTabela();
}

function renderizarTabela() {
    const corpo = document.getElementById('tabela-clientes');
    if (!corpo) return;

    let somaComissoes = 0;
    let somaMensalidades = 0;

    corpo.innerHTML = parceiros.map(res => {
        const comissao = res.vendas * 0.10;
        const totalFatura = comissao + TAXA_FIXA_MENSAL;
        
        somaComissoes += comissao;
        somaMensalidades += TAXA_FIXA_MENSAL;

        let corBadge = "var(--success)";
        if(res.status === "Pendente") corBadge = "var(--warning)";
        if(res.status === "Atrasado") corBadge = "var(--danger)";

        return `
            <tr>
                <td><strong>${res.nome}</strong></td>
                <td>R$ ${res.vendas.toFixed(2)}</td>
                <td style="color: var(--warning); font-weight: 600;">R$ ${comissao.toFixed(2)}</td>
                <td>R$ ${TAXA_FIXA_MENSAL.toFixed(2)}</td>
                <td style="font-weight: 800;">R$ ${totalFatura.toFixed(2)}</td>
                <td><span class="badge" style="background: ${corBadge}">${res.status}</span></td>
                <td>
                    <button class="btn-action" onclick="gerarPDF('${res.nome}', ${res.vendas})">📄 PDF</button>
                    <button class="btn-action btn-bloquear" onclick="bloquearLoja('${res.nome}')">🚫</button>
                </td>
            </tr>
        `;
    }).join('');

    document.getElementById('total-comissoes').innerText = `R$ ${somaComissoes.toFixed(2)}`;
    document.getElementById('total-fixo').innerText = `R$ ${somaMensalidades.toFixed(2)}`;
    document.getElementById('total-geral').innerText = `R$ ${(somaComissoes + somaMensalidades).toFixed(2)}`;
}

function bloquearLoja(nome) {
    if(confirm(`Deseja realmente bloquear o acesso de ${nome}?`)) {
        alert(`${nome} foi bloqueado com sucesso.`);
    }
}

function gerarPDF(nome, vendasBrutas) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const comissao = vendasBrutas * 0.10;
    const totalFinal = comissao + TAXA_FIXA_MENSAL;

    // Cabeçalho PDF
    doc.setFontSize(22);
    doc.setTextColor(20, 20, 20);
    doc.text("EXTRATO DE COBRANÇA MENSAL", 20, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Parceiro: ${nome.toUpperCase()}`, 20, 35);
    doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 20, 40);

    // Tabela de Itens
    doc.autoTable({
        startY: 50,
        head: [['Serviço / Descrição', 'Base de Cálculo', 'Subtotal']],
        body: [
            ['Uso de Plataforma (Comissão 10%)', `Vendas: R$ ${vendasBrutas.toFixed(2)}`, `R$ ${comissao.toFixed(2)}`],
            ['Mensalidade de Manutenção (Fixo)', 'Referente ao Mês Atual', `R$ ${TAXA_FIXA_MENSAL.toFixed(2)}`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [230, 126, 34] } // Cor primária (Laranja)
    });

    // Rodapé de Total
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`TOTAL A PAGAR: R$ ${totalFinal.toFixed(2)}`, 20, finalY);
    
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text("Pagamento via PIX para liberação de crédito no sistema.", 20, finalY + 12);

    doc.save(`extrato_${nome.toLowerCase().replace(/\s/g, '_')}.pdf`);
}

// Inicia o sistema
inicializar();
