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

## Déploiement

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
