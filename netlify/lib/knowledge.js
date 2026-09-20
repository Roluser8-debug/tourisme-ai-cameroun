// Charge data/chatbot-knowledge.json, que l'on soit en local ou déployé sur Netlify.
// En local, le fichier est à deux dossiers au-dessus de la fonction ; une fois déployé,
// Netlify le place à la racine de la fonction (voir "included_files" dans netlify.toml).

const fs = require("fs");
const path = require("path");

const FILE = "data/chatbot-knowledge.json";

const candidates = [
  path.join(__dirname, FILE),
  path.join(__dirname, "../../", FILE),
  path.join(process.cwd(), FILE),
  path.join("/var/task", FILE),
];

function loadKnowledge() {
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) {
    throw new Error(
      `${FILE} introuvable. Chemins essayés : ${candidates.join(", ")}`
    );
  }
  return JSON.parse(fs.readFileSync(found, "utf-8"));
}

module.exports = { loadKnowledge };
