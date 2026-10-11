// EndoriumSpace — communauté Q&A (contenu curé, statique).
// Pour ajouter une question : copier un bloc et incrémenter `id` + `slug` unique.
window.EFQA = [
  {
    id: 1,
    slug: "mot-de-passe-admin-initial",
    title: "Où trouver le mot de passe admin au premier démarrage ?",
    tags: ["installation", "premiers-pas"],
    votes: 24, views: 1320, author: "camille", date: "2026-09-18",
    body: "Je viens de lancer le conteneur EndoriumFort CE mais je n'ai pas d'identifiants pour me connecter à `https://mon-hote/`. Comment obtenir le mot de passe du compte `admin` ?",
    answers: [
      {
        votes: 31, accepted: true, author: "mainteneur", date: "2026-09-18",
        body: "Au **tout premier lancement**, un mot de passe aléatoire est généré et **affiché une seule fois** dans les logs :\n\n```\ndocker logs endoriumfort\n```\n\nCherchez la ligne :\n\n```\n[SECURITY] Default admin 'admin' created with a one-time random password (shown only once):\n\n    <MOT_DE_PASSE>\n```\n\nConnectez-vous avec `admin` + ce mot de passe, puis changez-le immédiatement (et enrôlez une MFA — c'est imposé par défaut).\n\n> Pour le fixer à l'avance (provisioning), utilisez `ENDORIUMFORT_BOOTSTRAP_ADMIN_PASSWORD` **sur une base neuve**."
      }
    ]
  },
  {
    id: 2,
    slug: "deposer-iso-esxi-via-bastion",
    title: "Déposer une image ISO sur un ESXi à travers le bastion ?",
    tags: ["rbi", "transfert-fichiers"],
    votes: 18, views: 860, author: "nadia", date: "2026-09-25",
    body: "J'administre un **ESXi** via le navigateur isolé (RBI) du bastion. Je voudrais téléverser une ISO sur le datastore, mais le sélecteur de fichier de l'interface ESXi ne voit rien côté serveur isolé. C'est possible ?",
    answers: [
      {
        votes: 15, accepted: true, author: "mainteneur", date: "2026-09-25",
        body: "Oui, via le **transfert de fichiers du navigateur isolé**. Deux chemins :\n\n1. **Glisser-déposer** le fichier local directement sur le canvas du RBI.\n2. **Interception du sélecteur** : quand l'UI ESXi ouvre son `<input type=file>` (bouton « Upload »), le bastion vous demande le fichier **local**, puis le remet à la page isolée.\n\nLe fichier transite bastion→ESXi via le navigateur isolé qui détient la session. Pour une grosse ISO, le transfert est **streamé sur disque** (pas de chargement en mémoire).\n\nAssurez-vous d'utiliser le moteur RBI « tiles » (présent dans l'image RBI). Les **politiques fines** de transfert (sens autorisés, tailles, extensions, DLP) relèvent de l'édition Enterprise, mais la **capacité** de transfert est disponible en CE."
      }
    ]
  },
  {
    id: 3,
    slug: "ami-reseau-distant-relais",
    title: "Permettre à un ami d'atteindre son réseau depuis mon bastion ?",
    tags: ["relais", "enterprise", "reseau"],
    votes: 12, views: 540, author: "louis", date: "2026-10-02",
    body: "Mon bastion tourne chez moi. Un ami voudrait accéder à ses machines (SSH) **chez lui** à travers mon bastion. Quelle est la bonne architecture ?",
    answers: [
      {
        votes: 14, accepted: true, author: "mainteneur", date: "2026-10-02",
        body: "C'est le rôle d'un **relais** (fonctionnalité **Enterprise**). Votre ami déploie `endoriumfort-relay` **sur son réseau** ; il reçoit les connexions du bastion et les réachemine vers ses machines locales.\n\n**Point réseau clé** : c'est le **bastion qui se connecte au relais** (le relais n'émet que des *heartbeats* sortants). Donc votre ami doit **rediriger le port d'écoute du relais sur sa box** (port-forward), et restreindre la source à l'IP de votre bastion.\n\nFlux résumé :\n\n1. Côté bastion : activer l'enrôlement (`ENDORIUMFORT_RELAY_ENROLL_SECRET`), émettre un **token d'enrôlement** (et un certificat si requis).\n2. Côté ami : lancer le relais avec `--server https://votre-bastion`, `--relay-id`, `--enrollment-token`, `--listen 0.0.0.0:18080`, `--allow-target 192.168.1.10:22`.\n3. Côté bastion : **rattacher la ressource au relais**.\n\nVoir le guide détaillé de déploiement de relais dans la documentation."
      },
      {
        votes: 3, accepted: false, author: "theo", date: "2026-10-03",
        body: "Astuce : si l'IP publique de l'ami est **dynamique**, utilisez un DynDNS, ou hébergez le relais sur un petit VPS qui atteint le LAN via VPN."
      }
    ]
  },
  {
    id: 4,
    slug: "chiffrer-base-au-repos",
    title: "Comment chiffrer la base de données au repos ?",
    tags: ["securite", "chiffrement", "configuration"],
    votes: 16, views: 720, author: "sofia", date: "2026-10-05",
    body: "Pour un audit, je dois chiffrer les données **au repos**. EndoriumFort le gère-t-il nativement ?",
    answers: [
      {
        votes: 19, accepted: true, author: "mainteneur", date: "2026-10-05",
        body: "Oui, via **SQLCipher**. Fournissez une clé :\n\n```\nENDORIUMFORT_DB_ENCRYPTION_KEY=\"$(openssl rand -hex 32)\"\n```\n\nSur une base **neuve**, elle est créée chiffrée. Sur une base **existante en clair**, ajoutez au premier redémarrage :\n\n```\nENDORIUMFORT_DB_ENCRYPTION_MIGRATE=1\n```\n\nLa base est chiffrée en place (une sauvegarde `.plaintext.bak` est conservée) ; retirez ensuite le flag.\n\n> Sécurité intégrée : si une clé est posée mais que le binaire n'a pas SQLCipher, le service **refuse de démarrer** — pas de stockage en clair silencieux. Pensez aussi à `ENDORIUMFORT_VAULT_KEY` pour les secrets et à chiffrer le volume hôte (LUKS) en défense en profondeur."
      }
    ]
  },
  {
    id: 5,
    slug: "imposer-mfa-tous",
    title: "Rendre la MFA obligatoire pour tous les utilisateurs",
    tags: ["mfa", "securite"],
    votes: 9, views: 410, author: "ines", date: "2026-10-06",
    body: "Je veux garantir que **personne** ne puisse utiliser le bastion sans second facteur. Comment l'imposer côté serveur (et pas seulement dans l'UI) ?",
    answers: [
      {
        votes: 11, accepted: true, author: "mainteneur", date: "2026-10-06",
        body: "Réglez :\n\n```\nENDORIUMFORT_REQUIRE_MFA=all\n```\n\n(C'est déjà le **défaut**.) L'enforcement est **côté serveur** : un utilisateur sans facteur enrôlé est bloqué sur tout `/api` sauf les écrans d'enrôlement, jusqu'à ce qu'il ajoute un TOTP ou une passkey.\n\nValeurs possibles : `all`, `admins`, `none`.\n\n> À la mise à jour d'un parc existant, les comptes sans MFA seront forcés d'en enrôler une. Pour une transition en douceur, passez temporairement sur `admins`, puis revenez à `all`."
      }
    ]
  },
  {
    id: 6,
    slug: "verifier-integrite-audit",
    title: "Comment prouver que le journal d'audit n'a pas été modifié ?",
    tags: ["audit", "conformite"],
    votes: 13, views: 480, author: "karim", date: "2026-10-07",
    body: "Un auditeur me demande une preuve d'intégrité du journal. Qu'est-ce qu'EndoriumFort fournit ?",
    answers: [
      {
        votes: 12, accepted: true, author: "mainteneur", date: "2026-10-07",
        body: "Le journal est **chaîné** : chaque entrée contient un hachage liant à la précédente, donc toute altération rompt la chaîne.\n\n- Sans clé : chaîne **SHA-256** (détecte les éditions).\n- Avec `ENDORIUMFORT_AUDIT_HMAC_KEY` : chaîne **HMAC** (résistante à la falsification ; stockez la clé **hors** du volume de données).\n\nDans la console, section Audit, le bouton **« Vérifier l'intégrité »** recalcule la chaîne et renvoie `intègre` ou la **ligne** où elle est rompue. C'est la preuve exploitable à fournir à l'auditeur."
      }
    ]
  },
  {
    id: 7,
    slug: "ports-exposes",
    title: "Quels ports exposer, et le 80 est-il obligatoire ?",
    tags: ["installation", "reseau"],
    votes: 7, views: 390, author: "manon", date: "2026-10-08",
    body: "Dans le `docker run`, je vois `-p 443:443 -p 80:80`. Puis-je me passer du 80 ? Et quel est le port du backend ?",
    answers: [
      {
        votes: 8, accepted: true, author: "mainteneur", date: "2026-10-08",
        body: "nginx (intégré) écoute en **80** et **443** ; le backend tourne en interne sur **8080** (non exposé).\n\n- Le **443** suffit en pratique ; le 80 sert surtout à rediriger vers HTTPS. Vous pouvez n'exposer que `-p 443:443`.\n- Pour éviter les ports privilégiés sur l'hôte, mappez par ex. `-p 8443:443` et accédez via `https://hote:8443`.\n\nLa sonde de santé interne est `http://127.0.0.1:8080/api/health`."
      }
    ]
  },
  {
    id: 8,
    slug: "sauvegarde-cles",
    title: "Que faut-il sauvegarder exactement (et les clés) ?",
    tags: ["exploitation", "sauvegarde"],
    votes: 10, views: 300, author: "yanis", date: "2026-10-09",
    body: "Je mets en place des sauvegardes. Les volumes suffisent-ils, ou dois-je garder autre chose ?",
    answers: [
      {
        votes: 10, accepted: true, author: "mainteneur", date: "2026-10-09",
        body: "Sauvegardez :\n\n1. Le volume **`/app/data`** (base, config, licence, audit).\n2. Le volume **`/app/recordings`** si vous enregistrez les sessions.\n3. **Hors volume** : vos **clés d'environnement** — `ENDORIUMFORT_VAULT_KEY`, `ENDORIUMFORT_DB_ENCRYPTION_KEY`, `ENDORIUMFORT_AUDIT_HMAC_KEY`.\n\n⚠️ **Sans les clés, les données chiffrées sont irrécupérables.** Stockez-les dans un gestionnaire de secrets, **séparément** des archives de données. À la restauration, redonnez exactement les mêmes variables d'environnement."
      }
    ]
  }
];
