# Glossaire

| Terme | Définition |
|---|---|
| **Bastion** | Point de passage unique et contrôlé vers les systèmes d'administration. Les accès ne se font plus en direct mais à travers lui. |
| **PAM** | *Privileged Access Management* : gestion des accès à privilèges — qui peut administrer quoi, comment, et avec quelle trace. |
| **Ressource** | Une cible déclarée dans le bastion : serveur SSH, interface web, lecteur de fichiers. |
| **Session** | Un accès ouvert vers une ressource, du début à la fin, avec son propriétaire et ses événements. |
| **Périmètre** | L'ensemble des ressources affectées à un utilisateur. |
| **Règles d'accès** | Conditions posées sur une ressource : motif, niveau de risque, ticket, garde-fou, transferts. |
| **Motif** | Justification saisie à l'ouverture d'une session, rattachée au journal. |
| **Objet de session** | Courte description exigée sur une ressource à risque élevé ou critique. |
| **Coffre-fort** | Stockage chiffré des identifiants des cibles, injectés par le bastion sans être montrés. |
| **Garde-fou SSH** | Filtre côté serveur qui bloque des commandes dangereuses avant qu'elles atteignent la cible. |
| **Observer** | Suivre une session SSH en direct, en lecture seule. |
| **RBI** | *Remote Browser Isolation* : navigateur exécuté côté serveur, dont seules les images atteignent le poste. |
| **Journal d'audit** | Fichier où chaque événement est enregistré et chaîné au précédent par une empreinte. |
| **Chaîne de hachage** | Procédé où chaque entrée contient l'empreinte de la précédente : toute altération casse la suite. |
| **HMAC** | Empreinte calculée avec une clé secrète : sans la clé, impossible de produire une empreinte valide. |
| **TOTP** | Code à usage unique renouvelé toutes les 30 secondes par une application d'authentification. |
| **Passkey / WebAuthn** | Second facteur fondé sur une clé cryptographique liée au domaine : biométrie, code de l'appareil, clé FIDO2. Résiste à l'hameçonnage. |
| **Zone** | Regroupement de ressources sur la carte : site, environnement, équipe. |
| **CE / EE** | *Community Edition* (cette documentation) et *Enterprise Edition*. Voir [Éditions](#/editions). |
