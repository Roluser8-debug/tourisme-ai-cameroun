// Affiche les sites écotouristiques (data/sites.json) sous forme de cartes.

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("eco-sites-grid");
  if (!grid) return;

  fetch("data/sites.json")
    .then((res) => res.json())
    .then((sites) => {
      const render = () => (grid.innerHTML = sites.map(renderSiteCard).join(""));
      render();
      window.addEventListener("camtour-lang-changed", render);
    })
    .catch((err) => {
      console.error("Erreur de chargement des sites écotouristiques :", err);
      const t = window.CamtourI18n.t;
      grid.innerHTML = `<div class="placeholder-block"><strong>${t("eco_error")}</strong>${t("retry_later")}</div>`;
    });
});

function renderSiteCard(site) {
  const { tf, t } = window.CamtourI18n;
  const activites = (tf(site, "activites") || []).map((a) => `<li>${a}</li>`).join("");

  return `
    <div class="card">
      <div class="card-image">
        <img src="${site.image}" alt="${tf(site, "nom")}" loading="lazy" />
        <span class="card-region-badge">${tf(site, "region")}</span>
      </div>
      <div class="card-body">
        <h3>${site.icone} ${tf(site, "nom")}</h3>
        <p>${tf(site, "description")}</p>
        <ul class="card-list">${activites}</ul>
        <p class="card-meta"><strong>${t("eco_best_period")}</strong> ${tf(site, "meilleure_periode")}</p>
        <p class="card-eco-tip">🌱 ${tf(site, "conseil_durable")}</p>
      </div>
    </div>
  `;
}
