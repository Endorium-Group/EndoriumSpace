# Variables d'environnement

Référence des principales variables de l'édition Community. Toutes ont un défaut ; les réglages liés à la sécurité ont des **défauts conformes**.

> Au démarrage, le conteneur journalise une ligne `[config] …` récapitulant les valeurs effectives.

## Réseau

| Variable | Défaut | Rôle |
|---|---|---|
| `ENDORIUMFORT_PORT` | `8080` | Port interne du backend (nginx expose 80/443). |

## Authentification & session

| Variable | Défaut | Rôle |
|---|---|---|
| `ENDORIUMFORT_REQUIRE_MFA` | `all` | `all` / `admins` / `none`. |
| `ENDORIUMFORT_IDLE_TIMEOUT_SECONDS` | `900` | Timeout d'inactivité (0 = désactivé). |
| `ENDORIUMFORT_TOKEN_TTL_SECONDS` | `3600` | Durée de vie absolue de session. |
| `ENDORIUMFORT_PASSWORD_MIN_LENGTH` | `12` | Longueur minimale (plancher 8). |
| `ENDORIUMFORT_PASSWORD_HISTORY` | `5` | Non-réutilisation des N derniers (0 = désactivé). |
| `ENDORIUMFORT_BOOTSTRAP_ADMIN_PASSWORD` | *(vide)* | Mot de passe admin initial (sinon aléatoire, affiché une fois). |

## WebAuthn / passkeys

| Variable | Défaut | Rôle |
|---|---|---|
| `ENDORIUMFORT_WEBAUTHN_RP_ID` | *(auto)* | Domaine (ex. `app.example.com`). |
| `ENDORIUMFORT_WEBAUTHN_ORIGIN` | *(auto)* | Origine (ex. `https://app.example.com`). |

## Chiffrement

| Variable | Défaut | Rôle |
|---|---|---|
| `ENDORIUMFORT_VAULT_KEY` | *(vide)* | Clé du coffre (64 hex). Sans elle, les secrets ne sont pas chiffrés. |
| `ENDORIUMFORT_VAULT_KEY_OLD` | *(vide)* | Anciennes clés (CSV) pour la rotation sans interruption. |
| `ENDORIUMFORT_DB_ENCRYPTION_KEY` | *(vide)* | Chiffre la base au repos (SQLCipher). |
| `ENDORIUMFORT_DB_ENCRYPTION_MIGRATE` | *(vide)* | `1` pour chiffrer en place une base existante en clair. |

## Audit

| Variable | Défaut | Rôle |
|---|---|---|
| `ENDORIUMFORT_AUDIT_HMAC_KEY` | *(vide)* | Clé HMAC de la chaîne d'audit (à stocker hors du volume). |
| `ENDORIUMFORT_AUDIT_MAX_FILE_MB` | `0` | Rotation/archivage du journal (0 = off). |
| `ENDORIUMFORT_AUDIT_RETENTION_DAYS` | `0` | Purge des archives (0 = conserver). |

> Les variables liées aux fonctionnalités **Enterprise** (relais, push mobile, cluster…) sont documentées avec ces modules.
