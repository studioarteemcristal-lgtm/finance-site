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

// servir estáticos (pasta public)
app.use(express.static(path.join(__dirname, "public")));

// rota raiz -> login
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// pasta do banco (cria se não existir)
const pastaDB = path.join(__dirname, "data");
if (!fs.existsSync(pastaDB)) fs.mkdirSync(pastaDB, { recursive: true });

const dbPath = path.join(pastaDB, "database.sqlite");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("❌ Erro ao abrir banco:", err);
  else console.log("✅ Banco conectado em", dbPath);
});

// cria tabelas e insere usuário padrão automaticamente
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

  // usuário padrão: leilaine / Bn@75406320
  const senhaPadrao = bcrypt.hashSync("Bn@75406320", 10);
  db.run(
    "INSERT OR IGNORE INTO users (usuario, senha) VALUES (?, ?)",
    ["leilaine", senhaPadrao],
    (err) => {
      if (err) console.error("Erro ao garantir usuário padrão:", err);
      else console.log("✅ Usuário padrão garantido: leilaine");
    }
  );
});

// segredo JWT (em produção use var de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || "CHAVE_SUPER_SECRETA_123";

// middleware para verificar token (Bearer)
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

// rota login
app.post("/api/login", (req, res) => {
  const { usuario, senha } = req.body;
  if (!usuario || !senha) return res.status(400).json({ erro: "Dados incompletos" });

  db.get("SELECT * FROM users WHERE usuario = ?", [usuario], (err, user) => {
    if (err) return res.status(500).json({ erro: "Erro no servidor" });
    if (!user) return res.status(401).json({ erro: "Usuário não encontrado" });

    const senhaOK = bcrypt.compareSync(senha, user.senha);
    if (!senhaOK) return res.status(401).json({ erro: "Senha incorreta" });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "8h" });
    res.json({ token });
  });
});

// GET lancamentos com filtros opcionais ?from=YYYY-MM-DD&to=YYYY-MM-DD
app.get("/api/lancamentos", verificarToken, (req, res) => {
  const { from, to } = req.query;
  let sql = "SELECT * FROM lancamentos";
  const params = [];

  if (from && to) {
    sql += " WHERE date(data) BETWEEN date(?) AND date(?)";
    params.push(from, to);
  } else if (from) {
    sql += " WHERE date(data) >= date(?)";
    params.push(from);
  } else if (to) {
    sql += " WHERE date(data) <= date(?)";
    params.push(to);
  }

  sql += " ORDER BY data DESC";

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ erro: "Erro ao buscar" });
    res.json(rows);
  });
});

// GET por id
app.get("/api/lancamentos/:id", verificarToken, (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM lancamentos WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ erro: "Erro ao buscar" });
    if (!row) return res.status(404).json({ erro: "Lançamento não encontrado" });
    res.json(row);
  });
});

// CREATE
app.post("/api/lancamentos", verificarToken, (req, res) => {
  const { tipo, descricao, valor, data } = req.body;
  db.run(
    `INSERT INTO lancamentos (tipo, descricao, valor, data) VALUES (?, ?, ?, ?)`,
    [tipo, descricao, valor, data],
    function (err) {
      if (err) return res.status(500).json({ erro: "Erro ao salvar" });
      res.json({ id: this.lastID });
    }
  );
});

// UPDATE
app.put("/api/lancamentos/:id", verificarToken, (req, res) => {
  const id = req.params.id;
  const { tipo, descricao, valor, data } = req.body;
  db.run(
    `UPDATE lancamentos SET tipo = ?, descricao = ?, valor = ?, data = ? WHERE id = ?`,
    [tipo, descricao, valor, data, id],
    function (err) {
      if (err) return res.status(500).json({ erro: "Erro ao atualizar" });
      if (this.changes === 0) return res.status(404).json({ erro: "Lançamento não encontrado" });
      res.json({ ok: true });
    }
  );
});

// DELETE
app.delete("/api/lancamentos/:id", verificarToken, (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM lancamentos WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ erro: "Erro ao excluir" });
    if (this.changes === 0) return res.status(404).json({ erro: "Lançamento não encontrado" });
    res.json({ ok: true });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🚀 Servidor rodando na porta " + PORT));
