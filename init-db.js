import sqlite3 from "sqlite3";
import bcrypt from "bcryptjs";

const db = new sqlite3.Database("./data/database.sqlite");

// ================================
// ✅ CRIAR TABELAS
// ================================
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

  // ================================
  // ✅ CRIAR USUÁRIO ADMIN
  // ================================
  const senhaHash = bcrypt.hashSync("admin123", 10);

  db.run(
    "INSERT OR IGNORE INTO users (usuario, senha) VALUES (?, ?)",
    ["admin", senhaHash]
  );

  console.log("✔ Banco de dados inicializado corretamente.");
});
