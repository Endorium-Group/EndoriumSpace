# Session SSH

EndoriumFort fournit un **terminal SSH dans le navigateur**. Aucun client SSH ni clé n'est à installer sur le poste de l'opérateur : le bastion ouvre la connexion vers la cible et relaie le terminal par WebSocket chiffré.

## Ouvrir une session

1. Sur la **Carte**, double-cliquez une ressource SSH, ou sélectionnez-la puis **Se connecter**.
2. Si la ressource l'exige, renseignez le motif, l'objet ou le ticket ([Règles d'accès](#/regles-acces)).
3. Le terminal s'ouvre dans la page **Sessions**.

### Authentification sur la cible

- **Identifiant du coffre** : la connexion s'authentifie seule ; l'opérateur ne voit pas le mot de passe.
- **Saisie manuelle** : sinon, le terminal demande le mot de passe du compte à l'ouverture.

Le bastion s'authentifie sur la cible **par mot de passe** : le compte cible doit accepter `PasswordAuthentication`. L'authentification par clé n'est pas prise en charge par la CE.

## Fermer l'onglet n'est pas fermer la session

Si la page se ferme ou que le réseau coupe, le shell distant reste en vie **deux minutes** par défaut. Revenez sur **Sessions** ou sur la carte et choisissez **Reprendre la session** : vous retrouvez le terminal là où il était. Détachement et reprise sont journalisés (`session.detached`, `session.resumed`).

Délai réglable par `ENDORIUMFORT_SSH_RESUME_GRACE_SECONDS` (défaut `120`, maximum `3600`). Avec `0`, la session se termine dès que la page disparaît.

Seul l'utilisateur qui a ouvert la session peut la piloter. Les autres, s'ils en ont le droit, peuvent l'**observer** ([Sessions](#/sessions)).

## Snippets

Le menu **Snippets** du terminal conserve des commandes réutilisables : diagnostic, collecte de journaux, vérifications. Pour chacune :

- **Insérer** tape la commande sans l'exécuter, pour la relire ou la compléter ;
- **Exécuter** l'envoie avec un retour à la ligne.

Des snippets sont fournis ; ajoutez les vôtres avec un nom et une commande. Vos snippets sont conservés dans votre navigateur. Une commande envoyée par snippet passe par le [garde-fou](#/garde-fou-ssh) comme une commande tapée.

## Transférer des fichiers

Depuis la session, vous pouvez **parcourir** l'arborescence de la cible, **télécharger** et **déposer** des fichiers. Le bastion utilise SFTP ; sur les cibles sans SFTP (équipements réseau, appliances), il se replie sur SCP, qui permet de transférer mais pas de lister un répertoire.

### Activation

Désactivé par défaut. Un administrateur l'active **par ressource et par sens** :

- **Autoriser le téléchargement de fichiers depuis la cible** ;
- **Autoriser l'envoi de fichiers vers la cible**.

Seul l'opérateur qui a ouvert la session peut transférer, avec l'identité utilisée par le terminal.

### Taille maximale

Un dépôt est plafonné à **100 Mo** par défaut. Réglage dans **Administration → Sécurité**, ou par `ENDORIUMFORT_SSH_TRANSFER_MAX_UPLOAD_MB` (1 à 10 240).

### Traçabilité

Les fichiers transitent par une zone tampon du bastion : un dépôt n'atteint la cible qu'une fois complet et dans la limite de taille. Chaque transfert est journalisé avec le chemin, la taille et l'empreinte **SHA-256** du fichier :

| Événement | Quand |
|---|---|
| `ssh.file.download` | un fichier a été téléchargé depuis la cible |
| `ssh.file.upload` | un fichier a été déposé sur la cible |
| `ssh.file.denied` | un transfert a été refusé (sens non autorisé, taille, droits) |

> Ne pas confondre avec les [lecteurs de partage de fichiers](#/partage-fichiers), qui sont un espace de stockage propre au bastion et non un accès au système de fichiers d'une cible.

## Garde-fou de commandes

Sur une ressource où il est activé, chaque commande est comparée à une liste de commandes interdites **avant** d'atteindre la cible. Voir [Garde-fou de commandes SSH](#/garde-fou-ssh).

## Traçabilité

- Ouverture, fin, interruption, détachement et reprise sont journalisés dans le [journal d'audit](#/audit), avec le motif et le ticket éventuels.
- Chaque transfert de fichier et chaque commande bloquée a son propre événement.
- Un administrateur voit la session en temps réel et peut l'observer ou la terminer.

## Bonnes pratiques

- Rangez les identifiants dans le coffre plutôt que de les communiquer aux opérateurs.
- Activez le garde-fou sur les ressources de production.
- N'ouvrez le transfert de fichiers que dans le sens nécessaire.
- Restreignez le pare-feu des cibles pour n'accepter SSH **que depuis le bastion** : sinon, rien n'empêche de contourner celui-ci.
