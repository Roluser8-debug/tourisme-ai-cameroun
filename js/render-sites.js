// Affiche les sites écotouristiques (data/sites.json) sous forme de cartes.

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("eco-sites-grid");
  if (!grid) return;

  fetch("data/sites.json")
    .then((res) => res.json())
    .then((sites) => {
      grid.innerHTML = sites.map(renderSiteCard).join("");
    })
    .catch((err) => {
      console.error("Erreur de chargement des sites écotouristiques :", err);
      grid.innerHTML =
        '<div class="placeholder-block"><strong>Impossible de charger les sites</strong>Merci de réessayer plus tard.</div>';
    });
});

function renderSiteCard(site) {
  const activites = site.activites
    .map((a) => `<li>${a}</li>`)
    .join("");

  return `
    <div class="card">
      <div class="card-image">
        <img src="${site.image}" alt="${site.nom}" loading="lazy" />
      </div>
      <div class="card-body">
        <span class="card-region-badge">${site.region}</span>
        <h3>${site.icone} ${site.nom}</h3>
        <p>${site.description}</p>
        <ul class="card-list">${activites}</ul>
        <p class="card-meta"><strong>Meilleure période :</strong> ${site.meilleure_periode}</p>
        <p class="card-eco-tip">🌱 ${site.conseil_durable}</p>
      </div>
    </div>
  `;
}
