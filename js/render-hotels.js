// Affiche l'annuaire d'hôtels (data/hotels.json) avec recherche par ville et par budget.

let allHotels = [];

// Les valeurs de "budget" restent en français dans les données (utilisées comme clés de filtre) ;
// seul leur affichage est traduit, via cette petite table.
const BUDGET_KEY = { "Économique": "budget_economique", "Milieu de gamme": "budget_milieu", "Haut de gamme": "budget_haut" };
function budgetLabel(budget) {
  const key = BUDGET_KEY[budget];
  return key ? window.CamtourI18n.t(key) : budget;
}

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("hotels-grid");
  if (!grid) return;

  const villeSelect = document.getElementById("hotels-filter-ville");
  const budgetSelect = document.getElementById("hotels-filter-budget");

  fetch("data/hotels.json")
    .then((res) => res.json())
    .then((hotels) => {
      allHotels = hotels;
      fillFilterOptions(villeSelect, hotels.map((h) => h.ville));

      const villeParam = new URLSearchParams(window.location.search).get("ville");
      if (villeParam && villeSelect) {
        villeSelect.value = villeParam;
      }

      applyFilters();
    })
    .catch((err) => {
      console.error("Erreur de chargement de l'annuaire d'hôtels :", err);
      const t = window.CamtourI18n.t;
      grid.innerHTML = `<div class="placeholder-block"><strong>${t("hotels_error")}</strong>${t("retry_later")}</div>`;
    });

  if (villeSelect) villeSelect.addEventListener("change", applyFilters);
  if (budgetSelect) budgetSelect.addEventListener("change", applyFilters);
  window.addEventListener("camtour-lang-changed", applyFilters);
});

function fillFilterOptions(select, values) {
  if (!select) return;
  const uniqueValues = [...new Set(values)].sort();
  uniqueValues.forEach((v) => {
    const option = document.createElement("option");
    option.value = v;
    option.textContent = v;
    select.appendChild(option);
  });
}

function applyFilters() {
  const villeSelect = document.getElementById("hotels-filter-ville");
  const budgetSelect = document.getElementById("hotels-filter-budget");
  if (!villeSelect || !budgetSelect) return;
  const ville = villeSelect.value;
  const budget = budgetSelect.value;

  const filtered = allHotels.filter((h) => {
    return (!ville || h.ville === ville) && (!budget || h.budget === budget);
  });

  renderHotels(filtered);
}

function renderHotels(hotels) {
  const grid = document.getElementById("hotels-grid");
  if (!grid) return;
  const t = window.CamtourI18n.t;

  if (hotels.length === 0) {
    grid.innerHTML = `<div class="placeholder-block"><strong>${t("hotels_empty")}</strong>${t("hotels_empty_hint")}</div>`;
    return;
  }

  grid.innerHTML = hotels.map(renderHotelCard).join("");
}

function renderHotelCard(hotel) {
  const { tf, t } = window.CamtourI18n;
  return `
    <div class="card">
      <div class="card-body">
        <span class="card-region-badge">${hotel.ville} · ${budgetLabel(hotel.budget)}</span>
        <h3>🏨 ${hotel.nom}</h3>
        <p>${tf(hotel, "description")}</p>
        <p class="card-meta"><strong>${t("hotels_contact")}</strong> ${hotel.contact}</p>
      </div>
    </div>
  `;
}
