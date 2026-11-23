# Accès direct aux applications web

Une ressource web s'ouvre au choix de l'administrateur, ressource par ressource :

| | Navigateur isolé | Accès direct |
|---|---|---|
| Fluidité | images de la page | native |
| Ce qui arrive sur le poste | des pixels | le contenu de l'application |
| WebSocket, applications modernes | oui | oui |
| Traçabilité | vidéo, journal | journal HTTP |

L'accès direct convient aux applications métier du quotidien (comptabilité, GED, intranet) ; le [navigateur isolé](#/proxy-rbi) reste le choix pour l'administration et les données sensibles. Les ressources à risque élevé ou critique restent dans le navigateur isolé, sauf `ENDORIUMFORT_APPS_ALLOW_HIGH_RISK=1`.

## Principe

Chaque application a **son propre sous-domaine** : `compta.apps.cabinet.fr`, `ged.apps.cabinet.fr`. Elle s'y croit chez elle : aucune réécriture d'URL.

```
navigateur ──https://compta.apps.cabinet.fr──► nginx du bastion ──► passerelle d'applications ──► application interne
                                                                        │ session active ?
                                                                        └──────► bastion
```

1. L'utilisateur ouvre la ressource : le bastion ouvre une **session** selon les règles habituelles (MFA, appareil connu, horaires, approbation).
2. Il signe un **ticket** à usage unique, valable une minute, et ouvre l'application dans un nouvel onglet.
3. La passerelle (conteneur séparé, profil compose `apps`) échange le ticket contre un cookie limité à ce sous-domaine, puis relaie l'application, WebSocket compris.
4. Elle vérifie régulièrement que la session est toujours active ; session terminée ⇒ accès fermé.

Le domaine d'applications ne doit pas être un parent du nom de la console (console `bastion.cabinet.fr`, applications `*.apps.cabinet.fr`).

## Mise en place

1. Dans `.env` : `ENDORIUMFORT_APPGATE_SECRET=<openssl rand -hex 32>` et `COMPOSE_PROFILES=apps`, puis `docker compose up -d`.
2. **Administration › Accès applicatif** : saisissez le domaine. La page vérifie le DNS (et donne l'enregistrement `CNAME` à créer), le certificat joker (importable en PEM, échéance surveillée chaque jour), et l'état de chaque application publiée.
3. Sur la ressource : **Mode d'accès web** = *Accès direct*, et un sous-domaine.

nginx est reconfiguré tout seul, validé et rechargé ; en cas d'erreur, la configuration précédente est conservée.

## Certificat automatique (Enterprise)

Le bastion obtient et renouvelle le certificat joker par ACME DNS-01 (Let's Encrypt ou autorité ACME privée) et crée l'enregistrement DNS chez Cloudflare, OVHcloud, Gandi, Infomaniak, Route 53 ou tout serveur RFC 2136. Les identifiants du fournisseur DNS sont chiffrés avec la clé du coffre.

## Connexion automatique (Enterprise)

L'application s'ouvre **déjà connectée** avec le compte du coffre :

| Mode | Fonctionnement |
|---|---|
| Authentification HTTP | la réponse est donnée par le bastion |
| Formulaire | adresse de la page de connexion, et sélecteurs CSS des champs identifiant, mot de passe et bouton |

En accès direct, c'est la passerelle qui se connecte et garde les cookies de l'application : aucun cookie de l'application n'arrive au navigateur. Dans le navigateur isolé, aucune image n'est envoyée avant la fin de la connexion. Le mot de passe n'atteint jamais le poste, l'écran ni les journaux.

## Règles de transfert (Enterprise)

Par application en accès direct :

- téléchargements et envois **autorisés**, **limités** à certains types de fichiers et à une taille, ou **bloqués** ;
- mode **lecture seule** ;
- **pas de cache** sur le poste ;
- **Content-Security-Policy** imposée.

Un envoi est inspecté avant d'être transmis. Un transfert bloqué affiche une page explicative, est journalisé (`webapp.dlp.blocked`) et remonte au centre de sécurité.

## Traçabilité

La passerelle tient un journal chaîné : ouverture et fermeture, requêtes, envois, téléchargements, WebSocket, connexions automatiques, blocages.

> **Démo** — la ressource **grafana** montre un accès direct avec connexion automatique et règles de transfert (*Administration › Ressources*). L'ouverture elle-même demande un vrai bastion et sa passerelle : la démo l'indique.
