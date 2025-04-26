// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBSMuT4evMVh6Yz3zDrjMXlCmbuQviNEsk",
    authDomain: "oracao-initerrupta.firebaseapp.com",
    databaseURL: "https://oracao-initerrupta-default-rtdb.firebaseio.com",
    projectId: "oracao-initerrupta",
    storageBucket: "oracao-initerrupta.firebasestorage.app",
    messagingSenderId: "1011751489589",
    appId: "1:1011751489589:web:2c0dc806b92da56323217c"
};

const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const url = window.location.pathname;
const isAdmin = url.includes('admin');

// Funções comuns
function gerarHorarios() {
    const horarios = [];
    let hora = 0, minuto = 0;
    for (let i = 0; i < 96; i++) { // 96 blocos de 15 min em 24h
        const h = hora.toString().padStart(2, '0');
        const m = minuto.toString().padStart(2, '0');
        horarios.push(`${h}:${m}`);
        minuto += 15;
        if (minuto === 60) {
            minuto = 0;
            hora++;
        }
    }
    return horarios;
}

function criarBotao(horario, ocupado, nomeUsuario) {
    const button = document.createElement('button');
    button.innerText = ocupado ? (nomeUsuario ? nomeUsuario : 'Ocupado') : horario;
    button.disabled = ocupado && !nomeUsuario;

    button.onclick = () => {
        if (!ocupado) {
            const nome = prompt("Digite seu nome:");
            if (nome) {
                database.ref('horarios/' + horario).set(nome);
            }
        } else if (nomeUsuario) {
            const confirmar = confirm("Deseja remover seu nome deste horário?");
            if (confirmar) {
                database.ref('horarios/' + horario).remove();
            }
        }
    };
    return button;
}

function carregarMotivos() {
    database.ref('motivos').on('value', snapshot => {
        const motivosDiv = document.getElementById('motivos');
        motivosDiv.innerText = snapshot.val() || "Sem motivos cadastrados.";
    });
}

function carregarHorarios() {
    database.ref('periodo').once('value').then(periodoSnap => {
        const periodo = periodoSnap.val();
        const hoje = new Date();
        if (!periodo || hoje < new Date(periodo.inicio) || hoje > new Date(periodo.fim)) {
            document.body.innerHTML = "<h1>Fora do período disponível para cadastro.</h1>";
            return;
        }

        database.ref('horarios').on('value', snapshot => {
            const horariosDiv = isAdmin ? document.getElementById('horariosAdmin') : document.getElementById('horarios');
            horariosDiv.innerHTML = '';

            const horarios = gerarHorarios();
            const dados = snapshot.val() || {};

            horarios.forEach(horario => {
                const ocupado = dados[horario];
                const nomeUsuario = ocupado ? ocupado : null;
                const button = criarBotao(horario, !!ocupado, (isAdmin || (nomeUsuario && nomeUsuario === sessionStorage.getItem(horario))) ? nomeUsuario : null);
                horariosDiv.appendChild(button);
            });
        });
    });
}

function definirPeriodo() {
    const inicio = document.getElementById('startDate').value;
    const fim = document.getElementById('endDate').value;
    if (inicio && fim) {
        database.ref('periodo').set({
            inicio: inicio,
            fim: fim
        });
    }
}

function salvarMotivos() {
    const motivos = document.getElementById('motivosInput').value;
    database.ref('motivos').set(motivos);
}

if (!isAdmin) {
    carregarMotivos();
}
carregarHorarios();
