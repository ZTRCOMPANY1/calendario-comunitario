const socket = io();
const lista = document.getElementById('listaEventos');

function criarCardEvento(evento) {
    return `
        <div class="evento-card">
            ${evento.imagem ? `<img src="${evento.imagem}" alt="Imagem do Evento" width="150" />` : ''}
            <h3>${evento.titulo}</h3>
            <p>${evento.descricao}</p>
            <p><strong>Data:</strong> ${evento.data}</p>
            <p><strong>Categoria:</strong> ${evento.categoria}</p>
            <p><strong>Local:</strong> ${evento.local}</p>
            <p><strong>Status:</strong> ${evento.status}</p>
        </div>
    `;
}

async function carregarEventos() {
    const res = await fetch('/api/eventos');
    const eventos = await res.json();

    lista.innerHTML = eventos.map(criarCardEvento).join('');
}

socket.on('atualizarEventos', carregarEventos);

carregarEventos();
