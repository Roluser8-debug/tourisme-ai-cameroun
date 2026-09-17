// Fonction serveur (Netlify Function) qui construit un itinéraire personnalisé avec l'API Claude.
// Même principe que chat.js : on injecte le contenu de data/chatbot-knowledge.json dans le prompt
// système, pour que l'IA s'appuie sur nos vraies informations plutôt que d'inventer.

const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");

const anthropic = new Anthropic();

const knowledge = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../data/chatbot-knowledge.json"), "utf-8")
);

const SYSTEM_PROMPT = `Tu es le planificateur de voyage IA du site "CAMTOUR AI".

Ta mission : construire un itinéraire de voyage personnalisé au Cameroun à partir des préférences du visiteur (point de départ, durée, budget, avec qui il voyage, centres d'intérêt), en t'appuyant uniquement sur les informations de référence fournies ci-dessous (parcs, mets, aires culturelles, hôtels, circuits).

Règles :
- Réponds TOUJOURS dans la langue utilisée par le visiteur dans son dernier message.
- Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après, sans balises markdown (pas de \`\`\`), respectant exactement ce schéma :
{
  "message": "1-2 phrases d'introduction chaleureuse sur le voyage proposé",
  "jours": [
    { "jour": 1, "titre": "court résumé du jour", "activites": [
      { "heure": "08h30", "icone": "🏛️", "titre": "...", "description": "1-2 phrases" }
    ]}
  ],
  "budget_estime": { "transport": 0, "activites": 0, "repas": 0, "hebergement": 0, "total": 0, "note": "Estimation indicative en FCFA, à confirmer sur place — pas de prix garanti." }
}
- Construis l'itinéraire uniquement à partir des sites, mets, aires culturelles, hôtels et circuits fournis dans les informations de référence. N'invente pas de lieu, d'hôtel ou de prix qui n'y figure pas.
- Le nombre de jours dans "jours" doit correspondre à la durée demandée par le visiteur.
- Le budget est une estimation réaliste basée sur le coût de la vie au Cameroun ; indique-le toujours comme une estimation, jamais comme un prix garanti.
- Mets en avant le tourisme durable et responsable quand c'est pertinent (guides certifiés, écotourisme communautaire).
- Si le visiteur envoie ensuite un message pour modifier son voyage (budget, préférences, nombre de personnes...), renvoie un NOUVEL itinéraire complet mis à jour, avec le même schéma JSON — jamais une simple liste de changements.
- Si la demande est trop vague pour construire un itinéraire (ex. aucune durée indiquée), fais une hypothèse raisonnable plutôt que de bloquer, et mentionne-la dans "message".

Informations de référence (JSON) :
${JSON.stringify(knowledge)}`;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Méthode non autorisée." }) };
  }

  let messages;
  try {
    const body = JSON.parse(event.body || "{}");
    messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error("Liste de messages manquante ou vide.");
    }
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: "Requête invalide." }) };
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-opus-5",
      max_tokens: 2048,
      output_config: { effort: "medium" },
      system: SYSTEM_PROMPT,
      messages,
    });

    const reply = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    return {
      statusCode: 200,
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error("Erreur API Claude (trip-plan) :", err);
    return {
      statusCode: 502,
      body: JSON.stringify({
        error:
          "Le planificateur est momentanément indisponible. Merci de réessayer dans un instant.",
      }),
    };
  }
};
