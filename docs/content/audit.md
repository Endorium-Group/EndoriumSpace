# Journal d'audit

EndoriumFort écrit chaque événement de sécurité — connexions, sessions, transferts, administration, refus — dans un **journal infalsifiable**. Il est consultable dans la section **Journal** par les administrateurs et les auditeurs.

## Où il est stocké

Le journal est un fichier JSONL (un événement JSON par ligne), `audit-log.jsonl`, dans le volume de données (`/app/data` en Docker, `/var/lib/endoriumfort` en paquet Debian). Il est indépendant de la base : la base peut être en PostgreSQL, le journal reste sur le volume.

Chaque ligne porte :

| Champ | Contenu |
|---|---|
| `type` | le type d'événement, ex. `session.create` |
| `actor` | l'utilisateur à l'origine, ou `system` |
| `role` | son rôle au moment de l'action |
| `createdAt` | horodatage UTC |
| `payload` | le détail : ressource, session, motif, ticket, empreinte de fichier… |
| `prevHash` / `hash` | les maillons de la chaîne d'intégrité |

## Infalsifiabilité

Chaque entrée est **chaînée** à la précédente : son empreinte est calculée sur son contenu **et** sur l'empreinte de l'entrée d'avant. Modifier, insérer ou supprimer une ligne casse la chaîne à cet endroit.

- **Sans clé** : chaîne SHA-256. Elle détecte toute altération maladroite, mais quelqu'un qui a accès au fichier et connaît le procédé pourrait recalculer toute la chaîne.
- **Avec `ENDORIUMFORT_AUDIT_HMAC_KEY`** : chaîne HMAC-SHA256. Sans la clé, impossible de produire une chaîne valide. **C'est le réglage recommandé.**

```
ENDORIUMFORT_AUDIT_HMAC_KEY=<openssl rand -hex 32>
```

Stockez cette clé **hors** du volume de données : une clé posée à côté du journal ne protège de rien. Elle accepte une valeur hexadécimale ou une phrase de passe.

> Fixez la clé **dès l'installation**. Les lignes écrites avant restent vérifiées en SHA-256 simple.

## Vérifier l'intégrité

Dans **Journal**, **« Vérifier l'intégrité »** recalcule toute la chaîne et indique :

- si le journal est **intègre** ;
- sinon, le **numéro de la première ligne rompue** ;
- le nombre de lignes vérifiées, et si la chaîne est protégée par une clé.

C'est la preuve à fournir à un auditeur. Faites-le après chaque restauration et chaque mise à jour.

## Rechercher

Filtres disponibles, combinables :

- **Période** : date ou date-heure de début et de fin.
- **Utilisateur** : l'acteur exact.
- **Famille** : `session`, `auth`, `user`, `resource`… ou un type précis.
- **Catégorie** : échecs uniquement, ou actions d'administration uniquement.
- **Texte libre** : cherché partout dans l'événement, sans distinction de casse.
- **Session** : tous les événements d'une session donnée.

Depuis une session ou un utilisateur, les liens « Journal » ouvrent la vue déjà filtrée.

## Exporter

La vue **s'exporte en CSV** avec ses filtres actifs — pour un rapport de conformité, un dossier d'incident ou un tableur.

## Principaux événements

| Famille | Événements |
|---|---|
| Authentification | `auth.login.success`, `auth.login.failure`, `auth.login.rate_limited`, `auth.logout` |
| Comptes | `user.create`, `user.update`, `user.delete`, `user.password.change`, `user.webauthn.register`, `user.webauthn.delete` |
| Ressources | `resource.create`, `resource.update`, `resource.delete`, `credential.access` |
| Sessions | `session.create`, `session.purpose.bound`, `session.detached`, `session.resumed`, `session.shadow`, `session.terminate`, `session.close`, `session.expire` |
| Règles | `policy.decision.allow`, `policy.decision.deny`, `command_guard.block` |
| Fichiers | `ssh.file.download`, `ssh.file.upload`, `ssh.file.denied`, `fileshare.open`, `fileshare.purge` |
| Web | `rbi.open`, `rbi.close`, `web.proxy_access`, `web.proxy_error` |
| Plateforme | `settings.integration.updated`, `settings.integration.cleared`, `report.export` |

## Taille et conservation

Le journal n'est ni tourné ni purgé automatiquement : il grossit tant que le bastion fonctionne. Quelques centaines d'octets par événement : même une activité soutenue reste modeste, mais surveillez l'espace du volume.

Pour archiver, **ne modifiez pas le fichier en place** : ce serait indiscernable d'une falsification. Sauvegardez-le avec le reste du volume ([Sauvegarde](#/sauvegarde)) et conservez les archives selon votre politique.

> Conservation longue (12 mois pour PCI DSS, par exemple) et minimisation (RGPD) peuvent s'opposer : fixez la durée selon votre contexte.

## Vers un SIEM

Le fichier JSONL se collecte avec n'importe quel agent de logs (Vector, Fluent Bit, Promtail, Filebeat) en lecture seule. L'export natif et continu vers un SIEM relève de l'édition Enterprise.
