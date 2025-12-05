import express from "express";
import sqlite3 from "sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

// Corrigir caminhos no Render (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos (public/)
app.use(express.static(path.join(__dirname, "public")));

// Conectar ao banco SQLite
const db = new sqlite3.Database(path.join(__dirname, "data", "database.sqlite"));

// ================= JWT Middleware ==================
function verificarToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(403).json({ error: "Token ausente" });

  const token = authHeader.replace("Bearer ", "");

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Token inválido" });

    req.user = decoded;
    next();
  });
}

// ================= LOGIN ============================
app.post("/api/login", (req, res) => {
  const { usuario, senha } = req.body;

  // 🔥 CORRIGIDO: tabela correta é "users"
  db.get("SELECT * FROM users WHERE usuario = ?", [usuario], (err, user) => {
    if (err) return res.status(500).json({ error: "Erro no banco", detalhe: err });
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
    if (err) return res.status(500).json({ error: err });
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
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Lançamento adicionado" });
    }
  );
});

// ================== ROTA SPA (Render fix) ====================
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ================== INICIAR SERVIDOR ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✔ Servidor rodando na porta ${PORT}`);
});
