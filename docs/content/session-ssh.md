# Session SSH

EndoriumFort fournit un **terminal SSH dans le navigateur** : aucun client SSH ni clé privée sur le poste de l'opérateur.

## Ouvrir une session

1. Tableau de bord → sélectionnez une ressource de protocole **SSH**.
2. Cliquez sur **Ouvrir une session**.
3. Le terminal s'ouvre dans le navigateur ; interagissez comme avec un SSH classique.

## Authentification vers la cible

- **Identifiant du coffre** : si la ressource est liée à un secret vaulté, la connexion s'authentifie automatiquement — l'opérateur ne voit pas le mot de passe.
- **Saisie manuelle** : sinon, l'utilisateur fournit ses identifiants au moment de la connexion.

## Traçabilité

- Chaque session est **journalisée** (création, fin, acteur) dans le [journal d'audit](#/audit).
- Les sessions actives sont visibles en temps réel et peuvent être **terminées** par un administrateur.

## Bonnes pratiques

- Préférez des **comptes nominatifs** côté cible, ou des identifiants gérés dans le coffre.
- Activez la **MFA** pour tous les opérateurs ([MFA](#/mfa)).
- Restreignez l'accès via les **rôles et profils** ([Utilisateurs & rôles](#/utilisateurs)).

> L'enregistrement et la relecture vidéo des sessions, ainsi que la gouvernance juste-à-temps (double approbation, élévation), sont des fonctionnalités **Enterprise**.
