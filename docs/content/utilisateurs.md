# Utilisateurs & rôles

EndoriumFort applique un **contrôle d'accès basé sur les rôles (RBAC)** et le moindre privilège.

## Rôles

| Rôle | Vocation |
|---|---|
| **admin** | Administration complète (utilisateurs, ressources, configuration, audit). |
| **operator** | Ouvre des sessions vers les ressources qui lui sont accordées. |
| **auditor** | Consultation du journal d'audit et des sessions (lecture seule). |

> Les intitulés exacts et des rôles additionnels peuvent exister selon la configuration ; le principe reste : attribuer le minimum nécessaire.

## Créer un utilisateur

1. **Utilisateurs → Ajouter**.
2. Renseignez identifiant, rôle, et (selon la politique) un mot de passe initial + rotation forcée.
3. L'utilisateur devra, à sa première connexion, changer son mot de passe et — si la politique l'exige — enrôler une MFA.

## Accorder des ressources

Deux approches :

- **Par ressource** : Utilisateurs → (utilisateur) → Périmètre d'accès → accorder la ressource.
- **Par profil d'accès** : regrouper plusieurs ressources dans un profil et l'affecter (utile à grande échelle).

## Révoquer / supprimer

- Retirer une ressource/profil retire l'accès immédiatement.
- La **suppression d'un utilisateur** purge son compte et ses facteurs MFA. Le journal d'audit conserve les traces (imputabilité).

## Au-delà de la CE

SSO (OIDC/SAML), annuaire **LDAP/AD**, provisioning **SCIM**, gouvernance **juste-à-temps** (double approbation, accès temporaires) relèvent de l'édition **Enterprise**.
