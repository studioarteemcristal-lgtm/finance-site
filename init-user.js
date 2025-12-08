// uso: node init-user.js nomeUsuario senha
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log("Uso: node init-user.js <usuario> <senha>");
  process.exit(1);
}
const [usuario, senha] = args;

const pastaDB = path.join(__dirname, "data");
if (!fs.existsSync(pastaDB)) fs.mkdirSync(pastaDB, { recursive: true });

const dbPath = path.join(pastaDB, "database.sqlite");
const db = new sqlite3.Database(dbPath);

const senhaHash = bcrypt.hashSync(senha, 10);
db.run("INSERT OR REPLACE INTO users (usuario, senha) VALUES (?, ?)", [usuario, senhaHash], (err) => {
  if (err) console.error("Erro:", err);
  else console.log("Usuário criado/atualizado:", usuario);
  db.close();
});
