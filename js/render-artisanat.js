// Affiche la "Route des artisans" à partir des spécialités déjà présentes dans data/cultural-areas.json

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("artisanat-grid");
  if (!grid) return;

  fetch("data/cultural-areas.json")
    .then((res) => res.json())
    .then((areas) => {
      const render = () => (grid.innerHTML = areas.map(renderArtisanatCard).join(""));
      render();
      window.addEventListener("camtour-lang-changed", render);
    })
    .catch((err) => {
      console.error("Erreur de chargement de l'artisanat :", err);
      const t = window.CamtourI18n.t;
      grid.innerHTML = `<div class="placeholder-block"><strong>${t("culture_artisanat_error")}</strong>${t("retry_later")}</div>`;
    });
});

function renderArtisanatCard(area) {
  const { tf } = window.CamtourI18n;
  return `
    <div class="card">
      <div class="card-body">
        <span class="card-region-badge">${tf(area, "region")}</span>
        <h3>🎨 ${tf(area, "nom")}</h3>
        <p>${tf(area, "artisanat")}</p>
      </div>
    </div>
  `;
}
