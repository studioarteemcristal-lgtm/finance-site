import sqlite3 from "sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Garante a pasta /data no Render
const pastaDB = path.join(process.cwd(), "data");
if (!fs.existsSync(pastaDB)) fs.mkdirSync(pastaDB, { recursive: true });

const dbPath = path.join(pastaDB, "database.sqlite");
const db = new sqlite3.Database(dbPath);

// Garante tabela
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL
  )
`);

const USERNAME = "leilaine";
const PASSWORD = "Bn@75406320";

db.get("SELECT * FROM users WHERE usuario = ?", [USERNAME], async (err, row) => {
  if (err) return console.log("Erro DB:", err);

  if (row) return console.log("Usuário já existe:", USERNAME);

  const hash = await bcrypt.hash(PASSWORD, 10);

  db.run(
    "INSERT INTO users (usuario, senha) VALUES (?, ?)",
    [USERNAME, hash],
    (err) => {
      if (err) console.log("Erro criando usuário:", err);
      else console.log("Usuário criado com sucesso:", USERNAME);
    }
  );
});
