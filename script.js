// Configuração do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, set, remove, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBSMuT4evMVh6Yz3zDrjMXlCmbuQviNEsk",
    authDomain: "oracao-initerrupta.firebaseapp.com",
    databaseURL: "https://oracao-initerrupta-default-rtdb.firebaseio.com",
    projectId: "oracao-initerrupta",
    storageBucket: "oracao-initerrupta.firebasestorage.app",
    messagingSenderId: "1011751489589",
    appId: "1:1011751489589:web:2c0dc806b92da56323217c"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const url = window.location.pathname;
const isAdmin = url.includes('admin');

// Funções comuns
function gerarHorarios() {
    const horarios = [];
    let hora = 0, minuto = 0;
    for (let i = 0; i < 96; i++) {
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

    button.onclick = async () => {
        if (!ocupado) {
            const nome = prompt("Digite seu nome:");
            if (nome) {
                await set(ref(database, 'horarios/' + horario), nome);
            }
        } else if (nomeUsuario) {
            const confirmar = confirm("Deseja remover seu nome deste horário?");
            if (confirmar) {
                await remove(ref(database, 'horarios/' + horario));
            }
        }
    };
    return button;
}

function carregarMotivos() {
    onValue(ref(database, 'motivos'), snapshot => {
        const motivosDiv = document.getElementById('motivos');
        motivosDiv.innerText = snapshot.val() || "Sem motivos cadastrados.";
    });
}

async function carregarHorarios() {
    const periodoSnap = await get(ref(database, 'periodo'));
    const periodo = periodoSnap.val();
    const hoje = new Date();

    if (!periodo || hoje < new Date(periodo.inicio) || hoje > new Date(periodo.fim)) {
        document.body.innerHTML = "<h1>Fora do período disponível para cadastro.</h1>";
        return;
    }

    onValue(ref(database, 'horarios'), snapshot => {
        const horariosDiv = isAdmin ? document.getElementById('horariosAdmin') : document.getElementById('horarios');
        horariosDiv.innerHTML = '';

        const horarios = gerarHorarios();
        const dados = snapshot.val() || {};

        horarios.forEach(horario => {
            const ocupado = dados[horario];
            const nomeUsuario = ocupado ? ocupado : null;
            const button = criarBotao(horario, !!ocupado, nomeUsuario);
            horariosDiv.appendChild(button);
        });
    });
}

async function definirPeriodo() {
    const inicio = document.getElementById('startDate').value;
    const fim = document.getElementById('endDate').value;
    if (inicio && fim) {
        await set(ref(database, 'periodo'), {
            inicio: inicio,
            fim: fim
        });
        alert("Período definido com sucesso.");
    }
}

async function salvarMotivos() {
    const motivos = document.getElementById('motivosInput').value;
    await set(ref(database, 'motivos'), motivos);
    alert("Motivos salvos com sucesso.");
}

if (!isAdmin) {
    carregarMotivos();
}
carregarHorarios();
