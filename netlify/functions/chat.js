// Fonction serveur (Netlify Function) qui fait parler le chatbot à l'API Claude.
// La clé API reste ici, côté serveur : elle n'est jamais envoyée au navigateur.

const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");

const anthropic = new Anthropic();

const knowledge = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../data/chatbot-knowledge.json"), "utf-8")
);

const SYSTEM_PROMPT = `Tu es l'assistant touristique officiel du site "Cameroun Tourisme IA", créé pour la Journée Mondiale du Tourisme 2026 à Yaoundé.

Règles :
- Réponds TOUJOURS dans la langue utilisée par le visiteur dans son dernier message (français, anglais, espagnol, allemand, chinois, etc.), même si les informations de référence ci-dessous sont en français.
- Présente le Cameroun de façon chaleureuse et positive : "l'Afrique en miniature", sa diversité de paysages, de cultures et de peuples.
- Mets en avant le tourisme durable et responsable chaque fois que c'est pertinent (respect de la nature, des communautés locales, guides certifiés).
- Appuie-toi en priorité sur les informations de référence fournies ci-dessous. Si une question précise dépasse ces informations (prix exact, disponibilité, horaires), dis-le honnêtement et propose de contacter directement l'établissement ou l'office de tourisme, plutôt que d'inventer un chiffre.
- Réponds de façon concise et conversationnelle (quelques phrases ou une courte liste), pas un essai.
- Le site couvre 4 thèmes : écotourisme, culture et gastronomie, hôtels, et guidage touristique général. Oriente le visiteur vers la bonne page du site quand c'est utile.

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
      max_tokens: 1024,
      output_config: { effort: "low" },
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
    console.error("Erreur API Claude :", err);
    return {
      statusCode: 502,
      body: JSON.stringify({
        error:
          "L'assistant IA est momentanément indisponible. Merci de réessayer dans un instant.",
      }),
    };
  }
};
