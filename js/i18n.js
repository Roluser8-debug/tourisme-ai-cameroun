// Système bilingue FR/EN. Charger CE fichier en premier sur chaque page (avant main.js et les autres scripts).
//
// - Textes fixes des pages (menus, titres, boutons...) : dictionnaire ci-dessous + attributs data-i18n-*.
// - Contenu des fiches (data/*.json) : chaque champ traduit a un champ "<nom>_en" à côté du champ français ;
//   window.CamtourI18n.tf(objet, "champ") renvoie la bonne version selon la langue courante.
// - Les scripts qui construisent eux-mêmes du texte (carte, planificateur, chatbot) utilisent
//   window.CamtourI18n.t("cle") et se souscrivent à l'évènement "camtour-lang-changed" pour se redessiner.

window.CamtourI18n = (() => {
  const KEY = "camtour-lang";

  const DICT = {
    // ---- Navigation & structure partagée ----
    skip_link: { fr: "Aller au contenu principal", en: "Skip to main content" },
    nav_toggle_aria: { fr: "Ouvrir le menu", en: "Open menu" },
    nav_accueil: { fr: "Accueil", en: "Home" },
    nav_planificateur: { fr: "🧳 Mon voyage", en: "🧳 My Trip" },
    nav_eco: { fr: "Écotourisme", en: "Ecotourism" },
    nav_culture: { fr: "Culture &amp; Gastronomie", en: "Culture &amp; Food" },
    nav_hotels: { fr: "Hôtels", en: "Hotels" },
    nav_carte: { fr: "📍 Carte", en: "📍 Map" },
    nav_apropos: { fr: "À propos", en: "About" },
    nav_assistant: { fr: "💬 Assistant IA", en: "💬 AI Assistant" },
    lang_switch_to: { fr: "EN", en: "FR" },
    lang_switch_aria: { fr: "Switch to English", en: "Passer en français" },
    footer_text: {
      fr: '&copy; 2026 — Explorez le Cameroun : nature, culture, gastronomie et hébergements. <a href="a-propos.html">En savoir plus sur le projet</a>.',
      en: '&copy; 2026 — Explore Cameroon: nature, culture, food and places to stay. <a href="a-propos.html">More about this project</a>.',
    },

    // ---- Accueil ----
    home_title: { fr: "CAMTOUR AI — Votre voyage au Cameroun, construit par l'IA", en: "CAMTOUR AI — Your Cameroon trip, built by AI" },
    home_meta: {
      fr: "Dites-nous ce que vous aimez, CAMTOUR AI construit votre voyage au Cameroun : itinéraire personnalisé, écotourisme, culture, gastronomie et hôtels, guidés par une IA multilingue.",
      en: "Tell us what you love, and CAMTOUR AI builds your trip to Cameroon: a personalised itinerary, ecotourism, culture, food and hotels, guided by a multilingual AI.",
    },
    home_hero_h1: { fr: "Découvrez le Cameroun avec l'intelligence artificielle", en: "Discover Cameroon with artificial intelligence" },
    home_hero_p: { fr: "Rêve d'Afrique : visitez le Cameroun avec CAMTOUR IA.", en: "Dream of Africa: visit Cameroon with CAMTOUR AI." },
    home_hero_btn_build: { fr: "🧳 Construire mon voyage", en: "🧳 Build my trip" },
    home_hero_btn_chat: { fr: "🤖 Parler à CAMTOUR AI", en: "🤖 Talk to CAMTOUR AI" },
    home_quicklink_eco: { fr: "Écotourisme", en: "Ecotourism" },
    home_quicklink_culture: { fr: "Culture &amp; Gastronomie", en: "Culture &amp; Food" },
    home_quicklink_hotels: { fr: "Hôtels", en: "Hotels" },
    home_quicklink_carte: { fr: "Carte", en: "Map" },
    home_s1_eyebrow: { fr: "À découvrir", en: "To discover" },
    home_s1_h2: { fr: "Quatre façons de découvrir le Cameroun", en: "Four ways to discover Cameroon" },
    home_s1_p: { fr: "Ce site rassemble en un seul endroit ce dont un visiteur a besoin.", en: "This site brings together everything a visitor needs, in one place." },
    home_card_nature_h3: { fr: "Nature", en: "Nature" },
    home_card_nature_p: { fr: "Parcs nationaux, réserves naturelles et tourisme durable, région par région.", en: "National parks, nature reserves and sustainable tourism, region by region." },
    home_card_culture_h3: { fr: "Culture", en: "Culture" },
    home_card_culture_p: { fr: "Les 4 grandes aires socioculturelles, leurs traditions, festivals et chefferies.", en: "The 4 major sociocultural areas, their traditions, festivals and chiefdoms." },
    home_card_gastro_h3: { fr: "Gastronomie", en: "Food" },
    home_card_gastro_p: { fr: "Les 14 mets emblématiques officiels, classés par aire socioculturelle.", en: "The 14 official emblematic dishes, organised by sociocultural area." },
    home_card_artisanat_h3: { fr: "Artisanat", en: "Crafts" },
    home_card_artisanat_p: { fr: "La route des artisans : sculpture, perlage, tissage et bronze, localité par localité.", en: "The craftsmen's route: carving, beadwork, weaving and bronze work, town by town." },
    home_s2_eyebrow: { fr: "Explorer", en: "Explore" },
    home_s2_h2: { fr: "Où voulez-vous aller ?", en: "Where do you want to go?" },
    home_s2_p: { fr: "Les 4 grandes zones touristiques officielles du Cameroun.", en: "Cameroon's 4 official tourist zones." },
    home_zone_mountains_h3: { fr: "Zone des Montagnes", en: "Mountain Zone" },
    home_zone_mountains_p: { fr: "Ouest &amp; Nord-Ouest — route des chefferies, artisanat, lacs et grottes.", en: "West &amp; North-West — chiefdoms route, crafts, lakes and caves." },
    home_zone_coastal_h3: { fr: "Zone Côtière", en: "Coastal Zone" },
    home_zone_coastal_p: { fr: "Sud-Ouest, Littoral &amp; Sud — plages, Mont Cameroun, tortues marines.", en: "South-West, Littoral &amp; South — beaches, Mount Cameroon, sea turtles." },
    home_zone_forest_h3: { fr: "Zone Forestière", en: "Forest Zone" },
    home_zone_forest_p: { fr: "Centre, Sud &amp; Est — forêt équatoriale, gorilles, peuples Baka et Bagyeli.", en: "Centre, South &amp; East — equatorial forest, gorillas, Baka and Bagyeli peoples." },
    home_zone_sahel_h3: { fr: "Zone Soudano-Sahélienne", en: "Sudano-Sahelian Zone" },
    home_zone_sahel_p: { fr: "Adamaoua, Nord &amp; Extrême-Nord — safaris, paysages lunaires, sultanats.", en: "Adamawa, North &amp; Far North — safaris, lunar landscapes, sultanates." },

    // ---- Écotourisme ----
    eco_title: { fr: "Écotourisme — CAMTOUR AI", en: "Ecotourism — CAMTOUR AI" },
    eco_eyebrow: { fr: "Nature &amp; aventure", en: "Nature &amp; adventure" },
    eco_h1: { fr: "🌿 Écotourisme", en: "🌿 Ecotourism" },
    eco_p: { fr: "Parcs nationaux, réserves naturelles et expériences de tourisme durable au Cameroun.", en: "National parks, nature reserves and sustainable tourism experiences in Cameroon." },
    eco_loading: { fr: "Chargement des sites écotouristiques…", en: "Loading ecotourism sites…" },
    eco_error: { fr: "Impossible de charger les sites", en: "Unable to load the sites" },
    retry_later: { fr: "Merci de réessayer plus tard.", en: "Please try again later." },
    eco_best_period: { fr: "Meilleure période :", en: "Best time to visit:" },

    // ---- Culture & gastronomie ----
    culture_title: { fr: "Culture &amp; Gastronomie — CAMTOUR AI", en: "Culture &amp; Food — CAMTOUR AI" },
    culture_eyebrow: { fr: "Traditions &amp; saveurs", en: "Traditions &amp; flavours" },
    culture_h1: { fr: "🍲 Culture &amp; Gastronomie", en: "🍲 Culture &amp; Food" },
    culture_p: { fr: "Les 4 grandes aires culturelles et les 14 mets emblématiques du Cameroun.", en: "Cameroon's 4 major cultural areas and its 14 emblematic dishes." },
    culture_areas_eyebrow: { fr: "Peuples &amp; royaumes", en: "Peoples &amp; kingdoms" },
    culture_areas_h2: { fr: "Aires culturelles", en: "Cultural areas" },
    culture_areas_p: { fr: "Grassfields · Sawa · Sudano-Sahélienne · Fang-Beti", en: "Grassfields · Sawa · Sudano-Sahelian · Fang-Beti" },
    culture_areas_loading: { fr: "Chargement des aires culturelles…", en: "Loading cultural areas…" },
    culture_areas_error: { fr: "Impossible de charger les aires culturelles", en: "Unable to load the cultural areas" },
    culture_dishes_eyebrow: { fr: "Gastronomie", en: "Food" },
    culture_dishes_h2: { fr: "Mets emblématiques", en: "Emblematic dishes" },
    culture_dishes_p: { fr: "Les 14 mets officiels du Cameroun, par aire socioculturelle", en: "Cameroon's 14 official dishes, by sociocultural area" },
    culture_dishes_loading: { fr: "Chargement des mets emblématiques…", en: "Loading emblematic dishes…" },
    culture_dishes_error: { fr: "Impossible de charger les mets emblématiques", en: "Unable to load the emblematic dishes" },
    culture_artisanat_eyebrow: { fr: "Savoir-faire", en: "Craftsmanship" },
    culture_artisanat_h2: { fr: "🎨 Route des artisans", en: "🎨 Craftsmen's route" },
    culture_artisanat_p: { fr: "Les spécialités artisanales des 4 aires socioculturelles", en: "Craft specialties of the 4 sociocultural areas" },
    culture_artisanat_loading: { fr: "Chargement de l'artisanat…", en: "Loading crafts…" },
    culture_artisanat_error: { fr: "Impossible de charger l'artisanat", en: "Unable to load the crafts" },
    culture_artisanat_label: { fr: "Artisanat :", en: "Crafts:" },
    culture_evenement_label: { fr: "Événement :", en: "Event:" },
    culture_accompagnement_label: { fr: "Se déguste avec :", en: "Served with:" },

    // ---- Hôtels ----
    hotels_title: { fr: "Hôtels — CAMTOUR AI", en: "Hotels — CAMTOUR AI" },
    hotels_eyebrow: { fr: "Séjourner", en: "Stay" },
    hotels_h1: { fr: "🏨 Hôtels", en: "🏨 Hotels" },
    hotels_p: { fr: "Un annuaire d'hébergements pour préparer votre séjour au Cameroun.", en: "A directory of places to stay, to help plan your trip to Cameroon." },
    hotels_filter_ville: { fr: "Ville", en: "City" },
    hotels_filter_all_villes: { fr: "Toutes les villes", en: "All cities" },
    hotels_filter_budget: { fr: "Budget", en: "Budget" },
    hotels_filter_all_budgets: { fr: "Tous les budgets", en: "All budgets" },
    budget_economique: { fr: "Économique", en: "Budget-friendly" },
    budget_milieu: { fr: "Milieu de gamme", en: "Mid-range" },
    budget_haut: { fr: "Haut de gamme", en: "Upscale" },
    hotels_loading: { fr: "Chargement de l'annuaire d'hôtels…", en: "Loading the hotel directory…" },
    hotels_error: { fr: "Impossible de charger l'annuaire d'hôtels", en: "Unable to load the hotel directory" },
    hotels_empty: { fr: "Aucun hôtel ne correspond à cette recherche", en: "No hotel matches this search" },
    hotels_empty_hint: { fr: "Essayez une autre ville ou un autre budget.", en: "Try another city or budget." },
    hotels_contact: { fr: "Contact :", en: "Contact:" },

    // ---- Carte ----
    carte_title: { fr: "Carte — CAMTOUR AI", en: "Map — CAMTOUR AI" },
    carte_eyebrow: { fr: "Explorer", en: "Explore" },
    carte_h1: { fr: "📍 Carte du Cameroun", en: "📍 Map of Cameroon" },
    carte_p: { fr: "Explorez autour de vous, découvrez un lieu, puis ajoutez-le à votre voyage.", en: "Explore around you, discover a place, then add it to your trip." },
    carte_locate_btn: { fr: "📍 Explorer autour de moi", en: "📍 Explore around me" },
    carte_or: { fr: "ou", en: "or" },
    carte_city_default: { fr: "Choisir une ville…", en: "Choose a city…" },
    carte_city_label: { fr: "Choisir une ville", en: "Choose a city" },
    filter_nature: { fr: "🌿 Nature", en: "🌿 Nature" },
    filter_culture: { fr: "🏛️ Culture", en: "🏛️ Culture" },
    filter_gastronomie: { fr: "🍲 Gastronomie", en: "🍲 Food" },
    filter_artisanat: { fr: "🎨 Artisanat", en: "🎨 Crafts" },
    filter_hotels: { fr: "🏨 Hôtels", en: "🏨 Hotels" },
    filter_evenements: { fr: "🎉 Événements", en: "🎉 Events" },
    cat_nature: { fr: "Nature", en: "Nature" },
    cat_culture: { fr: "Culture", en: "Culture" },
    cat_gastronomie: { fr: "Gastronomie", en: "Food" },
    cat_artisanat: { fr: "Artisanat", en: "Crafts" },
    cat_hotels: { fr: "Hôtels", en: "Hotels" },
    cat_evenements: { fr: "Événements", en: "Events" },
    map_hotels_count: { fr: "{n} hôtel référencé dans cette ville.", en: "{n} hotel listed in this city." },
    map_hotels_count_plural: { fr: "{n} hôtels référencés dans cette ville.", en: "{n} hotels listed in this city." },
    map_dishes_intro: { fr: "{n} mets emblématiques : {list}.", en: "{n} emblematic dishes: {list}." },
    map_area_nom: { fr: "Aire culturelle {nom}", en: "{nom} cultural area" },
    map_cuisine_nom: { fr: "Cuisine {nom}", en: "{nom} cuisine" },
    map_artisanat_nom: { fr: "Artisanat {nom}", en: "{nom} crafts" },
    map_hotels_nom: { fr: "Hôtels à {ville}", en: "Hotels in {ville}" },
    map_traditions_label: { fr: "Traditions :", en: "Traditions:" },
    map_activites_label: { fr: "Activités :", en: "Activities:" },
    map_periode_label: { fr: "Meilleure période :", en: "Best time to visit:" },
    map_hebergement_label: { fr: "Hébergement : {list}", en: "Accommodation: {list}" },
    map_panel_hint: {
      fr: "👆 Cliquez sur un lieu de la carte pour voir sa fiche, ou lancez « Explorer autour de moi ».",
      en: "👆 Click a place on the map to see its details, or use \"Explore around me\".",
    },
    map_locate_no_geoloc: { fr: "Votre navigateur ne sait pas vous localiser. Choisissez une ville dans la liste.", en: "Your browser can't locate you. Choose a city from the list." },
    map_locate_loading: { fr: "Localisation en cours…", en: "Locating you…" },
    map_locate_denied: { fr: "Impossible de vous localiser (accès refusé ou indisponible). Choisissez une ville dans la liste.", en: "Couldn't locate you (access denied or unavailable). Choose a city from the list." },
    map_locate_far: { fr: "Vous semblez être à plus de {km} km du lieu le plus proche. Choisissez une ville du Cameroun dans la liste pour explorer autour d'elle.", en: "You seem to be more than {km} km from the nearest place. Choose a Cameroonian city from the list to explore around it." },
    map_locate_nearby: { fr: "{n} lieux à découvrir autour de {label}.", en: "{n} places to discover around {label}." },
    map_no_active_filter: { fr: "Aucune catégorie active : activez au moins un filtre.", en: "No category active: turn on at least one filter." },
    map_nearby_title: { fr: "📍 Autour de {label}", en: "📍 Around {label}" },
    map_here: { fr: "vous", en: "you" },
    map_here_tooltip: { fr: "Vous êtes ici", en: "You are here" },
    map_distance: { fr: " · à environ {km} km", en: " · about {km} km away" },
    map_budget_free: { fr: "Gratuit", en: "Free" },
    map_budget_est: { fr: "Budget : estimé par CAMTOUR AI dans votre itinéraire, une fois le lieu ajouté à votre voyage.", en: "Budget: estimated by CAMTOUR AI in your itinerary, once the place is added to your trip." },
    map_add: { fr: "➕ Ajouter à mon voyage", en: "➕ Add to my trip" },
    map_added: { fr: "✓ Ajouté — retirer", en: "✓ Added — remove" },
    map_link_site: { fr: "Voir la fiche", en: "View details" },
    map_link_dishes: { fr: "Voir les mets", en: "View the dishes" },
    map_link_crafts: { fr: "Voir la route des artisans", en: "View the craftsmen's route" },
    map_link_hotels: { fr: "Voir les hôtels", en: "View the hotels" },
    map_link_culture: { fr: "Voir la culture de la région", en: "View the region's culture" },
    map_event_approx: { fr: "Position approximative : vérifiez le lieu exact avant de partir.", en: "Approximate location: check the exact venue before you travel." },
    map_event_dates: { fr: "Dates exactes à confirmer auprès des organisateurs ou de l'office de tourisme.", en: "Exact dates to be confirmed with the organisers or the tourist office." },
    map_tray_title: { fr: "🧳 Mon voyage : {n} lieu choisi", en: "🧳 My trip: {n} place chosen" },
    map_tray_title_plural: { fr: "🧳 Mon voyage : {n} lieux choisis", en: "🧳 My trip: {n} places chosen" },
    map_tray_cta: { fr: "✨ Créer mon voyage avec ces lieux", en: "✨ Build my trip with these places" },
    map_tray_clear: { fr: "Vider la liste", en: "Clear the list" },
    remove_place_aria: { fr: "Retirer {nom}", en: "Remove {nom}" },
    budget_chips_aria: { fr: "Budgets rapides", en: "Quick budgets" },
    map_load_error: { fr: "Impossible de charger les lieux de la carte. Merci de réessayer plus tard.", en: "Unable to load the map's places. Please try again later." },

    // ---- Planificateur ----
    plan_title: { fr: "Mon voyage — CAMTOUR AI", en: "My Trip — CAMTOUR AI" },
    plan_meta: {
      fr: "Construisez votre voyage au Cameroun avec l'intelligence artificielle : itinéraire personnalisé et budget estimé selon vos envies.",
      en: "Build your trip to Cameroon with artificial intelligence: a personalised itinerary and estimated budget, based on what you love.",
    },
    plan_eyebrow: { fr: "Planificateur IA", en: "AI Planner" },
    plan_h1: { fr: "🧳 Construire mon voyage", en: "🧳 Build my trip" },
    plan_p: { fr: "Dites-nous ce que vous aimez, CAMTOUR AI construit votre expérience.", en: "Tell us what you love, and CAMTOUR AI builds your experience." },
    plan_info_banner: {
      fr: "ℹ️ L'itinéraire et le budget proposés sont générés par l'IA à partir du contenu réel du site (parcs, mets, hôtels, circuits) — le budget reste une estimation indicative, à confirmer sur place.",
      en: "ℹ️ The itinerary and budget are generated by AI from the site's real content (parks, dishes, hotels, tours) — the budget is an indicative estimate only, to confirm on the spot.",
    },
    plan_places_title: { fr: "📍 Lieux choisis sur la carte ({n})", en: "📍 Places chosen on the map ({n})" },
    plan_places_hint: { fr: "CAMTOUR AI les intégrera à votre itinéraire.", en: "CAMTOUR AI will work them into your itinerary." },
    plan_places_add_more: { fr: "➕ Ajouter d'autres lieux depuis la carte", en: "➕ Add more places from the map" },
    plan_progress: { fr: "Étape {n} sur {total}", en: "Step {n} of {total}" },
    plan_step1_h2: { fr: "Quel voyage souhaitez-vous vivre au Cameroun ?", en: "What kind of trip do you want in Cameroon?" },
    plan_step1_hint: { fr: "Je veux découvrir :", en: "I want to discover:" },
    plan_step1_error: { fr: "Choisissez au moins une envie pour continuer.", en: "Choose at least one interest to continue." },
    plan_interest_nature: { fr: "🌿 Nature", en: "🌿 Nature" },
    plan_interest_culture: { fr: "🏛️ Culture", en: "🏛️ Culture" },
    plan_interest_gastronomie: { fr: "🍲 Gastronomie", en: "🍲 Food" },
    plan_interest_artisanat: { fr: "🎨 Artisanat", en: "🎨 Crafts" },
    plan_interest_faune: { fr: "🐘 Faune", en: "🐘 Wildlife" },
    plan_interest_plages: { fr: "🏖️ Plages", en: "🏖️ Beaches" },
    plan_interest_montagnes: { fr: "🏔️ Montagnes", en: "🏔️ Mountains" },
    plan_interest_histoire: { fr: "🏺 Histoire", en: "🏺 History" },
    plan_step2_h2: { fr: "Avec qui voyagez-vous ?", en: "Who are you travelling with?" },
    plan_step2_error: { fr: "Choisissez avec qui vous voyagez pour continuer.", en: "Choose who you're travelling with to continue." },
    plan_profil_seul: { fr: "🧍 Seul", en: "🧍 Solo" },
    plan_profil_couple: { fr: "💑 Couple", en: "💑 Couple" },
    plan_profil_famille: { fr: "👨‍👩‍👧 Famille", en: "👨‍👩‍👧 Family" },
    plan_profil_amis: { fr: "🧑‍🤝‍🧑 Amis", en: "🧑‍🤝‍🧑 Friends" },
    plan_profil_pro: { fr: "💼 Voyage professionnel", en: "💼 Business trip" },
    plan_step3_h2: { fr: "D'où partez-vous, et pour combien de temps ?", en: "Where are you starting from, and for how long?" },
    plan_depart_label: { fr: "Ville de départ", en: "Starting city" },
    plan_depart_placeholder: { fr: "Ex. Yaoundé, Douala...", en: "E.g. Yaoundé, Douala..." },
    plan_duree_label: { fr: "Durée du séjour (en jours)", en: "Trip length (in days)" },
    plan_duree_placeholder: { fr: "Ex. 3", en: "E.g. 3" },
    plan_step3_error: { fr: "Indiquez une ville de départ et une durée entre 1 et 14 jours.", en: "Enter a starting city and a length between 1 and 14 days." },
    plan_step4_h2: { fr: "Votre budget", en: "Your budget" },
    plan_budget_placeholder: { fr: "Ex. 150000 (FCFA)", en: "E.g. 150000 (FCFA)" },
    plan_step4_error: { fr: "Indiquez un budget d'au moins 10 000 FCFA.", en: "Enter a budget of at least 10,000 FCFA." },
    plan_budget_preview_title: { fr: "CAMTOUR AI estime pour {budget} :", en: "CAMTOUR AI estimates for {budget}:" },
    plan_budget_transport: { fr: "🚗 Transport estimé", en: "🚗 Estimated transport" },
    plan_budget_hebergement: { fr: "🏨 Hébergement estimé", en: "🏨 Estimated accommodation" },
    plan_budget_activites: { fr: "🎟️ Activités", en: "🎟️ Activities" },
    plan_budget_repas: { fr: "🍲 Repas", en: "🍲 Meals" },
    plan_budget_preview_note: { fr: "Répartition indicative : l'IA l'affinera selon votre itinéraire.", en: "Indicative split: the AI will refine it based on your itinerary." },
    plan_prev: { fr: "Précédent", en: "Back" },
    plan_next: { fr: "Suivant", en: "Next" },
    plan_submit: { fr: "✨ Créer mon voyage", en: "✨ Create my trip" },
    plan_loader_title: { fr: "CAMTOUR AI prépare votre expérience...", en: "CAMTOUR AI is preparing your experience..." },
    plan_loader_1: { fr: "Analyse de vos envies…", en: "Analysing what you love…" },
    plan_loader_2: { fr: "Sélection des lieux à visiter…", en: "Selecting places to visit…" },
    plan_loader_3: { fr: "Choix des repas et des hébergements…", en: "Choosing meals and places to stay…" },
    plan_loader_4: { fr: "Calcul de votre budget…", en: "Working out your budget…" },
    plan_loader_5: { fr: "Dernières touches à votre itinéraire…", en: "Adding the final touches to your itinerary…" },
    plan_ready: { fr: "✅ Votre voyage est prêt.", en: "✅ Your trip is ready." },
    plan_hero_title: { fr: "🌍 Mon voyage au Cameroun", en: "🌍 My trip to Cameroon" },
    plan_days: { fr: "jour", en: "day" },
    plan_days_plural: { fr: "jours", en: "days" },
    plan_refine_h3: { fr: "💬 Modifier mon voyage", en: "💬 Change my trip" },
    plan_refine_hint: { fr: "Dites à CAMTOUR AI ce qui change : il réorganise tout l'itinéraire pour vous.", en: "Tell CAMTOUR AI what's changed: it reorganises the whole itinerary for you." },
    plan_refine_placeholder: { fr: "Ex. « Réduis le budget à 80 000 FCFA »", en: "E.g. \"Lower my budget to 80,000 FCFA\"" },
    plan_refine_send: { fr: "Envoyer", en: "Send" },
    plan_refine_loading: { fr: "🤖 CAMTOUR AI adapte votre voyage… cela peut prendre une minute.", en: "🤖 CAMTOUR AI is adapting your trip… this can take a minute." },
    plan_restart: { fr: "🔄 Créer un nouveau voyage", en: "🔄 Start a new trip" },
    plan_retry: { fr: "↩︎ Revenir au formulaire", en: "↩︎ Back to the form" },
    plan_suggestion_budget: { fr: "Je n'ai finalement que 80 000 FCFA.", en: "I actually only have 80,000 FCFA." },
    plan_suggestion_famille: { fr: "Je voyage maintenant avec mes deux enfants.", en: "I'm now travelling with my two children." },
    plan_suggestion_gastro: { fr: "Je veux plus de gastronomie et moins de musées.", en: "I want more food experiences and fewer museums." },
    plan_suggestion_days: { fr: "Ajoute un jour de plus.", en: "Add one more day." },
    plan_budget_title: { fr: "💰 Budget estimatif", en: "💰 Estimated budget" },
    plan_budget_transport_row: { fr: "Transport", en: "Transport" },
    plan_budget_hebergement_row: { fr: "Hébergement", en: "Accommodation" },
    plan_budget_activites_row: { fr: "Activités", en: "Activities" },
    plan_budget_repas_row: { fr: "Repas", en: "Meals" },
    plan_budget_total: { fr: "Total estimé", en: "Estimated total" },
    plan_budget_over: { fr: "⚠️ Cette estimation dépasse un peu votre budget de {budget}. Demandez à CAMTOUR AI de l'adapter ci-dessous.", en: "⚠️ This estimate slightly exceeds your budget of {budget}. Ask CAMTOUR AI to adjust it below." },
    plan_budget_default_note: { fr: "Estimation indicative, à confirmer sur place — pas de prix garanti.", en: "Indicative estimate, to confirm on the spot — no guaranteed price." },
    plan_start_unavailable: { fr: "Le planificateur est momentanément indisponible. Merci de réessayer dans un instant.", en: "The planner is temporarily unavailable. Please try again shortly." },
    plan_wait_too_long: { fr: "La création du voyage prend plus de temps que prévu. Merci de réessayer dans un instant.", en: "Building the trip is taking longer than expected. Please try again shortly." },
    plan_parse_error: { fr: "L'assistant n'a pas pu construire un itinéraire structuré cette fois-ci. Merci de reformuler votre demande.", en: "The assistant couldn't build a structured itinerary this time. Please try rephrasing your request." },

    // ---- Message envoyé à l'IA (le planificateur construit une phrase dans la langue de la page) ----
    plan_ai_message: {
      fr: "Je pars de {depart} pour {duree} jour(s), avec un budget total d'environ {budget} FCFA. Je voyage : {profil}. Ce que je veux découvrir : {interets}.",
      en: "I'm leaving from {depart} for {duree} day(s), with a total budget of about {budget} FCFA. I'm travelling: {profil}. What I want to discover: {interets}.",
    },
    plan_ai_no_preference: { fr: "pas de préférence particulière", en: "no particular preference" },
    plan_ai_places_suffix: { fr: " Lieux que je veux absolument visiter : {list}.", en: " Places I absolutely want to visit: {list}." },

    // ---- À propos ----
    apropos_title: { fr: "À propos — CAMTOUR AI", en: "About — CAMTOUR AI" },
    apropos_eyebrow: { fr: "Le projet", en: "The project" },
    apropos_h1: { fr: "À propos de ce projet", en: "About this project" },
    apropos_p: { fr: "Réalisé pour le concours « L'IA dans le Tourisme ».", en: "Made for the \"AI in Tourism\" competition." },
    apropos_criteria_h2: { fr: "Comment ce projet répond aux critères du jury", en: "How this project meets the jury's criteria" },
    apropos_c1_h3: { fr: "✅ Faisabilité technique", en: "✅ Technical feasibility" },
    apropos_c1_p: {
      fr: "Le site est en ligne et fonctionne réellement : les 4 sections (écotourisme, culture, gastronomie, hôtels) sont consultables, et l'assistant IA répond en direct grâce à l'API Claude d'Anthropic. Hébergement Netlify gratuit et stable, sans base de données à gérer.",
      en: "The site is live and genuinely works: all 4 sections (ecotourism, culture, food, hotels) can be browsed, and the AI assistant replies live via Anthropic's Claude API. Free, stable Netlify hosting, with no database to manage.",
    },
    apropos_c2_h3: { fr: "🌍 Image du Cameroun", en: "🌍 Image of Cameroon" },
    apropos_c2_p: {
      fr: "Le Cameroun est présenté comme « l'Afrique en miniature » : ses parcs nationaux, ses 4 grandes aires culturelles (Grassfields, Sawa, Sudano-Sahélienne, Fang-Beti) et ses 14 mets emblématiques sont mis en valeur avec un ton chaleureux et positif, y compris par l'assistant IA.",
      en: "Cameroon is presented as \"Africa in miniature\": its national parks, its 4 major cultural areas (Grassfields, Sawa, Sudano-Sahelian, Fang-Beti) and its 14 emblematic dishes are showcased in a warm, positive tone, including by the AI assistant.",
    },
    apropos_c3_h3: { fr: "🙂 Facilité d'utilisation", en: "🙂 Ease of use" },
    apropos_c3_p: {
      fr: "Aucune application à installer : tout se passe dans le navigateur, sur téléphone comme sur ordinateur. Navigation simple en 5 pages, et un assistant conversationnel qui répond dans la langue du visiteur (français, anglais, et bien d'autres).",
      en: "No app to install: everything runs in the browser, on phone or computer alike. Simple navigation across 5 pages, and a conversational assistant that replies in the visitor's own language (French, English and many others).",
    },
    apropos_c4_h3: { fr: "🌱 Développement durable", en: "🌱 Sustainable development" },
    apropos_c4_p: {
      fr: "Chaque site écotouristique présente un conseil de tourisme durable (guides certifiés, écotourisme communautaire). L'assistant IA a pour consigne de toujours privilégier le tourisme responsable dans ses réponses, et l'annuaire d'hôtels reste informatif — sans pousser à la surconsommation touristique.",
      en: "Every ecotourism site includes a sustainable-tourism tip (certified guides, community ecotourism). The AI assistant is instructed to always favour responsible tourism in its answers, and the hotel directory stays purely informative — with no push towards tourism overconsumption.",
    },
    apropos_brief_h2: { fr: "Le projet en bref", en: "The project in brief" },
    apropos_brief_p1: {
      fr: "« CAMTOUR AI » est une solution unique qui répond aux 4 axes du concours « L'IA dans le Tourisme » plutôt que de traiter chacun séparément : guidage touristique multilingue, écotourisme, culture &amp; gastronomie, et aide à la gestion hôtelière. L'idée centrale est simple : un visiteur, camerounais ou étranger, doit pouvoir poser n'importe quelle question sur le tourisme au Cameroun et obtenir une réponse utile, honnête et dans sa propre langue — à toute heure, sans agence ni guide humain disponible immédiatement.",
      en: "\"CAMTOUR AI\" is a single solution addressing all 4 themes of the \"AI in Tourism\" competition rather than treating each separately: multilingual tourist guidance, ecotourism, culture &amp; food, and help with hotel management. The core idea is simple: a visitor, Cameroonian or foreign, should be able to ask any question about tourism in Cameroon and get a useful, honest answer in their own language — at any time, with no travel agency or human guide immediately available.",
    },
    apropos_brief_p2: {
      fr: "Le contenu du site (sites naturels, mets, aires culturelles, hôtels) sert de socle de connaissances fiable pour l'assistant IA : il répond en s'appuyant sur ces informations plutôt qu'en inventant, et oriente le visiteur vers la bonne page du site quand c'est utile. Ce contenu a vocation à être enrichi avec de vrais partenaires (parcs, hôtels, artisans) après le concours.",
      en: "The site's content (natural sites, dishes, cultural areas, hotels) serves as a reliable knowledge base for the AI assistant: it answers by relying on this information rather than making things up, and points the visitor to the right page of the site when useful. This content is meant to grow with real partners (parks, hotels, craftsmen) after the competition.",
    },
    apropos_sources_h2: { fr: "Sources des données", en: "Data sources" },
    apropos_sources_p: {
      fr: "Les sites touristiques, hôtels, festivals et circuits présentés s'appuient sur des documents officiels du Ministère du Tourisme et des Loisirs (MINTOUL) : la brochure « Le Cameroun, Quatre Zones touristiques complètes », qui documente les 4 zones touristiques du pays (Soudano-Sahélienne, Forestière, Côtière, Zone des Montagnes), ainsi que le dépliant institutionnel du ministère. Plusieurs photos du site proviennent aussi directement des archives photographiques du MINTOUL. Les coordonnées d'hôtels et d'agences affichées sont donc réelles — à vérifier directement auprès de l'établissement avant réservation, les tarifs et disponibilités pouvant évoluer.",
      en: "The tourist sites, hotels, festivals and tours presented here are based on official documents from the Ministry of Tourism and Leisure (MINTOUL): the brochure \"Cameroon, Four Complete Tourist Zones\", which documents the country's 4 tourist zones (Sudano-Sahelian, Forest, Coastal, Mountain Zone), as well as the ministry's institutional leaflet. Several photos on the site also come directly from MINTOUL's photo archives. The hotel and agency contact details shown are therefore real — please check directly with the establishment before booking, as rates and availability may change.",
    },
    apropos_sources_contact: {
      fr: 'Contact officiel MINTOUL : +237 222 23 29 36 — infos@mintoul.gov.cm — <a href="https://www.mintoul.gov.cm" target="_blank" rel="noopener">www.mintoul.gov.cm</a>',
      en: 'Official MINTOUL contact: +237 222 23 29 36 — infos@mintoul.gov.cm — <a href="https://www.mintoul.gov.cm" target="_blank" rel="noopener">www.mintoul.gov.cm</a>',
    },
    apropos_photos_h2: { fr: "Photos officielles (MINTOUL)", en: "Official photos (MINTOUL)" },
    apropos_photos_p: {
      fr: "Ces photos proviennent des archives photographiques du Ministère du Tourisme et des Loisirs du Cameroun, remises directement pour ce projet — ce sont de vrais lieux camerounais, pas des illustrations génériques.",
      en: "These photos come from the photo archives of Cameroon's Ministry of Tourism and Leisure, provided directly for this project — they show real Cameroonian places, not generic illustrations.",
    },
    apropos_credits_h2: { fr: "Crédits photos", en: "Photo credits" },
    apropos_credits_p: {
      fr: "Photos libres de droits, via Pexels et Wikimedia Commons (Creative Commons / domaine public). Certaines sont des illustrations génériques (ex. plat similaire) en attendant de vraies photos des lieux et mets camerounais.",
      en: "Royalty-free photos, via Pexels and Wikimedia Commons (Creative Commons / public domain). Some are generic illustrations (e.g. a similar-looking dish) while awaiting real photos of Cameroonian places and dishes.",
    },

    // ---- Assistant IA (bulle de chat) ----
    chat_launcher_aria: { fr: "Ouvrir l'assistant IA", en: "Open the AI assistant" },
    chat_header: { fr: "🤖 Assistant CAMTOUR AI", en: "🤖 CAMTOUR AI Assistant" },
    chat_close_aria: { fr: "Fermer", en: "Close" },
    chat_input_label: { fr: "Votre question pour l'assistant", en: "Your question for the assistant" },
    chat_input_placeholder: { fr: "Posez votre question...", en: "Ask your question..." },
    chat_send: { fr: "Envoyer", en: "Send" },
    chat_greeting: {
      fr: "Bonjour ! Je suis votre assistant pour découvrir le Cameroun : écotourisme, culture, gastronomie et hôtels. Posez-moi une question, dans la langue de votre choix.",
      en: "Hello! I'm your assistant for discovering Cameroon: ecotourism, culture, food and hotels. Ask me anything, in whichever language you like.",
    },
    chat_server_error: { fr: "Réponse inattendue du serveur.", en: "Unexpected response from the server." },
    chat_unavailable: { fr: "L'assistant IA est momentanément indisponible. Merci de réessayer dans un instant.", en: "The AI assistant is temporarily unavailable. Please try again shortly." },
    chat_network_error: { fr: "Impossible de contacter l'assistant IA. Vérifiez votre connexion internet et réessayez dans un instant.", en: "Couldn't reach the AI assistant. Check your internet connection and try again shortly." },

    // ---- Guide vocal (dans la bulle de chat) ----
    voice_toggle_on: { fr: "Guide vocal activé : les réponses sont lues à voix haute", en: "Voice guide on: answers are read aloud" },
    voice_toggle_off: { fr: "Activer le guide vocal (lecture des réponses à voix haute)", en: "Turn on the voice guide (read answers aloud)" },
    voice_replay: { fr: "🔊 Écouter", en: "🔊 Listen" },
    voice_stop: { fr: "⏹ Arrêter", en: "⏹ Stop" },
    voice_mic_aria: { fr: "Poser ma question à voix haute", en: "Ask my question out loud" },
    voice_listening: { fr: "Je vous écoute…", en: "Listening…" },
    voice_mic_error: { fr: "Micro indisponible. Vérifiez l'autorisation du micro dans votre navigateur.", en: "Microphone unavailable. Check the microphone permission in your browser." },
  };

  function detectDefault() {
    try {
      return (navigator.language || "fr").toLowerCase().startsWith("en") ? "en" : "fr";
    } catch (err) {
      return "fr";
    }
  }

  function getLang() {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "fr" || saved === "en") return saved;
    } catch (err) {
      /* stockage indisponible : on retombe sur la langue détectée */
    }
    return detectDefault();
  }

  function t(key, vars) {
    const lang = getLang();
    const entry = DICT[key];
    let text = entry ? entry[lang] || entry.fr : key;
    if (vars) {
      Object.keys(vars).forEach((k) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, "g"), vars[k]);
      });
    }
    return text;
  }

  // Renvoie le champ traduit d'un objet de data/*.json : tf(hotel, "description") -> description_en si lang=en et présent, sinon description.
  function tf(obj, field) {
    if (!obj) return "";
    const lang = getLang();
    if (lang === "en" && obj[field + "_en"] != null) return obj[field + "_en"];
    return obj[field];
  }

  function setLang(lang) {
    try {
      localStorage.setItem(KEY, lang);
    } catch (err) {
      /* stockage indisponible : le choix ne survivra pas à cette page */
    }
    document.documentElement.lang = lang;
    window.dispatchEvent(new CustomEvent("camtour-lang-changed", { detail: { lang } }));
    applyStaticTranslations();
  }

  function applyStaticTranslations() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      el.innerHTML = t(el.dataset.i18nHtml);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      el.setAttribute("aria-label", t(el.dataset.i18nAria));
    });
    document.querySelectorAll("[data-i18n-content]").forEach((el) => {
      el.setAttribute("content", t(el.dataset.i18nContent));
    });
    const titleKey = document.body && document.body.dataset.i18nTitle;
    if (titleKey) document.title = t(titleKey);
  }

  function injectLangToggle() {
    const nav = document.querySelector(".main-nav");
    if (!nav || nav.querySelector(".lang-toggle")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lang-toggle";
    const render = () => {
      btn.textContent = t("lang_switch_to");
      btn.setAttribute("aria-label", t("lang_switch_aria"));
    };
    render();
    btn.addEventListener("click", () => {
      setLang(getLang() === "fr" ? "en" : "fr");
      render();
    });
    window.addEventListener("camtour-lang-changed", render);
    nav.appendChild(btn);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.documentElement.lang = getLang();
    injectLangToggle();
    applyStaticTranslations();
  });

  return { t, tf, getLang, setLang, applyStaticTranslations };
})();
