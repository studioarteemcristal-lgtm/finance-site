import sqlite3 from "sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new sqlite3.Database(path.join(__dirname, "data", "database.sqlite"));

const senhaCriptografada = bcrypt.hashSync("Bn@75406320", 10);

db.serialize(() => {
  console.log("🔧 Criando tabela USERS...");

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT UNIQUE,
      senha TEXT
    )
  `);

  db.run(`DELETE FROM users WHERE usuario = 'leilaine'`);

  db.run(
    `INSERT INTO users (usuario, senha) VALUES (?, ?)`,
    ["leilaine", senhaCriptografada],
    err => {
      if (err) console.log("❌ Erro ao inserir usuário:", err);
      else console.log("✔ Usuário criado com sucesso!");
    }
  );
});

db.close();
