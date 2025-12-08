import express from "express";
import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// ==============================
// SERVIR ARQUIVOS ESTÁTICOS
// ==============================
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// ==============================
// GARANTIR PASTA DO BANCO
// ==============================
const pastaDB = path.join(__dirname, "data");

if (!fs.existsSync(pastaDB)) {
  fs.mkdirSync(pastaDB, { recursive: true });
}

// ==============================
// ABRIR BANCO SQLITE
// ==============================
const db = new sqlite3.Database(path.join(pastaDB, "database.sqlite"), err => {
  if (err) console.error("❌ Erro ao abrir banco:", err);
  else console.log("✅ Banco conectado!");
});

// ==============================
// CRIAR TABELAS
// ==============================
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT UNIQUE,
      senha TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS lancamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT,
      descricao TEXT,
      valor REAL,
      data TEXT
    )
  `);

  const senhaCriptografada = bcrypt.hashSync("Bn@75406320", 10);

  db.run(
    "INSERT OR IGNORE INTO users (usuario, senha) VALUES (?, ?)",
    ["leilaine", senhaCriptografada]
  );
});

// ==============================
// SEGREDO JWT
// ==============================
const JWT_SECRET = "CHAVE_SUPER_SECRETA_123"; // pode trocar depois

// ==============================
// MIDDLEWARE JWT
// ==============================
function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).json({ erro: "Token ausente" });

  const token = authHeader.split(" ")[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ erro: "Token inválido" });
    req.userId = decoded.id;
    next();
  });
}

// ==============================
// LOGIN COM JWT ✅
// ==============================
app.post("/api/login", (req, res) => {
  const { usuario, senha } = req.body;

  if (!usuario || !senha) {
    return res.status(400).json({ erro: "Usuário ou senha ausentes" });
  }

  db.get(
    "SELECT * FROM users WHERE usuario = ?",
    [usuario],
    (err, user) => {
      if (err) return res.status(500).json({ erro: "Erro no banco" });
      if (!user) return res.status(401).json({ erro: "Usuário não encontrado" });

      const senhaOK = bcrypt.compareSync(senha, user.senha);
      if (!senhaOK) return res.status(401).json({ erro: "Senha incorreta" });

      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "8h" });

      res.json({ token });
    }
  );
});

// ==============================
// LISTAR LANÇAMENTOS ✅
// ==============================
app.get("/api/lancamentos", verificarToken, (req, res) => {
  db.all("SELECT * FROM lancamentos ORDER BY id DESC", (err, rows) => {
    if (err) return res.status(500).json({ erro: "Erro ao buscar lançamentos" });
    res.json(rows);
  });
});

// ==============================
// CRIAR LANÇAMENTO ✅
// ==============================
app.post("/api/lancamentos", verificarToken, (req, res) => {
  const { tipo, descricao, valor, data } = req.body;

  if (!tipo || !descricao || !valor || !data) {
    return res.status(400).json({ erro: "Dados incompletos" });
  }

  db.run(
    "INSERT INTO lancamentos (tipo, descricao, valor, data) VALUES (?, ?, ?, ?)",
    [tipo, descricao, valor, data],
    err => {
      if (err) return res.status(500).json({ erro: "Erro ao salvar lançamento" });
      res.json({ sucesso: true });
    }
  );
});

// ==============================
// INICIAR SERVIDOR
// ==============================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("✅ Servidor JWT rodando na porta", PORT);
});
