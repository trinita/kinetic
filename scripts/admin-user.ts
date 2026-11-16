// Creates an admin login. Usage: npm run admin:user
// Asks for a username and password (the password is not shown or saved anywhere) and prints the
// line to put in ADMIN_USERS. Several accounts: join entries with a comma.

import { randomBytes } from "node:crypto";
import readline from "node:readline";
import { hashPassword } from "@/lib/admin/password";

function ask(question: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  if (hidden) {
    // Don't echo what is typed.
    (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s: string) => {
      if (s.includes(question)) process.stdout.write(question);
    };
  }
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer);
    }),
  );
}

async function main() {
  const username = (await ask("Nama pengguna (username): ")).trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    console.error("Gunakan 3–32 huruf kecil, angka, titik, garis bawah, atau tanda hubung.");
    process.exit(1);
  }
  const password = await ask("Kata sandi (min. 12 karakter): ", true);
  if (password.length < 12) {
    console.error("Kata sandi terlalu pendek (min. 12 karakter).");
    process.exit(1);
  }
  if ((await ask("Ulangi kata sandi: ", true)) !== password) {
    console.error("Kata sandi tidak sama.");
    process.exit(1);
  }

  const entry = `${username}:${await hashPassword(password)}`;
  console.log("\nTambahkan ke .env.local (komputer) dan ke Vercel → Settings → Environment Variables:\n");
  console.log(`ADMIN_USERS=${entry}`);
  console.log("\nJika belum ada, tambahkan juga kunci sesi acak ini (sekali saja, sama untuk semua akun):\n");
  console.log(`ADMIN_SESSION_SECRET=${randomBytes(32).toString("base64url")}`);
  console.log("\nUntuk beberapa akun: ADMIN_USERS=akun1:...,akun2:...");
}

void main();
