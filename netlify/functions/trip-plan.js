// Fonction serveur (Netlify Function) qui construit un itinéraire personnalisé avec l'API Claude.
// Même principe que chat.js : on injecte le contenu de data/chatbot-knowledge.json dans le prompt
// système, pour que l'IA s'appuie sur nos vraies informations plutôt que d'inventer.

const Anthropic = require("@anthropic-ai/sdk");
const { apiErrorResponse } = require("../lib/api-error");
const { loadKnowledge } = require("../lib/knowledge");

const anthropic = new Anthropic();

const knowledge = loadKnowledge();

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

// Extrait l'objet JSON de la réponse, même si l'IA l'a entouré de texte ou de balises ```json.
// Renvoie null si aucun JSON valide n'est trouvé (par exemple réponse coupée).
function extractJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  const candidate = text.slice(start, end + 1);
  try {
    JSON.parse(candidate);
    return candidate;
  } catch (err) {
    return null;
  }
}

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
      max_tokens: 8000,
      output_config: { effort: "medium" },
      system: SYSTEM_PROMPT,
      messages,
    });

    const raw = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    const reply = extractJson(raw);
    if (!reply) {
      console.error(
        `[trip-plan] Réponse non exploitable (stop_reason=${response.stop_reason}). Début : ${raw.slice(0, 300)} … Fin : ${raw.slice(-300)}`
      );
      return {
        statusCode: 502,
        body: JSON.stringify({
          error:
            "L'assistant n'a pas pu construire un itinéraire structuré cette fois-ci. Merci de réessayer ou de reformuler votre demande.",
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    return apiErrorResponse(
      "trip-plan",
      err,
      "Le planificateur est momentanément indisponible. Merci de réessayer dans un instant."
    );
  }
};
