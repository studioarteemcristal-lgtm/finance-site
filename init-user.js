import sqlite3 from "sqlite3";
import bcrypt from "bcryptjs";

// ✅ Caminho correto do banco
const db = new sqlite3.Database("./data/database.sqlite");

// ✅ Dados do usuário
const usuario = "leilaine";
const senha = "Bn@75406320";
const senhaCripto = bcrypt.hashSync(senha, 10);

// ✅ Inserção na tabela CORRETA: users
db.run(
  "INSERT INTO users (usuario, senha) VALUES (?, ?)",
  [usuario, senhaCripto],
  err => {
    if (err) {
      console.log("❌ Erro ao criar usuário:", err.message);
    } else {
      console.log("✅ Usuário criado com sucesso!");
    }
  }
);

// ✅ Fechar banco corretamente
db.close();
