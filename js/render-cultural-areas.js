// Affiche les 4 aires culturelles (data/cultural-areas.json) sous forme de cartes.

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("cultural-areas-grid");
  if (!grid) return;

  fetch("data/cultural-areas.json")
    .then((res) => res.json())
    .then((areas) => {
      grid.innerHTML = areas.map(renderAreaCard).join("");
    })
    .catch((err) => {
      console.error("Erreur de chargement des aires culturelles :", err);
      grid.innerHTML =
        '<div class="placeholder-block"><strong>Impossible de charger les aires culturelles</strong>Merci de réessayer plus tard.</div>';
    });
});

function renderAreaCard(area) {
  const traditions = area.traditions.map((t) => `<li>${t}</li>`).join("");

  return `
    <div class="card">
      <div class="card-image">
        <img src="${area.image}" alt="${area.nom}" loading="lazy" />
      </div>
      <div class="card-body">
        <span class="card-region-badge">${area.region}</span>
        <h3>${area.icone} ${area.nom}</h3>
        <p>${area.description}</p>
        <ul class="card-list">${traditions}</ul>
        <p class="card-meta"><strong>Artisanat :</strong> ${area.artisanat}</p>
        <p class="card-meta"><strong>Événement :</strong> ${area.evenement}</p>
      </div>
    </div>
  `;
}
