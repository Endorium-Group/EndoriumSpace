// EndoriumSpace — sommaire de la documentation : sections → pages (fichiers dans content/).
// Lu par le navigateur (recherche) et par scripts/build.mjs (pages statiques).
// `description` (facultative) remplace la meta description tirée du premier paragraphe.
window.EFDOCS = [
  { group: "Prise en main", pages: [
    { slug: "introduction", title: "Introduction", file: "introduction.md" },
    { slug: "concepts", title: "Concepts", file: "concepts.md",
      description: "Les notions clés d'EndoriumFort : ressource, session, rôle, périmètre, règles d'accès, coffre et journal d'audit, et l'architecture du bastion." },
    { slug: "dimensionnement", title: "Dimensionnement", file: "dimensionnement.md",
      description: "Dimensionner un bastion EndoriumFort : CPU, mémoire, disque pour les enregistrements et journaux, bande passante, limites à relever, SQLite ou PostgreSQL." },
    { slug: "installation", title: "Installation (Docker)", file: "installation.md",
      description: "Installer EndoriumFort avec Docker : essai rapide, docker compose avec images GHCR épinglées, clés à fournir, ports et volumes à prévoir." },
    { slug: "installation-debian", title: "Installation (Debian)", file: "installation-debian.md",
      description: "Installer EndoriumFort sans Docker depuis le dépôt APT signé : paquet Debian, configuration dans /etc/endoriumfort, certificat, durcissement systemd." },
    { slug: "kubernetes", title: "Installation (Kubernetes)", file: "kubernetes.md",
      description: "Déployer EndoriumFort sur Kubernetes avec le chart Helm (registre OCI GHCR) : Secret des clés, valeurs, TLS et ingress, PostgreSQL, partage de fichiers." },
    { slug: "premier-demarrage", title: "Premier démarrage", file: "premier-demarrage.md",
      description: "Premier démarrage d'EndoriumFort : compte initial, configuration de sécurité imposée (mot de passe et MFA), comptes nominatifs, clé du coffre, domaine." },
    { slug: "console", title: "Visite de la console", file: "console.md",
      description: "Visite de la console web d'EndoriumFort : navigation, carte des ressources, sessions, journal et rapports, administration, compte personnel." }
  ]},
  { group: "Accès", pages: [
    { slug: "ressources", title: "Déclarer une ressource", file: "ressources.md",
      description: "Déclarer une ressource dans EndoriumFort (SSH, web, partage de fichiers…) : types disponibles en Community, création, affectation aux utilisateurs, tests." },
    { slug: "regles-acces", title: "Règles d'accès", file: "regles-acces.md",
      description: "Règles d'accès par ressource dans EndoriumFort : niveau de risque, motif obligatoire, politique adaptative, garde-fou SSH, transferts, double approbation." },
    { slug: "session-ssh", title: "Session SSH", file: "session-ssh.md",
      description: "Terminal SSH dans le navigateur avec EndoriumFort : ouvrir et reprendre une session, snippets, transfert de fichiers SFTP, garde-fou et enregistrement." },
    { slug: "garde-fou-ssh", title: "Garde-fou de commandes SSH", file: "garde-fou-ssh.md",
      description: "Le garde-fou SSH d'EndoriumFort bloque côté serveur les commandes dangereuses : activation par ressource, règles fournies et personnalisées, limites." },
    { slug: "proxy-rbi", title: "Navigateur isolé (RBI)", file: "proxy-rbi.md",
      description: "Proxy HTTP et navigateur isolé (RBI) d'EndoriumFort pour les interfaces web d'administration : copier-coller, fichiers, impression, moteurs, traçabilité." },
    { slug: "machine-de-rebond", title: "Machine de rebond", file: "machine-de-rebond.md",
      description: "Machine de rebond native d'EndoriumFort : un bureau jetable dans la console, navigateur confiné à une liste blanche, fichiers, presse-papiers tracé." },
    { slug: "acces-direct", title: "Accès direct aux applications", file: "acces-direct.md",
      description: "Accès direct aux applications web avec EndoriumFort : sous-domaine dédié, vitesse native, certificat automatique, connexion automatique, règles de transfert." },
    { slug: "rdp-navigateur", title: "RDP navigateur & RemoteApp", file: "rdp-navigateur.md",
      description: "RDP dans le navigateur avec EndoriumFort Enterprise : postes Windows sans client, presse-papiers gouverné, enregistrement, applications publiées RemoteApp." },
    { slug: "partage-fichiers", title: "Partage de fichiers", file: "partage-fichiers.md",
      description: "Partage de fichiers EndoriumFort : un drive web par utilisateur, service isolé, partages en lecture ou écriture avec expiration, traçabilité des fichiers." },
    { slug: "workspace", title: "Endorium Workspace", file: "workspace.md",
      description: "Endorium Workspace : un portail à tuiles pour les collaborateurs non techniques, profil « bureau », appareils connus, fichiers et aperçu sécurisé." },
    { slug: "sessions", title: "Sessions", file: "sessions.md",
      description: "Suivre les sessions EndoriumFort en temps réel : qui voit quoi, reprendre, observer en direct ou terminer une session, événements journalisés." },
    { slug: "relais", title: "Relais de site", file: "relais.md",
      description: "Relais de site EndoriumFort Enterprise : joindre les machines d'un site distant sans VPN ni port ouvert, enrôlement par code, rattachement des ressources." }
  ]},
  { group: "Identités & secrets", pages: [
    { slug: "utilisateurs", title: "Utilisateurs & rôles", file: "utilisateurs.md",
      description: "Gérer les utilisateurs d'EndoriumFort : les trois rôles, création, affectation des ressources, suivi d'activité, modification, mot de passe." },
    { slug: "mfa", title: "MFA (TOTP & passkeys)", file: "mfa.md",
      description: "MFA dans EndoriumFort : qui doit enrôler un second facteur, enrôler un TOTP ou une passkey (WebAuthn), connexion, perte d'un facteur, bonnes pratiques." },
    { slug: "coffre", title: "Coffre-fort de secrets", file: "coffre.md",
      description: "Coffre-fort de secrets d'EndoriumFort : clé du coffre, identifiants chiffrés en AES-256-GCM, injectés à la connexion sans jamais être montrés aux opérateurs." }
  ]},
  { group: "Traçabilité", pages: [
    { slug: "audit", title: "Journal d'audit", file: "audit.md",
      description: "Journal d'audit infalsifiable d'EndoriumFort : stockage, chaînage SHA-256 ou HMAC, vérification d'intégrité, recherche, export et événements principaux." },
    { slug: "rapports", title: "Rapports", file: "rapports.md",
      description: "Rapports d'activité EndoriumFort : sessions, connexions et commandes bloquées par jour, mois, trimestre ou année, comparés à la période précédente, export CSV." }
  ]},
  { group: "Exploitation", pages: [
    { slug: "tls-reverse-proxy", title: "TLS & reverse-proxy", file: "tls-reverse-proxy.md",
      description: "Servir EndoriumFort en HTTPS : Let's Encrypt intégré, reverse-proxy existant (Caddy, nginx) ou certificat personnel, domaine des passkeys, en-têtes." },
    { slug: "base-de-donnees", title: "Base de données", file: "base-de-donnees.md",
      description: "Base de données d'EndoriumFort : SQLite par défaut ou PostgreSQL, préparation, migration de SQLite vers PostgreSQL, instance unique, sauvegarde." },
    { slug: "sauvegarde", title: "Sauvegarde & restauration", file: "sauvegarde.md",
      description: "Sauvegarder et restaurer EndoriumFort sous Docker ou Debian : données, base, partage de fichiers et clés, vérifications après restauration, plan de reprise." },
    { slug: "mise-a-jour", title: "Mise à jour", file: "mise-a-jour.md",
      description: "Mettre à jour EndoriumFort : version épinglée, docker compose, docker run, paquet Debian ou Kubernetes, et vérification de l'authenticité des images." },
    { slug: "durcissement", title: "Durcissement", file: "durcissement.md",
      description: "Durcir un bastion EndoriumFort avant la production : protections déjà en place, liste de contrôle, durée des connexions, signalement des vulnérabilités." },
    { slug: "depannage", title: "Dépannage", file: "depannage.md",
      description: "Dépannage d'EndoriumFort : conteneur qui ne démarre pas, santé du service, connexion, sessions SSH, navigateur isolé, partage de fichiers, coffre et journal." }
  ]},
  { group: "Référence", pages: [
    { slug: "configuration", title: "Variables d'environnement", file: "configuration.md",
      description: "Référence des variables d'environnement d'EndoriumFort Community : clés et secrets, réseau et TLS, authentification, base, SSH, navigateur isolé, fichiers." },
    { slug: "api", title: "API REST", file: "api.md",
      description: "API REST d'EndoriumFort : authentification par jeton, codes de réponse, routes principales et exemples pour scripter tout ce que fait la console." },
    { slug: "glossaire", title: "Glossaire", file: "glossaire.md",
      description: "Glossaire d'EndoriumFort : bastion, PAM, ressource, session, coffre, RBI, MFA, passkey, journal chaîné et autres termes de la documentation." },
    { slug: "editions", title: "Éditions (CE/EE)", file: "editions.md",
      description: "EndoriumFort Community ou Enterprise : ce que contient le socle open-core au code public, et ce qu'ajoute l'édition Enterprise sous licence." }
  ]}
];
