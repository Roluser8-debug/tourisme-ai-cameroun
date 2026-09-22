// Affiche les 4 aires culturelles (data/cultural-areas.json) sous forme de cartes.

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("cultural-areas-grid");
  if (!grid) return;

  fetch("data/cultural-areas.json")
    .then((res) => res.json())
    .then((areas) => {
      const render = () => (grid.innerHTML = areas.map(renderAreaCard).join(""));
      render();
      window.addEventListener("camtour-lang-changed", render);
    })
    .catch((err) => {
      console.error("Erreur de chargement des aires culturelles :", err);
      const t = window.CamtourI18n.t;
      grid.innerHTML = `<div class="placeholder-block"><strong>${t("culture_areas_error")}</strong>${t("retry_later")}</div>`;
    });
});

function renderAreaCard(area) {
  const { tf, t } = window.CamtourI18n;
  const traditions = (tf(area, "traditions") || []).map((tr) => `<li>${tr}</li>`).join("");

  return `
    <div class="card">
      <div class="card-image">
        <img src="${area.image}" alt="${tf(area, "nom")}" loading="lazy" />
        <span class="card-region-badge">${tf(area, "region")}</span>
      </div>
      <div class="card-body">
        <h3>${area.icone} ${tf(area, "nom")}</h3>
        <p>${tf(area, "description")}</p>
        <ul class="card-list">${traditions}</ul>
        <p class="card-meta"><strong>${t("culture_artisanat_label")}</strong> ${tf(area, "artisanat")}</p>
        <p class="card-meta"><strong>${t("culture_evenement_label")}</strong> ${tf(area, "evenement")}</p>
      </div>
    </div>
  `;
}
