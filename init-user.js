import sqlite3 from "sqlite3";
import bcrypt from "bcryptjs";

const db = new sqlite3.Database("./data/database.sqlite");

const usuario = "leilaine";
const senha = "Bn@75406320";
const senhaCripto = bcrypt.hashSync(senha, 10);

db.run(
  "INSERT INTO usuarios (usuario, senha) VALUES (?, ?)",
  [usuario, senhaCripto],
  err => {
    if (err) {
      console.log("Erro ao criar usuário:", err.message);
    } else {
      console.log("Usuário criado com sucesso!");
    }
  }
);

db.close();

