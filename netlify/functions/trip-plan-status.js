// Fonction serveur rapide : dit à la page si le voyage demandé (voir trip-plan-background.js) est prêt.
// Réponses possibles : { status: "pending" } | { status: "done", reply } | { status: "error", error }

const { connectLambda, getStore } = require("@netlify/blobs");

const JOB_ID_PATTERN = /^[0-9a-f-]{36}$/;

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ error: "Méthode non autorisée." }) };
  }

  const id = event.queryStringParameters && event.queryStringParameters.id;
  if (typeof id !== "string" || !JOB_ID_PATTERN.test(id)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Requête invalide." }) };
  }

  try {
    connectLambda(event);

    // Lecture "forte" (résultat à jour tout de suite) si l'environnement le permet ;
    // sinon lecture normale, un peu moins instantanée mais suffisante puisque la page réessaie.
    let job;
    try {
      job = await getStore({ name: "trip-jobs", consistency: "strong" }).get(id, { type: "json" });
    } catch (err) {
      if (err && err.name !== "BlobsConsistencyError") throw err;
      job = await getStore({ name: "trip-jobs" }).get(id, { type: "json" });
    }

    return {
      statusCode: 200,
      headers: { "Cache-Control": "no-store" },
      body: JSON.stringify(job || { status: "pending" }),
    };
  } catch (err) {
    console.error("[trip-plan-status] Lecture impossible :", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Impossible de vérifier l'avancement du voyage." }),
    };
  }
};
