// Planificateur de voyage IA — 4 écrans (envies, profil, trajet, budget), génération animée,
// itinéraire détaillé et modification du voyage par conversation.
// Parle à /api/trip-plan (lancement en tâche de fond) et /api/trip-plan-status (résultat prêt ?).
// Bilingue : tous les textes passent par window.CamtourI18n.t(), y compris le message envoyé à
// l'IA (buildPreferencesMessage) — important, car le serveur répond dans la langue de ce message.

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("trip-form");
  if (!form) return;

  const { t } = window.CamtourI18n;

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
  let lastItinerary = null; // dernier voyage complet affiché (remis en place si une modification échoue)

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
    return `${Math.round(Number(n) || 0).toLocaleString(window.CamtourI18n.getLang() === "en" ? "en-US" : "fr-FR")} FCFA`;
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
    progressLabel.textContent = t("plan_progress", { n: index + 1, total: steps.length });
  }
  window.addEventListener("camtour-lang-changed", () => {
    if (!form.hidden) showStep(currentStep); // le libellé "Étape X sur Y" doit rester à jour
  });

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
    ["plan_budget_transport", 0.25],
    ["plan_budget_hebergement", 0.35],
    ["plan_budget_activites", 0.2],
    ["plan_budget_repas", 0.2],
  ];

  function updateBudgetPreview() {
    const budget = Number(budgetInput.value);
    if (!budget || budget < 10000) {
      budgetPreview.hidden = true;
      return;
    }
    budgetPreview.innerHTML = `
      <p class="trip-budget-preview-title">${t("plan_budget_preview_title", { budget: fcfa(budget) })}</p>
      <ul>
        ${BUDGET_SPLIT.map(([key, share]) => `<li><span>${t(key)}</span><strong>≈ ${fcfa(budget * share)}</strong></li>`).join("")}
      </ul>
      <p class="trip-budget-preview-note">${t("plan_budget_preview_note")}</p>
    `;
    budgetPreview.hidden = false;
  }

  budgetInput.addEventListener("input", updateBudgetPreview);
  window.addEventListener("camtour-lang-changed", updateBudgetPreview);

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
      <h3>${t("plan_places_title", { n: list.length })}</h3>
      <p>${t("plan_places_hint")}</p>
      <ul class="trip-places-list">
        ${list
          .map(
            (p) => `
          <li>${esc(p.icone)} ${esc(p.nom)}
            <button type="button" data-remove="${esc(p.id)}" aria-label="${esc(t("remove_place_aria", { nom: p.nom }))}">✕</button>
          </li>`
          )
          .join("")}
      </ul>
      <a href="carte.html">${t("plan_places_add_more")}</a>
    `;
    placesEl.hidden = false;
    placesEl.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => window.CamtourTrip.remove(btn.dataset.remove));
    });
  }

  renderSelectedPlaces();
  window.addEventListener("camtour-trip-changed", renderSelectedPlaces);
  window.addEventListener("camtour-lang-changed", renderSelectedPlaces);

  // ---------- Demande à l'IA ----------

  // Important : ce message est envoyé comme "dernier message du visiteur". Le serveur répond dans
  // la même langue, donc il doit toujours être construit dans la langue actuelle de la page.
  function buildPreferencesMessage(formData) {
    const depart = formData.get("depart");
    const duree = formData.get("duree");
    const budget = formData.get("budget");
    const profilValue = formData.get("profil");
    const profilLabels = {
      "Seul(e)": "plan_profil_seul",
      "En couple": "plan_profil_couple",
      "En famille": "plan_profil_famille",
      "Entre amis": "plan_profil_amis",
      "Voyage professionnel": "plan_profil_pro",
    };
    const interetLabels = {
      Nature: "plan_interest_nature",
      Culture: "plan_interest_culture",
      Gastronomie: "plan_interest_gastronomie",
      Artisanat: "plan_interest_artisanat",
      Faune: "plan_interest_faune",
      Plages: "plan_interest_plages",
      Montagnes: "plan_interest_montagnes",
      Histoire: "plan_interest_histoire",
    };
    const profil = (t(profilLabels[profilValue]) || profilValue).replace(/^\S+\s/, ""); // retire l'emoji
    const interets = formData
      .getAll("interets")
      .map((v) => (t(interetLabels[v]) || v).replace(/^\S+\s/, ""));
    const lieux = window.CamtourTrip.get();

    let message = t("plan_ai_message", {
      depart,
      duree,
      budget,
      profil,
      interets: interets.length ? interets.join(", ") : t("plan_ai_no_preference"),
    });
    if (lieux.length) {
      message += t("plan_ai_places_suffix", { list: lieux.map((p) => `${p.nom} (${p.lieu})`).join(" ; ") });
    }
    return message;
  }

  const POLL_INTERVAL_MS = 1500;
  const POLL_MAX_WAIT_MS = 5 * 60 * 1000;

  // Écrire un voyage prend plus de 10 s : le serveur travaille en tâche de fond,
  // et on vient demander régulièrement où il en est. Dès que des journées sont écrites,
  // onPartial(itinérairePartiel) est appelé pour les afficher sans attendre la fin.
  async function callTripPlan(onPartial) {
    const jobId = crypto.randomUUID();

    const startRes = await fetch("/api/trip-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, messages: history, lang: window.CamtourI18n.getLang() }),
    });
    if (!startRes.ok) {
      throw new Error(t("plan_start_unavailable"));
    }

    let data;
    let shownDays = 0;
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
      if (data.status === "partial" && onPartial) {
        try {
          const partial = JSON.parse(data.partial);
          if (Array.isArray(partial.jours) && partial.jours.length > shownDays) {
            shownDays = partial.jours.length;
            onPartial(partial);
          }
        } catch (err) {
          /* aperçu illisible : on attend simplement la suite */
        }
      }
      if (data.status === "error") {
        throw new Error(data.error || t("plan_start_unavailable"));
      }
      if (Date.now() - startedAt > POLL_MAX_WAIT_MS) {
        throw new Error(t("plan_wait_too_long"));
      }
    }

    let itinerary;
    try {
      itinerary = JSON.parse(data.reply);
      if (!Array.isArray(itinerary.jours) || itinerary.jours.length === 0) throw new Error("vide");
    } catch (err) {
      throw new Error(t("plan_parse_error"));
    }

    history.push({ role: "assistant", content: data.reply });
    return itinerary;
  }

  // ---------- Animation pendant la génération ----------

  const LOADER_KEYS = ["plan_loader_1", "plan_loader_2", "plan_loader_3", "plan_loader_4", "plan_loader_5"];
  let loaderTimer = null;

  function startLoader() {
    let i = 0;
    resultEl.hidden = false;
    resultEl.innerHTML = `
      <div class="trip-loader" role="status">
        <div class="trip-loader-icon" aria-hidden="true">🤖</div>
        <p class="trip-loader-title">${t("plan_loader_title")}</p>
        <p class="trip-loader-step" id="trip-loader-step">${t(LOADER_KEYS[0])}</p>
        <div class="trip-loader-bar" aria-hidden="true"><span></span></div>
      </div>
    `;
    resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
    const stepEl = document.getElementById("trip-loader-step");
    loaderTimer = setInterval(() => {
      i = (i + 1) % LOADER_KEYS.length;
      stepEl.textContent = t(LOADER_KEYS[i]);
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
    if (Number.isFinite(n)) return n === 0 ? t("map_budget_free") : `≈ ${fcfa(n)}`;
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
      ["🚗", "plan_budget_transport_row", Number(b.transport) || 0],
      ["🏨", "plan_budget_hebergement_row", Number(b.hebergement) || 0],
      ["🎟️", "plan_budget_activites_row", Number(b.activites) || 0],
      ["🍲", "plan_budget_repas_row", Number(b.repas) || 0],
    ];
    // Le total est recalculé ici : plus fiable qu'une addition faite par l'IA.
    const total = rows.reduce((sum, [, , value]) => sum + value, 0);

    const over =
      tripMeta && tripMeta.budget && total > tripMeta.budget * 1.05
        ? `<p class="trip-budget-warning">${t("plan_budget_over", { budget: fcfa(tripMeta.budget) })}</p>`
        : "";

    return `
      <div class="trip-budget">
        <h3>${t("plan_budget_title")}</h3>
        <ul>
          ${rows
            .map(
              ([icon, key, value]) => `
            <li>
              <span>${icon} ${t(key)}</span>
              <strong>${fcfa(value)}</strong>
              <i class="trip-budget-bar" style="width:${total ? Math.round((value / total) * 100) : 0}%"></i>
            </li>`
            )
            .join("")}
          <li class="trip-budget-total"><span>${t("plan_budget_total")}</span><strong>${fcfa(total)}</strong></li>
        </ul>
        ${over}
        <p class="trip-budget-note">${esc(b.note || t("plan_budget_default_note"))}</p>
      </div>
    `;
  }

  const REFINE_SUGGESTION_KEYS = ["plan_suggestion_budget", "plan_suggestion_famille", "plan_suggestion_gastro", "plan_suggestion_days"];

  // pending = true : itinéraire encore en cours d'écriture (seules les premières journées sont là) ;
  // on affiche ces journées, une carte « jour suivant en préparation », et pas encore le budget ni
  // la zone de modification. scroll = true : remonter en haut du voyage (seulement au premier affichage,
  // pour ne pas déplacer la page pendant que le visiteur lit les journées déjà arrivées).
  function renderItinerary(itinerary, { pending = false, scroll = true } = {}) {
    // L'IA renvoie un "resume" à jour (durée, budget, profil) après chaque modification.
    const r = itinerary.resume || {};
    tripMeta = {
      jours: Number(r.jours) || (tripMeta && tripMeta.jours) || itinerary.jours.length,
      budget: Number(r.budget) || (tripMeta && tripMeta.budget) || 0,
      profil: r.profil || (tripMeta && tripMeta.profil) || "",
    };
    const dayWord = tripMeta.jours > 1 ? t("plan_days_plural") : t("plan_days");
    const metaLine = [`${tripMeta.jours} ${dayWord}`, tripMeta.budget ? fcfa(tripMeta.budget) : "", tripMeta.profil].filter(Boolean).join(" · ");

    const days = itinerary.jours
      .map(
        (jour, i) => `
        <div class="trip-day">
          <h3>${t("plan_day_label")} ${esc(jour.jour ?? i + 1)}${jour.titre ? ` — <span class="trip-day-title">${esc(jour.titre)}</span>` : ""}</h3>
          <ul class="trip-activities">
            ${(jour.activites || []).map(renderActivity).join("")}
          </ul>
        </div>
      `
      )
      .join("");

    // Carte d'attente : le jour suivant, ou le budget une fois toutes les journées écrites.
    const nextDay = itinerary.jours.length + 1;
    const pendingDay = pending
      ? `<div class="trip-day trip-day--pending" role="status">
          <span class="trip-day-spinner" aria-hidden="true">🤖</span>
          ${nextDay <= tripMeta.jours ? t("plan_day_pending", { n: nextDay }) : t("plan_loader_4")}
        </div>`
      : "";

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

    const intro = introMessage || (pending && !chatLog.length ? itinerary.message : "");

    if (pending) {
      resultEl.innerHTML = `
        <div class="trip-hero">
          <p class="trip-ready">${t("plan_partial_ready")}</p>
          <h2>${t("plan_hero_title")}</h2>
          <p class="trip-hero-meta">${esc(metaLine)}</p>
        </div>
        ${intro ? `<p class="trip-message">${esc(intro)}</p>` : ""}
        ${chat}
        <div class="trip-days trip-days--live">${days}${pendingDay}</div>
      `;
      resultEl.hidden = false;
      if (scroll) resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    resultEl.innerHTML = `
      <div class="trip-hero">
        <p class="trip-ready">${t("plan_ready")}</p>
        <h2>${t("plan_hero_title")}</h2>
        <p class="trip-hero-meta">${esc(metaLine)}</p>
      </div>
      ${intro ? `<p class="trip-message">${esc(intro)}</p>` : ""}
      ${chat}
      <div class="trip-days">${days}</div>
      ${renderBudget(itinerary.budget_estime || {})}
      <div class="trip-refine">
        <h3>${t("plan_refine_h3")}</h3>
        <p class="trip-refine-hint">${t("plan_refine_hint")}</p>
        <div class="trip-suggestions">
          ${REFINE_SUGGESTION_KEYS.map((key) => `<button type="button" class="trip-suggestion">${esc(t(key))}</button>`).join("")}
        </div>
        <form id="trip-refine-form" class="trip-refine-form">
          <label class="sr-only" for="trip-refine-input">${t("plan_refine_h3")}</label>
          <input id="trip-refine-input" type="text" placeholder="${esc(t("plan_refine_placeholder"))}" autocomplete="off" />
          <button type="submit" class="btn btn-gold">${t("plan_refine_send")}</button>
        </form>
        <p id="trip-refine-status" class="trip-refine-status" aria-live="polite"></p>
      </div>
      <div class="trip-restart">
        <button type="button" id="trip-restart" class="btn btn-outline-dark">${t("plan_restart")}</button>
      </div>
    `;
    resultEl.hidden = false;
    if (scroll) resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
    lastItinerary = itinerary;

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
      refineStatus.textContent = t("plan_refine_loading");

      // Pendant la modification, le nouvel itinéraire s'affiche lui aussi jour par jour.
      const entry = { user: text, ai: t("plan_refine_loading") };
      const previous = lastItinerary;
      let showedPartial = false;
      try {
        const updated = await callTripPlan((partial) => {
          if (!showedPartial) chatLog.push(entry);
          if (partial.message) entry.ai = partial.message;
          renderItinerary(partial, { pending: true, scroll: false });
          showedPartial = true;
        });
        entry.ai = updated.message || t("plan_ready");
        if (!showedPartial) chatLog.push(entry);
        renderItinerary(updated, { scroll: false });
      } catch (err) {
        history.pop(); // la demande n'a pas abouti : on ne la garde pas dans la conversation
        if (showedPartial) {
          // L'ancien voyage avait été remplacé par l'aperçu : on le remet.
          chatLog.pop();
          renderItinerary(previous, { scroll: false });
        }
        const status = document.getElementById("trip-refine-status");
        status.textContent = err.message;
        if (!showedPartial) {
          refineInput.disabled = false;
          refineBtn.disabled = false;
        }
      }
    });
  }

  function restart() {
    form.reset();
    history.length = 0;
    chatLog = [];
    introMessage = "";
    tripMeta = null;
    lastItinerary = null;
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

    let showedPartial = false;
    try {
      // Dès que le jour 1 est écrit, l'animation laisse place au voyage, qui se complète jour par jour.
      const itinerary = await callTripPlan((partial) => {
        stopLoader();
        renderItinerary(partial, { pending: true, scroll: !showedPartial });
        showedPartial = true;
      });
      stopLoader();
      introMessage = itinerary.message || "";
      renderItinerary(itinerary, { scroll: !showedPartial });
    } catch (err) {
      stopLoader();
      resultEl.innerHTML = `
        <p class="trip-message trip-message--error">${esc(err.message)}</p>
        <div class="trip-restart">
          <button type="button" id="trip-retry" class="btn btn-gold">${t("plan_retry")}</button>
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
