// 1. CONFIGURAÇÃO DO FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyCXA1yP1F-riNkzOX5zJs5gsQ82EzsT7Qg", 
    databaseURL: "https://myproject26-10f0e-default-rtdb.firebaseio.com/",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// --- REMOVI O LOGIN AUTOMÁTICO DAQUI PARA ELE SÓ RODAR APÓS A SENHA ---

const TAXA_FIXA_MENSAL = 69.90;
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

// 1. ESCUTA O SALDO ACUMULADO (BLINDADO)
function ouvirPedidosRealtime() {
    parceiros.forEach(p => {
        db.ref(`faturamento_acumulado/${p.id}`).on('value', (snapshot) => {
            const dadosAcumulados = snapshot.val() || { vendas: 0 };
            p.vendas = parseFloat(dadosAcumulados.vendas || 0);

            db.ref(`configuracoes/${p.id}/ultimo_pagamento`).on('value', (dateSnapshot) => {
                const ultimaData = dateSnapshot.val();
                p.status = calcularStatus(ultimaData);
                renderizarTabela(); 
            });
        });
    });
}

// 2. FUNÇÃO PARA BLINDAR FATURAMENTO
function blindarFaturamento(idLoja) {
    db.ref(`pedidos/${idLoja}`).once('value', (snapshot) => {
        const pedidos = snapshot.val();
        if (pedidos) {
            let somaNovosPedidos = 0;
            Object.values(pedidos).forEach(pedido => {
                somaNovosPedidos += parseFloat(pedido.total || 0);
            });

            db.ref(`faturamento_acumulado/${idLoja}`).transaction((atual) => {
                if (atual === null) return { vendas: somaNovosPedidos };
                return { vendas: parseFloat(atual.vendas || 0) + somaNovosPedidos };
            });
        }
    });
}

// 3. LÓGICA DO STATUS
function calcularStatus(dataUltimoPagamento) {
    const hoje = new Date();
    const diaAtual = hoje.getDate();
    
    if (!dataUltimoPagamento) return "PENDENTE";

    const dataPagto = new Date(dataUltimoPagamento);
    const mesesDiferenca = (hoje.getFullYear() - dataPagto.getFullYear()) * 12 + (hoje.getMonth() - dataPagto.getMonth());

    if (mesesDiferenca >= 1 && diaAtual > DIA_VENCIMENTO) {
        return "PENDENTE";
    }
    return "ATIVO";
}

// 4. RENDERIZAÇÃO DA TABELA
function renderizarTabela() {
    const corpo = document.getElementById('tabela-clientes');
    if (!corpo) return;

    let somaComissoesGeral = 0;
    let somaMensalidadesGeral = 0;

    corpo.innerHTML = parceiros.map(res => {
        const comissao = res.vendas * 0.10;
        const totalFatura = comissao + TAXA_FIXA_MENSAL;
        const statusCor = res.status === "ATIVO" ? "#27ae60" : "#e67e22"; 
        
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

    document.getElementById('total-comissoes').innerText = `R$ ${somaComissoesGeral.toFixed(2)}`;
    document.getElementById('total-fixo').innerText = `R$ ${somaMensalidadesGeral.toFixed(2)}`;
    document.getElementById('total-geral').innerText = `R$ ${(somaComissoesGeral + somaMensalidadesGeral).toFixed(2)}`;
}

// 5. FUNÇÃO PARA DAR BAIXA
function darBaixaPagamento(idLoja, nomeLoja) {
    const agora = new Date().toISOString();

    Swal.fire({
        title: `Confirmar recebimento?`,
        text: `O saldo de ${nomeLoja} será zerado.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#27ae60',
        confirmButtonText: 'Sim!',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            db.ref(`configuracoes/${idLoja}`).update({ ultimo_pagamento: agora });
            db.ref(`faturamento_acumulado/${idLoja}`).set({ vendas: 0 }).then(() => {
                Swal.fire('Sucesso!', 'Pagamento registrado.', 'success');
            });
            db.ref(`pedidos/${idLoja}`).remove();
        }
    });
}

// 6. GERADOR DE PDF
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
            ['Vendas Brutas', `R$ ${vendas.toFixed(2)}`],
            ['Comissão (10%)', `R$ ${comissao.toFixed(2)}`],
            ['Mensalidade', `R$ ${TAXA_FIXA_MENSAL.toFixed(2)}`],
            ['TOTAL', `R$ ${total.toFixed(2)}`]
        ],
        theme: 'grid'
    });

    doc.save(`fatura-${nome.toLowerCase()}.pdf`);
}

// --- SISTEMA DE LOGIN NO FINAL ---
const SENHA_MESTRA = "ADAN@26MYDI"; 

function verificarAcesso() {
    const campoSenha = document.getElementById('admin-pass');
    
    if (campoSenha.value === SENHA_MESTRA) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('panel-content').style.display = 'block';
        
        // Só faz o login no Firebase aqui
        firebase.auth().signInAnonymously().then(() => {
            console.log("Mydi Autenticado e Liberado! ✅");
            inicializar(); 
        }).catch(err => {
            console.error("Erro no Firebase:", err);
            Swal.fire('Erro', 'Falha na conexão com o banco.', 'error');
        });

    } else {
        Swal.fire('Acesso Negado', 'Senha incorreta!', 'error');
        campoSenha.value = "";
    }
}

document.addEventListener('keypress', (e) => {
    if(e.key === 'Enter' && document.getElementById('admin-pass')) {
        verificarAcesso();
    }
});
