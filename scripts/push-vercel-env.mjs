import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envFile = join(root, ".env.vercel");
const repoFile = join(root, ".vercel/repo.json");
const authFile = join(homedir(), "Library/Application Support/com.vercel.cli/auth.json");
const targets = ["production", "preview", "development"];

function parseEnv(content) {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");
      if (index === -1) throw new Error(`Linea invalida: ${line}`);
      return [line.slice(0, index), line.slice(index + 1)];
    });
}

const { token } = JSON.parse(readFileSync(authFile, "utf8"));
const { projects } = JSON.parse(readFileSync(repoFile, "utf8"));
const project = projects.find((item) => item.name === "predicta");

if (!project) {
  throw new Error("No se encontro el proyecto predicta en .vercel/repo.json");
}

const entries = parseEnv(readFileSync(envFile, "utf8"));

for (const [key, value] of entries) {
  const response = await fetch(
    `https://api.vercel.com/v10/projects/${project.id}/env?teamId=${project.orgId}&upsert=true`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key,
        value,
        type: "encrypted",
        target: targets,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`No se pudo guardar ${key}: ${response.status} ${error}`);
  }

  console.log(`✓ ${key} → production, preview, development`);
}

console.log("\nVariables exportadas a Vercel (proyecto predicta).");
