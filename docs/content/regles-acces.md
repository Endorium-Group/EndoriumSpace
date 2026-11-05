# Règles d'accès

Chaque ressource porte ses propres règles. Elles sont appliquées **par le serveur** à l'ouverture de chaque session : l'interface les affiche, mais ne les décide pas. Une session refusée produit un événement `policy.decision.deny` dans le [journal d'audit](#/audit), avec la raison.

Réglage : **Administration → Ressources → (la ressource) → Règles d'accès**. Le formulaire résume en direct **ce que les utilisateurs devront faire**.

## Niveau de risque

Quatre niveaux : **faible**, **moyen**, **élevé**, **critique**. Le niveau s'affiche sur la carte et pilote deux comportements :

- à partir de **élevé**, l'utilisateur doit indiquer l'**objet de la session** (120 caractères au plus) avant de l'ouvrir ;
- avec la **politique adaptative**, un niveau élevé ou critique exige aussi un **numéro de ticket**.

Le bilan de l'onglet **Sécurité** signale les ressources SSH à risque élevé sans garde-fou de commandes.

## Motif obligatoire

Cochez **Motif obligatoire** pour que chaque ouverture demande une justification (280 caractères au plus) et, en option, un numéro de ticket (80 caractères au plus).

Le motif et le ticket sont rattachés à l'événement d'ouverture de session dans le journal : un auditeur sait ensuite **pourquoi** quelqu'un s'est connecté, pas seulement **quand**.

## Politique adaptative

**Politique adaptative (ticket exigé si le risque est élevé)** : sur une ressource de niveau élevé ou critique, l'ouverture est refusée sans numéro de ticket. Sans effet sur une ressource de niveau faible ou moyen.

## Garde-fou SSH

**SSH guard (bloque les commandes dangereuses)** filtre côté serveur les commandes saisies dans la session, avant qu'elles n'atteignent la cible. Ressources SSH uniquement. Voir [Garde-fou de commandes SSH](#/garde-fou-ssh).

## Transfert de fichiers

Deux cases indépendantes, ressources SSH uniquement, **désactivées par défaut** :

- **Autoriser le téléchargement de fichiers depuis la cible** ;
- **Autoriser l'envoi de fichiers vers la cible**.

Voir [Session SSH](#/session-ssh).

## Approbation par un second administrateur

Cette case active la double validation, qui repose sur la file des demandes d'accès de l'édition **Enterprise**.

> **En CE, ne la cochez pas.** Sans file de demandes, un opérateur ne peut pas obtenir l'approbation exigée : la ressource devient inaccessible pour lui. Seuls les administrateurs peuvent encore l'ouvrir.

## Récapitulatif

| Règle | Ce que l'utilisateur doit fournir | Refus journalisé |
|---|---|---|
| Motif obligatoire | une justification | `missing_justification` |
| Risque élevé ou critique | l'objet de la session | `purpose_required` |
| Adaptative + risque élevé ou critique | un numéro de ticket | `ticket_required` |
| Garde-fou SSH | rien : les commandes interdites sont bloquées | `command_guard.block` |

## Bonnes pratiques

- Classez honnêtement les ressources : la production et les équipements réseau en **élevé** ou **critique**.
- Exigez un motif partout où un audit vous demandera de justifier les accès.
- Activez le garde-fou sur toutes les ressources SSH de production.
- N'activez le transfert de fichiers que dans le sens nécessaire.
