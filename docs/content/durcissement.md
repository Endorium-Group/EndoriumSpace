# Durcissement

Ce que le bastion fait déjà de lui-même, puis ce qu'il vous reste à faire avant la production.

## Ce qui est déjà en place

| Domaine | Mesure |
|---|---|
| Comptes | Mot de passe initial à changer et MFA imposée aux administrateurs, côté serveur. |
| Mots de passe | Hachage scrypt salé ; politique minimale appliquée par le serveur. |
| Force brute | Blocage progressif par identifiant et par IP, de 30 s à 30 min, journalisé. |
| Secrets | Coffre AES-256-GCM, dès que la clé est fournie. |
| Journal | Chaîne de hachage, HMAC avec clé ; vérification depuis la console. |
| Droits | Rôle relu à chaque requête : une rétrogradation s'applique immédiatement. |
| Web | CSP stricte, anti-iframe, API sensibles du navigateur désactivées, HSTS en HTTPS, pas de cache. |
| Conteneur | Backend non-root ; service de fichiers isolé, sans privilège, sans réseau sortant. |
| Navigateur isolé | Un Chromium jetable par session, détruit à la fermeture. |
| Images | Signées (Cosign), provenance SLSA, analysées en intégration continue. |

## Liste de contrôle avant production

### Clés

- [ ] `ENDORIUMFORT_VAULT_KEY` fournie (64 caractères hexadécimaux). **Sans elle, les secrets sont stockés en clair** ([Coffre-fort](#/coffre)).
- [ ] `ENDORIUMFORT_AUDIT_HMAC_KEY` fournie dès l'installation ([Journal d'audit](#/audit)).
- [ ] `ENDORIUMFORT_FILESHARE_SECRET` aléatoire, 32 caractères au moins.
- [ ] Les trois clés rangées dans un gestionnaire de secrets, **hors** de l'hôte et des sauvegardes.

### Comptes

- [ ] Mot de passe `admin` changé dès le premier démarrage ([Premier démarrage](#/premier-demarrage)).
- [ ] Un compte nominatif par administrateur ; `admin` gardé en réserve, mot de passe long sous scellés.
- [ ] Au moins deux seconds facteurs par administrateur.
- [ ] Opérateurs invités à enrôler un second facteur.
- [ ] Moindre privilège : auditeurs en **auditeur**, pas en administrateur ; affectations limitées au nécessaire.

### Réseau

- [ ] Certificat TLS valide ; le certificat par défaut de l'image n'est **pas** utilisé ([TLS & reverse-proxy](#/tls-reverse-proxy)).
- [ ] Domaine WebAuthn déclaré.
- [ ] `ENDORIUMFORT_TRUSTED_PROXIES` renseigné si un reverse-proxy est devant.
- [ ] Le bastion n'est pas exposé à Internet sans nécessité ; sinon, derrière un VPN ou une liste d'IP autorisées.
- [ ] Les cibles n'acceptent SSH et leurs interfaces d'administration **que depuis le bastion** : sinon, il se contourne.

### Ressources

- [ ] Identifiants des cibles dans le coffre, avec des comptes aux droits minimaux.
- [ ] Niveau de risque renseigné ; motif obligatoire sur la production.
- [ ] Garde-fou SSH actif sur les ressources sensibles ([Garde-fou](#/garde-fou-ssh)).
- [ ] Transfert de fichiers SSH ouvert seulement dans le sens nécessaire.
- [ ] Ressources web exposées en navigateur isolé uniquement à qui peut y échanger des fichiers : les transferts n'y sont pas filtrés en CE ([Navigateur isolé](#/proxy-rbi)).

### Exploitation

- [ ] Version épinglée, mises à jour suivies ([Mise à jour](#/mise-a-jour)).
- [ ] Sauvegardes planifiées et restauration testée ([Sauvegarde](#/sauvegarde)).
- [ ] Volume de données sur un stockage chiffré (LUKS, chiffrement du fournisseur) : la CE ne chiffre pas la base au repos.
- [ ] Revue régulière du journal : `auth.login.rate_limited`, `policy.decision.deny`, `command_guard.block`, `credential.access`.
- [ ] Bilan **Administration → Sécurité** sans point « À corriger ».

## Durée des connexions

`ENDORIUMFORT_TOKEN_TTL_SECONDS` (défaut `3600`) fixe la durée de vie d'une connexion à la console. Réduisez-la sur les postes partagés. La CE n'a pas de déconnexion sur inactivité : verrouillez les postes.

## Signaler une vulnérabilité

Jamais dans un espace public : écrivez à **security@endorium.space**. Voir la [Communauté](../community/).
