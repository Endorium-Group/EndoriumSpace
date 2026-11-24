// EndoriumSpace — questions fréquentes de la communauté (contenu rédigé par l'équipe).
// Pas de votes ni de vues : ce n'est pas un forum, et on ne simule pas d'activité.
// Pour ajouter une question : copier un bloc, `id` et `slug` uniques, une
// `description` de 120 à 155 caractères (meta description), et relier
// la réponse à la page de documentation qui fait foi.
window.EFQA = [
  {
    id: 1,
    slug: "mot-de-passe-admin-initial",
    title: "Quels identifiants utiliser au premier démarrage ?",
    description: "Compte initial d'EndoriumFort CE (admin / Admin123) et configuration de sécurité imposée à la première connexion : mot de passe privé et second facteur.",
    tags: ["installation", "premiers-pas"],
    date: "2026-11-04",
    body: "Je viens de lancer EndoriumFort CE et j'arrive sur l'écran de connexion. Quel compte utiliser ?",
    answers: [
      {
        accepted: true, date: "2026-11-24",
        body: "Sur une base **neuve**, EndoriumFort crée un seul compte administrateur :\n\n| Identifiant | Mot de passe |\n|---|---|\n| `admin` | `Admin123` |\n\nOuvrez `https://votre-hote/` et connectez-vous avec ces identifiants.\n\n## La configuration de sécurité initiale\n\nÀ la première connexion, un écran **« Configuration de sécurité initiale »** bloque tout le reste de la console jusqu'à ce que vous ayez :\n\n1. choisi un **mot de passe privé** : au moins 8 caractères, avec une majuscule, une minuscule et un chiffre. Visez beaucoup plus long : c'est le compte le plus sensible du bastion ;\n2. enrôlé un **second facteur** : un code TOTP (application d'authentification, QR code puis code à 6 chiffres) ou une passkey.\n\nCe blocage est appliqué **côté serveur** : ni l'API ni un jeton ne permettent de le contourner.\n\n> Ce mot de passe est public : il figure dans la documentation. Faites cette étape **juste après l'installation**, avant d'exposer le bastion sur le réseau. Tant qu'elle n'est pas terminée, n'importe qui peut la terminer à votre place.\n\n## « Identifiants invalides » avec admin / Admin123\n\nLe compte initial n'existe que sur une base neuve. Si le volume de données (`/app/data` en Docker, `/var/lib/endoriumfort` en paquet Debian) a déjà servi, c'est le mot de passe choisi à ce moment-là qui s'applique.\n\nSi l'écran affiche « Trop de tentatives », attendez : après 10 échecs en 5 minutes, le blocage dure de 30 secondes à 30 minutes, et même le bon mot de passe est refusé pendant ce temps.\n\n## Juste après\n\n- Créez un compte **administrateur nominatif** par personne (**Administration → Utilisateurs → Nouvel utilisateur**), et gardez `admin` comme compte de secours, avec un mot de passe long rangé dans un coffre.\n- Vérifiez que `ENDORIUMFORT_VAULT_KEY` est fournie **avant** d'enregistrer le premier mot de passe de cible : sans elle, il est stocké en clair.\n- Déclarez le domaine définitif (`ENDORIUMFORT_WEBAUTHN_RP_ID`, `ENDORIUMFORT_WEBAUTHN_ORIGIN`) pour que les passkeys fonctionnent.\n\nVoir [Premier démarrage](../docs/#/premier-demarrage)."
      }
    ]
  },
  {
    id: 2,
    slug: "secrets-en-clair-vault-key",
    title: "Mes mots de passe de cibles sont-ils vraiment chiffrés ?",
    description: "Les secrets des cibles ne sont chiffrés (AES-256-GCM) que si ENDORIUMFORT_VAULT_KEY est valide : générer la clé, la transmettre au conteneur, la sauvegarder.",
    tags: ["securite", "coffre", "configuration"],
    date: "2026-11-04",
    body: "J'ai enregistré des identifiants SSH dans le coffre. Comment savoir s'ils sont chiffrés en base ?",
    answers: [
      {
        accepted: true, date: "2026-11-24",
        body: "Ils ne le sont **que si `ENDORIUMFORT_VAULT_KEY` est fournie et valide** : exactement 64 caractères hexadécimaux, soit une clé de 32 octets. Le coffre chiffre alors chaque secret en AES-256-GCM, avec un vecteur d'initialisation aléatoire par secret, **avant** de l'écrire en base.\n\n## Générer et fournir la clé\n\n```\nopenssl rand -hex 32\n```\n\nLe `docker-compose.yml` du dépôt ne transmet pas cette variable au conteneur. Ajoutez-la par un `docker-compose.override.yml`, que compose lit automatiquement, et mettez la valeur dans `.env` :\n\n```\nservices:\n  endoriumfort:\n    environment:\n      - ENDORIUMFORT_VAULT_KEY=${ENDORIUMFORT_VAULT_KEY}\n      - ENDORIUMFORT_AUDIT_HMAC_KEY=${ENDORIUMFORT_AUDIT_HMAC_KEY}\n```\n\npuis `docker compose up -d`.\n\n## Le piège : pas de clé, pas d'erreur\n\nSans clé, ou avec une clé mal formée, le bastion **démarre quand même** et enregistre les nouveaux secrets **en clair**. Vérifiez la clé avant d'enregistrer le premier mot de passe de cible. L'onglet **Administration → Coffre-fort** récapitule les ressources et l'état de leurs identifiants. En base, un secret chiffré a la forme `aes256:v1:<iv>:<tag>:<chiffré>`.\n\n## Points d'attention\n\n- Fournir une clé **après coup** ne chiffre pas les secrets existants : ressaisissez-les.\n- La CE ne sait pas rechiffrer le coffre avec une nouvelle clé : pour en changer, remplacez la clé puis ressaisissez chaque mot de passe.\n- Rangez la clé **hors de l'hôte** et hors des sauvegardes de volumes, dans un gestionnaire de secrets. Une clé perdue ne se récupère pas, et une sauvegarde de base sans elle ne permet pas de relire les secrets.\n\n## Qui peut relire un secret\n\nLa console n'affiche jamais un secret enregistré : le bastion l'injecte à la connexion. Seule la route `GET /api/resources/<id>/credentials` le relit, pour les administrateurs et les opérateurs affectés à la ressource ; chaque lecture est journalisée (`credential.access`). En usage normal, cet événement est rare : surveillez-le.\n\nDétails : [Coffre-fort](../docs/#/coffre)."
      }
    ]
  },
  {
    id: 3,
    slug: "deposer-iso-hyperviseur-rbi",
    title: "Déposer une image ISO sur un hyperviseur à travers le navigateur isolé ?",
    seoTitle: "Déposer une ISO via le navigateur isolé (RBI)",
    description: "Téléverser une ISO sur un hyperviseur depuis le navigateur isolé (RBI) du bastion : glisser-déposer ou sélecteur de fichier, taille maximale, prérequis.",
    tags: ["rbi", "transfert-fichiers"],
    date: "2026-11-04",
    body: "J'administre un hyperviseur par le navigateur isolé du bastion. Je voudrais téléverser une ISO sur un datastore : c'est possible alors que le navigateur tourne sur le serveur ?",
    answers: [
      {
        accepted: true, date: "2026-11-24",
        body: "Oui. Le navigateur isolé tourne sur le bastion, mais c'est bien un fichier de **votre poste** que vous déposez : le bastion le reçoit, puis le remet à la page isolée.\n\n## Deux façons de déposer\n\n1. **Glisser-déposer** le fichier local sur la vue du navigateur isolé.\n2. Cliquer sur le bouton d'envoi de l'interface cible (l'envoi de fichier du datastore, par exemple) : le bastion intercepte le sélecteur de fichier de la page et vous demande le fichier **local**. Vous pouvez en choisir plusieurs d'un coup.\n\nLe fichier est écrit sur disque côté bastion, pas chargé en mémoire : une ISO de plusieurs gigaoctets passe. Prévoyez l'espace disque correspondant sur l'hôte du bastion, et une connexion stable entre votre poste et le bastion pendant l'envoi.\n\n## Plafonner la taille\n\nPar défaut, il n'y a pas de limite. Pour en fixer une, en mégaoctets :\n\n```\nENDORIUMFORT_RBI_MAX_UPLOAD_MB=10240\n```\n\n## Le sens inverse\n\nUn fichier produit par la page cible, comme un export de configuration ou un journal, se **télécharge** vers votre poste de la même façon.\n\n## Moteur de rendu\n\nLes deux moteurs transfèrent des fichiers : `tiles`, présent dans les images Docker publiées et choisi automatiquement, et `cdp`, celui du paquet Debian. Le moteur actif est indiqué dans les journaux de démarrage ; `ENDORIUMFORT_RBI_ENGINE=tiles` ou `cdp` force un choix. Seul `tiles` affiche les menus déroulants natifs (`<select>`), fréquents dans les consoles d'hyperviseur.\n\n## À savoir en Community\n\nLes transferts **ne sont pas arbitrés** en CE : pas de politique pour refuser un sens, plafonner un volume par type ou bloquer des extensions. Tout opérateur qui peut ouvrir la ressource peut envoyer et récupérer des fichiers. Si vous devez cloisonner ces flux, n'affectez la ressource qu'aux personnes qui doivent en échanger. La gouvernance des transferts relève de l'édition Enterprise.\n\nVoir [Navigateur isolé](../docs/#/proxy-rbi)."
      }
    ]
  },
  {
    id: 4,
    slug: "atteindre-reseau-distant",
    title: "Atteindre des machines sur un autre site depuis mon bastion ?",
    description: "Joindre des serveurs d'un autre site depuis le bastion EndoriumFort : VPN site à site en Community, relais sortant sans port ouvert en Enterprise.",
    tags: ["reseau", "architecture"],
    date: "2026-11-04",
    body: "Mon bastion tourne sur un site, mais je dois administrer des serveurs sur un second site, derrière un NAT. Comment faire en CE ?",
    answers: [
      {
        accepted: true, date: "2026-11-24",
        body: "Le bastion se connecte **lui-même** aux cibles : c'est lui, et non votre poste, qui doit pouvoir les joindre à l'adresse déclarée sur la ressource. Une machine d'un autre site n'est donc accessible que si le réseau du bastion y mène.\n\n## En Community : un VPN site à site\n\nMontez un **VPN site à site** (WireGuard, IPsec) entre le réseau du bastion et le site distant, puis restreignez-le :\n\n- côté pare-feu, n'autorisez que l'adresse du bastion vers les cibles, et seulement sur les ports utiles (22 pour SSH, le port de l'interface pour le web) ;\n- côté cibles, n'acceptez SSH et les interfaces d'administration **que depuis le bastion** : sinon, il se contourne.\n\nDerrière un NAT, c'est le VPN qui rend les adresses privées du site joignables : déclarez les ressources avec ces adresses-là.\n\n## Déclarer la ressource\n\nDans **Administration → Ressources → Nouvelle ressource**, l'**adresse** est le nom d'hôte ou l'IP **tel que le bastion le résout**, pas tel que le voit votre poste. Testez la joignabilité depuis l'hôte du bastion avant de déclarer la ressource, par exemple :\n\n```\nnc -zv 192.168.1.10 22\n```\n\nUne **zone** par site (champ *Zone* de la ressource) regroupe ses machines sur la carte de la console.\n\n## En Enterprise : un relais, sans VPN ni port ouvert\n\nL'édition Enterprise propose des **relais de site** : un mini PC, un NAS Synology ou un conteneur Docker posé sur le site distant. C'est le relais qui appelle le bastion, par une liaison sortante chiffrée (WebSocket sur HTTPS) : aucun port à ouvrir sur la box, même derrière un NAT.\n\n- Il s'enrôle avec un **code à usage unique** saisi sur sa page locale.\n- Il ne joint que les cibles qu'on lui a autorisées.\n- Une ressource rattachée à un relais n'est **jamais** jointe directement : relais hors ligne, session refusée.\n- SSH, RDP, navigateur isolé, machine de rebond et partages SMB passent tous par lui.\n\nVoir [Déclarer une ressource](../docs/#/ressources) et [Relais de site](../docs/#/relais)."
      }
    ]
  },
  {
    id: 5,
    slug: "chiffrer-base-au-repos",
    title: "La base de données est-elle chiffrée au repos ?",
    description: "Ce qu'EndoriumFort chiffre (secrets du coffre, AES-256-GCM) et ce qu'il ne chiffre pas : la base et le journal. Chiffrer le volume avec LUKS ou le cloud.",
    tags: ["securite", "chiffrement"],
    date: "2026-11-04",
    body: "Pour un audit, je dois garantir que les données sont chiffrées au repos. Qu'est-ce que la CE fait ?",
    answers: [
      {
        accepted: true, date: "2026-11-24",
        body: "Deux niveaux à distinguer : ce que l'application chiffre elle-même, et ce qui relève du stockage.\n\n| Donnée | Protection en CE |\n|---|---|\n| Secrets des cibles (coffre) | chiffrés en **AES-256-GCM**, si `ENDORIUMFORT_VAULT_KEY` est fournie |\n| Mots de passe des comptes du bastion | hachés (scrypt salé), jamais stockés en clair |\n| Base : comptes, ressources, sessions, réglages | **non chiffrée** |\n| Journal d'audit (`audit-log.jsonl`) | **non chiffré**, mais chaîné : toute altération est détectable |\n\n## Chiffrer le stockage\n\nLe chiffrement au repos de la base se fait sous l'application, au niveau du stockage :\n\n- **LUKS** sur l'hôte, pour le disque qui porte les volumes Docker ou `/var/lib/endoriumfort` (paquet Debian) ;\n- le **volume chiffré** du fournisseur cloud ;\n- une **classe de stockage chiffrée** sur Kubernetes.\n\nPensez au volume de données du bastion (`/app/data`), mais aussi à celui du partage de fichiers, qui est séparé, et aux **sauvegardes** : elles contiennent la même base.\n\n## Avec PostgreSQL\n\nLe même raisonnement s'applique au serveur de base : stockage chiffré, et connexion chiffrée entre le bastion et la base dès qu'elle n'est pas sur le même hôte :\n\n```\nENDORIUMFORT_DB_DSN=postgresql://endoriumfort:<mot-de-passe>@db.example.com:5432/endoriumfort?sslmode=verify-full\n```\n\nLe journal d'audit, lui, reste un fichier sur le volume de données du bastion.\n\n## Ce que le chiffrement de disque couvre\n\nIl protège contre le vol d'un disque, d'un instantané ou d'une sauvegarde. Il ne protège pas contre quelqu'un qui a la main sur l'hôte en fonctionnement : cela se traite par le durcissement et l'accès restreint au serveur. Gardez enfin la clé du coffre **hors** des sauvegardes : une base dérobée sans la clé ne livre pas les secrets des cibles.\n\nPour l'auditeur, la preuve tient en trois éléments : la clé du coffre fournie, le volume sur un stockage chiffré, et la chaîne d'audit vérifiée depuis **Journal → Vérifier l'intégrité**.\n\nVoir [Durcissement](../docs/#/durcissement) et [Coffre-fort](../docs/#/coffre)."
      }
    ]
  },
  {
    id: 6,
    slug: "mfa-obligatoire",
    title: "Peut-on rendre la MFA obligatoire pour tout le monde ?",
    description: "MFA dans EndoriumFort CE : obligatoire pour les administrateurs, facultative pour les opérateurs et auditeurs. Repérer les comptes sans second facteur.",
    tags: ["mfa", "securite"],
    date: "2026-11-04",
    body: "Je veux que personne ne puisse utiliser le bastion sans second facteur. Est-ce configurable ?",
    answers: [
      {
        accepted: true, date: "2026-11-24",
        body: "En CE, la règle est fixe :\n\n| Compte | Second facteur |\n|---|---|\n| **Administrateurs** | **obligatoire**, imposé côté serveur |\n| **Opérateurs et auditeurs** | recommandé, à l'initiative de chacun |\n\nUn nouvel administrateur n'accède qu'aux écrans de configuration initiale tant qu'il n'a pas enrôlé de second facteur, et aucun jeton ne permet de contourner cette étape. Un administrateur ne peut pas non plus retirer son **dernier** facteur.\n\nIl n'existe pas de réglage pour l'imposer aux autres rôles.\n\n## Ce que vous pouvez faire\n\n- **Repérer les comptes concernés** : **Administration → Utilisateurs**, filtre **Sans MFA uniquement**, puis relancer leurs titulaires.\n- **Suivre le bilan** **Administration → Sécurité**, qui signale les administrateurs sans MFA.\n- **Privilégier les passkeys** : elles résistent à l'hameçonnage, un code TOTP non. Elles demandent le bastion en HTTPS sous son domaine définitif.\n- **Enrôler deux facteurs** par personne, par exemple une passkey et un TOTP de secours : la console ne propose pas de réinitialisation de MFA.\n- **Limiter les droits** : un auditeur en rôle **auditeur**, pas administrateur, et des affectations de ressources limitées au nécessaire.\n- **Surveiller les connexions** dans le journal : `auth.login.success` et `auth.login.failure`.\n\n## Enrôler un facteur\n\nChacun le fait depuis **Mon compte → Sécurité** :\n\n1. **TOTP** : scanner le QR code avec une application d'authentification, ou saisir le secret affiché, puis valider avec le code à 6 chiffres. L'heure du serveur et celle du téléphone doivent être justes.\n2. **Passkey** : **Ajouter une passkey**, puis suivre l'invite du navigateur (biométrie, code de l'appareil ou clé de sécurité). On peut en enregistrer plusieurs.\n\n## Perte d'un facteur\n\nAvec deux facteurs, on se connecte avec l'autre et on remplace celui qui est perdu. Sans facteur de secours, un administrateur supprime puis recrée le compte sous le même identifiant ; l'historique reste dans le journal d'audit, et il faut réaffecter ses ressources.\n\nVoir [MFA](../docs/#/mfa)."
      }
    ]
  },
  {
    id: 7,
    slug: "verifier-integrite-audit",
    title: "Comment prouver que le journal d'audit n'a pas été modifié ?",
    description: "Le journal d'audit d'EndoriumFort est chaîné (SHA-256 ou HMAC) : vérifier son intégrité depuis la console ou par l'API, et protéger la clé HMAC.",
    tags: ["audit", "conformite"],
    date: "2026-11-04",
    body: "Un auditeur me demande une preuve d'intégrité du journal. Qu'est-ce qu'EndoriumFort fournit ?",
    answers: [
      {
        accepted: true, date: "2026-11-24",
        body: "Le journal est **chaîné** : l'empreinte de chaque entrée est calculée sur son contenu **et** sur l'empreinte de l'entrée d'avant. Modifier, insérer ou supprimer une ligne casse la chaîne à cet endroit.\n\n## SHA-256 ou HMAC\n\n- **Sans clé** : chaîne SHA-256. Elle détecte toute altération maladroite, mais quelqu'un qui a accès au fichier et connaît le procédé pourrait recalculer toute la chaîne.\n- **Avec `ENDORIUMFORT_AUDIT_HMAC_KEY`** : chaîne HMAC-SHA256, impossible à produire sans la clé. C'est le réglage recommandé.\n\n```\nENDORIUMFORT_AUDIT_HMAC_KEY=<openssl rand -hex 32>\n```\n\n**Réglez-la dès l'installation** : les lignes écrites avant restent vérifiées en SHA-256 simple. Et stockez-la **hors** du volume de données : une clé posée à côté du journal ne protège de rien.\n\n## Vérifier\n\nDans **Journal**, **« Vérifier l'intégrité »** recalcule toute la chaîne et indique :\n\n- si le journal est **intègre** ;\n- sinon, le numéro de la **première ligne rompue** ;\n- le nombre de lignes vérifiées, et si la chaîne est protégée par une clé.\n\nC'est la preuve à fournir à l'auditeur. Faites-le aussi après chaque restauration et chaque mise à jour. Pour l'automatiser, avec un compte dédié au rôle **auditeur** :\n\n```\ncurl -sf https://bastion.example.com/api/audit/verify \\\n  -H \"Authorization: Bearer $TOKEN\"\n```\n\n## Ne pas casser la preuve soi-même\n\nLe journal (`audit-log.jsonl`, dans le volume de données) n'est ni tourné ni purgé automatiquement. Pour archiver, **ne le modifiez pas en place** : ce serait indiscernable d'une falsification. Sauvegardez-le avec le volume et conservez les archives selon votre politique.\n\nPour en garder une copie hors du bastion, collectez le fichier en lecture seule avec un agent de logs (Vector, Fluent Bit, Promtail, Filebeat). La vue **Journal** s'exporte aussi en CSV, avec ses filtres, pour un dossier d'audit.\n\nVoir [Journal d'audit](../docs/#/audit)."
      }
    ]
  },
  {
    id: 8,
    slug: "ports-exposes",
    title: "Quels ports exposer ?",
    description: "Ports à ouvrir pour le bastion EndoriumFort : 443 indispensable, 80 pour la redirection et Let's Encrypt, 8080 jamais. Ports non privilégiés et passkeys.",
    tags: ["installation", "reseau"],
    date: "2026-11-04",
    body: "Le fichier compose publie 80 et 443. Puis-je me passer du 80 ? Et le port 8080 ?",
    answers: [
      {
        accepted: true, date: "2026-11-24",
        body: "| Port | Où | Rôle |\n|---|---|---|\n| `443` | hôte | Console, API et WebSocket, en HTTPS. **Indispensable.** |\n| `80` | hôte | Redirection vers HTTPS, et validation Let's Encrypt si vous l'activez. Facultatif sinon. |\n| `8080` | interne | Backend. **Ne l'exposez jamais** : nginx le sert. |\n| `8090` | interne | Service de partage de fichiers, sur le réseau `files` uniquement. |\n\nRien d'autre n'est à ouvrir : terminal SSH, navigateur isolé et partage de fichiers passent tous par le 443, en HTTPS et WebSocket. Le bastion n'a besoin d'aucun port entrant pour joindre les cibles : c'est lui qui se connecte à elles.\n\n## Se passer du 80\n\nSans Let's Encrypt intégré, le 80 ne sert qu'à rediriger vers HTTPS : vous pouvez ne pas le publier. Les utilisateurs devront alors taper `https://` explicitement.\n\n## Changer les ports\n\nPour éviter les ports privilégiés, ou si 80 et 443 sont déjà pris :\n\n```\nEF_HTTP_PORT=8080\nEF_HTTPS_PORT=8443\n```\n\nLe bastion se joint alors par `https://hote:8443`. Déclarez cette origine, **port compris**, pour les passkeys :\n\n```\nENDORIUMFORT_WEBAUTHN_RP_ID=hote.example.com\nENDORIUMFORT_WEBAUTHN_ORIGIN=https://hote.example.com:8443\n```\n\n## Derrière un reverse-proxy\n\nSi Caddy, Traefik ou nginx occupe déjà le 443, le proxy joint le bastion sur le réseau interne. Déclarez alors l'adresse du proxy dans `ENDORIUMFORT_TRUSTED_PROXIES` : sinon, le journal et la limitation de débit voient l'IP du proxy pour tout le monde.\n\n## Pare-feu\n\n- N'exposez pas le bastion à Internet sans nécessité ; sinon, placez-le derrière un VPN ou une liste d'IP autorisées.\n- Côté cibles, n'acceptez SSH et les interfaces d'administration **que depuis l'adresse du bastion** : sinon, il se contourne.\n\nVoir [Installation](../docs/#/installation) et [TLS & reverse-proxy](../docs/#/tls-reverse-proxy)."
      }
    ]
  },
  {
    id: 9,
    slug: "sauvegarde-cles",
    title: "Que faut-il sauvegarder exactement ?",
    description: "Sauvegarder EndoriumFort : volume /app/data, base PostgreSQL, volume du partage de fichiers et clés du coffre, de l'audit et du partage, gardées à part.",
    tags: ["exploitation", "sauvegarde"],
    date: "2026-11-04",
    body: "Je mets en place des sauvegardes. Les volumes suffisent-ils ?",
    answers: [
      {
        accepted: true, date: "2026-11-24",
        body: "Non. Il faut quatre choses :\n\n| Quoi | Où | Quand |\n|---|---|---|\n| Volume de données | `/app/data` (Docker), `/var/lib/endoriumfort` (Debian) | toujours : base SQLite, journal d'audit |\n| Base PostgreSQL | votre serveur | si vous l'utilisez |\n| Volume du partage de fichiers | `/data` du conteneur `endoriumfort-files`, `/var/lib/endoriumfort-files` (Debian) | si vous utilisez les lecteurs |\n| Clés et configuration | `.env`, `docker-compose.override.yml` ou `/etc/endoriumfort/` | toujours |\n\nLe volume du partage de fichiers est **séparé** de celui du bastion : il s'oublie facilement.\n\n## Les clés, à part\n\n`ENDORIUMFORT_VAULT_KEY` déchiffre les secrets du coffre, `ENDORIUMFORT_AUDIT_HMAC_KEY` permet de vérifier le journal, `ENDORIUMFORT_FILESHARE_SECRET` signe les tickets du partage de fichiers. Elles ne sont **pas** dans les volumes : sans la clé du coffre, les secrets restaurés sont illisibles ; sans la clé HMAC, le journal ne se vérifie plus. Gardez-les dans un gestionnaire de secrets, **séparément** des archives.\n\n## Sauvegarder (Docker)\n\nArrêtez le bastion le temps de la copie, pour une base et un journal cohérents :\n\n```\ndocker stop endoriumfort endoriumfort-files\ndocker run --rm -v ef-data:/data -v \"$PWD\":/backup alpine \\\n  tar czf /backup/ef-data-$(date +%F).tar.gz -C /data .\ndocker run --rm -v ef-files:/data -v \"$PWD\":/backup alpine \\\n  tar czf /backup/ef-files-$(date +%F).tar.gz -C /data .\ndocker start endoriumfort-files endoriumfort\n```\n\nL'interruption dure quelques secondes. Sans arrêt, préférez un instantané (LVM, ZFS, snapshot cloud) : une copie à chaud d'une base SQLite en cours d'écriture peut être incohérente. Avec PostgreSQL, sauvegardez la base avec vos outils (`pg_dump`, sauvegarde continue) **et** le volume, pour le journal.\n\nEn paquet Debian, `/etc/endoriumfort` contient les clés : chiffrez l'archive qui l'inclut, ou stockez-la à part.\n\n## Tester\n\nPlanifiez la sauvegarde (cron, timer systemd) et restaurez-la au moins une fois. Après restauration, lancez **Journal → Vérifier l'intégrité** : c'est la preuve que la chaîne d'audit a survécu.\n\nVoir [Sauvegarde & restauration](../docs/#/sauvegarde)."
      }
    ]
  },
  {
    id: 10,
    slug: "passkey-ne-fonctionne-pas",
    title: "« Passkey sign-in failed » : pourquoi ma passkey est refusée ?",
    description: "« Passkey sign-in failed » : HTTPS valide et domaine exact dans ENDORIUMFORT_WEBAUTHN_RP_ID et ENDORIUMFORT_WEBAUTHN_ORIGIN. Les causes et la correction.",
    tags: ["mfa", "depannage"],
    date: "2026-11-04",
    body: "Le TOTP fonctionne, mais l'ajout ou l'utilisation d'une passkey échoue.",
    answers: [
      {
        accepted: true, date: "2026-11-24",
        body: "Presque toujours un problème de **domaine**. Une passkey est liée au nom de domaine sous lequel elle a été créée, et le navigateur refuse de la présenter ailleurs.\n\n## Les prérequis\n\n- un accès en **HTTPS** avec un certificat **valide** (sauf `localhost`, en test) : le certificat par défaut de l'image ne convient pas ;\n- un domaine déclaré au bastion, qui correspond **exactement** à l'URL tapée :\n\n```\nENDORIUMFORT_WEBAUTHN_RP_ID=bastion.example.com\nENDORIUMFORT_WEBAUTHN_ORIGIN=https://bastion.example.com\n```\n\n`RP_ID` est le nom de domaine seul ; `ORIGIN` est l'URL complète, avec le port s'il n'est pas 443 (`https://bastion.example.com:8443`).\n\n## Les causes fréquentes\n\n| Situation | Cause et correction |\n|---|---|\n| Accès par une IP (`https://10.0.0.5`) | Les passkeys exigent un nom de domaine : passez par le nom déclaré. |\n| Accès par un autre nom ou un alias | L'origine ne correspond pas : utilisez le nom déclaré. |\n| Port non standard | Le port fait partie de l'origine : ajoutez-le à `ORIGIN`. |\n| Avertissement de certificat | Certificat non valide : Let's Encrypt intégré ou votre propre certificat. |\n| Domaine changé depuis l'enrôlement | Les passkeys de l'ancien domaine ne fonctionnent plus : chacun en enrôle une nouvelle. |\n\n## Diagnostiquer et corriger\n\n1. Ouvrez le bilan **Administration → Sécurité** : il signale une configuration WebAuthn invalide.\n2. Corrigez les variables, puis recréez le conteneur (`docker compose up -d`) pour qu'il les relise.\n3. Retirez la passkey qui échoue et enrôlez-en une nouvelle depuis **Mon compte → Sécurité → Ajouter une passkey**.\n\nEn attendant, connectez-vous avec votre second facteur de secours (TOTP) : c'est pour ce cas qu'il vaut mieux en enrôler deux. Un administrateur ne peut pas retirer son dernier facteur, ce qui évite de se retrouver sans aucun.\n\nLes ajouts et retraits de passkeys sont journalisés (`user.webauthn.register`, `user.webauthn.delete`).\n\nVoir [MFA](../docs/#/mfa) et [TLS & reverse-proxy](../docs/#/tls-reverse-proxy)."
      }
    ]
  },
  {
    id: 11,
    slug: "commande-bloquee-garde-fou",
    title: "« Command blocked by bastion guard » sur une commande anodine",
    description: "Pourquoi le garde-fou SSH bloque une commande anodine : règle trop large ou caractère non ASCII (accent, guillemet typographique). Diagnostiquer et corriger.",
    tags: ["ssh", "depannage"],
    date: "2026-11-04",
    body: "Sur une ressource SSH, une commande sans danger est refusée avec ce message. Pourquoi ?",
    answers: [
      {
        accepted: true, date: "2026-11-24",
        body: "Le garde-fou de la ressource a retenu la saisie. La ligne n'a pas été envoyée à la cible, et un événement `command_guard.block` a été écrit dans le journal d'audit, avec la session concernée et la règle déclenchée. Il y a deux causes possibles.\n\n## 1. Une règle correspond\n\nCinq règles sont livrées actives :\n\n| Règle | Ce qu'elle bloque |\n|---|---|\n| `wipe_root` | `rm -rf /` |\n| `fork_bomb` | la « bombe fork » shell classique |\n| `disk_format` | `mkfs` et ses variantes |\n| `raw_disk_dd` | `dd` écrivant vers un périphérique `/dev/…` |\n| `power_command` | `shutdown`, `poweroff`, `reboot` |\n\nElles sont reconnues en début de ligne ou après un séparateur (`;`, `&`, `|`), précédées ou non de `sudo` ou d'un chemin (`/sbin/reboot`). Le garde-fou lit la ligne comme le shell : `r''m`, `\"rm\"` et `r\\m` sont tous lus `rm`.\n\nUne **règle personnalisée** trop générale peut attraper plus que prévu. Vérifiez la liste dans **Administration → Sécurité → règles du SSH guard** : les règles fournies se désactivent une par une, et les règles ajoutées s'appliquent à toutes les ressources gardées.\n\n## 2. Un caractère non accepté\n\nSur une ressource gardée, seuls les caractères ASCII imprimables usuels passent : lettres sans accent, chiffres, espaces et ponctuation du shell. Toute autre saisie est bloquée comme une commande interdite, avec la raison `non_whitelisted_input`. Causes typiques :\n\n- une lettre accentuée dans un message de commit ou un nom de fichier ;\n- un guillemet typographique collé depuis un traitement de texte ou une messagerie ;\n- un emoji ou un caractère Unicode invisible.\n\nRetapez la commande avec des guillemets droits. Les touches d'édition (Entrée, Retour arrière, Ctrl-C, flèches) passent normalement.\n\n## Trancher entre les deux\n\nFiltrez le journal sur `command_guard.block` : l'événement indique la règle ou la raison. Si les opérateurs doivent saisir du texte accentué sur cette cible, n'activez pas le garde-fou sur la ressource.\n\n> Le garde-fou élève le niveau face aux erreurs et aux contournements occasionnels ; ce n'est pas une frontière de sécurité face à un opérateur malveillant. Combinez-le avec des comptes cibles aux droits minimaux et la relecture du journal.\n\nVoir [Garde-fou de commandes SSH](../docs/#/garde-fou-ssh)."
      }
    ]
  },
  {
    id: 12,
    slug: "ssh-cle-publique",
    title: "Le bastion peut-il se connecter aux cibles par clé SSH ?",
    description: "EndoriumFort CE s'authentifie sur les cibles SSH par mot de passe du coffre. Configurer sshd pour ne l'accepter que depuis l'adresse du bastion.",
    tags: ["ssh"],
    date: "2026-11-04",
    body: "Nos serveurs n'acceptent que l'authentification par clé. Comment les déclarer ?",
    answers: [
      {
        accepted: true, date: "2026-11-24",
        body: "Pas en CE aujourd'hui : le bastion s'authentifie sur la cible **par mot de passe**, et le compte cible doit accepter `PasswordAuthentication`. Ce mot de passe vit dans le coffre, chiffré en AES-256-GCM, et le bastion l'injecte lui-même : l'opérateur ouvre sa session sans jamais le voir, et ne peut donc pas le réutiliser hors du bastion.\n\n## Limiter l'exposition côté cible\n\nAutorisez le mot de passe **uniquement depuis l'adresse du bastion**, pour un compte dédié, et gardez l'authentification par clé partout ailleurs :\n\n```\n# /etc/ssh/sshd_config\nPasswordAuthentication no\nMatch Address 10.0.0.10 User bastion-ops\n    PasswordAuthentication yes\n```\n\nVérifiez la syntaxe avec `sshd -t`, puis rechargez le service en gardant une session ouverte le temps de tester la connexion par le bastion.\n\n## Bonnes pratiques pour ce compte\n\n- un **mot de passe long et aléatoire**, généré pour l'occasion : personne n'a besoin de le connaître ;\n- des **droits minimaux**, avec `sudo` limité aux commandes nécessaires ;\n- le pare-feu de la cible qui n'accepte SSH **que depuis le bastion** : sinon, il se contourne ;\n- le **garde-fou SSH** et le **motif obligatoire** sur les ressources sensibles ([Règles d'accès](../docs/#/regles-acces)).\n\nDéclarez ensuite la ressource avec ce compte et son mot de passe dans le coffre (**Administration → Ressources → Identifiants**).\n\n## Côté administrateurs\n\nLes postes des administrateurs, eux, n'ont plus besoin de clé du tout : le terminal s'ouvre dans le navigateur, après la MFA du bastion. Plus de clés privées à distribuer, à faire tourner ou à révoquer au départ de quelqu'un.\n\n## Et ensuite\n\nLa rotation automatique des mots de passe des cibles et les comptes temporaires créés à chaque session relèvent de l'édition Enterprise. L'authentification par clé en CE est un sujet ouvert : votez ou détaillez votre besoin dans les [idées](https://github.com/Endorium-Group/EndoriumFort-CE/discussions/categories/ideas).\n\nVoir [Session SSH](../docs/#/session-ssh) et [Coffre-fort](../docs/#/coffre)."
      }
    ]
  },
  {
    id: 13,
    slug: "derriere-reverse-proxy",
    title: "Faire tourner le bastion derrière Caddy ou Traefik",
    description: "Placer EndoriumFort derrière Caddy, Traefik ou nginx : WebSocket, délais, en-têtes X-Forwarded, ENDORIUMFORT_TRUSTED_PROXIES et taille des requêtes.",
    tags: ["reseau", "tls"],
    date: "2026-11-04",
    body: "J'ai déjà un reverse-proxy qui gère mes certificats. Que faut-il régler ?",
    answers: [
      {
        accepted: true, date: "2026-11-24",
        body: "C'est un déploiement courant : le proxy termine le TLS et relaie vers le bastion. Quatre points à respecter.\n\n1. **WebSocket** : les terminaux SSH et le navigateur isolé utilisent des WebSocket de longue durée. Le proxy doit les relayer, avec des délais d'inactivité d'au moins une heure.\n2. **En-têtes** : transmettez `Host`, `X-Forwarded-For` et `X-Forwarded-Proto: https`. Ce dernier active l'en-tête HSTS.\n3. **Vraie adresse IP** : déclarez l'adresse du proxy dans `ENDORIUMFORT_TRUSTED_PROXIES` (voir plus bas).\n4. **Taille des requêtes** : autorisez des corps assez gros pour les transferts de fichiers ; le partage de fichiers accepte 2 Go par défaut.\n\n## Proxies de confiance\n\n```\nENDORIUMFORT_TRUSTED_PROXIES=10.0.0.5,172.18.0.0/16\n```\n\nAdresses ou plages CIDR, séparées par des virgules. Vide par défaut : personne n'est cru, et un client ne peut pas choisir l'adresse journalisée. Sans ce réglage, le bastion voit l'IP du proxy pour tout le monde : le journal est faux, et un seul utilisateur maladroit peut bloquer tous les autres par la limitation de débit.\n\n## Caddy\n\n```\nbastion.example.com {\n    reverse_proxy https://endoriumfort:443 {\n        transport http {\n            tls_insecure_skip_verify\n        }\n    }\n}\n```\n\nLe bastion reste en HTTPS derrière le proxy, avec son certificat auto-signé : d'où `tls_insecure_skip_verify`, sur ce seul saut interne. Caddy relaie les WebSocket sans réglage supplémentaire.\n\n## nginx\n\n```\nlocation / {\n    proxy_pass https://127.0.0.1:8443;\n    proxy_http_version 1.1;\n    proxy_set_header Upgrade $http_upgrade;\n    proxy_set_header Connection \"upgrade\";\n    proxy_set_header Host $host;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    proxy_set_header X-Forwarded-Proto https;\n    proxy_read_timeout 3600s;\n    proxy_send_timeout 3600s;\n    client_max_body_size 2g;\n}\n```\n\n## Traefik\n\nMêmes principes : un service vers `https://endoriumfort:443` qui accepte le certificat interne, et des délais de point d'entrée compatibles avec des sessions d'une heure.\n\n## Ensuite\n\nDéclarez le nom public pour les passkeys (`ENDORIUMFORT_WEBAUTHN_RP_ID` et `ENDORIUMFORT_WEBAUTHN_ORIGIN`), puis vérifiez le bilan **Administration → Sécurité**.\n\nExemples complets : [TLS & reverse-proxy](../docs/#/tls-reverse-proxy)."
      }
    ]
  },
  {
    id: 14,
    slug: "licence-ce-usage-pro",
    title: "Puis-je utiliser la CE en production dans mon entreprise ?",
    description: "EndoriumFort Community Edition est source-available : gratuite pour l'évaluation et l'usage hors production, licence Enterprise pour la production.",
    tags: ["licence", "editions"],
    date: "2026-11-04",
    body: "La CE est gratuite et son code est public. Puis-je la déployer pour administrer les serveurs de production de ma société ?",
    answers: [
      {
        accepted: true, date: "2026-11-24",
        body: "Non, pas sans licence. La CE est publiée sous la **licence source-available EndoriumFort Community Edition** : son code est public et auditable, mais ce n'est **pas** une licence open source au sens de l'OSI.\n\n## Ce qui est gratuit, ce qui demande une licence\n\n| | |\n|---|---|\n| **Gratuit** | usage personnel, pédagogique, recherche, évaluation, test, et usage interne **hors production** |\n| **Licence Enterprise requise** | tout **usage commercial ou en production**, y compris la revente en service hébergé ou managé |\n| **Redistribution** | copies conformes autorisées, avec attribution |\n| **Modifications** | permises pour votre usage autorisé ; leur redistribution passe par une contribution au dépôt d'origine |\n\nConcrètement :\n\n- installer la CE dans un environnement de test pour l'évaluer avant de décider, c'est précisément l'usage prévu ;\n- un laboratoire, une formation ou un projet de recherche : gratuit ;\n- protéger l'accès aux serveurs de production de votre société, ou proposer le bastion à des clients : licence Enterprise.\n\n## Ce que l'Enterprise ajoute\n\nAu-delà du droit d'usage en production, elle apporte notamment :\n\n- RDP dans le navigateur, applications publiées (RemoteApp) et VNC ;\n- l'intégration à l'annuaire et l'authentification unique ;\n- la gouvernance des accès : validations, accès temporaires, politiques centralisées ;\n- l'enregistrement des sessions et la production de preuves ;\n- les relais de site, la haute disponibilité, l'intégration au SOC ;\n- le support de l'éditeur.\n\nElle se déploie hors ligne, sans serveur de licence ni appel extérieur, ce qui convient aux environnements isolés. À expiration, sa licence désactive les fonctions Enterprise sans toucher au socle.\n\n## Avant de décider\n\nLe fichier `LICENSE` du dépôt fait foi : faites-le relire avant de fonder un usage commercial dessus. Pour une évaluation ou une offre, écrivez à **contact@endorium.space**.\n\nVoir [Éditions](../docs/#/editions)."
      }
    ]
  },
  {
    id: 15,
    slug: "postgresql",
    title: "Utiliser PostgreSQL plutôt que SQLite ?",
    description: "Passer EndoriumFort de SQLite à PostgreSQL avec ENDORIUMFORT_DB_DSN, migrer une installation existante, et ce qui reste sur le volume de données.",
    tags: ["exploitation", "base-de-donnees"],
    date: "2026-11-04",
    body: "Nous avons un PostgreSQL géré et sauvegardé. Le bastion peut-il l'utiliser ?",
    answers: [
      {
        accepted: true, date: "2026-11-24",
        body: "Oui, sans changer d'image : une seule variable choisit le moteur.\n\n```\n# SQLite (défaut) : vide, ou un chemin de fichier\nENDORIUMFORT_DB_DSN=\n\n# PostgreSQL\nENDORIUMFORT_DB_DSN=postgresql://endoriumfort:<mot-de-passe>@db.example.com:5432/endoriumfort?sslmode=require\n```\n\nLe journal de démarrage confirme le choix : `[config] database backend=postgresql`. Si la base est injoignable, le bastion **refuse de démarrer** plutôt que de tourner sans comptes ni journal ; la politique de redémarrage du conteneur réessaie, ce qui règle le cas d'un PostgreSQL plus lent à démarrer.\n\n## Préparer la base\n\n```\nCREATE ROLE endoriumfort LOGIN PASSWORD '<mot-de-passe>';\nCREATE DATABASE endoriumfort OWNER endoriumfort;\n```\n\nLe bastion crée ses tables au premier démarrage. Chiffrez la connexion (`sslmode=require` ou `verify-full`) dès que la base n'est pas sur le même hôte.\n\n## Migrer une installation SQLite\n\nLe dépôt fournit `scripts/migrate-sqlite-to-postgres.py`, qui produit un script SQL relisible avant application :\n\n1. sauvegardez, puis arrêtez le bastion ;\n2. démarrez-le une fois avec le nouveau `ENDORIUMFORT_DB_DSN` pour créer les tables, puis arrêtez-le ;\n3. générez et appliquez les données (commandes ci-dessous) ;\n4. redémarrez le bastion avec `ENDORIUMFORT_DB_DSN`.\n\n```\nscripts/migrate-sqlite-to-postgres.py --replace /chemin/vers/endoriumfort.db > load.sql\npsql \"postgresql://...\" -v ON_ERROR_STOP=1 -f load.sql\n```\n\n`--replace` vide les tables cibles : à n'utiliser que sur une base qui ne contient que l'amorçage du bastion, jamais sur une base en service. Gardez la **même** `ENDORIUMFORT_VAULT_KEY` : les secrets migrés sont chiffrés avec elle.\n\n## Deux précisions\n\n- Le **journal d'audit** reste un fichier sur le volume de données : gardez ce volume, et sauvegardez-le avec la base (`pg_dump` ou votre sauvegarde continue ne le couvrent pas).\n- Une **seule instance** du bastion à la fois, même avec PostgreSQL : une partie de son état vit en mémoire, et la chaîne d'audit est strictement séquentielle.\n\nVoir [Base de données](../docs/#/base-de-donnees)."
      }
    ]
  },
  {
    id: 16,
    slug: "signaler-vulnerabilite",
    title: "Comment signaler une faille de sécurité ?",
    description: "Signaler une vulnérabilité d'EndoriumFort en privé à security@endorium.space : informations à fournir, délais de réponse et divulgation coordonnée.",
    tags: ["securite", "contribuer"],
    date: "2026-11-04",
    body: "Je pense avoir trouvé une vulnérabilité. Où la signaler ?",
    answers: [
      {
        accepted: true, date: "2026-11-24",
        body: "**Jamais dans un espace public** : ni discussion, ni issue, ni réseau social. Une faille publiée avant son correctif expose tous ceux qui utilisent le bastion.\n\n## Où écrire\n\nÀ **security@endorium.space**, en privé.\n\n## Quoi envoyer\n\n- la **version** et l'**édition** (CE ou EE), le mode de déploiement (Docker, paquet Debian, Kubernetes) et le **composant** concerné : console, API, terminal SSH, navigateur isolé, partage de fichiers… ;\n- les **étapes de reproduction**, depuis une installation aussi proche que possible de celle par défaut ;\n- l'**impact** constaté : ce qu'un attaquant obtient, et avec quels prérequis (compte opérateur, accès réseau, aucun) ;\n- si possible, une **preuve de concept minimale** ;\n- un moyen de vous recontacter.\n\nRetirez de vos envois tout secret réel : clés, mots de passe, jetons.\n\n## Ce qui se passe ensuite\n\nObjectif de l'équipe : **accusé de réception sous 72 heures**, analyse sous 7 jours. Merci de laisser le temps d'un correctif avant toute divulgation.\n\nSeule la dernière version publiée reçoit les correctifs de sécurité : restez à jour, et vérifiez l'authenticité des images (signées avec Cosign) avant de les déployer ([Mise à jour](../docs/#/mise-a-jour)).\n\n## Ce qui n'est pas une vulnérabilité\n\nUn comportement documenté n'en est pas une. Par exemple :\n\n- des secrets stockés en clair **sans** `ENDORIUMFORT_VAULT_KEY` ;\n- l'absence de filtrage des transferts du navigateur isolé en CE ;\n- les limites connues du garde-fou SSH face aux variables et substitutions du shell.\n\nPour ces sujets, une [discussion](https://github.com/Endorium-Group/EndoriumFort-CE/discussions/categories/q-a) ou une [idée](https://github.com/Endorium-Group/EndoriumFort-CE/discussions/categories/ideas) convient. Un bug sans impact de sécurité se signale par une [issue](https://github.com/Endorium-Group/EndoriumFort-CE/issues/new/choose).\n\nVoir [Durcissement](../docs/#/durcissement)."
      }
    ]
  }
];
