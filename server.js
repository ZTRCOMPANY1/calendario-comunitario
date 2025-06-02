const express = require('express');
const fs = require('fs');
const session = require('express-session');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const multer = require('multer');
const path = require('path');

// Configurações
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
    secret: 'segredo-super-simples',
    resave: false,
    saveUninitialized: true
}));

// Multer configuração para upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Funções para ler e salvar eventos JSON
function carregarEventos() {
    try {
        const data = fs.readFileSync('eventos.json', 'utf8');
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}
function salvarEventos(eventos) {
    fs.writeFileSync('eventos.json', JSON.stringify(eventos, null, 2));
}

// Middleware autenticação simples
function autenticar(req, res, next) {
    if (req.session.logado) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Rotas de login
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});
app.post('/login', (req, res) => {
    const { usuario, senha } = req.body;
    if (usuario === 'admin' && senha === 'admin123') {
        req.session.logado = true;
        res.redirect('/painel');
    } else {
        res.send('<h3>Login inválido! <a href="/login">Tentar novamente</a></h3>');
    }
});
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Página painel admin (protegida)
app.get('/painel', autenticar, (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Página pública eventos
app.get('/eventos', (req, res) => {
    res.sendFile(__dirname + '/public/eventos.html');
});

// API eventos
app.get('/api/eventos', (req, res) => {
    const eventos = carregarEventos();
    res.json(eventos);
});

// Criar evento com upload
app.post('/api/eventos', autenticar, upload.single('imagem'), (req, res) => {
    const eventos = carregarEventos();
    const novoEvento = {
        id: Date.now(),
        titulo: req.body.titulo,
        descricao: req.body.descricao,
        data: req.body.data,
        categoria: req.body.categoria,
        local: req.body.local,
        status: 'Acontecerá',
        imagem: req.file ? `/uploads/${req.file.filename}` : ''
    };
    eventos.push(novoEvento);
    salvarEventos(eventos);

    io.emit('atualizarEventos');
    res.json({ mensagem: 'Evento criado com sucesso!' });
});

// Atualizar ordem dos eventos
app.post('/api/eventos/ordenar', autenticar, (req, res) => {
    const { ordem } = req.body;
    let eventos = carregarEventos();

    eventos.sort((a, b) => ordem.indexOf(a.id.toString()) - ordem.indexOf(b.id.toString()));

    salvarEventos(eventos);
    io.emit('atualizarEventos');
    res.json({ mensagem: 'Ordem atualizada!' });
});

// Remover evento
app.delete('/api/eventos/:id', autenticar, (req, res) => {
    const eventos = carregarEventos();
    const id = parseInt(req.params.id);
    const eventosFiltrados = eventos.filter(e => e.id !== id);

    salvarEventos(eventosFiltrados);
    io.emit('atualizarEventos');
    res.json({ mensagem: 'Evento removido com sucesso!' });
});

// Alterar status do evento
app.patch('/api/eventos/:id/status', autenticar, (req, res) => {
    const eventos = carregarEventos();
    const id = parseInt(req.params.id);
    const { status } = req.body;

    const evento = eventos.find(e => e.id === id);
    if (evento) {
        evento.status = status;
        salvarEventos(eventos);
        io.emit('atualizarEventos');
        res.json({ mensagem: 'Status atualizado!' });
    } else {
        res.status(404).json({ mensagem: 'Evento não encontrado' });
    }
});

// Socket.io conexão
io.on('connection', (socket) => {
    console.log('Usuário conectado');
});

http.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});
