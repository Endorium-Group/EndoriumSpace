# Journal d'audit

EndoriumFort journalise les événements de sécurité (connexions, MFA, gestion des utilisateurs et des ressources, sessions…) dans un **journal infalsifiable**.

## Infalsifiabilité (chaîne de hachage)

Chaque entrée du journal est **chaînée** à la précédente par un hachage. Toute modification ou suppression d'une entrée **rompt la chaîne** et devient détectable.

- Sans clé : chaîne **SHA-256** (détecte les altérations).
- Avec `ENDORIUMFORT_AUDIT_HMAC_KEY` : chaîne **HMAC** (résistante à la falsification par un attaquant qui ne connaît pas la clé). Stockez cette clé **hors** du volume de données.

## Vérifier l'intégrité

Depuis la console (section Audit), le bouton **« Vérifier l'intégrité »** recalcule la chaîne et indique si le journal est **intègre** ou à quelle ligne il a été rompu.

## Événements typiques

- `auth.login.success` / `auth.login.failure`, `auth.logout`
- `user.create` / `user.delete` / `user.password.change`
- `resource.create` / `resource.update` / `resource.delete`
- `session.create` / `session.terminate`

## Rétention

La rétention et la rotation du journal sont **configurables** (voir [Configuration](#/configuration)) :

- `ENDORIUMFORT_AUDIT_MAX_FILE_MB` — archive le journal actif au-delà d'une taille.
- `ENDORIUMFORT_AUDIT_RETENTION_DAYS` — purge les archives au-delà de N jours.

> La conservation longue (ex. 12 mois PCI) et la minimisation (RGPD) peuvent s'opposer : fixez la politique selon votre contexte.
