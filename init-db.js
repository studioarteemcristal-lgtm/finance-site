import sqlite3 from "sqlite3";
import bcrypt from "bcryptjs";

const db = new sqlite3.Database("./data/database.sqlite");

// Criar tabelas
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
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

  // Criar usuário admin
  const senhaHash = bcrypt.hashSync("admin123", 10);

  db.run(
    "INSERT OR IGNORE INTO usuarios (usuario, senha) VALUES (?,?)",
    ["admin", senhaHash]
  );

  console.log("✔ Banco de dados inicializado.");
});
