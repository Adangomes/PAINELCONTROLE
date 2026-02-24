const TAXA_FIXA_MENSAL = 59.90;

// Seus clientes reais conforme os links passados
const parceiros = [
    { id: 1, nome: "Snoop Lanches", vendas: 0.00, status: "Ativo", url: "https://snooplanche2.netlify.app/" },
    { id: 2, nome: "Kings Burger", vendas: 0.00, status: "Ativo", url: "https://kingsburger.netlify.app/" }
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

    doc.setFontSize(22);
    doc.text("EXTRATO DE COBRANÇA MENSAL", 20, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Parceiro: ${nome.toUpperCase()}`, 20, 35);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 40);

    doc.autoTable({
        startY: 50,
        head: [['Serviço', 'Base', 'Subtotal']],
        body: [
            ['Uso de Plataforma (10%)', `Vendas: R$ ${vendasBrutas.toFixed(2)}`, `R$ ${comissao.toFixed(2)}`],
            ['Mensalidade de Manutenção', 'Fixa Mensal', `R$ ${TAXA_FIXA_MENSAL.toFixed(2)}`],
        ],
        headStyles: { fillColor: [230, 126, 34] }
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`TOTAL A PAGAR: R$ ${totalFinal.toFixed(2)}`, 20, finalY);
    doc.save(`extrato_${nome.toLowerCase().replace(/\s/g, '_')}.pdf`);
}

inicializar();
