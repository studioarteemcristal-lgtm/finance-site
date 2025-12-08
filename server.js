// ==============================
// server.js - Finance Site
// ==============================

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
// PASTA DO BANCO
// ==============================
const pastaDB = path.join(__dirname, "data");
if (!fs.existsSync(pastaDB)) {
  fs.mkdirSync(pastaDB, { recursive: true });
}

// ==============================
// ABRIR BANCO SQLITE
// ==============================
const dbPath = path.join(pastaDB, "database.sqlite");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("❌ Erro ao abrir banco:", err);
  else console.log("✅ Banco conectado em", dbPath);
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

  const senhaPadrao = bcrypt.hashSync("Bn@75406320", 10);

  db.run(
    "INSERT OR IGNORE INTO users (usuario, senha) VALUES (?, ?)",
    ["leilaine", senhaPadrao]
  );
});

// ==============================
// SEGREDO JWT
// ==============================
const JWT_SECRET = process.env.JWT_SECRET || "CHAVE_SUPER_SECRETA_123";

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
// LOGIN COM JWT
// ==============================
app.post("/api/login", (req, res) => {
  const { usuario, senha } = req.body;
  if (!usuario || !senha) {
// ==============================
// LOGIN COM JWT
// ==============================
app.post("/api/login", (req, res) => {
  const { usuario, senha } = req.body;

  if (!usuario || !senha) {
    return res.status(400).json({ erro: "Usuário e senha obrigatórios" });
  }

  db.get("SELECT * FROM users WHERE usuario = ?", [usuario], (err, user) => {
    if (err) return res.status(500).json({ erro: "Erro no servidor" });
    if (!user) return res.status(401).json({ erro: "Usuário não encontrado" });

    const senhaCorreta = bcrypt.compareSync(senha, user.senha);
    if (!senhaCorreta)
      return res.status(401).json({ erro: "Senha incorreta" });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "8h" });

    res.json({ token });
  });
});

// ==============================
// ROTAS PROTEGIDAS - LANÇAMENTOS
// ==============================

// Criar lançamento
app.post("/api/lancamentos", verificarToken, (req, res) => {
  const { tipo, descricao, valor, data } = req.body;

  db.run(
    "INSERT INTO lancamentos (tipo, descricao, valor, data) VALUES (?, ?, ?, ?)",
    [tipo, descricao, valor, data],
    function (err) {
      if (err) return res.status(500).json({ erro: "Erro ao inserir" });
      res.json({ id: this.lastID });
    }
  );
});

// Listar lançamentos
app.get("/api/lancamentos", verificarToken, (req, res) => {
  db.all("SELECT * FROM lancamentos ORDER BY date(data) DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ erro: "Erro ao buscar" });
    res.json(rows);
  });
});

// Apagar lançamento
app.delete("/api/lancamentos/:id", verificarToken, (req, res) => {
  const id = req.params.id;

  db.run("DELETE FROM lancamentos WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ erro: "Erro ao apagar" });

    if (this.changes === 0) {
      return res.status(404).json({ erro: "Registro não encontrado" });
    }

    res.json({ sucesso: true });
  });
});

// ==============================
// INICIAR SERVIDOR
// ==============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

