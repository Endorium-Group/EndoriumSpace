# RDP dans le navigateur et applications publiées (Enterprise)

Les postes et serveurs Windows s'ouvrent de deux façons :

| | RDP dans le navigateur | RDP par l'agent |
|---|---|---|
| Sur le poste | rien, un navigateur suffit | l'agent EndoriumFort et le client RDP du système (`mstsc`, FreeRDP) |
| Affichage | images dans la console | fenêtre native |
| Usage type | collaborateurs, prestataires, postes non gérés | administrateurs, longues sessions |

## RDP dans le navigateur

Le bastion confie la connexion à une passerelle RDP interne (`rdpgate`, conteneur séparé, écrite sans dépendance tierce). Elle ouvre la session avec le compte du **coffre** et ne renvoie au navigateur que l'image du bureau. Le mot de passe n'arrive jamais sur le poste.

Pour l'activer sur une ressource RDP : cocher **Ouvrir dans le navigateur** dans son profil RDP et renseigner le compte dans le coffre.

Prise en charge : TLS (vérification stricte, empreinte `sha256:` épinglée, ou ignorée en laboratoire), NLA (CredSSP / NTLMv2), clavier international, curseur distant, redimensionnement de la fenêtre, reconnexion automatique après une coupure réseau, reprise de la session si l'onglet se ferme par accident (60 s). Qualité d'image et images par seconde se règlent par ressource.

## Gouvernance

- **Presse-papiers texte** autorisé ou non, par ressource (désactivé par défaut). Chaque transfert est journalisé avec son sens, sa longueur et son empreinte SHA-256 — jamais le texte.
- **Enregistrement** de la session et relecture depuis les preuves.
- **Observation en direct** par un auditeur, en lecture seule, journalisée.

## Applications publiées (RemoteApp)

Une ressource peut publier **une seule application** d'un serveur Windows plutôt que le bureau entier : le logiciel de comptabilité, l'ERP. Elle s'ouvre comme une fenêtre locale, par l'agent (`mstsc` sous Windows, FreeRDP sous macOS et Linux).

| Réglage | Rôle |
|---|---|
| Programme | alias RemoteApp (`||compta`) ou chemin de l'exécutable |
| Arguments, dossier de travail | facultatifs |
| Presse-papiers, imprimantes, lecteurs | redirections, **désactivées par défaut**, choisies ressource par ressource |

Le profil est servi à l'agent par le bastion : changer un réglage dans la console suffit, rien n'est à redistribuer sur les postes.

> **Démo** — la ressource **win-rds-01** montre un profil RemoteApp ouvert dans le navigateur (*Administration › Ressources*). Le flux graphique lui-même n'est pas simulé.
