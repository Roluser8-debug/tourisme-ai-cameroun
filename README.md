# Assistant Touristique IA du Cameroun

Site web réalisé pour le concours « L'IA dans le Tourisme » — Journée Mondiale du Tourisme 2026 (Yaoundé, 23–27 septembre 2026).

## Voir le site en local

Le chatbot a besoin de la fonction serveur pour fonctionner, donc pour le tester il faut utiliser **Netlify CLI** plutôt que d'ouvrir directement `index.html` :

1. Copie `.env.example` en `.env` et colle ta vraie clé API Anthropic dedans.
2. Dans un terminal, à la racine du projet : `npx netlify dev`
3. Ouvre l'adresse affichée (en général `http://localhost:8888`).

Si tu veux juste voir les pages sans le chatbot, tu peux toujours ouvrir `index.html` directement dans le navigateur.

## Où en est le projet

⚠️ La Journée Mondiale du Tourisme a lieu du **23 au 27 septembre 2026** — il reste très peu de temps.

Site en ligne : **https://camtour-ai.netlify.app/**

Plan complet : `C:\Users\Rol-User\.claude\plans\stateful-yawning-puppy.md`

- [x] Phase 1 — Squelette et navigation
- [x] Phase 2 — Chatbot IA multilingue (testé et fonctionnel en ligne)
- [x] Phase 3 — Écotourisme (13 parcs/réserves/sites naturels)
- [x] Phase 4 — Culture, gastronomie, artisanat (4 aires culturelles, 14 mets)
- [x] Phase 5 — Annuaire d'hôtels (16 hôtels, recherche ville/budget)
- [x] Phase 6 — Finitions et préparation démo (côté code ; reste la répétition et la vidéo de secours côté utilisateur)

## Script de démo (5 minutes)

1. **Intro (30s)** — présente le contexte : concours « L'IA dans le Tourisme », JMT 2026. Ouvre la page d'accueil.
2. **Page d'accueil (20s)** — montre les 4 axes du site (écotourisme, culture &amp; gastronomie, hôtels, assistant IA).
3. **Assistant IA en direct (90s)** — clique sur la bulle de chat et pose 2-3 vraies questions devant le jury, par exemple :
   - En français : *« Quel parc me conseilles-tu si j'aime les gorilles ? »*
   - En anglais : *« Can you suggest a traditional dish from the North-West region? »*
   - Montre que l'assistant s'appuie sur le contenu du site (pas d'invention) et privilégie le tourisme durable.
4. **Contenu du site (60s)** — parcours rapide des pages Écotourisme, Culture &amp; Gastronomie, puis Hôtels (montre le filtre par ville/budget).
5. **Page « À propos » (20s)** — montre explicitement comment le projet répond aux 4 critères du jury.
6. **Conclusion (20s)** — rappelle l'ambition : une seule plateforme pour tout le tourisme camerounais, prête à être enrichie avec de vrais partenaires après le concours.

## Avant la démo — checklist

- [ ] Tester le Wi-Fi sur place à Yaoundé avant le passage (le site et le chatbot ont besoin d'internet).
- [ ] Préparer une **vidéo de secours** en cas de coupure Wi-Fi le jour J : enregistre un screen recording de ce script de démo en amont (par ex. avec l'enregistreur d'écran Windows : `Win + Alt + R`), et garde-la accessible **hors ligne** (clé USB ou stockée localement sur l'ordinateur de démo, pas seulement dans le cloud).
- [ ] Charger complètement le téléphone/ordinateur utilisé pour la démo.
- [ ] Répéter le script à voix haute au moins une fois avant le jour J.
- [ ] Vérifier que le site est bien accessible publiquement (`https://camtour-ai.netlify.app/`) depuis un réseau différent de chez toi (ex. data mobile).

## État des photos — à vérifier / remplacer plus tard

Toutes les photos actuellement dans `images/` sont bien présentes et s'affichent (fichiers JPEG valides, vérifiés), mais **la plupart ne sont pas de vraies photos des lieux réels** — ce sont des photos libres de droits génériques qui illustrent le thème (ex. "éléphants en savane" pour Waza, pas une photo prise à Waza). Liste détaillée dans `a-propos.html` (section « Crédits photos »). À remplacer en priorité si tu trouves de vraies photos des lieux :

**Photos génériques (illustration du thème, pas le lieu exact) :**
- `images/eco/waza.jpg`, `korup.jpg`, `dja.jpg`, `lobeke.jpg`, `mont-cameroun.jpg`, `benoue.jpg`, `mefou.jpg`, `lac-ossa.jpg` — photos Pexels génériques (éléphants, gorille, canopée, paysage volcanique... pas forcément le bon pays ni le bon site)
- `images/eco/chutes-lobe.jpg` — ⚠️ à remplacer en priorité : c'est en réalité une photo de la **côte californienne**, pas des chutes de la Lobé à Kribi
- `images/dishes/*.jpg` et `images/culture/*.jpg` — illustrations génériques (plat ou scène similaire, pas forcément camerounais)
- `images/hero.jpg` — photo "Douala au coucher du soleil" (Pexels), à vérifier si c'est vraiment Douala

**Photos réelles du lieu exact (Wikimedia Commons, ajoutées en septembre 2026) :**
- `images/eco/ekom-nkam.jpg` — vraies chutes d'Ekom-Nkam
- `images/eco/campo-maan.jpg` — vrai gorille du programme d'habituation du parc de Campo-Ma'an
- `images/eco/bamboutos.jpg` — vraie cascade dans les Monts Bamboutos
- `images/eco/menchum.jpg` — vraies chutes de la Menchum

**Note sur le téléchargement :** la connexion internet de l'environnement de travail a été instable pendant la récupération de ces 4 dernières photos (plusieurs tentatives ont échoué ou ont été coupées avant de réussir, et un premier essai pour les Bamboutos avait renvoyé une carte topographique au lieu d'une photo — écarté avant l'ajout au site). Le résultat final a été vérifié visuellement et techniquement (fichiers non corrompus), mais si tu remplaces des photos toi-même, vérifie que le fichier téléchargé s'ouvre bien avant de l'ajouter.

## Structure du projet

- `index.html`, `eco-tourisme.html`, `culture-gastronomie.html`, `hotels.html`, `a-propos.html` — les pages du site
- `css/style.css` — le style visuel (couleurs, mise en page, menu mobile, bulle de chat)
- `js/main.js` — le comportement du menu
- `js/chatbot-widget.js` — la bulle de discussion, parle à `/api/chat`
- `data/chatbot-knowledge.json` — les informations que connaît le chatbot (à enrichir en Phases 3-5)
- `netlify/functions/chat.js` — la fonction serveur qui appelle l'API Claude (clé API gardée secrète)
- `.env.example` — modèle pour ta clé API en local (jamais la vraie clé dans le code)
