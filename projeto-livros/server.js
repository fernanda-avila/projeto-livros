require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const db = require('./database');
const express = require('express');
const cors = require('cors');




app.use(cors({
  origin: 'http://localhost:3000', 
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do Multer para uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Apenas imagens são permitidas (jpeg, jpg, png, gif)'));
  }
});

// Middlewares
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'DELETE']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas
app.get('/api/obras', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, titulo, autor, descricao, genero, tipo, capa, 
             DATE_FORMAT(data_publicacao, '%Y-%m-%d') as data_publicacao
      FROM obras 
      ORDER BY data_cadastro DESC
    `);
    res.json(rows || []);
  } catch (err) {
    console.error('Erro ao buscar obras:', err);
    res.status(500).json({ error: 'Erro ao buscar obras' });
  }
});

app.post('/api/obras', upload.single('capa'), async (req, res) => {
  try {
    const { titulo, autor, descricao, genero, tipo, data_publicacao } = req.body;
    if (!titulo || !autor) {
      return res.status(400).json({ error: 'Título e autor são obrigatórios' });
    }

    const capa = req.file ? `/uploads/${req.file.filename}` : null;
    const [result] = await db.query(
      `INSERT INTO obras (titulo, autor, descricao, genero, tipo, capa, data_publicacao) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [titulo, autor, descricao, genero, tipo, capa, data_publicacao || null]
    );
    
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('Erro ao cadastrar obra:', err);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Erro ao cadastrar obra' });
  }
});

app.delete('/api/obras/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    const [rows] = await db.query('SELECT capa FROM obras WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Obra não encontrada' });

    if (rows[0].capa) {
      const filePath = path.join(__dirname, rows[0].capa);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    const [result] = await db.query('DELETE FROM obras WHERE id = ?', [id]);
    res.json({ deleted: result.affectedRows });
  } catch (err) {
    console.error('Erro ao remover obra:', err);
    res.status(500).json({ error: 'Erro ao remover obra' });
  }
});

// Inicialização
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});