# Variables d'environnement

Référence des variables lues par l'édition Community. Toutes ont un défaut ; seules les **clés** sont à fournir obligatoirement en production.

Docker : section `environment` du fichier compose, ou `-e` de `docker run`. Paquet Debian : `/etc/endoriumfort/endoriumfort.env`. Helm : `config`, `secrets` ou `extraEnv`. Un changement prend effet au **redémarrage** du bastion.

## Clés et secrets

| Variable | Défaut | Rôle |
|---|---|---|
| `ENDORIUMFORT_VAULT_KEY` | *(vide)* | Clé du coffre, 64 caractères hexadécimaux. **Vide ou invalide : secrets stockés en clair.** |
| `ENDORIUMFORT_AUDIT_HMAC_KEY` | *(vide)* | Clé de la chaîne d'audit (hexadécimal ou phrase de passe). Vide : chaîne SHA-256 sans clé. |
| `ENDORIUMFORT_FILESHARE_SECRET` | *(vide)* | Clé des tickets du partage de fichiers, 32 caractères au moins, identique des deux côtés. |
| `ENDORIUMFORT_FILESHARE_SECRET_FILE` | *(vide)* | Variante : chemin d'un fichier contenant cette clé. |

Générez chaque clé avec `openssl rand -hex 32`, et conservez-les hors de l'hôte.

## Réseau et TLS

| Variable | Défaut | Rôle |
|---|---|---|
| `EF_HTTP_PORT` / `EF_HTTPS_PORT` | `80` / `443` | Ports publiés sur l'hôte (fichier compose). |
| `ENDORIUMFORT_PORT` | `8080` | Port interne du backend. À ne changer qu'en connaissance de cause. |
| `ENDORIUMFORT_TRUSTED_PROXIES` | *(vide)* | Adresses ou CIDR des reverse-proxys dont `X-Forwarded-For` est cru. |
| `ACME_ENABLED` | `0` | `1` : certificat Let's Encrypt automatique. |
| `ACME_DOMAIN` / `ACME_EMAIL` | *(vide)* | Nom DNS public et adresse de contact pour Let's Encrypt. |
| `TZ` | `Europe/Paris` | Fuseau horaire du conteneur. Le journal reste horodaté en UTC. |

## Authentification

| Variable | Défaut | Rôle |
|---|---|---|
| `ENDORIUMFORT_TOKEN_TTL_SECONDS` | `3600` | Durée de vie d'une connexion à la console. |
| `ENDORIUMFORT_WEBAUTHN_RP_ID` | *(auto)* | Domaine des passkeys, ex. `bastion.example.com`. |
| `ENDORIUMFORT_WEBAUTHN_ORIGIN` | *(auto)* | Origine exacte, ex. `https://bastion.example.com`. |
| `ENDORIUMFORT_WEBAUTHN_CHALLENGE_TTL_SECONDS` | `180` | Délai pour répondre à une demande de passkey. |

## Base de données

| Variable | Défaut | Rôle |
|---|---|---|
| `ENDORIUMFORT_DB_DSN` | *(vide)* | Vide ou chemin : SQLite. `postgresql://…` : PostgreSQL. Voir [Base de données](#/base-de-donnees). |

## Sessions SSH

| Variable | Défaut | Rôle |
|---|---|---|
| `ENDORIUMFORT_SSH_RESUME_GRACE_SECONDS` | `120` | Délai de reprise d'une session dont la page s'est fermée (0 à 3600 ; 0 = fin immédiate). |
| `ENDORIUMFORT_SSH_TRANSFER_MAX_UPLOAD_MB` | `100` | Taille maximale d'un dépôt de fichier SSH (1 à 10 240). Aussi réglable dans **Administration → Sécurité**. |

## Navigateur isolé

| Variable | Défaut | Rôle |
|---|---|---|
| `ENDORIUMFORT_RBI_ENGINE` | *(auto)* | `tiles` ou `cdp`. Automatique selon l'image. |
| `ENDORIUMFORT_RBI_MAX_SESSIONS` | `12` | Navigateurs isolés simultanés. |
| `ENDORIUMFORT_RBI_MAX_FPS` | `20` | Images par seconde (0 à 60). |
| `ENDORIUMFORT_RBI_JPEG_QUALITY` | `55` | Qualité d'image (1 à 100). |
| `ENDORIUMFORT_RBI_MAX_WIDTH` / `_MAX_HEIGHT` | `1600` / `900` | Résolution maximale. |
| `ENDORIUMFORT_RBI_MAX_UPLOAD_MB` | `0` | Taille maximale d'un dépôt (0 = sans limite). |
| `ENDORIUMFORT_RBI_CHROMIUM` | *(auto)* | Chemin du navigateur, pour le moteur `cdp`. Par défaut, le premier Chromium trouvé dans le `PATH`. |
| `ENDORIUMFORT_RBI_FLAGS` | *(vide)* | Options supplémentaires passées au navigateur. |

> D'autres variables `ENDORIUMFORT_RBI_*` (sens de transfert autorisés, extensions bloquées…) apparaissent dans le code : elles relèvent de la gouvernance des transferts de l'édition Enterprise et **n'ont aucun effet en CE**. Voir [Navigateur isolé](#/proxy-rbi).

## Partage de fichiers

| Variable | Côté | Défaut | Rôle |
|---|---|---|---|
| `ENDORIUMFORT_FILESHARE_UPSTREAM` | bastion | *(vide)* | URL du service, ex. `http://endoriumfort-files:8090`. Vide : `/files/` répond 503. |
| `ENDORIUMFORT_FILESHARE_MAX_BODY` | bastion | `2g` | Taille maximale d'une requête vers `/files/`. |
| `EF_FS_QUOTA_MB` | service | `10240` | Quota par lecteur utilisateur (0 = illimité). |
| `EF_FS_MAX_UPLOAD_MB` | service | `2048` | Taille maximale d'un fichier. |
| `EF_FS_SESSION_TTL_SECONDS` | service | `900` | Durée d'accès au lecteur entre deux renouvellements. |
| `EF_FS_MAX_ZIP_ENTRIES` | service | `20000` | Éléments maximum d'un dossier téléchargé en `.zip`. |
| `EF_FS_LISTEN` / `EF_FS_DATA_DIR` | service | `:8090` / `/data` | Écoute et stockage. |
| `EF_FS_COOKIE_SECURE` | service | `auto` | `auto` suit `X-Forwarded-Proto`. |

## Ce qui n'est pas réglable

Pour éviter les surprises, quelques valeurs **fixes** en CE :

- politique de mot de passe : 8 caractères, majuscule, minuscule, chiffre ;
- limitation de débit des connexions : 10 échecs en 5 minutes, puis blocage progressif ;
- MFA imposée aux administrateurs, facultative pour les autres ;
- pas de déconnexion sur inactivité, ni de rotation automatique du journal d'audit.

Le fichier compose fourni déclare aussi des variables propres aux modules Enterprise (relais, etc.) : elles sont sans effet en CE.
