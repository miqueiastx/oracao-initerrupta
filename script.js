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

// Funções para Admin
async function salvarPeriodo() {
  const dataInicio = document.getElementById('dataInicio').value;
  const dataFim = document.getElementById('dataFim').value;
  if (!dataInicio || !dataFim) {
    Swal.fire({
      icon: 'error',
      title: 'Erro',
      text: 'Preencha as duas datas corretamente.'
    });
    return;
  }
  try {
    await set(ref(database, 'periodo'), {
      inicio: dataInicio,
      fim: dataFim
    });
    Swal.fire({
      icon: 'success',
      title: 'Sucesso',
      text: 'Período salvo com sucesso!'
    });
  } catch (error) {
    console.error("Erro ao salvar o período:", error);
    Swal.fire({
      icon: 'error',
      title: 'Erro!',
      text: 'Não foi possível salvar o período.'
    });
  }
}
window.salvarPeriodo = salvarPeriodo; // Expondo para o escopo global

async function salvarMotivos() {
  const motivos = document.getElementById('motivos').value;
  if (!motivos) {
    Swal.fire({
      icon: 'error',
      title: 'Erro',
      text: 'Preencha os motivos.'
    });
    return;
  }
  try {
    await set(ref(database, 'motivos'), {
      texto: motivos
    });
    Swal.fire({
      icon: 'success',
      title: 'Sucesso',
      text: 'Motivos de oração salvos com sucesso!'
    });
  } catch (error) {
    console.error("Erro ao salvar os motivos:", error);
    Swal.fire({
      icon: 'error',
      title: 'Erro!',
      text: 'Não foi possível salvar os motivos.'
    });
  }
}
window.salvarMotivos = salvarMotivos; // Expondo para o escopo global

// Funções para o Usuário
async function carregarDados() {
  const dbRef = ref(database);
  try {
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

    const motivosDiv = document.getElementById('motivos-oracao'); // Assumindo que há um elemento com este ID no index.html
    if (motivosDiv && motivosSnapshot.exists()) {
      motivosDiv.innerHTML = `<h3>Motivos de Oração</h3><p>${motivosSnapshot.val().texto}</p>`;
    }

    const horariosDiv = document.getElementById('horarios'); // Assumindo que há um elemento com este ID no index.html
    if (horariosDiv) {
      await gerarHorarios(horariosDiv);
    }
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    // Tratar o erro de forma apropriada para o usuário
    document.body.innerHTML = "<p>Ocorreu um erro ao carregar os dados.</p>";
  }
}

async function gerarHorarios(horariosDiv) {
  if (!horariosDiv) return;
  horariosDiv.innerHTML = "";

  try {
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
              try {
                await remove(horarioRef);
                localStorage.removeItem('nome_' + hora);
                Swal.fire({
                  icon: 'success',
                  title: 'Cancelado',
                  text: `Horário ${hora} cancelado com sucesso.`
                });
                carregarDados();
              } catch (error) {
                console.error("Erro ao cancelar horário:", error);
                Swal.fire({
                  icon: 'error',
                  title: 'Erro!',
                  text: `Não foi possível cancelar o horário ${hora}.`
                });
              }
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
            const { value: nome } = await Swal.fire({
              title: 'Reservar horário',
              input: 'text',
              inputLabel: 'Digite seu nome',
              inputPlaceholder: 'Seu nome',
              showCancelButton: true
            });

            if (nome) {
              try {
                await set(horarioRef, { nome });
                localStorage.setItem('nome_' + hora, nome);
                Swal.fire({
                  icon: 'success',
                  title: 'Reservado!',
                  text: `Horário ${hora} reservado com sucesso.`
                });
                carregarDados();
              } catch (error) {
                console.error("Erro ao reservar horário:", error);
                Swal.fire({
                  icon: 'error',
                  title: 'Erro!',
                  text: `Não foi possível reservar o horário ${hora}.`
                });
              }
            }
          };
          div.appendChild(btnEscolher);
        }
        horariosDiv.appendChild(div);
      }
    }
  } catch (error) {
    console.error("Erro ao gerar horários:", error);
    if (horariosDiv) {
      horariosDiv.innerHTML = "<p>Ocorreu um erro ao carregar os horários.</p>";
    }
  }
}

// Detecta se é página admin ou index
if (window.location.pathname.includes("admin")) {
  // Página admin - as funções salvarPeriodo e salvarMotivos já estão expostas globalmente
} else {
  // Página index
  document.addEventListener('DOMContentLoaded', carregarDados);
}
