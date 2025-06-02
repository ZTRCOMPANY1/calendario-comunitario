const socket = io();

const lista = document.getElementById('listaEventos');
const form = document.getElementById('formEvento');

function criarCardEvento(evento) {
    return `
        <div class="evento-card" draggable="true" data-id="${evento.id}">
            ${evento.imagem ? `<img src="${evento.imagem}" alt="Imagem do Evento" width="150" />` : ''}
            <h3>${evento.titulo}</h3>
            <p>${evento.descricao}</p>
            <p><strong>Data:</strong> ${evento.data}</p>
            <p><strong>Categoria:</strong> ${evento.categoria}</p>
            <p><strong>Local:</strong> ${evento.local}</p>
            <p><strong>Status:</strong> ${evento.status}</p>
            <button onclick="removerEvento(${evento.id})">Remover</button><br />
            <label>Status:
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

    lista.innerHTML = eventos.map(criarCardEvento).join('');
    addDnDToEventos();
}

// Adicionar evento
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const res = await fetch('/api/eventos', {
        method: 'POST',
        body: formData
    });

    if (res.ok) {
        alert('Evento adicionado!');
        form.reset();
        carregarEventos();
    } else {
        alert('Erro ao adicionar evento');
    }
});

// Remover evento
async function removerEvento(id) {
    if (confirm('Tem certeza que deseja remover?')) {
        await fetch(`/api/eventos/${id}`, { method: 'DELETE' });
        carregarEventos();
    }
}

// Alterar status
async function alterarStatus(id, status) {
    await fetch(`/api/eventos/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    });
    carregarEventos();
}

// Drag and Drop
let dragSrcEl = null;

function handleDragStart(e) {
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
    this.classList.add('dragElem');
}

function handleDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    this.classList.add('over');
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter() {
    this.classList.add('over');
}

function handleDragLeave() {
    this.classList.remove('over');
}

function handleDrop(e) {
    if (e.stopPropagation) e.stopPropagation();

    if (dragSrcEl !== this) {
        // Remove o elemento arrastado
        dragSrcEl.parentNode.removeChild(dragSrcEl);

        // Insere no novo local
        const dropHTML = e.dataTransfer.getData('text/html');
        this.insertAdjacentHTML('beforebegin', dropHTML);

        // Adiciona novamente os eventos no novo elemento inserido
        addDnDHandlers(this.previousSibling);
    }

    this.classList.remove('over');
    return false;
}

function handleDragEnd() {
    const cards = lista.querySelectorAll('.evento-card');
    cards.forEach(card => card.classList.remove('over'));
}

function addDnDHandlers(elem) {
    elem.addEventListener('dragstart', handleDragStart);
    elem.addEventListener('dragenter', handleDragEnter);
    elem.addEventListener('dragover', handleDragOver);
    elem.addEventListener('dragleave', handleDragLeave);
    elem.addEventListener('drop', handleDrop);
    elem.addEventListener('dragend', handleDragEnd);
}

function addDnDToEventos() {
    const cards = lista.querySelectorAll('.evento-card');
    cards.forEach(card => addDnDHandlers(card));
}

// Salvar Ordem
document.getElementById('salvarOrdem').addEventListener('click', async () => {
    const ordem = Array.from(lista.querySelectorAll('.evento-card'))
        .map(card => card.getAttribute('data-id'));

    const res = await fetch('/api/eventos/ordenar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordem })
    });

    if (res.ok) {
        alert('Ordem salva!');
    } else {
        alert('Erro ao salvar ordem');
    }
});

// Atualizar eventos em tempo real
socket.on('atualizarEventos', () => {
    carregarEventos();
});

// Inicializa
carregarEventos();
