# Concepts

Six notions suffisent pour comprendre EndoriumFort.

## Ressource

Une **ressource** est une cible déclarée dans le bastion : un serveur SSH, une interface d'administration web, un lecteur de partage de fichiers. Elle porte une adresse, un port, éventuellement un identifiant rangé dans le coffre, et ses propres **règles d'accès**.

Les utilisateurs ne voient jamais l'adresse « en direct » : ils ouvrent la ressource depuis la console, et c'est le bastion qui se connecte.

## Session

Ouvrir une ressource crée une **session**. Elle a un propriétaire, un début, une fin, et apparaît en temps réel dans la page **Sessions**. Un administrateur peut l'observer ou la terminer. Toute session est journalisée.

## Rôle

Le **rôle** fixe les capacités globales d'un compte :

| Rôle | En une phrase |
|---|---|
| **Administrateur** | Configure tout : utilisateurs, ressources, règles, intégrations. |
| **Opérateur** | Ouvre des sessions vers les ressources qui lui sont affectées. |
| **Auditeur** | Consulte journal, sessions et rapports, sans rien ouvrir ni modifier. |

## Périmètre

Le rôle ne donne accès à **aucune ressource** en particulier. Chaque ressource doit être **affectée** explicitement à un opérateur : c'est son **périmètre**. Un opérateur sans affectation ne voit rien.

## Règles d'accès

Chaque ressource porte des garde-fous appliqués **côté serveur** à l'ouverture et pendant la session : motif obligatoire, niveau de risque, ticket exigé, garde-fou de commandes SSH, sens de transfert de fichiers autorisés. Voir [Règles d'accès](#/regles-acces).

Le modèle se lit donc en trois couches :

```
rôle          →  ce que le compte peut faire en général
périmètre     →  quelles ressources il peut ouvrir
règles        →  à quelles conditions il peut les ouvrir
```

## Coffre et journal

- Le **coffre-fort** chiffre les identifiants des cibles. Le bastion les injecte au moment de la connexion : l'opérateur ne les voit pas, et ne peut donc pas les réutiliser hors du bastion.
- Le **journal d'audit** enregistre chaque action dans un fichier chaîné par hachage. Modifier ou retirer une ligne casse la chaîne, ce que la console détecte.

## Architecture

```
Navigateur ──HTTPS/WSS──►  nginx ──►  backend EndoriumFort  ──SSH / HTTP──►  cibles
                             │              │
                             │              ├── base (SQLite ou PostgreSQL)
                             │              └── journal d'audit chaîné
                             └──/files/──►  service de partage de fichiers (conteneur séparé)
```

Le navigateur est le seul client : rien à installer sur les postes des opérateurs.
