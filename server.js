import express from "express";
import sqlite3 from "sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const db = new sqlite3.Database("./data/database.sqlite");

// ================= JWT Middleware ==================
function verificarToken(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).json({ error: "Token ausente" });

  jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Token inválido" });
    req.user = decoded;
    next();
  });
}

// ================= LOGIN ============================
app.post("/api/login", (req, res) => {
  const { usuario, senha } = req.body;

  db.get("SELECT * FROM usuarios WHERE usuario = ?", [usuario], (err, user) => {
    if (err) return res.json({ error: err });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const senhaValida = bcrypt.compareSync(senha, user.senha);

    if (!senhaValida) return res.status(401).json({ error: "Senha incorreta" });

    const token = jwt.sign(
      { id: user.id, usuario: user.usuario },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ token });
  });
});

// ================= LISTAR LANÇAMENTOS ================
app.get("/api/lancamentos", verificarToken, (req, res) => {
  db.all("SELECT * FROM lancamentos ORDER BY data DESC", [], (err, rows) => {
    if (err) return res.json({ error: err });
    res.json(rows);
  });
});

// ================= NOVO LANÇAMENTO ====================
app.post("/api/lancamentos", verificarToken, (req, res) => {
  const { tipo, descricao, valor, data } = req.body;

  db.run(
    "INSERT INTO lancamentos (tipo, descricao, valor, data) VALUES (?,?,?,?)",
    [tipo, descricao, valor, data],
    err => {
      if (err) return res.json({ error: err });
      res.json({ message: "Lançamento adicionado" });
    }
  );
});

// ================== SERVIDOR ====================
app.listen(3000, () => {
  console.log("✔ Servidor rodando em http://localhost:3000");
});
