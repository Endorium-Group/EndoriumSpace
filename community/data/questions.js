// EndoriumSpace — questions fréquentes de la communauté (contenu rédigé par l'équipe).
// Pas de votes ni de vues : ce n'est pas un forum, et on ne simule pas d'activité.
// Pour ajouter une question : copier un bloc, `id` et `slug` uniques, et relier
// la réponse à la page de documentation qui fait foi.
window.EFQA = [
  {
    id: 1,
    slug: "mot-de-passe-admin-initial",
    title: "Quels identifiants utiliser au premier démarrage ?",
    tags: ["installation", "premiers-pas"],
    date: "2026-11-04",
    body: "Je viens de lancer EndoriumFort CE et j'arrive sur l'écran de connexion. Quel compte utiliser ?",
    answers: [
      {
        accepted: true, date: "2026-11-04",
        body: "Sur une base **neuve**, le compte initial est :\n\n| Identifiant | Mot de passe |\n|---|---|\n| `admin` | `Admin123` |\n\nÀ la première connexion, un écran de **configuration de sécurité initiale** bloque tout le reste jusqu'à ce que vous ayez :\n\n1. choisi un mot de passe privé ;\n2. enrôlé un second facteur (TOTP ou passkey).\n\n> Ce mot de passe est public. Faites cette étape **juste après l'installation**, avant d'exposer le bastion sur le réseau.\n\nSi le volume de données a déjà servi, c'est le mot de passe choisi à ce moment qui s'applique. Voir [Premier démarrage](../docs/#/premier-demarrage)."
      }
    ]
  },
  {
    id: 2,
    slug: "secrets-en-clair-vault-key",
    title: "Mes mots de passe de cibles sont-ils vraiment chiffrés ?",
    tags: ["securite", "coffre", "configuration"],
    date: "2026-11-04",
    body: "J'ai enregistré des identifiants SSH dans le coffre. Comment savoir s'ils sont chiffrés en base ?",
    answers: [
      {
        accepted: true, date: "2026-11-04",
        body: "Ils ne le sont **que si `ENDORIUMFORT_VAULT_KEY` est fournie et valide** : exactement 64 caractères hexadécimaux.\n\n```\nopenssl rand -hex 32\n```\n\nSans clé, ou avec une clé mal formée, le bastion démarre quand même et enregistre les secrets **en clair**. Points d'attention :\n\n- le `docker-compose.yml` du dépôt ne transmet pas cette variable : ajoutez-la par un `docker-compose.override.yml` (voir [Installation](../docs/#/installation)) ;\n- fournir une clé **après coup** ne chiffre pas les secrets existants : ressaisissez-les ;\n- rangez la clé hors de l'hôte : sans elle, les secrets ne se relisent plus.\n\nDétails : [Coffre-fort](../docs/#/coffre)."
      }
    ]
  },
  {
    id: 3,
    slug: "deposer-iso-hyperviseur-rbi",
    title: "Déposer une image ISO sur un hyperviseur à travers le navigateur isolé ?",
    tags: ["rbi", "transfert-fichiers"],
    date: "2026-11-04",
    body: "J'administre un hyperviseur par le navigateur isolé du bastion. Je voudrais téléverser une ISO sur un datastore : c'est possible alors que le navigateur tourne sur le serveur ?",
    answers: [
      {
        accepted: true, date: "2026-11-04",
        body: "Oui. Deux façons :\n\n1. **Glisser-déposer** le fichier local sur la vue du navigateur isolé.\n2. Cliquer sur le bouton d'envoi de l'interface cible : le bastion intercepte le sélecteur de fichier et vous demande le fichier **local**, puis le remet à la page isolée.\n\nLe fichier est écrit sur disque côté bastion, pas chargé en mémoire : une grosse ISO passe. `ENDORIUMFORT_RBI_MAX_UPLOAD_MB` permet de plafonner la taille.\n\nDeux prérequis :\n\n- le moteur de rendu `tiles`, présent dans les images Docker publiées (le moteur `cdp` du paquet Debian ne transfère pas de fichiers) ;\n- en CE, les transferts ne sont **pas filtrés** : tout opérateur qui ouvre la ressource peut envoyer et récupérer des fichiers.\n\nVoir [Navigateur isolé](../docs/#/proxy-rbi)."
      }
    ]
  },
  {
    id: 4,
    slug: "atteindre-reseau-distant",
    title: "Atteindre des machines sur un autre site depuis mon bastion ?",
    tags: ["reseau", "architecture"],
    date: "2026-11-04",
    body: "Mon bastion tourne sur un site, mais je dois administrer des serveurs sur un second site, derrière un NAT. Comment faire en CE ?",
    answers: [
      {
        accepted: true, date: "2026-11-04",
        body: "Le bastion se connecte **lui-même** aux cibles : il doit pouvoir les joindre à l'adresse déclarée sur la ressource.\n\nEn CE, la solution est réseau : un **VPN site à site** (WireGuard, IPsec) entre le bastion et le site distant, avec des règles de pare-feu qui n'autorisent que le bastion vers les cibles.\n\nTestez la joignabilité depuis l'hôte du bastion avant de déclarer la ressource. L'acheminement par relais sans VPN relève de l'édition Enterprise."
      }
    ]
  },
  {
    id: 5,
    slug: "chiffrer-base-au-repos",
    title: "La base de données est-elle chiffrée au repos ?",
    tags: ["securite", "chiffrement"],
    date: "2026-11-04",
    body: "Pour un audit, je dois garantir que les données sont chiffrées au repos. Qu'est-ce que la CE fait ?",
    answers: [
      {
        accepted: true, date: "2026-11-04",
        body: "Deux niveaux à distinguer :\n\n- **Les secrets des cibles** sont chiffrés par l'application (AES-256-GCM), à condition que `ENDORIUMFORT_VAULT_KEY` soit fournie.\n- **La base elle-même** (comptes, ressources, sessions) et le journal d'audit ne sont **pas** chiffrés par la CE.\n\nPour le chiffrement au repos, placez le volume de données sur un stockage chiffré : LUKS sur l'hôte, volume chiffré du fournisseur cloud, ou classe de stockage chiffrée sur Kubernetes. Avec PostgreSQL, appliquez la même logique au serveur de base.\n\nVoir [Durcissement](../docs/#/durcissement)."
      }
    ]
  },
  {
    id: 6,
    slug: "mfa-obligatoire",
    title: "Peut-on rendre la MFA obligatoire pour tout le monde ?",
    tags: ["mfa", "securite"],
    date: "2026-11-04",
    body: "Je veux que personne ne puisse utiliser le bastion sans second facteur. Est-ce configurable ?",
    answers: [
      {
        accepted: true, date: "2026-11-04",
        body: "En CE, la règle est fixe :\n\n- **administrateurs** : second facteur **obligatoire**, imposé côté serveur ; un nouvel administrateur ne peut rien faire avant de l'avoir enrôlé ;\n- **opérateurs et auditeurs** : facultatif.\n\nIl n'existe pas de réglage pour l'imposer aux autres rôles. Ce que vous pouvez faire :\n\n- filtrer **Administration → Utilisateurs → Sans MFA uniquement** pour repérer les comptes concernés et relancer leurs titulaires ;\n- privilégier les passkeys, qui résistent à l'hameçonnage.\n\nVoir [MFA](../docs/#/mfa)."
      }
    ]
  },
  {
    id: 7,
    slug: "verifier-integrite-audit",
    title: "Comment prouver que le journal d'audit n'a pas été modifié ?",
    tags: ["audit", "conformite"],
    date: "2026-11-04",
    body: "Un auditeur me demande une preuve d'intégrité du journal. Qu'est-ce qu'EndoriumFort fournit ?",
    answers: [
      {
        accepted: true, date: "2026-11-04",
        body: "Le journal est **chaîné** : chaque entrée contient l'empreinte de la précédente, donc toute modification, insertion ou suppression casse la chaîne.\n\n- Sans clé : chaîne SHA-256.\n- Avec `ENDORIUMFORT_AUDIT_HMAC_KEY` : chaîne HMAC — impossible à recalculer sans la clé. **Réglez-la dès l'installation**, et stockez-la hors du volume.\n\nDans **Journal**, **« Vérifier l'intégrité »** recalcule la chaîne et renvoie soit « intègre », soit le numéro de la **première ligne rompue**. Pour l'automatiser :\n\n```\ncurl -sf https://bastion/api/audit/verify -H \"Authorization: Bearer $TOKEN\"\n```\n\nVoir [Journal d'audit](../docs/#/audit)."
      }
    ]
  },
  {
    id: 8,
    slug: "ports-exposes",
    title: "Quels ports exposer ?",
    tags: ["installation", "reseau"],
    date: "2026-11-04",
    body: "Le fichier compose publie 80 et 443. Puis-je me passer du 80 ? Et le port 8080 ?",
    answers: [
      {
        accepted: true, date: "2026-11-04",
        body: "- **443** : la console, l'API et les WebSocket. Indispensable.\n- **80** : redirection vers HTTPS, et validation Let's Encrypt si vous l'activez. Facultatif sinon.\n- **8080** : le backend, interne au conteneur. **Ne l'exposez pas** : nginx le sert.\n\nPour éviter les ports privilégiés : `EF_HTTP_PORT=8080 EF_HTTPS_PORT=8443`, puis `https://hote:8443` — en déclarant cette origine, port compris, dans `ENDORIUMFORT_WEBAUTHN_ORIGIN`.\n\nVoir [Installation](../docs/#/installation)."
      }
    ]
  },
  {
    id: 9,
    slug: "sauvegarde-cles",
    title: "Que faut-il sauvegarder exactement ?",
    tags: ["exploitation", "sauvegarde"],
    date: "2026-11-04",
    body: "Je mets en place des sauvegardes. Les volumes suffisent-ils ?",
    answers: [
      {
        accepted: true, date: "2026-11-04",
        body: "Non. Il faut :\n\n1. le volume de données **`/app/data`** : base SQLite et journal d'audit ;\n2. la base **PostgreSQL**, si vous l'utilisez ;\n3. le volume du **partage de fichiers**, séparé de celui du bastion ;\n4. **hors volume**, vos clés : `ENDORIUMFORT_VAULT_KEY`, `ENDORIUMFORT_AUDIT_HMAC_KEY`, `ENDORIUMFORT_FILESHARE_SECRET`.\n\nSans la clé du coffre, les secrets restaurés sont illisibles ; sans la clé HMAC, le journal ne se vérifie plus. Gardez-les dans un gestionnaire de secrets, **à part** des archives.\n\nVoir [Sauvegarde & restauration](../docs/#/sauvegarde)."
      }
    ]
  },
  {
    id: 10,
    slug: "passkey-ne-fonctionne-pas",
    title: "« Passkey sign-in failed » : pourquoi ma passkey est refusée ?",
    tags: ["mfa", "depannage"],
    date: "2026-11-04",
    body: "Le TOTP fonctionne, mais l'ajout ou l'utilisation d'une passkey échoue.",
    answers: [
      {
        accepted: true, date: "2026-11-04",
        body: "Presque toujours un problème de domaine. Les passkeys exigent :\n\n- du **HTTPS** avec un certificat valide (sauf `localhost`) ;\n- un domaine déclaré au bastion, qui correspond **exactement** à l'URL tapée :\n\n```\nENDORIUMFORT_WEBAUTHN_RP_ID=bastion.example.com\nENDORIUMFORT_WEBAUTHN_ORIGIN=https://bastion.example.com\n```\n\nSi vous accédez par une IP, un autre nom ou un autre port, la passkey est refusée. Une passkey créée sous un ancien domaine ne fonctionne plus : enrôlez-en une nouvelle.\n\nLe bilan **Administration → Sécurité** signale une configuration invalide."
      }
    ]
  },
  {
    id: 11,
    slug: "commande-bloquee-garde-fou",
    title: "« Command blocked by bastion guard » sur une commande anodine",
    tags: ["ssh", "depannage"],
    date: "2026-11-04",
    body: "Sur une ressource SSH, une commande sans danger est refusée avec ce message. Pourquoi ?",
    answers: [
      {
        accepted: true, date: "2026-11-04",
        body: "Le garde-fou de la ressource a retenu la saisie, pour l'une de deux raisons :\n\n1. **Une règle correspond** : vérifiez la liste dans **Administration → Sécurité**. Une règle personnalisée trop large peut attraper plus que prévu.\n2. **Un caractère non accepté** : sur une ressource gardée, seuls les caractères ASCII usuels passent. Une lettre accentuée, un guillemet typographique (collé depuis un traitement de texte) ou un emoji suffisent à bloquer la ligne.\n\nLe journal contient l'événement `command_guard.block` avec la raison. Voir [Garde-fou de commandes SSH](../docs/#/garde-fou-ssh)."
      }
    ]
  },
  {
    id: 12,
    slug: "ssh-cle-publique",
    title: "Le bastion peut-il se connecter aux cibles par clé SSH ?",
    tags: ["ssh"],
    date: "2026-11-04",
    body: "Nos serveurs n'acceptent que l'authentification par clé. Comment les déclarer ?",
    answers: [
      {
        accepted: true, date: "2026-11-04",
        body: "Pas en CE aujourd'hui : le bastion s'authentifie sur la cible **par mot de passe**.\n\nPour ces serveurs, autorisez l'authentification par mot de passe **uniquement depuis l'adresse du bastion**, avec un compte dédié dont le mot de passe vit dans le coffre :\n\n```\n# /etc/ssh/sshd_config\nPasswordAuthentication no\nMatch Address 10.0.0.10\n    PasswordAuthentication yes\n```\n\nLes postes des administrateurs, eux, n'ont plus besoin de clé du tout. Le sujet est ouvert : votez ou détaillez votre besoin dans les [idées](https://github.com/Endorium-Group/EndoriumFort-CE/discussions/categories/ideas)."
      }
    ]
  },
  {
    id: 13,
    slug: "derriere-reverse-proxy",
    title: "Faire tourner le bastion derrière Caddy ou Traefik",
    tags: ["reseau", "tls"],
    date: "2026-11-04",
    body: "J'ai déjà un reverse-proxy qui gère mes certificats. Que faut-il régler ?",
    answers: [
      {
        accepted: true, date: "2026-11-04",
        body: "Quatre points :\n\n1. **WebSocket** relayées, avec des délais d'au moins une heure (terminaux SSH, navigateur isolé).\n2. En-têtes `Host`, `X-Forwarded-For` et `X-Forwarded-Proto: https`.\n3. `ENDORIUMFORT_TRUSTED_PROXIES` = l'adresse du proxy. Sinon le bastion voit l'IP du proxy pour tout le monde : journal faux, et un seul utilisateur maladroit peut bloquer tous les autres par la limitation de débit.\n4. Taille de requête suffisante pour les transferts de fichiers.\n\nExemples Caddy et nginx : [TLS & reverse-proxy](../docs/#/tls-reverse-proxy)."
      }
    ]
  },
  {
    id: 14,
    slug: "licence-ce-usage-pro",
    title: "Puis-je utiliser la CE en production dans mon entreprise ?",
    tags: ["licence", "editions"],
    date: "2026-11-04",
    body: "La CE est gratuite et son code est public. Puis-je la déployer pour administrer les serveurs de production de ma société ?",
    answers: [
      {
        accepted: true, date: "2026-11-04",
        body: "Non, pas sans licence. La CE est **source-available**, pas open source au sens de l'OSI :\n\n- **gratuite** pour l'usage personnel, pédagogique, de recherche, l'évaluation, les tests et l'usage interne **hors production** ;\n- tout **usage commercial ou en production** demande une licence Enterprise.\n\nÉvaluer la CE dans un environnement de test avant de décider est précisément l'usage prévu. Le fichier `LICENSE` du dépôt fait foi ; pour une offre, écrivez à **contact@endorium.space**.\n\nVoir [Éditions](../docs/#/editions)."
      }
    ]
  },
  {
    id: 15,
    slug: "postgresql",
    title: "Utiliser PostgreSQL plutôt que SQLite ?",
    tags: ["exploitation", "base-de-donnees"],
    date: "2026-11-04",
    body: "Nous avons un PostgreSQL géré et sauvegardé. Le bastion peut-il l'utiliser ?",
    answers: [
      {
        accepted: true, date: "2026-11-04",
        body: "Oui, sans changer d'image :\n\n```\nENDORIUMFORT_DB_DSN=postgresql://endoriumfort:…@db:5432/endoriumfort?sslmode=require\n```\n\nLe bastion crée ses tables au premier démarrage. Pour migrer une installation SQLite existante, le dépôt fournit `scripts/migrate-sqlite-to-postgres.py`.\n\nDeux précisions :\n\n- le **journal d'audit** reste un fichier sur le volume de données : gardez ce volume et sauvegardez-le ;\n- une seule instance du bastion à la fois, même avec PostgreSQL.\n\nVoir [Base de données](../docs/#/base-de-donnees)."
      }
    ]
  },
  {
    id: 16,
    slug: "signaler-vulnerabilite",
    title: "Comment signaler une faille de sécurité ?",
    tags: ["securite", "contribuer"],
    date: "2026-11-04",
    body: "Je pense avoir trouvé une vulnérabilité. Où la signaler ?",
    answers: [
      {
        accepted: true, date: "2026-11-04",
        body: "**Jamais dans un espace public** — ni discussion, ni issue.\n\nÉcrivez à **security@endorium.space** avec :\n\n- la version et le composant concernés ;\n- les étapes de reproduction et l'impact ;\n- si possible, une preuve de concept minimale.\n\nObjectif de l'équipe : accusé de réception sous 72 heures, analyse sous 7 jours. Merci de laisser le temps d'un correctif avant toute divulgation. Seule la dernière version publiée reçoit les correctifs de sécurité."
      }
    ]
  }
];
