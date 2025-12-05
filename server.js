import express from "express";
import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";
import cors from "cors";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";

// ==============================
// CONFIGURAÇÕES INICIAIS
// ==============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// ==============================
// SERVIR ARQUIVOS ESTÁTICOS
// ==============================
app.use(express.static(path.join(__dirname, "public")));

// Abrir o login direto no root "/"
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
  if (err) {
    console.error("❌ Erro ao abrir banco:", err);
  } else {
    console.log("✅ Banco conectado com sucesso!");
  }
});

// ==============================
// CRIAR TABELA + GARANTIR USUÁRIO (ORDEM SEGURA)
// ==============================
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT UNIQUE,
      senha TEXT
    )
  `);

  const senhaCriptografada = bcrypt.hashSync("Bn@75406320", 10);

  db.run(
    "INSERT OR IGNORE INTO users (usuario, senha) VALUES (?, ?)",
    ["leilaine", senhaCriptografada],
    err => {
      if (err) {
        console.log("❌ Erro ao garantir usuário:", err);
      } else {
        console.log("✅ Usuário 'leilaine' garantido no banco!");
      }
    }
  );
});

// ==============================
// ROTA DE LOGIN (100% FUNCIONAL)
// ==============================
app.post("/api/login", (req, res) => {
  try {
    const { usuario, senha } = req.body;

    if (!usuario || !senha) {
      return res.status(400).json({ erro: "Usuário ou senha ausentes" });
    }

    db.get(
      "SELECT * FROM users WHERE usuario = ?",
      [usuario],
      (err, user) => {
        if (err) {
          console.error("❌ Erro no banco:", err);
          return res.status(500).json({ erro: "Erro no banco de dados" });
        }

        if (!user) {
          return res.status(401).json({ erro: "Usuário não encontrado" });
        }

        const senhaOK = bcrypt.compareSync(senha, user.senha);

        if (!senhaOK) {
          return res.status(401).json({ erro: "Senha incorreta" });
        }

        res.json({ sucesso: true });
      }
    );
  } catch (e) {
    console.error("❌ ERRO GERAL LOGIN:", e);
    res.status(500).json({ erro: "Falha grave no servidor" });
  }
});

// ==============================
// INICIAR SERVIDOR (RENDER)
// ==============================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("✅ Servidor rodando na porta", PORT);
});
