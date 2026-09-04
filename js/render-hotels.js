// Affiche l'annuaire d'hôtels (data/hotels.json) avec recherche par ville et par budget.

let allHotels = [];

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
      renderHotels(hotels);
    })
    .catch((err) => {
      console.error("Erreur de chargement de l'annuaire d'hôtels :", err);
      grid.innerHTML =
        '<div class="placeholder-block"><strong>Impossible de charger l\'annuaire d\'hôtels</strong>Merci de réessayer plus tard.</div>';
    });

  if (villeSelect) villeSelect.addEventListener("change", applyFilters);
  if (budgetSelect) budgetSelect.addEventListener("change", applyFilters);
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
  const ville = document.getElementById("hotels-filter-ville").value;
  const budget = document.getElementById("hotels-filter-budget").value;

  const filtered = allHotels.filter((h) => {
    return (!ville || h.ville === ville) && (!budget || h.budget === budget);
  });

  renderHotels(filtered);
}

function renderHotels(hotels) {
  const grid = document.getElementById("hotels-grid");
  if (!grid) return;

  if (hotels.length === 0) {
    grid.innerHTML =
      '<div class="placeholder-block"><strong>Aucun hôtel ne correspond à cette recherche</strong>Essayez une autre ville ou un autre budget.</div>';
    return;
  }

  grid.innerHTML = hotels.map(renderHotelCard).join("");
}

function renderHotelCard(hotel) {
  return `
    <div class="card">
      <div class="card-body">
        <span class="card-region-badge">${hotel.ville} · ${hotel.budget}</span>
        <h3>🏨 ${hotel.nom}</h3>
        <p>${hotel.description}</p>
        <p class="card-meta"><strong>Contact :</strong> ${hotel.contact}</p>
      </div>
    </div>
  `;
}
