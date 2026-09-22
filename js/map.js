// Carte intelligente (Leaflet.js) : 6 catégories de lieux, fiche détaillée au clic,
// « Explorer autour de moi » (position ou ville choisie) et « Ajouter à mon voyage ».
// Les lieux ajoutés sont mémorisés par window.CamtourTrip (voir main.js) et repris par la page Mon voyage.
// Bilingue : chaque lieu garde sa source (raw) et son texte est reconstruit dans la langue courante
// par describePlace(), plutôt que d'être figé au chargement.

document.addEventListener("DOMContentLoaded", () => {
  const mapEl = document.getElementById("carte-cameroun");
  if (!mapEl || typeof L === "undefined") return;

  const { t, tf } = window.CamtourI18n;

  const detailEl = document.getElementById("map-detail");
  const nearbyEl = document.getElementById("map-nearby");
  const trayEl = document.getElementById("map-tray");
  const locateBtn = document.getElementById("map-locate");
  const citySelect = document.getElementById("map-city");
  const statusEl = document.getElementById("map-locate-status");

  const map = L.map(mapEl).setView([5.7, 12.4], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  // "decalage" (en pixels) écarte les pastilles de catégories différentes qui partagent le même point
  // (par exemple culture, gastronomie et artisanat d'une même aire culturelle).
  const CATEGORIES = {
    nature: { key: "cat_nature", icone: "🌿", decalage: [0, 0] },
    culture: { key: "cat_culture", icone: "🏛️", decalage: [-30, -16] },
    gastronomie: { key: "cat_gastronomie", icone: "🍲", decalage: [0, -32] },
    artisanat: { key: "cat_artisanat", icone: "🎨", decalage: [30, -16] },
    evenements: { key: "cat_evenements", icone: "🎉", decalage: [-20, 26] },
    hotels: { key: "cat_hotels", icone: "🏨", decalage: [20, 26] },
  };
  const BUDGET_KEY = { "Économique": "budget_economique", "Milieu de gamme": "budget_milieu", "Haut de gamme": "budget_haut" };
  const budgetLabel = (b) => (BUDGET_KEY[b] ? t(BUDGET_KEY[b]) : b);

  const layers = {};
  Object.keys(CATEGORIES).forEach((cat) => {
    layers[cat] = L.layerGroup().addTo(map);
  });
  const activeCats = new Set(Object.keys(CATEGORIES));

  const places = []; // { id, cat, lat, lng, icone, kind, raw, extra }
  const markers = {};
  let selectedId = null;
  let origin = null; // { lat, lng, label, marker, fromGps }

  // ---------- Outils ----------

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[c]);
  }

  function norm(text) {
    return String(text)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace("soudano", "sudano");
  }

  // Distance à vol d'oiseau en km (formule de haversine)
  function distanceKm(lat1, lng1, lat2, lng2) {
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLng = (lng2 - lng1) * rad;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(a));
  }

  function withDistance(place) {
    return origin ? distanceKm(origin.lat, origin.lng, place.lat, place.lng) : null;
  }

  // ---------- Construction des lieux à partir des données du site ----------

  function addPlace(place) {
    if (typeof place.lat !== "number" || typeof place.lng !== "number") return;
    places.push(place);
  }

  function buildPlaces({ sites, areas, villes, hotels, dishes, events }) {
    sites.forEach((site) =>
      addPlace({ id: `site-${site.id}`, cat: "nature", lat: site.lat, lng: site.lng, icone: site.icone || "🌿", kind: "site", raw: site })
    );

    areas.forEach((area) => {
      addPlace({ id: `culture-${area.id}`, cat: "culture", lat: area.lat, lng: area.lng, icone: area.icone || "🏛️", kind: "area-culture", raw: area });

      const areaDishes = dishes.filter((d) => norm(d.region).includes(norm(area.nom)));
      if (areaDishes.length) {
        addPlace({
          id: `gastronomie-${area.id}`,
          cat: "gastronomie",
          lat: area.lat,
          lng: area.lng,
          icone: "🍲",
          kind: "area-food",
          raw: area,
          extra: { dishes: areaDishes },
        });
      }

      if (area.artisanat) {
        addPlace({ id: `artisanat-${area.id}`, cat: "artisanat", lat: area.lat, lng: area.lng, icone: "🎨", kind: "area-craft", raw: area });
      }
    });

    events.forEach((ev) => addPlace({ id: `event-${ev.id}`, cat: "evenements", lat: ev.lat, lng: ev.lng, icone: "🎉", kind: "event", raw: ev }));

    const hotelsByVille = {};
    hotels.forEach((h) => {
      (hotelsByVille[h.ville] = hotelsByVille[h.ville] || []).push(h);
    });

    villes.forEach((v) => {
      const list = hotelsByVille[v.ville];
      if (!list) return;
      addPlace({
        id: `hotels-${v.ville}`,
        cat: "hotels",
        lat: v.lat,
        lng: v.lng,
        icone: "🏨",
        kind: "hotel-group",
        raw: v,
        extra: { hotels: list },
      });
    });
  }

  // ---------- Texte affiché, reconstruit dans la langue courante ----------

  function describePlace(place) {
    const { raw, extra, kind } = place;
    switch (kind) {
      case "site":
        return {
          nom: tf(raw, "nom"),
          lieu: tf(raw, "region"),
          resume: tf(raw, "description"),
          lignes: [
            [place.icone, (tf(raw, "activites") || []).length ? `${t("map_activites_label")} ${tf(raw, "activites").join(", ")}` : null],
            ["🗓️", tf(raw, "meilleure_periode") ? `${t("map_periode_label")} ${tf(raw, "meilleure_periode")}` : null],
            ["🌱", tf(raw, "conseil_durable")],
          ],
          lien: { href: "eco-tourisme.html", label: t("map_link_site") },
        };
      case "area-culture":
        return {
          nom: t("map_area_nom", { nom: tf(raw, "nom") }),
          lieu: tf(raw, "region"),
          resume: tf(raw, "description"),
          lignes: [["🎭", (tf(raw, "traditions") || []).length ? `${t("map_traditions_label")} ${tf(raw, "traditions").join(", ")}` : null]],
          lien: { href: "culture-gastronomie.html", label: t("map_link_site") },
        };
      case "area-food": {
        const dishes = extra.dishes;
        return {
          nom: t("map_cuisine_nom", { nom: tf(raw, "nom") }),
          lieu: tf(raw, "region"),
          resume: t("map_dishes_intro", { n: dishes.length, list: dishes.map((d) => d.nom).join(", ") }),
          lignes: dishes.map((d) => ["🍲", `${d.nom} — ${tf(d, "description")}`]),
          lien: { href: "culture-gastronomie.html", label: t("map_link_dishes") },
        };
      }
      case "area-craft":
        return {
          nom: t("map_artisanat_nom", { nom: tf(raw, "nom") }),
          lieu: tf(raw, "region"),
          resume: tf(raw, "artisanat"),
          lignes: [],
          lien: { href: "culture-gastronomie.html", label: t("map_link_crafts") },
        };
      case "event":
        return {
          nom: raw.nom,
          lieu: `${raw.ville} · ${tf(raw, "aire")}`,
          resume: tf(raw, "description"),
          lignes: [
            ["📅", [tf(raw, "frequence"), tf(raw, "periode")].filter(Boolean).join(" — ")],
            ["⚠️", raw.approximatif ? t("map_event_approx") : null],
            ["ℹ️", t("map_event_dates")],
          ],
          lien: { href: "culture-gastronomie.html", label: t("map_link_culture") },
        };
      case "hotel-group": {
        const list = extra.hotels;
        const budgetOrder = ["Économique", "Milieu de gamme", "Haut de gamme"];
        const budgets = budgetOrder.filter((b) => list.some((h) => h.budget === b)).map(budgetLabel);
        const n = list.length;
        return {
          nom: t("map_hotels_nom", { ville: raw.ville }),
          lieu: raw.ville,
          resume: n > 1 ? t("map_hotels_count_plural", { n }) : t("map_hotels_count", { n }),
          lignes: list.slice(0, 4).map((h) => ["🏨", `${h.nom} (${budgetLabel(h.budget)})`]),
          budget: budgets.length ? t("map_hebergement_label", { list: budgets.join(", ") }) : null,
          lien: { href: `hotels.html?ville=${encodeURIComponent(raw.ville)}`, label: t("map_link_hotels") },
        };
      }
      default:
        return { nom: "", lieu: "", resume: "", lignes: [], lien: null };
    }
  }

  // ---------- Marqueurs ----------

  function makeIcon(place, selected) {
    const [dx, dy] = CATEGORIES[place.cat].decalage;
    return L.divIcon({
      html: `<span class="map-marker${selected ? " is-selected" : ""}">${place.icone}</span>`,
      className: "map-marker-wrapper",
      iconSize: [32, 32],
      iconAnchor: [16 - dx, 16 - dy],
    });
  }

  function addMarkers() {
    places.forEach((place) => {
      const nom = describePlace(place).nom;
      const marker = L.marker([place.lat, place.lng], { icon: makeIcon(place, false), title: nom })
        .bindTooltip(nom, { direction: "top", offset: [0, -14] })
        .on("click", () => showPlace(place))
        .addTo(layers[place.cat]);
      markers[place.id] = marker;
    });
  }

  function refreshMarkerTooltips() {
    places.forEach((place) => {
      markers[place.id].setTooltipContent(describePlace(place).nom);
    });
  }

  // ---------- Fiche détaillée ----------

  function showPlace(place, { fly = false } = {}) {
    if (selectedId && markers[selectedId]) {
      const previous = places.find((p) => p.id === selectedId);
      markers[selectedId].setIcon(makeIcon(previous, false));
    }
    selectedId = place.id;
    markers[place.id].setIcon(makeIcon(place, true));
    if (fly) map.flyTo([place.lat, place.lng], Math.max(map.getZoom(), 9));

    const cat = CATEGORIES[place.cat];
    const info = describePlace(place);
    const d = withDistance(place);
    const added = window.CamtourTrip.has(place.id);

    detailEl.innerHTML = `
      <span class="map-badge">${cat.icone} ${t(cat.key)}</span>
      <h3>${esc(place.icone)} ${esc(info.nom)}</h3>
      <p class="map-detail-place">📍 ${esc(info.lieu)}${d !== null ? t("map_distance", { km: Math.round(d) }) : ""}</p>
      ${info.resume ? `<p class="map-detail-resume">${esc(info.resume)}</p>` : ""}
      ${
        info.lignes.filter(([, text]) => text).length
          ? `<ul class="map-detail-lines">${info.lignes
              .filter(([, text]) => text)
              .map(([icon, text]) => `<li><span>${icon}</span> ${esc(text)}</li>`)
              .join("")}</ul>`
          : ""
      }
      <p class="map-detail-budget">💰 ${info.budget ? esc(info.budget) : t("map_budget_est")}</p>
      <div class="map-detail-actions">
        <button type="button" id="map-add" class="btn ${added ? "btn-outline-dark" : "btn-gold"}">${added ? t("map_added") : t("map_add")}</button>
        ${info.lien ? `<a class="btn btn-outline-dark" href="${esc(info.lien.href)}">${esc(info.lien.label)}</a>` : ""}
      </div>
    `;

    document.getElementById("map-add").addEventListener("click", () => {
      if (window.CamtourTrip.has(place.id)) {
        window.CamtourTrip.remove(place.id);
      } else {
        window.CamtourTrip.add({ id: place.id, cat: place.cat, nom: info.nom, icone: place.icone, lieu: info.lieu });
      }
    });

    if (window.matchMedia("(max-width: 900px)").matches) {
      detailEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  // ---------- Explorer autour de moi ----------

  function refreshNearby() {
    if (!origin) {
      nearbyEl.hidden = true;
      return;
    }
    const nearest = places
      .filter((p) => activeCats.has(p.cat))
      .map((p) => ({ place: p, d: withDistance(p) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 8);

    if (!nearest.length) {
      nearbyEl.innerHTML = `<p class="map-panel-hint">${t("map_no_active_filter")}</p>`;
      nearbyEl.hidden = false;
      return nearest;
    }

    nearbyEl.innerHTML = `
      <h3>${t("map_nearby_title", { label: esc(origin.label) })}</h3>
      <ol class="map-nearby-list">
        ${nearest
          .map(({ place, d }) => {
            const info = describePlace(place);
            return `
          <li><button type="button" data-id="${esc(place.id)}">
            <span class="map-nearby-icon">${esc(place.icone)}</span>
            <span class="map-nearby-name">${esc(info.nom)}<small>${t(CATEGORIES[place.cat].key)} · ${esc(info.lieu)}</small></span>
            <span class="map-nearby-dist">${Math.round(d)} km</span>
          </button></li>`;
          })
          .join("")}
      </ol>
    `;
    nearbyEl.hidden = false;
    nearbyEl.querySelectorAll("button[data-id]").forEach((btn) => {
      btn.addEventListener("click", () => showPlace(places.find((p) => p.id === btn.dataset.id), { fly: true }));
    });
    return nearest;
  }

  function setOrigin(lat, lng, label, { fromGps = false } = {}) {
    if (origin && origin.marker) map.removeLayer(origin.marker);
    origin = { lat, lng, label, fromGps };
    origin.marker = L.circleMarker([lat, lng], {
      radius: 9,
      color: "#fff",
      weight: 3,
      fillColor: "#2f6b45",
      fillOpacity: 1,
    })
      .bindTooltip(fromGps ? t("map_here_tooltip") : label)
      .addTo(map);

    const nearest = refreshNearby();
    if (!nearest || !nearest.length) return;

    if (nearest[0].d > 300) {
      // Loin du Cameroun : on montre les lieux les plus proches plutôt que la position
      map.fitBounds(L.latLngBounds(nearest.map(({ place }) => [place.lat, place.lng])), { padding: [40, 40] });
      statusEl.textContent = fromGps ? t("map_locate_far", { km: Math.round(nearest[0].d) }) : "";
    } else {
      map.flyTo([lat, lng], 9);
      statusEl.textContent = t("map_locate_nearby", { n: nearest.length, label });
    }
  }

  locateBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      statusEl.textContent = t("map_locate_no_geoloc");
      return;
    }
    statusEl.textContent = t("map_locate_loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        citySelect.value = "";
        setOrigin(pos.coords.latitude, pos.coords.longitude, t("map_here"), { fromGps: true });
      },
      () => {
        statusEl.textContent = t("map_locate_denied");
      },
      { timeout: 10000 }
    );
  });

  // ---------- Mon voyage (lieux ajoutés) ----------

  function renderTray() {
    const list = window.CamtourTrip.get();
    if (!list.length) {
      trayEl.hidden = true;
      trayEl.innerHTML = "";
      return;
    }
    trayEl.innerHTML = `
      <h3>${list.length > 1 ? t("map_tray_title_plural", { n: list.length }) : t("map_tray_title", { n: list.length })}</h3>
      <ul class="map-tray-list">
        ${list
          .map(
            (p) => `
          <li>${esc(p.icone)} ${esc(p.nom)}
            <button type="button" data-remove="${esc(p.id)}" aria-label="${esc(t("remove_place_aria", { nom: p.nom }))}">✕</button>
          </li>`
          )
          .join("")}
      </ul>
      <div class="map-tray-actions">
        <a class="btn btn-gold" href="planificateur.html">${t("map_tray_cta")}</a>
        <button type="button" id="map-tray-clear" class="btn btn-outline-dark">${t("map_tray_clear")}</button>
      </div>
    `;
    trayEl.hidden = false;
    trayEl.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => window.CamtourTrip.remove(btn.dataset.remove));
    });
    document.getElementById("map-tray-clear").addEventListener("click", () => window.CamtourTrip.clear());
  }

  window.addEventListener("camtour-trip-changed", () => {
    renderTray();
    const selected = places.find((p) => p.id === selectedId);
    if (selected) showPlace(selected); // remet à jour le bouton Ajouter / Retirer
  });

  window.addEventListener("camtour-lang-changed", () => {
    refreshMarkerTooltips();
    renderTray();
    refreshNearby();
    const selected = places.find((p) => p.id === selectedId);
    if (selected) showPlace(selected);
  });

  // ---------- Filtres ----------

  document.querySelectorAll(".map-filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.filter;
      const isActive = btn.classList.toggle("active");
      btn.setAttribute("aria-pressed", String(isActive));
      if (isActive) {
        activeCats.add(key);
        map.addLayer(layers[key]);
      } else {
        activeCats.delete(key);
        map.removeLayer(layers[key]);
      }
      refreshNearby();
    });
    btn.setAttribute("aria-pressed", "true");
  });

  // ---------- Chargement des données ----------

  Promise.all([
    fetch("data/sites.json").then((r) => r.json()),
    fetch("data/cultural-areas.json").then((r) => r.json()),
    fetch("data/villes.json").then((r) => r.json()),
    fetch("data/hotels.json").then((r) => r.json()),
    fetch("data/dishes.json").then((r) => r.json()),
    fetch("data/events.json").then((r) => r.json()),
  ])
    .then(([sites, areas, villes, hotels, dishes, events]) => {
      buildPlaces({ sites, areas, villes, hotels, dishes, events });
      addMarkers();
      renderTray();

      villes.forEach((v) => {
        const option = document.createElement("option");
        option.value = v.ville;
        option.textContent = v.ville;
        citySelect.appendChild(option);
      });
      citySelect.addEventListener("change", () => {
        const ville = villes.find((v) => v.ville === citySelect.value);
        if (ville) setOrigin(ville.lat, ville.lng, ville.ville);
      });
    })
    .catch((err) => {
      console.error("Erreur de chargement des données de la carte :", err);
      detailEl.innerHTML = `<p class="map-panel-hint">${t("map_load_error")}</p>`;
    });
});
