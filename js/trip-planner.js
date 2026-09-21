// Planificateur de voyage IA — 4 écrans (envies, profil, trajet, budget), génération animée,
// itinéraire détaillé et modification du voyage par conversation.
// Parle à /api/trip-plan (lancement en tâche de fond) et /api/trip-plan-status (résultat prêt ?).

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("trip-form");
  if (!form) return;

  const steps = Array.from(form.querySelectorAll(".trip-step"));
  const prevBtn = document.getElementById("trip-prev");
  const nextBtn = document.getElementById("trip-next");
  const submitBtn = document.getElementById("trip-submit");
  const resultEl = document.getElementById("trip-result");
  const progressLabel = document.getElementById("trip-progress-label");
  const progressFill = document.getElementById("trip-progress-fill");
  const budgetInput = document.getElementById("trip-budget");
  const budgetPreview = document.getElementById("trip-budget-preview");

  let currentStep = 0;
  const history = []; // conversation envoyée à l'IA
  let tripMeta = null; // { jours, budget, profil } affichés dans l'en-tête du voyage
  let introMessage = ""; // phrase d'accueil de la première proposition
  let chatLog = []; // modifications demandées : { user, ai }

  // ---------- Petits outils ----------

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[c]);
  }

  function fcfa(n) {
    return `${Math.round(Number(n) || 0).toLocaleString("fr-FR")} FCFA`;
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ---------- Écrans du formulaire ----------

  function showStep(index) {
    steps.forEach((step, i) => {
      step.hidden = i !== index;
      const err = step.querySelector(".trip-step-error");
      if (err) err.hidden = true;
    });
    prevBtn.hidden = index === 0;
    nextBtn.hidden = index === steps.length - 1;
    submitBtn.hidden = index !== steps.length - 1;
    progressLabel.textContent = `Étape ${index + 1} sur ${steps.length}`;
    progressFill.style.width = `${((index + 1) / steps.length) * 100}%`;
  }

  function validateStep(index) {
    const step = steps[index];
    let valid = true;

    const minChecked = Number(step.dataset.minChecked || 0);
    if (minChecked && step.querySelectorAll('input[type="checkbox"]:checked').length < minChecked) {
      valid = false;
    }

    let firstInvalid = null;
    for (const input of step.querySelectorAll("input[required]")) {
      if (!input.checkValidity()) {
        valid = false;
        firstInvalid = firstInvalid || input;
      }
    }

    const err = step.querySelector(".trip-step-error");
    if (err) err.hidden = valid;
    if (firstInvalid && firstInvalid.type !== "radio") firstInvalid.focus();
    return valid;
  }

  nextBtn.addEventListener("click", () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < steps.length - 1) {
      currentStep += 1;
      showStep(currentStep);
    }
  });

  prevBtn.addEventListener("click", () => {
    if (currentStep > 0) {
      currentStep -= 1;
      showStep(currentStep);
    }
  });

  // ---------- Budget : répartition indicative en direct ----------

  const BUDGET_SPLIT = [
    ["🚗", "Transport estimé", 0.25],
    ["🏨", "Hébergement estimé", 0.35],
    ["🎟️", "Activités", 0.2],
    ["🍲", "Repas", 0.2],
  ];

  function updateBudgetPreview() {
    const budget = Number(budgetInput.value);
    if (!budget || budget < 10000) {
      budgetPreview.hidden = true;
      return;
    }
    budgetPreview.innerHTML = `
      <p class="trip-budget-preview-title">CAMTOUR AI estime pour ${fcfa(budget)} :</p>
      <ul>
        ${BUDGET_SPLIT.map(
          ([icon, label, share]) =>
            `<li><span>${icon} ${label}</span><strong>≈ ${fcfa(budget * share)}</strong></li>`
        ).join("")}
      </ul>
      <p class="trip-budget-preview-note">Répartition indicative : l'IA l'affinera selon votre itinéraire.</p>
    `;
    budgetPreview.hidden = false;
  }

  budgetInput.addEventListener("input", updateBudgetPreview);

  form.querySelectorAll("[data-budget]").forEach((btn) => {
    btn.addEventListener("click", () => {
      budgetInput.value = btn.dataset.budget;
      updateBudgetPreview();
    });
  });

  // ---------- Lieux choisis sur la carte ----------

  const placesEl = document.getElementById("trip-places");

  function renderSelectedPlaces() {
    if (!placesEl) return;
    const list = window.CamtourTrip.get();
    if (!list.length) {
      placesEl.hidden = true;
      placesEl.innerHTML = "";
      return;
    }
    placesEl.innerHTML = `
      <h3>📍 Lieux choisis sur la carte (${list.length})</h3>
      <p>CAMTOUR AI les intégrera à votre itinéraire.</p>
      <ul class="trip-places-list">
        ${list
          .map(
            (p) => `
          <li>${esc(p.icone)} ${esc(p.nom)}
            <button type="button" data-remove="${esc(p.id)}" aria-label="Retirer ${esc(p.nom)}">✕</button>
          </li>`
          )
          .join("")}
      </ul>
      <a href="carte.html">➕ Ajouter d'autres lieux depuis la carte</a>
    `;
    placesEl.hidden = false;
    placesEl.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => window.CamtourTrip.remove(btn.dataset.remove));
    });
  }

  renderSelectedPlaces();
  window.addEventListener("camtour-trip-changed", renderSelectedPlaces);

  // ---------- Demande à l'IA ----------

  function buildPreferencesMessage(formData) {
    const depart = formData.get("depart");
    const duree = formData.get("duree");
    const budget = formData.get("budget");
    const profil = formData.get("profil");
    const interets = formData.getAll("interets");
    const lieux = window.CamtourTrip.get();

    let message = `Je pars de ${depart} pour ${duree} jour(s), avec un budget total d'environ ${budget} FCFA. Je voyage : ${profil}. Ce que je veux découvrir : ${interets.length ? interets.join(", ") : "pas de préférence particulière"}.`;
    if (lieux.length) {
      message += ` Lieux que je veux absolument visiter : ${lieux.map((p) => `${p.nom} (${p.lieu})`).join(" ; ")}.`;
    }
    return message;
  }

  const POLL_INTERVAL_MS = 2500;
  const POLL_MAX_WAIT_MS = 5 * 60 * 1000;

  // Écrire un voyage prend plus de 10 s : le serveur travaille en tâche de fond,
  // et on vient demander régulièrement si le résultat est prêt.
  async function callTripPlan() {
    const jobId = crypto.randomUUID();

    const startRes = await fetch("/api/trip-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, messages: history }),
    });
    if (!startRes.ok) {
      throw new Error("Le planificateur est momentanément indisponible. Merci de réessayer dans un instant.");
    }

    let data;
    const startedAt = Date.now();
    while (true) {
      await wait(POLL_INTERVAL_MS);

      try {
        const res = await fetch(`/api/trip-plan-status?id=${encodeURIComponent(jobId)}`);
        data = await res.json();
        if (!res.ok) data = { status: "pending" };
      } catch (err) {
        data = { status: "pending" }; // coupure réseau passagère : on réessaie
      }

      if (data.status === "done") break;
      if (data.status === "error") {
        throw new Error(data.error || "Le planificateur est momentanément indisponible.");
      }
      if (Date.now() - startedAt > POLL_MAX_WAIT_MS) {
        throw new Error(
          "La création du voyage prend plus de temps que prévu. Merci de réessayer dans un instant."
        );
      }
    }

    let itinerary;
    try {
      itinerary = JSON.parse(data.reply);
      if (!Array.isArray(itinerary.jours) || itinerary.jours.length === 0) throw new Error("vide");
    } catch (err) {
      throw new Error(
        "L'assistant n'a pas pu construire un itinéraire structuré cette fois-ci. Merci de reformuler votre demande."
      );
    }

    history.push({ role: "assistant", content: data.reply });
    return itinerary;
  }

  // ---------- Animation pendant la génération ----------

  const LOADER_MESSAGES = [
    "Analyse de vos envies…",
    "Sélection des lieux à visiter…",
    "Choix des repas et des hébergements…",
    "Calcul de votre budget…",
    "Dernières touches à votre itinéraire…",
  ];
  let loaderTimer = null;

  function startLoader() {
    let i = 0;
    resultEl.hidden = false;
    resultEl.innerHTML = `
      <div class="trip-loader" role="status">
        <div class="trip-loader-icon" aria-hidden="true">🤖</div>
        <p class="trip-loader-title">CAMTOUR AI prépare votre expérience...</p>
        <p class="trip-loader-step" id="trip-loader-step">${LOADER_MESSAGES[0]}</p>
        <div class="trip-loader-bar" aria-hidden="true"><span></span></div>
      </div>
    `;
    resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
    const stepEl = document.getElementById("trip-loader-step");
    loaderTimer = setInterval(() => {
      i = (i + 1) % LOADER_MESSAGES.length;
      stepEl.textContent = LOADER_MESSAGES[i];
    }, 4000);
  }

  function stopLoader() {
    clearInterval(loaderTimer);
    loaderTimer = null;
  }

  // ---------- Affichage du voyage ----------

  function costLabel(value) {
    if (value === null || value === undefined || value === "") return null;
    const n = Number(value);
    if (Number.isFinite(n)) return n === 0 ? "Gratuit" : `≈ ${fcfa(n)}`;
    return String(value);
  }

  function renderActivity(a) {
    const chips = [
      ["📍", a.lieu],
      ["💰", costLabel(a.cout_fcfa)],
      ["⏱", a.duree],
      ["🚗", a.deplacement],
    ]
      .filter(([, text]) => text)
      .map(([icon, text]) => `<span class="trip-chip">${icon} ${esc(text)}</span>`)
      .join("");

    const notes = [
      ["🌱", a.impact],
      ["ℹ️", a.infos],
    ]
      .filter(([, text]) => text)
      .map(([icon, text]) => `<p class="trip-activity-note">${icon} ${esc(text)}</p>`)
      .join("");

    return `
      <li>
        <span class="trip-activity-time">${esc(a.heure)}</span>
        <span class="trip-activity-icon">${esc(a.icone || "📍")}</span>
        <span class="trip-activity-body">
          <strong>${esc(a.titre)}</strong>
          ${a.description ? `<span class="trip-activity-desc">${esc(a.description)}</span>` : ""}
          ${chips ? `<span class="trip-chips">${chips}</span>` : ""}
          ${notes}
        </span>
      </li>
    `;
  }

  function renderBudget(b) {
    const rows = [
      ["🚗", "Transport", Number(b.transport) || 0],
      ["🏨", "Hébergement", Number(b.hebergement) || 0],
      ["🎟️", "Activités", Number(b.activites) || 0],
      ["🍲", "Repas", Number(b.repas) || 0],
    ];
    // Le total est recalculé ici : plus fiable qu'une addition faite par l'IA.
    const total = rows.reduce((sum, [, , value]) => sum + value, 0);

    const over =
      tripMeta && tripMeta.budget && total > tripMeta.budget * 1.05
        ? `<p class="trip-budget-warning">⚠️ Cette estimation dépasse un peu votre budget de ${fcfa(tripMeta.budget)}. Demandez à CAMTOUR AI de l'adapter ci-dessous.</p>`
        : "";

    return `
      <div class="trip-budget">
        <h3>💰 Budget estimatif</h3>
        <ul>
          ${rows
            .map(
              ([icon, label, value]) => `
            <li>
              <span>${icon} ${label}</span>
              <strong>${fcfa(value)}</strong>
              <i class="trip-budget-bar" style="width:${total ? Math.round((value / total) * 100) : 0}%"></i>
            </li>`
            )
            .join("")}
          <li class="trip-budget-total"><span>Total estimé</span><strong>${fcfa(total)}</strong></li>
        </ul>
        ${over}
        <p class="trip-budget-note">${esc(b.note || "Estimation indicative, à confirmer sur place — pas de prix garanti.")}</p>
      </div>
    `;
  }

  const REFINE_SUGGESTIONS = [
    "Je n'ai finalement que 80 000 FCFA.",
    "Je voyage maintenant avec mes deux enfants.",
    "Je veux plus de gastronomie et moins de musées.",
    "Ajoute un jour de plus.",
  ];

  function renderItinerary(itinerary) {
    // L'IA renvoie un "resume" à jour (durée, budget, profil) après chaque modification.
    const r = itinerary.resume || {};
    tripMeta = {
      jours: Number(r.jours) || (tripMeta && tripMeta.jours) || itinerary.jours.length,
      budget: Number(r.budget) || (tripMeta && tripMeta.budget) || 0,
      profil: r.profil || (tripMeta && tripMeta.profil) || "",
    };
    const metaLine = [
      `${tripMeta.jours} jour${tripMeta.jours > 1 ? "s" : ""}`,
      tripMeta.budget ? fcfa(tripMeta.budget) : "",
      tripMeta.profil,
    ]
      .filter(Boolean)
      .join(" · ");

    const days = itinerary.jours
      .map(
        (jour, i) => `
        <div class="trip-day">
          <h3>Jour ${esc(jour.jour ?? i + 1)}${jour.titre ? ` — <span class="trip-day-title">${esc(jour.titre)}</span>` : ""}</h3>
          <ul class="trip-activities">
            ${(jour.activites || []).map(renderActivity).join("")}
          </ul>
        </div>
      `
      )
      .join("");

    const chat = chatLog.length
      ? `<div class="trip-chat">
          ${chatLog
            .map(
              (entry) => `
            <p class="trip-chat-user">💬 ${esc(entry.user)}</p>
            <p class="trip-chat-ai">🤖 ${esc(entry.ai)}</p>`
            )
            .join("")}
        </div>`
      : "";

    resultEl.innerHTML = `
      <div class="trip-hero">
        <p class="trip-ready">✅ Votre voyage est prêt.</p>
        <h2>🌍 Mon voyage au Cameroun</h2>
        <p class="trip-hero-meta">${esc(metaLine)}</p>
      </div>
      ${introMessage ? `<p class="trip-message">${esc(introMessage)}</p>` : ""}
      ${chat}
      <div class="trip-days">${days}</div>
      ${renderBudget(itinerary.budget_estime || {})}
      <div class="trip-refine">
        <h3>💬 Modifier mon voyage</h3>
        <p class="trip-refine-hint">Dites à CAMTOUR AI ce qui change : il réorganise tout l'itinéraire pour vous.</p>
        <div class="trip-suggestions">
          ${REFINE_SUGGESTIONS.map((s) => `<button type="button" class="trip-suggestion">${esc(s)}</button>`).join("")}
        </div>
        <form id="trip-refine-form" class="trip-refine-form">
          <label class="sr-only" for="trip-refine-input">Modifier mon voyage</label>
          <input id="trip-refine-input" type="text" placeholder="Ex. « Réduis le budget à 80 000 FCFA »" autocomplete="off" />
          <button type="submit" class="btn btn-gold">Envoyer</button>
        </form>
        <p id="trip-refine-status" class="trip-refine-status" aria-live="polite"></p>
      </div>
      <div class="trip-restart">
        <button type="button" id="trip-restart" class="btn btn-outline-dark">🔄 Créer un nouveau voyage</button>
      </div>
    `;
    resultEl.hidden = false;
    resultEl.scrollIntoView({ behavior: "smooth", block: "start" });

    const refineForm = document.getElementById("trip-refine-form");
    const refineInput = document.getElementById("trip-refine-input");
    const refineStatus = document.getElementById("trip-refine-status");
    const refineBtn = refineForm.querySelector("button");

    resultEl.querySelectorAll(".trip-suggestion").forEach((btn) => {
      btn.addEventListener("click", () => {
        refineInput.value = btn.textContent;
        refineInput.focus();
      });
    });

    document.getElementById("trip-restart").addEventListener("click", restart);

    refineForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const text = refineInput.value.trim();
      if (!text) return;

      history.push({ role: "user", content: text });
      refineInput.disabled = true;
      refineBtn.disabled = true;
      refineStatus.textContent = "🤖 CAMTOUR AI adapte votre voyage… cela peut prendre une minute.";

      try {
        const updated = await callTripPlan();
        chatLog.push({ user: text, ai: updated.message || "J'ai mis à jour votre voyage." });
        renderItinerary(updated);
      } catch (err) {
        history.pop(); // la demande n'a pas abouti : on ne la garde pas dans la conversation
        refineStatus.textContent = err.message;
        refineInput.disabled = false;
        refineBtn.disabled = false;
      }
    });
  }

  function restart() {
    form.reset();
    history.length = 0;
    chatLog = [];
    introMessage = "";
    tripMeta = null;
    resultEl.hidden = true;
    resultEl.innerHTML = "";
    form.hidden = false;
    currentStep = 0;
    showStep(0);
    updateBudgetPreview();
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ---------- Envoi du formulaire ----------

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // La touche Entrée ne doit pas envoyer le formulaire avant le dernier écran.
    if (currentStep < steps.length - 1) {
      nextBtn.click();
      return;
    }
    if (!validateStep(currentStep)) return;

    const formData = new FormData(form);
    tripMeta = {
      jours: Number(formData.get("duree")),
      budget: Number(formData.get("budget")),
      profil: formData.get("profil"),
    };
    history.length = 0;
    chatLog = [];
    introMessage = "";
    history.push({ role: "user", content: buildPreferencesMessage(formData) });

    form.hidden = true;
    startLoader();

    try {
      const itinerary = await callTripPlan();
      stopLoader();
      introMessage = itinerary.message || "";
      renderItinerary(itinerary);
    } catch (err) {
      stopLoader();
      resultEl.innerHTML = `
        <p class="trip-message trip-message--error">${esc(err.message)}</p>
        <div class="trip-restart">
          <button type="button" id="trip-retry" class="btn btn-gold">↩︎ Revenir au formulaire</button>
        </div>
      `;
      document.getElementById("trip-retry").addEventListener("click", () => {
        resultEl.hidden = true;
        form.hidden = false;
        form.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  });

  showStep(currentStep);
});
