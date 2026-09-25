// Lit l'itinéraire JSON pendant que l'IA l'écrit, morceau par morceau, et repère chaque journée
// terminée. Sert à afficher le voyage jour par jour sans attendre la fin de la réponse.
//
// L'itinéraire a la forme { "message", "resume", "jours": [ {...}, {...} ], "budget_estime" }.
// "jours" est le seul tableau placé directement dans l'objet principal : chaque fois qu'un objet
// se ferme juste à l'intérieur de ce tableau, une journée est complète.

class PartialItinerary {
  constructor() {
    this.text = "";
    this.start = -1; // position du premier "{"
    this.stack = []; // accolades et crochets ouverts
    this.inString = false;
    this.escaped = false;
    this.lastDayEnd = -1; // position de la fin de la dernière journée complète
  }

  // Ajoute un morceau de texte. Renvoie true si au moins une nouvelle journée vient de se terminer.
  push(chunk) {
    const from = this.text.length;
    this.text += chunk;
    let newDay = false;

    for (let i = from; i < this.text.length; i += 1) {
      const c = this.text[i];
      if (this.start === -1) {
        if (c === "{") {
          this.start = i;
          this.stack.push("{");
        }
        continue;
      }
      if (this.inString) {
        if (this.escaped) this.escaped = false;
        else if (c === "\\") this.escaped = true;
        else if (c === '"') this.inString = false;
        continue;
      }
      if (c === '"') this.inString = true;
      else if (c === "{" || c === "[") this.stack.push(c);
      else if (c === "}" || c === "]") {
        this.stack.pop();
        if (c === "}" && this.stack.length === 2 && this.stack[0] === "{" && this.stack[1] === "[") {
          this.lastDayEnd = i;
          newDay = true;
        }
      }
    }
    return newDay;
  }

  // Itinéraire partiel (message, resume et journées complètes) en texte JSON valide, ou null.
  snapshot() {
    if (this.lastDayEnd === -1) return null;
    const candidate = `${this.text.slice(this.start, this.lastDayEnd + 1)}]}`;
    try {
      const parsed = JSON.parse(candidate);
      return Array.isArray(parsed.jours) && parsed.jours.length > 0 ? candidate : null;
    } catch (err) {
      return null;
    }
  }
}

module.exports = { PartialItinerary };
