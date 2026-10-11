# MFA — TOTP & passkeys

EndoriumFort prend en charge deux seconds facteurs : **TOTP** (applications d'authentification) et **passkeys/WebAuthn** (biométrie, clés FIDO2).

## Politique globale

La variable `ENDORIUMFORT_REQUIRE_MFA` contrôle l'exigence :

| Valeur | Effet |
|---|---|
| `all` (défaut) | MFA obligatoire pour **tous** les comptes |
| `admins` | MFA obligatoire pour les administrateurs seulement |
| `none` | MFA facultative |

Avec `all`, un utilisateur sans second facteur est **bloqué** (hors écrans d'enrôlement) tant qu'il n'en a pas enrôlé un. L'enforcement est **côté serveur**.

## Enrôler un TOTP

1. **Profil → Sécurité → Activer la 2FA (TOTP)**.
2. Scannez le QR code avec votre application (ou saisissez le secret manuel).
3. Validez avec le code à 6 chiffres.

## Enrôler une passkey (WebAuthn)

1. **Profil → Sécurité → Ajouter une passkey**.
2. Suivez l'invite du navigateur (biométrie, code de l'appareil, ou clé de sécurité).

Pour WebAuthn, le domaine doit être correctement configuré (`ENDORIUMFORT_WEBAUTHN_RP_ID` / `ENDORIUMFORT_WEBAUTHN_ORIGIN`) — en dev, `localhost` fonctionne.

## Bonnes pratiques

- Enrôlez **au moins deux facteurs** (ex. une passkey + un TOTP de secours).
- Gardez `ENDORIUMFORT_REQUIRE_MFA=all` en production.
- Combinez avec un **timeout d'inactivité** (voir [Durcissement](#/durcissement)).
