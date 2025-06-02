const socket = io();


document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('salvarOrdem').addEventListener('click', async () => {
    const lista = document.getElementById('listaEventos');
    const ordemIds = Array.from(lista.children).map(div => div.dataset.id);
    
    const res = await fetch('/api/eventos/ordenar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ordem: ordemIds }),
    });

    if (res.ok) {
      alert('Ordem salva!');
    } else {
      alert('Erro ao salvar ordem.');
    }
  });
});

document.getElementById('formEvento').addEventListener('submit', async (e) => {
    e.preventDefault();

    const evento = {
        titulo: document.getElementById('titulo').value,
        descricao: document.getElementById('descricao').value,
        data: document.getElementById('data').value,
        categoria: document.getElementById('categoria').value,
        local: document.getElementById('local').value
    };

    const res = await fetch('/api/eventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evento)
    });

    const json = await res.json();
    alert(json.mensagem);

    document.getElementById('formEvento').reset();
    carregarEventos();
});

// Ativa o SortableJS na lista de eventos
const sortable = new Sortable(lista, {
    animation: 150,
    ghostClass: 'blue-background-class'
});

function criarCardEvento(evento) {
    return `
        <div class="evento-card">
            <h3>${evento.titulo}</h3>
            <p>${evento.descricao}</p>
            <p><strong>Data:</strong> ${evento.data}</p>
            <p><strong>Categoria:</strong> ${evento.categoria}</p>
            <p><strong>Local:</strong> ${evento.local}</p>
            <p><strong>Status:</strong> ${evento.status}</p>
            <button onclick="removerEvento(${evento.id})">Remover</button>
            <br>
            <label>Alterar status: 
                <select onchange="alterarStatus(${evento.id}, this.value)">
                    <option ${evento.status === 'Acontecerá' ? 'selected' : ''}>Acontecerá</option>
                    <option ${evento.status === 'Finalizado' ? 'selected' : ''}>Finalizado</option>
                    <option ${evento.status === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                </select>
            </label>
        </div>
    `;
}

async function carregarEventos() {
    const res = await fetch('/api/eventos');
    const eventos = await res.json();

    const lista = document.getElementById('listaEventos');
    lista.innerHTML = eventos.map(criarCardEvento).join('');
}

async function removerEvento(id) {
    if (confirm('Tem certeza que deseja remover este evento?')) {
        await fetch(`/api/eventos/${id}`, { method: 'DELETE' });
        carregarEventos();
    }
}

async function alterarStatus(id, status) {
    await fetch(`/api/eventos/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    });
    carregarEventos();
}

carregarEventos();

socket.on('atualizarEventos', () => {
    carregarEventos();
});
