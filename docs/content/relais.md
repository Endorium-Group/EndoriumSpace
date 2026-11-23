# Relais de site (Enterprise)

Un **relais** rend joignables depuis le bastion les machines d'un autre site — une agence, un cabinet, un client — **sans ouvrir de port** sur la box ni monter de VPN. C'est le relais qui appelle le bastion.

```
site distant                                   bastion
 poste 192.168.1.10:3389 ◄─┐
 NAS   192.168.1.20:445  ◄─┤ relais ══ wss sortant ══► /api/relays/tunnel ──► sessions SSH, RDP, web, fichiers…
                            └ (boîtier, NAS, Docker)
```

## Principe

- Le relais ouvre **une liaison sortante** chiffrée (WebSocket sur HTTPS) vers le bastion et la garde ouverte ; il en ouvre deux par défaut, pour la tolérance aux pannes.
- Les flux des sessions sont **multiplexés** sur cette liaison.
- Une ressource **rattachée** à un relais n'est jamais jointe directement : si le relais est hors ligne, la session est refusée avec un message clair.
- Le relais garde sa propre liste de cibles autorisées : même le bastion ne peut lui demander autre chose.

Tous les accès passent par le relais : SSH et transferts de fichiers, RDP (agent et navigateur), VNC, navigateur isolé et [machine de rebond](#/machine-de-rebond), [accès direct](#/acces-direct), partages SMB, tunnels de l'agent.

## Installer un relais

Trois formes, au choix de la personne sur place :

| Forme | Pour qui |
|---|---|
| **Image pour mini PC** | Un boîtier dédié : on écrit l'image sur une clé USB ou le disque (balenaEtcher, Rufus), on branche, on allume. *Secure Boot* compatible ; mises à jour de sécurité automatiques. |
| **Paquet Synology (DSM 7)** | Un NAS déjà en place : installation manuelle du `.spk`, l'assistant demande le bastion, le code et les cibles. |
| **Docker** | Une machine qui fait déjà tourner Docker : `ghcr.io/endorium-group/endoriumfort-relay`. |

Dans les trois cas, le relais affiche une **page de configuration** sur le réseau local (port `8080`, `18080` sur Synology).

## Enrôler par code

1. **Côté bastion** — *Administration › Relais › Enrôler un relais* : donnez un libellé (le nom du site) et cliquez **Générer un code**. Le code fait 8 caractères (sans 0/O/1/I/L), sert une fois et expire après quelques minutes.
2. **Côté site** — sur la page du relais, saisissez l'adresse du bastion, le code et les cibles (`IP:port`, une par ligne), puis **Connecter ce site**.
3. La carte de la console suit l'enrôlement et indique quand le relais est relié. La page du relais affiche **Connecté au bastion**, puis ne sert plus qu'à voir l'état.

Le relais reçoit un identifiant propre, conservé sur le boîtier (fichier en 0600) : aucun secret partagé à transmettre.

## Rattacher les ressources

Dans la fiche d'une ressource, choisissez le relais du site. Depuis *Administration › Relais*, un **test** vérifie que la cible répond à travers le relais.

Un relais se **renomme** ou se **révoque** depuis la console. La révocation conserve les rattachements : les ressources du site sont alors refusées, jamais jointes directement.

## Traçabilité et exploitation

- État en ligne / hors ligne, liaisons actives et dernier battement dans la console.
- Un relais redémarre seul avec le boîtier et se reconnecte seul après une coupure.
- `--reset` sur le relais efface son enrôlement (ou l'entrée de démarrage *reset* de l'image mini PC).

> Le mode entrant historique (proxy CONNECT en mTLS, port à ouvrir sur le site) est déprécié : une ressource rattachée à un relais entrant est refusée.
