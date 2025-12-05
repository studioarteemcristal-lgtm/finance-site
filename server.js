import express from "express";
import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";
import cors from "cors";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// ✅ GARANTIR PASTA DO BANCO
const pastaDB = path.join(__dirname, "data");
if (!fs.existsSync(pastaDB)) {
  fs.mkdirSync(pastaDB, { recursive: true });
}

const db = new sqlite3.Database(path.join(pastaDB, "database.sqlite"));

// ✅ ROTA DE LOGIN FUNCIONAL
app.post("/api/login", (req, res) => {
  const { usuario, senha } = req.body;

  if (!usuario || !senha) {
    return res.status(400).json({ erro: "Dados incompletos" });
  }

  db.get(
    "SELECT * FROM users WHERE usuario = ?",
    [usuario],
    (err, user) => {
      if (err) return res.status(500).json({ erro: "Erro no banco" });
      if (!user) return res.status(401).json({ erro: "Usuário não existe" });

      const senhaOK = bcrypt.compareSync(senha, user.senha);
      if (!senhaOK) return res.status(401).json({ erro: "Senha incorreta" });

      res.json({ sucesso: true });
    }
  );
});

// ✅ OBRIGATÓRIO NO RENDER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("✅ Servidor rodando na porta", PORT);
});
