# Endorium Workspace

**Endorium Workspace** ouvre le bastion aux collaborateurs non techniques : comptables, assistants, juristes, commerciaux. Ils accèdent à leurs dossiers, à leur logiciel métier et à leur poste du bureau depuis un navigateur, **sans VPN**. Chaque accès passe par le bastion, avec la même authentification, les mêmes règles et le même journal que pour les administrateurs.

```
Collaborateur ──navigateur──► bastion ──► serveur de fichiers (SMB), drive
  (maison, client)            MFA, horaires,  ──► logiciel métier (navigateur isolé)
                              journal chaîné  ──► poste du cabinet (RDP)
```

Le réseau interne n'est jamais exposé au poste distant : seules les ressources publiées sont atteignables.

## Le portail

L'adresse `/workspace` affiche des **tuiles** : un clic ouvre la ressource. Les tuiles sont regroupées (Fichiers, Applications, Postes de travail…) et ordonnées par l'administrateur.

Un compte au rôle **Workspace** est conduit au portail à la connexion et y reste : pas de console d'administration, de carte, ni de statistiques. Il ne voit que les ressources qui lui sont attribuées **et** publiées.

## Publier une ressource

Dans **Administration › Ressources**, ouvrez une ressource puis la section **Workspace** :

| Champ | Rôle |
|---|---|
| Publier dans le portail | La ressource devient une tuile pour les personnes qui y ont accès. |
| Groupe | Titre de la rangée de tuiles (ex. « Fichiers »). |
| Ordre | Position dans le groupe. |
| Audience | Liste des personnes qui verront la tuile (attribution de la ressource). |

## Le profil « bureau »

Une ressource au profil d'accès **bureau** s'ouvre **sans rien remplir** (ni justification ni ticket). La session dure la journée de travail et n'est accordée qu'aux heures du cabinet :

| Variable | Défaut | Rôle |
|---|---|---|
| `ENDORIUMFORT_WORKDAY_HOURS` | `10` | Durée d'une session « bureau », en heures (1 à 24). |
| `ENDORIUMFORT_OFFICE_HOURS` | `07:00-20:00` | Plage horaire autorisée (vide = à toute heure). |
| `ENDORIUMFORT_OFFICE_DAYS` | `mon-sat` | Jours autorisés : `mon-fri`, `mon,wed,fri` ou `any`. |

Hors de ces horaires, l'ouverture est refusée et journalisée.

## Appareils connus

Une ressource au profil **bureau** s'ouvre sans contrôle uniquement depuis un **navigateur que la personne a déjà validé**. Depuis un nouveau navigateur, la console demande une fois un code TOTP ou une passkey, puis propose de mémoriser l'appareil. Une vérification récente (10 minutes par défaut, `ENDORIUMFORT_DEVICE_CHECK_MINUTES`) suffit pour les ouvertures suivantes.

Chacun retrouve et retire ses appareils depuis la page **Mon compte** ; un administrateur peut révoquer ceux d'un utilisateur.

En Enterprise, un contexte inhabituel depuis un appareil connu — pays, réseau ou heure — redemande une vérification MFA plutôt que de refuser, et lève une alerte dans le centre de sécurité.

## Les fichiers

- **Drive web** : un espace par personne, des partages entre collègues avec expiration (voir [Partage de fichiers](#/partage-fichiers)).
- **Serveur de fichiers existant** : une ressource `smb://serveur/partage/dossier` publie un dossier d'un serveur Windows, Synology ou Samba comme lecteur commun. Le compte de service est conservé dans le coffre et n'est jamais transmis au navigateur.
- **Lecteur natif** *(Enterprise)* : l'agent EndoriumFort monte le lecteur comme une lettre Windows, un volume macOS ou un montage GVfs (WebDAV), avec les verrous nécessaires à Office. Le montage disparaît quand la session se termine.
- **Versions et corbeille** *(Enterprise)* : chaque fichier remplacé ou supprimé est conservé (30 jours par défaut) et se restaure en un clic, y compris un dossier entier à une date donnée.
- **Bouclier anti-rançongiciel** *(Enterprise)* : une série de modifications suspectes (fichiers réécrits en masse, extensions de chiffrement) bloque le compte sur ce lecteur, et les versions précédentes permettent de tout rétablir.

## Qui a ouvert ce fichier ?

**Journal › Fichiers** (permission `audit.read`) retrace l'historique d'un fichier ou d'un dossier : ouvertures, dépôts, renommages, partages, suppressions, aperçus, y compris au travers d'un partage et après la fin de celui-ci. La recherche vérifie la chaîne du journal du service de fichiers et indique si l'historique est intact.

En Enterprise, le bouton **Pack de preuve signé** exporte ce même historique : empreinte SHA-256, signature du serveur, état de la chaîne et sessions du bastion concernées. Ce document est prêt à remettre à un assureur, à un expert ou à un juge.

## Aperçu sécurisé *(Enterprise)*

Un partage en mode **Aperçu seulement** montre les fichiers mais ne permet pas de les télécharger. Le document s'ouvre dans le **navigateur isolé** du bastion, avec un **filigrane** portant l'identifiant de la personne, le lecteur et l'heure. Seule l'image de la page arrive sur le poste : il n'y a ni téléchargement, ni impression, ni copie.

PDF, images et fichiers texte s'affichent directement. Les documents Office sont convertis par LibreOffice si le service de fichiers en dispose (`EF_FS_OFFICE_CONVERTER`).

## Essayer

Dans la [démo](../demo/), connectez-vous avec `m.durand` (n'importe quel mot de passe) pour voir le portail. Ouvrez le lecteur **Compta**, puis le partage **Dupont SARL** pour l'aperçu sécurisé. Connectez-vous ensuite avec `s.lefevre` (auditeur) et ouvrez **Journal › Fichiers**.
