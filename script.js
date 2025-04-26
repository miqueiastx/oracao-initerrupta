// Importações Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js";
import { getDatabase, ref, set, get, child, update, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database-compat.js";

// Configuração Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBSMuT4evMVh6Yz3zDrjMXlCmbuQviNEsk",
  authDomain: "oracao-initerrupta.firebaseapp.com",
  databaseURL: "https://oracao-initerrupta-default-rtdb.firebaseio.com",
  projectId: "oracao-initerrupta",
  storageBucket: "oracao-initerrupta.appspot.com",
  messagingSenderId: "1011751489589",
  appId: "1:1011751489589:web:2c0dc806b92da56323217c"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Funções para o Admin
window.salvarPeriodo = async function () {
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    if (!dataInicio || !dataFim) {
        alert("Preencha as duas datas.");
        return;
    }
    await set(ref(database, 'periodo'), {
        inicio: dataInicio,
        fim: dataFim
    });
    alert("Período informado foi salvo!");
}

window.salvarMotivos = async function () {
    const motivos = document.getElementById('motivos').value;
    if (!motivos) {
        alert("Preencha os motivos.");
        return;
    }
    await set(ref(database, 'motivos'), {
        texto: motivos
    });
    alert("Motivos de oração salvos!");
}

// Funções para o Usuário
async function carregarDados() {
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, 'periodo'));
    const motivosSnapshot = await get(child(dbRef, 'motivos'));

    const hoje = new Date();
    if (snapshot.exists()) {
        const { inicio, fim } = snapshot.val();
        const inicioData = new Date(inicio);
        const fimData = new Date(fim);

        if (hoje < inicioData || hoje > fimData) {
            document.body.innerHTML = "<h2>Fora do período de inscrição.</h2>";
            return;
        }
    }

    if (motivosSnapshot.exists()) {
        document.getElementById('motivos').innerHTML = `<h3>Motivos de Oração</h3><p>${motivosSnapshot.val().texto}</p>`;
    }

    gerarHorarios();
}

async function gerarHorarios() {
    const horariosDiv = document.getElementById('horarios');
    horariosDiv.innerHTML = "";

    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 15) {
            const hora = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            const horarioRef = ref(database, 'horarios/' + hora);
            const snap = await get(horarioRef);

            const div = document.createElement('div');
            div.className = "horario";

            if (snap.exists()) {
                const nomeSalvo = snap.val().nome;
                const nomeUsuario = localStorage.getItem('nome_' + hora);

                if (nomeSalvo && nomeUsuario === nomeSalvo) {
                    div.innerHTML = `<strong>${hora}</strong> - Você reservou`;
                    const btnExcluir = document.createElement('button');
                    btnExcluir.textContent = "Cancelar";
                    btnExcluir.onclick = async () => {
                        await remove(horarioRef);
                        localStorage.removeItem('nome_' + hora);
                        carregarDados();
                    };
                    div.appendChild(btnExcluir);
                } else {
                    div.classList.add('ocupado');
                    div.innerHTML = `<strong>${hora}</strong> - Ocupado`;
                }
            } else {
                div.innerHTML = `<strong>${hora}</strong>`;
                const btnEscolher = document.createElement('button');
                btnEscolher.textContent = "Reservar";
                btnEscolher.onclick = async () => {
                    const nome = prompt("Digite seu nome:");
                    if (nome) {
                        await set(horarioRef, { nome });
                        localStorage.setItem('nome_' + hora, nome);
                        carregarDados();
                    }
                };
                div.appendChild(btnEscolher);
            }

            horariosDiv.appendChild(div);
        }
    }
}

if (window.location.pathname.includes("admin")) {
    // Página admin
} else {
    // Página usuário
    carregarDados();
}
