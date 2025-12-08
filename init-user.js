import sqlite3 from "sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pastaDB = path.join(__dirname, "data");
if (!fs.existsSync(pastaDB)) fs.mkdirSync(pastaDB, { recursive: true });

const dbPath = path.join(pastaDB, "database.sqlite");
const db = new sqlite3.Database(dbPath);

const USERNAME = "leilaine";
const PASSWORD = "Bn@75406320";

db.serialize(() => {
  db.get(
    "SELECT * FROM users WHERE usuario = ?",
    [USERNAME],
    async (err, row) => {
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
        "INSERT INTO users (usuario, senha) VALUES (?, ?)",
        [USERNAME, hash],
        (err) => {
          if (err) {
            console.error("Erro ao criar usuário:", err);
          } else {
            console.log("Usuário criado com sucesso:", USERNAME);
          }
        }
      );
    }
  );
});
