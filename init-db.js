// script para inicializar DB manualmente (opcional)
import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pastaDB = path.join(__dirname, "data");
if (!fs.existsSync(pastaDB)) fs.mkdirSync(pastaDB, { recursive: true });

const dbPath = path.join(pastaDB, "database.sqlite");
const db = new sqlite3.Database(dbPath);

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

  // cria usuário padrão (senha: Bn@75406320)
  const senhaPadrao = bcrypt.hashSync("Bn@75406320", 10);
  db.run("INSERT OR IGNORE INTO users (usuario, senha) VALUES (?, ?)", ["leilaine", senhaPadrao], (err) => {
    if (err) console.error("Erro inserir user:", err);
    else console.log("Usuário inicial criado (ou já existia): leilaine");
  });
});

db.close();
