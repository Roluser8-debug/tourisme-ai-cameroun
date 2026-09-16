// Affiche la "Route des artisans" à partir des spécialités déjà présentes dans data/cultural-areas.json

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("artisanat-grid");
  if (!grid) return;

  fetch("data/cultural-areas.json")
    .then((res) => res.json())
    .then((areas) => {
      grid.innerHTML = areas.map(renderArtisanatCard).join("");
    })
    .catch((err) => {
      console.error("Erreur de chargement de l'artisanat :", err);
      grid.innerHTML =
        '<div class="placeholder-block"><strong>Impossible de charger l\'artisanat</strong>Merci de réessayer plus tard.</div>';
    });
});

function renderArtisanatCard(area) {
  return `
    <div class="card">
      <div class="card-body">
        <span class="card-region-badge">${area.region}</span>
        <h3>🎨 ${area.nom}</h3>
        <p>${area.artisanat}</p>
      </div>
    </div>
  `;
}
