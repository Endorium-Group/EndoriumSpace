<p align="center">
  <img src="assets/logo-full-blue.png" alt="EndoriumFort" height="68">
</p>

<h1 align="center">EndoriumSpace</h1>

<p align="center">
  Site vitrine d'EndoriumFort — bastion PAM souverain et auto-hébergé.<br>
  Statique, sans dépendance, sans étape de build.
</p>

<p align="center">
  <a href="https://endorium.space"><img src="https://img.shields.io/website?url=https%3A%2F%2Fendorium.space&style=flat-square&label=endorium.space" alt="Site"></a>
  <img src="https://img.shields.io/badge/HTML%20%7C%20CSS%20%7C%20JS-E34F26?style=flat-square&logo=html5&logoColor=white" alt="Stack">
  <img src="https://img.shields.io/badge/dépendances-0-0e8a16?style=flat-square" alt="Zéro dépendance">
  <img src="https://img.shields.io/badge/nginx%20%7C%20Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Déploiement">
</p>

---

## Présentation

Site marketing du produit [EndoriumFort](https://github.com/Endorium-Group/EndoriumFort-CE),
en français. Le design reprend celui de l'UI du produit : mêmes tokens de
couleur, Space Grotesk et IBM Plex, accent bleu vers cyan, thème clair et
sombre.

Trois espaces s'ajoutent à la page d'accueil : la documentation, un fil de
questions communautaires, et les pages légales. Leur contenu est écrit en
Markdown. Pour les moteurs de recherche, chaque page de documentation et
chaque question a sa propre URL (`/docs/coffre/`, `/community/postgresql/`),
pré-rendue en HTML par `scripts/build.mjs` et versionnée : le site reste servi
tel quel, sans étape de build au déploiement.

---

## Structure

```
EndoriumSpace/
├── index.html          page d'accueil, toutes les sections
├── styles.css          système de design (clair + sombre)
├── main.js             thème, menu mobile, onglets, copie, animations
├── robots.txt          déclare le sitemap
├── sitemap.xml         URL de référence (généré)
├── assets/
│   ├── logo-*.png      logos repris du produit
│   ├── app.css         styles des espaces docs/community/legal
│   ├── md.js           rendu Markdown (navigateur et générateur)
│   ├── page.js         thème, sommaire mobile, copie (pages générées)
│   ├── docs.js         recherche de la doc, anciens liens docs/#/<page>
│   └── sizing.js       calculateur de dimensionnement (section #sizing)
├── docs/
│   ├── nav.js          sommaire : sections, pages, meta descriptions
│   ├── content/        pages Markdown (source)
│   ├── index.html      introduction (généré)
│   └── <page>/         une page par entrée du sommaire (généré)
├── community/
│   ├── index.html      liste des questions (liste générée entre marqueurs)
│   ├── data/           contenu des questions (source)
│   ├── <slug>/         une page par question (généré)
│   └── question.html   anciens liens ?id= → page de la question
├── legal/
│   ├── index.html      espace légal
│   └── content/        mentions, politiques
├── scripts/build.mjs   générateur des pages statiques (Node, sans dépendance)
├── nginx.conf          redirections (index.html → /, /demo/ → GitHub Pages), 404
├── Dockerfile          image nginx servant le site
└── docker-compose.yml  service pour un reverse-proxy Caddy existant
```

---

## Aperçu local

Les chemins d'assets sont relatifs, donc n'importe quel serveur statique suffit.

```bash
python3 -m http.server 8080
# puis ouvrir http://localhost:8080
```

| Alternative | Commande |
|---|---|
| Node | `npx serve` |
| PHP | `php -S localhost:8080` |
| Caddy | `caddy file-server --listen :8080` |

Ouvrir `index.html` par `file://` casse le rendu Markdown de l'espace `legal/`
et la recherche : il faut passer par un serveur HTTP.

---

## Pages générées et référencement

Après toute modification de `docs/content/`, `docs/nav.js` ou
`community/data/questions.js` :

```bash
node scripts/build.mjs           # régénère docs/<page>/, community/<slug>/, sitemap.xml
node scripts/build.mjs --check   # ce que vérifie la CI (workflows Site check et Pages)
```

- **Ajouter une page de doc** : le fichier dans `docs/content/`, une entrée dans
  `docs/nav.js` avec une `description` de 120 à 155 caractères (meta description).
- **Ajouter une question** : un bloc dans `community/data/questions.js`, avec
  `slug` et `description` ; `seoTitle` raccourcit le `<title>` si la question
  est longue. Une réponse courte se positionne mal : viser 300 mots, avec des
  exemples de configuration.
- Les liens internes s'écrivent comme avant (`#/coffre`, `../docs/#/coffre`) :
  le générateur les réécrit vers les URL statiques, et échoue sur une page inconnue.
- Chaque page porte une URL canonique sur `https://endorium.space/` (les filtres
  `community/?tag=…` pointent vers `/community/`, la copie GitHub Pages vers le domaine).

---

## Démo interactive (`demo/`)
`/demo/` sert la vraie interface **EndoriumFort Enterprise** (dépôt privé
`NergYR/EndoriumFort`, version figée dans `.github/workflows/pages.yml`, seul `frontend/`
est récupéré), sans serveur : l'API est simulée dans le navigateur.

```
demo/
├── src/shim.js          # point d'entrée : intercepte fetch/WebSocket, sous-chemin, bandeau « Démo »
├── src/api.js           # API simulée (état en sessionStorage, réinitialisable)
├── src/shell.js         # terminal SSH / exec Kubernetes simulés, garde de commandes, enregistrement
├── src/host.js          # sorties des commandes des hôtes simulés
├── src/v56.js           # rapports (port de reporting.cc), transfert SSH, drive de fichiers
├── src/workspace.js     # portail Workspace, aperçu filigrané, journal par fichier
├── src/jumphost.js      # machine de rebond : pages dessinées, liste blanche, dossier de session, drives
├── src/recent.js        # réglages RDP navigateur/RemoteApp et accès direct posés sur des ressources
├── src/fixtures.json    # réponses enregistrées depuis un vrai bastion Enterprise
├── capture/             # régénère fixtures.json (voir capture/README.md)
├── vite.config.demo.mjs # build du frontend pour la démo (sources produit non modifiées)
└── build.sh             # demo/build.sh <checkout EndoriumFort> <sortie> [base]
```

- Connexion avec n'importe quel mot de passe : `admin`, `c.moreau` (opérateur), `s.lefevre` (auditeur),
  `m.durand` (rôle Workspace : le portail à tuiles des collaborateurs).
- Simulé avec l'état de l'onglet : politiques JIT, profils, demandes et double validation,
  ouverture de session (motif, ticket, objectif, MFA), coffre (mot de passe injecté), terminal SSH
  et exec Kubernetes, garde de commandes, enregistrements rejouables, Session DNA et paquets de preuve
  (chaîne recalculée comme sur le bastion), journal, rapports d'activité (calculés sur le journal,
  avec 180 jours d'historique simulé), transfert de fichiers SSH, drive de fichiers et partages ; Endorium Workspace (`demo/src/workspace.js`) :
  portail et ressources publiées, partage « aperçu seulement » avec aperçu filigrané (image dessinée
  dans le navigateur à la place du flux du navigateur isolé), journal par fichier (Journal › Fichiers)
  et pack de preuve des fichiers ; machine de rebond (`demo/src/jumphost.js`, ressource
  `bureau-rebond`, compte `c.moreau`) : bureau, navigateur aux pages dessinées dans le navigateur
  (intranet, wiki, supervision), liste blanche portée du bastion (site refusé), dossier de session,
  presse-papiers, copie vers les drives, fenêtres Terminal, journal `jumphost.*`.
- Montré par les réglages des ressources (`demo/src/recent.js`) : RDP dans le navigateur et
  application publiée (`win-rds-01`), accès direct avec connexion automatique et règles de
  transfert (`grafana`) ; leur ouverture affiche un message.
- Rejoué tel qu'enregistré : SSO, LDAP, SCIM, SIEM/ITSM, relais, cluster, ITDR, centre de sécurité.
- Non simulé : navigateur isolé (RBI) hors aperçu de document et machine de rebond, VNC, RDP et
  accès direct (message explicite).
- Données 100 % fictives ; rien ne quitte le navigateur.

Build local :
```bash
git clone --depth 1 --branch dev https://github.com/NergYR/EndoriumFort /tmp/ee   # accès requis
demo/build.sh /tmp/ee ./_site/demo /demo/
```

Après une montée de version : changer `EE_REF` dans le workflow, relancer la capture
(`demo/capture/README.md`) et vérifier la démo.

## Déploiement

### GitHub Pages (en place)
Le workflow `.github/workflows/pages.yml` publie le site + la démo à chaque push sur `master`
(ou à la main, avec un tag au choix) sur https://endorium-group.github.io/EndoriumSpace/.
Prérequis une seule fois :
- *Settings → Pages → Source : GitHub Actions* ;
- secret `EF_SOURCE_TOKEN` : jeton *fine-grained*, accès **lecture seule « Contents »** au seul
  dépôt `NergYR/EndoriumFort` (le workflow n'en récupère que `frontend/`).
`404.html` renvoie les liens profonds de la démo (ex. `/demo/sessions`) vers l'application.

### Hébergeur statique

N'importe lequel convient — Netlify, Vercel, Cloudflare Pages, GitHub Pages,
nginx. Il suffit de servir ce répertoire tel quel, racine comprise.

### Docker derrière un reverse-proxy Caddy

L'image fournie sert le site en HTTP ; Caddy termine le TLS.

```bash
docker network ls                  # relever le réseau de Caddy, ex. reverse_default
# ajuster `name:` dans docker-compose.yml si besoin
docker compose up -d --build
```

Bloc Caddyfile correspondant — le conteneur s'appelle `endoriumspace`, port 80 :

```
endorium.space {
    import tls_alpn_only
    reverse_proxy endoriumspace:80
}
```

`nginx.conf` (dans l'image) redirige déjà `…/index.html` vers `…/` (301) et
`/demo/` vers la démo publiée sur GitHub Pages (302) : rien à ajouter côté Caddy.

Recharger ensuite Caddy (`caddy reload`, ou
`docker exec <caddy> caddy reload --config /etc/caddy/Caddyfile`). Pour publier
une mise à jour : `docker compose up -d --build`.

---

## À compléter avant mise en ligne

Les valeurs entre crochets sont des placeholders.

| Placeholder | Emplacement | Remplacer par |
|---|---|---|
| `[contact@votre-domaine]` | CTA et pied de page | l'adresse de contact réelle |
| `[lien-depot-public]` | pied de page | l'URL du dépôt CE |
| `[lien-documentation]` | pied de page | l'URL de la documentation |
| `[Mentions légales à compléter]` | `legal/content/` | les mentions légales |
| `og:image` | `index.html` | une URL **absolue**, sinon l'aperçu au partage est vide |
| URL de registre et de chart | section Déploiement | les URL réelles |

---

## Règles de contenu

Contraignantes : elles protègent la crédibilité du produit, et nous exposent
juridiquement si elles sont enfreintes.

- **Aucune fabrication** — pas de faux clients, logos, témoignages, chiffres ni
  certifications.
- **Conformité** — écrire « conçu pour s'aligner » ou « prêt pour l'audit »,
  jamais « certifié » : aucun audit tiers n'a été réalisé à ce jour.
- **Aucun secret réel** dans les exemples de code.

---

## Version anglaise

Le site est en français. Pour l'anglais : dupliquer `index.html` en
`en/index.html`, traduire, puis ajouter un sélecteur de langue dans l'en-tête.

---

## Liens

| Ressource | Lien |
|---|---|
| Produit (Community Edition) | [Endorium-Group/EndoriumFort-CE](https://github.com/Endorium-Group/EndoriumFort-CE) |
| Documentation produit | [docs/index.md](https://github.com/Endorium-Group/EndoriumFort-CE/blob/master/docs/index.md) |
| Site en production | [endorium.space](https://endorium.space) |
