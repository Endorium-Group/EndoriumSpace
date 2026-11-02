# EndoriumSpace — site vitrine d'EndoriumFort

Site marketing statique pour **EndoriumFort** (bastion PAM souverain, auto-hébergé).
Design calqué sur l'UI du produit (tokens de couleur, Space Grotesk + IBM Plex, accent bleu→cyan, thème clair/sombre).

## Contenu
Site **statique** (HTML/CSS/JS), zéro dépendance, zéro étape de build.

```
.
├── index.html     # page unique (FR) — toutes les sections
├── styles.css     # système de design (clair + sombre)
├── main.js        # thème, menu mobile, onglets, copier, animations
├── assets/        # logos (repris du produit)
└── README.md
```

## Développement / aperçu local
Comme les chemins d'assets sont relatifs, un simple serveur statique suffit :

```bash
python3 -m http.server 8080
# puis ouvrir http://localhost:8080
```
(ou `npx serve`, `php -S localhost:8080`, etc.)

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
├── src/fixtures.json    # réponses enregistrées depuis un vrai bastion Enterprise
├── capture/             # régénère fixtures.json (voir capture/README.md)
├── vite.config.demo.mjs # build du frontend pour la démo (sources produit non modifiées)
└── build.sh             # demo/build.sh <checkout EndoriumFort> <sortie> [base]
```

- Connexion avec n'importe quel mot de passe : `admin`, `c.moreau` (opérateur), `s.lefevre` (auditeur).
- Simulé avec l'état de l'onglet : politiques JIT, profils, demandes et double validation,
  ouverture de session (motif, ticket, objectif, MFA), coffre (mot de passe injecté), terminal SSH
  et exec Kubernetes, garde de commandes, enregistrements rejouables, Session DNA et paquets de preuve
  (chaîne recalculée comme sur le bastion), journal, rapports d'activité (calculés sur le journal,
  avec 180 jours d'historique simulé), transfert de fichiers SSH, drive de fichiers et partages.
- Rejoué tel qu'enregistré : SSO, LDAP, SCIM, SIEM/ITSM, relais, cluster, ITDR, centre de sécurité.
- Non simulé : navigateur isolé (RBI), VNC et RDP (message explicite).
- Données 100 % fictives ; rien ne quitte le navigateur.

Build local :
```bash
git clone --depth 1 --branch v1.0.56 https://github.com/NergYR/EndoriumFort /tmp/ee   # accès requis
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

### Statique simple
N'importe quel hébergeur statique : **Netlify, Vercel, Cloudflare Pages, GitHub Pages, Nginx**.
Il suffit de servir le répertoire tel quel (racine = ce dossier).

### Docker + Caddy (reverse-proxy existant)
Une image nginx servant le site en HTTP est fournie (`Dockerfile` + `docker-compose.yml`).
Caddy termine le TLS et reverse-proxy vers le conteneur sur le réseau Docker partagé.

```bash
# 1. Vérifier le nom du réseau de Caddy
docker network ls              # ex. "reverse_default"
# 2. (si besoin) ajuster `name:` dans docker-compose.yml
# 3. Construire + démarrer
docker compose up -d --build
```

Bloc Caddyfile correspondant (le conteneur s'appelle `endoriumspace`, port 80) :

```
endorium.space {
    import tls_alpn_only
    reverse_proxy endoriumspace:80
}
```

Puis recharger Caddy (`caddy reload` ou `docker exec <caddy> caddy reload ...`).
Pour mettre à jour le site : `docker compose up -d --build`.

## À personnaliser avant mise en ligne
Les valeurs entre crochets `[...]` sont des **placeholders** :
- `[contact@votre-domaine]` — adresse de contact (CTA + footer).
- `[lien-depot-public]`, `[lien-documentation]` — liens du footer.
- `[Mentions légales à compléter]`.
- `index.html` → balise `og:image` : mettre une **URL absolue** (https://votre-domaine/assets/logo-full-blue.png) pour un bon rendu au partage.
- URL de registre/chart dans la section Déploiement (exemples à adapter).

## Règles de contenu (à respecter)
- **Aucune fabrication** : pas de faux clients, logos, témoignages, chiffres ni certifications.
- Conformité = **« conçu pour s'aligner / prêt pour l'audit »**, **jamais « certifié »** (aucun audit tiers à ce jour).
- Pas de secrets réels dans les exemples de code.

## Bilingue (EN)
Le site est en français. Pour une version anglaise, dupliquer `index.html` en `en/index.html`,
traduire le contenu et ajouter un sélecteur de langue dans l'en-tête.
