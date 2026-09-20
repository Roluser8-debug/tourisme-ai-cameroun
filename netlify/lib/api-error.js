// Traduit une erreur de l'API Claude en explication claire pour le développeur.
// Le visiteur, lui, voit toujours un message poli et sans détail technique.

function diagnose(err) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return "Clé API absente : la variable ANTHROPIC_API_KEY n'est pas définie (fichier .env en local, Environment variables sur Netlify).";
  }

  switch (err && err.status) {
    case 401:
      return "Clé API refusée (401) : la clé ANTHROPIC_API_KEY est invalide ou révoquée.";
    case 403:
      return "Accès refusé (403) : la clé n'a pas le droit d'utiliser ce modèle.";
    case 404:
      return "Modèle introuvable (404) : vérifier le nom du modèle dans la fonction.";
    case 400:
      return "Requête refusée (400) : " + err.message + " (crédit épuisé ou paramètre non accepté ?)";
    case 429:
      return "Trop de requêtes (429) : limite de débit atteinte, réessayer plus tard.";
    case 529:
      return "API Claude surchargée (529) : réessayer plus tard.";
    default:
      return err && err.status
        ? "Erreur API " + err.status + " : " + err.message
        : "Erreur réseau ou inattendue : " + (err && err.message);
  }
}

// Écrit la vraie cause dans les journaux et renvoie le message à montrer au visiteur.
// En local (netlify dev), la cause est aussi ajoutée au message pour la voir à l'écran.
function visitorError(label, err, visitorMessage) {
  const reason = diagnose(err);
  console.error(`[${label}] ${reason}`, err);

  if (process.env.NETLIFY_DEV === "true") {
    return `${visitorMessage} (Diagnostic local : ${reason})`;
  }
  return visitorMessage;
}

// Même chose, sous forme de réponse HTTP 502 (pour les fonctions qui répondent directement).
function apiErrorResponse(label, err, visitorMessage) {
  return {
    statusCode: 502,
    body: JSON.stringify({ error: visitorError(label, err, visitorMessage) }),
  };
}

module.exports = { apiErrorResponse, visitorError };
