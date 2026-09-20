// Planificateur de voyage IA — formulaire en 5 étapes, parle à /api/trip-plan (fonction Netlify)

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("trip-form");
  if (!form) return;

  const steps = Array.from(form.querySelectorAll(".trip-step"));
  const prevBtn = document.getElementById("trip-prev");
  const nextBtn = document.getElementById("trip-next");
  const submitBtn = document.getElementById("trip-submit");
  const resultEl = document.getElementById("trip-result");

  let currentStep = 0;
  const history = [];

  function showStep(index) {
    steps.forEach((step, i) => {
      step.hidden = i !== index;
    });
    prevBtn.hidden = index === 0;
    nextBtn.hidden = index === steps.length - 1;
    submitBtn.hidden = index !== steps.length - 1;
  }

  function validateStep(index) {
    const step = steps[index];
    const requiredInputs = step.querySelectorAll("input[required]");
    for (const input of requiredInputs) {
      if (input.type === "radio") {
        const group = step.querySelectorAll(`input[name="${input.name}"]`);
        if (![...group].some((el) => el.checked)) return false;
      } else if (!input.value.trim()) {
        return false;
      }
    }
    return true;
  }

  nextBtn.addEventListener("click", () => {
    if (!validateStep(currentStep)) {
      steps[currentStep].querySelector("input")?.reportValidity?.();
      return;
    }
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

  function buildPreferencesMessage(formData) {
    const depart = formData.get("depart");
    const duree = formData.get("duree");
    const budget = formData.get("budget");
    const profil = formData.get("profil");
    const interets = formData.getAll("interets");

    return `Je pars de ${depart} pour ${duree} jour(s), avec un budget total d'environ ${budget} FCFA. Je voyage : ${profil}. Mes centres d'intérêt : ${interets.length ? interets.join(", ") : "pas de préférence particulière"}.`;
  }

  const POLL_INTERVAL_MS = 2500;
  const POLL_MAX_WAIT_MS = 3 * 60 * 1000;

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

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
    } catch (err) {
      throw new Error(
        "L'assistant n'a pas pu construire un itinéraire structuré cette fois-ci. Merci de reformuler votre demande."
      );
    }

    history.push({ role: "assistant", content: data.reply });
    return itinerary;
  }

  function renderItinerary(itinerary) {
    const jours = (itinerary.jours || [])
      .map(
        (jour) => `
        <div class="trip-day">
          <h3>Jour ${jour.jour}${jour.titre ? " — " + jour.titre : ""}</h3>
          <ul class="trip-activities">
            ${(jour.activites || [])
              .map(
                (a) => `
              <li>
                <span class="trip-activity-time">${a.heure || ""}</span>
                <span class="trip-activity-icon">${a.icone || "📍"}</span>
                <span class="trip-activity-body"><strong>${a.titre || ""}</strong><br>${a.description || ""}</span>
              </li>
            `
              )
              .join("")}
          </ul>
        </div>
      `
      )
      .join("");

    const b = itinerary.budget_estime || {};
    const budgetHtml = `
      <div class="trip-budget">
        <h3>💰 Budget estimatif</h3>
        <ul>
          <li><span>Transport</span><strong>${(b.transport || 0).toLocaleString("fr-FR")} FCFA</strong></li>
          <li><span>Activités</span><strong>${(b.activites || 0).toLocaleString("fr-FR")} FCFA</strong></li>
          <li><span>Repas</span><strong>${(b.repas || 0).toLocaleString("fr-FR")} FCFA</strong></li>
          <li><span>Hébergement</span><strong>${(b.hebergement || 0).toLocaleString("fr-FR")} FCFA</strong></li>
          <li class="trip-budget-total"><span>Total estimé</span><strong>${(b.total || 0).toLocaleString("fr-FR")} FCFA</strong></li>
        </ul>
        <p class="trip-budget-note">${b.note || "Estimation indicative, à confirmer sur place."}</p>
      </div>
    `;

    resultEl.innerHTML = `
      <p class="trip-message">${itinerary.message || ""}</p>
      <div class="trip-days">${jours}</div>
      ${budgetHtml}
      <form id="trip-refine-form" class="trip-refine-form">
        <label class="sr-only" for="trip-refine-input">Modifier mon voyage</label>
        <input id="trip-refine-input" type="text" placeholder="Ex. « Réduis le budget à 80 000 FCFA »" autocomplete="off" />
        <button type="submit" class="btn btn-gold">💬 Modifier mon voyage</button>
      </form>
      <p id="trip-refine-status" class="trip-refine-status" aria-live="polite"></p>
    `;
    resultEl.hidden = false;
    resultEl.scrollIntoView({ behavior: "smooth", block: "start" });

    const refineForm = document.getElementById("trip-refine-form");
    const refineInput = document.getElementById("trip-refine-input");
    const refineStatus = document.getElementById("trip-refine-status");

    refineForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const text = refineInput.value.trim();
      if (!text) return;

      history.push({ role: "user", content: text });
      refineInput.value = "";
      refineInput.disabled = true;
      refineStatus.textContent = "CAMTOUR AI recalcule votre voyage…";

      try {
        const updated = await callTripPlan();
        renderItinerary(updated);
      } catch (err) {
        refineStatus.textContent = err.message;
        refineInput.disabled = false;
      }
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validateStep(currentStep)) return;

    const formData = new FormData(form);
    const message = buildPreferencesMessage(formData);
    history.length = 0;
    history.push({ role: "user", content: message });

    submitBtn.disabled = true;
    submitBtn.textContent = "Création de votre voyage…";
    resultEl.hidden = false;
    resultEl.innerHTML = '<p class="trip-message">✨ CAMTOUR AI construit votre itinéraire, un instant…</p>';
    resultEl.scrollIntoView({ behavior: "smooth", block: "start" });

    try {
      const itinerary = await callTripPlan();
      renderItinerary(itinerary);
    } catch (err) {
      resultEl.innerHTML = `<p class="trip-message trip-message--error">${err.message}</p>`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "✨ Créer mon voyage";
    }
  });

  showStep(currentStep);
});
