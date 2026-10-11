# Durcissement

Recommandations pour une mise en production sûre. La plupart des contrôles ont un **défaut conforme** et sont réglables par variable d'environnement (voir aussi [Configuration](#/configuration)).

## TLS

- Placez EndoriumFort derrière un **certificat TLS valide** (reverse-proxy ou certificat monté). nginx intégré sert déjà le HTTPS ; fournissez votre certificat en production plutôt que l'auto-signé par défaut.
- N'exposez pas le port **80** sans redirection vers HTTPS.

## Authentification

- `ENDORIUMFORT_REQUIRE_MFA=all` — MFA obligatoire pour tous (défaut).
- `ENDORIUMFORT_PASSWORD_MIN_LENGTH=12` — longueur minimale (défaut 12, plancher 8).
- `ENDORIUMFORT_PASSWORD_HISTORY=5` — interdit la réutilisation des N derniers mots de passe.
- `ENDORIUMFORT_IDLE_TIMEOUT_SECONDS=900` — déconnexion après inactivité (15 min).
- `ENDORIUMFORT_TOKEN_TTL_SECONDS=3600` — durée de vie absolue de session.

## Chiffrement

- `ENDORIUMFORT_VAULT_KEY` — **obligatoire** pour chiffrer le coffre (sinon les secrets ne sont pas protégés). `openssl rand -hex 32`.
- `ENDORIUMFORT_DB_ENCRYPTION_KEY` — chiffre **toute la base au repos** (SQLCipher). Si une clé est posée sans support SQLCipher, le service **refuse de démarrer** (jamais de clair silencieux).
- `ENDORIUMFORT_AUDIT_HMAC_KEY` — rend le journal d'audit **infalsifiable** par HMAC. Stockez-la **hors** du volume de données.

> Conservez ces clés dans un gestionnaire de secrets, **séparément** des sauvegardes de données.

## Comptes

- Changez immédiatement le mot de passe admin initial.
- Appliquez le **moindre privilège** via les rôles ([Utilisateurs & rôles](#/utilisateurs)).

## Conteneur & réseau

- Le backend tourne déjà en **non-root** dans l'image.
- Limitez l'exposition réseau au strict nécessaire ; placez le bastion sur un segment d'administration dédié.
- Tenez l'image **à jour** ([Mise à jour](#/mise-a-jour)).

## Base au repos : migrer une base existante en clair

Si vous activez `ENDORIUMFORT_DB_ENCRYPTION_KEY` sur une base déjà créée en clair, ajoutez au **premier redémarrage** :

```
ENDORIUMFORT_DB_ENCRYPTION_MIGRATE=1
```

La base est chiffrée en place (une sauvegarde `.plaintext.bak` est conservée) ; retirez ensuite le flag.
