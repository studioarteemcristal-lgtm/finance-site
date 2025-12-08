// init-user.js
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");

const db = new sqlite3.Database("./data/database.sqlite");

const USERNAME = "leilaine";
const PASSWORD = "Bn@75406320";

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL
    )
  `);

  // Verifica se já existe
  db.get("SELECT * FROM usuarios WHERE usuario = ?", [USERNAME], async (err, row) => {
    if (err) {
      console.error("Erro ao verificar usuário:", err);
      return;
    }

    if (row) {
      console.log("Usuário já existe:", USERNAME);
      return;
    }

    const hash = await bcrypt.hash(PASSWORD, 10);
    db.run(
      "INSERT INTO usuarios (usuario, senha) VALUES (?, ?)",
      [USERNAME, hash],
      (err) => {
        if (err) {
          console.error("Erro ao criar usuário:", err);
        } else {
          console.log("Usuário criado com sucesso:", USERNAME);
        }
      }
    );
  });
});
