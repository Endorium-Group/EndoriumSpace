# Utilisateurs & rôles

EndoriumFort applique un contrôle d'accès par **rôle**, complété par un **périmètre** de ressources explicitement affectées. Voir [Concepts](#/concepts) pour le modèle d'ensemble.

## Les trois rôles

| Rôle | Vocation |
|---|---|
| **Administrateur** | Administration complète : utilisateurs, ressources, règles, configuration. Voit toutes les ressources. |
| **Opérateur** | Ouvre des sessions vers les ressources qui lui sont affectées. Rôle par défaut. |
| **Auditeur** | Lecture seule : journal, sessions, rapports. Peut observer une session, pas en ouvrir. |

Les droits viennent **uniquement du rôle** : il n'y a pas d'exception par personne. Pour donner un droit à quelqu'un, changez son rôle.

### Droits détaillés

| Droit | Administrateur | Opérateur | Auditeur |
|---|:-:|:-:|:-:|
| Voir les ressources | toutes | affectées | affectées |
| Ouvrir une session | oui | oui | — |
| Voir les sessions | toutes | les siennes | toutes |
| Terminer une session | toutes | les siennes | — |
| Observer une session SSH | oui | — | oui |
| Lire le journal d'audit et les rapports | oui | — | oui |
| Gérer ressources, utilisateurs, règles | oui | — | — |
| Gérer les réglages de la plateforme | oui | — | — |

L'onglet **Profil** d'un utilisateur affiche la liste exacte des droits de son rôle.

## Créer un utilisateur

**Administration → Utilisateurs → Nouvel utilisateur.**

1. **Identifiant** — unique, sans distinction de casse : `Admin` et `admin` sont le même compte.
2. **Mot de passe initial** — au moins 8 caractères, avec une majuscule, une minuscule et un chiffre.
3. **Rôle**.
4. **Doit changer son mot de passe à la prochaine connexion** — coché par défaut pour un administrateur. Recommandé pour tous : vous ne connaîtrez pas le mot de passe final.

Un nouvel **administrateur** doit en outre enrôler un second facteur avant de pouvoir agir ([MFA](#/mfa)).

## Affecter des ressources

Onglet **Accès** de l'utilisateur : cochez les ressources qu'il peut ouvrir. L'effet est immédiat dans les deux sens.

Un administrateur voit toutes les ressources : sa sélection ne compte que si son rôle change.

## Suivre l'activité

L'onglet **Activité** montre les derniers événements de l'utilisateur dans le journal, avec un lien vers son journal complet.

La liste des utilisateurs se filtre par rôle, et **Sans MFA uniquement** isole les comptes sans second facteur.

## Modifier un utilisateur

Toute modification, même un simple changement de rôle, demande de saisir un **nouveau mot de passe** pour le compte : le serveur l'exige. Cochez « doit changer son mot de passe » pour que l'utilisateur le remplace aussitôt.

Un changement de rôle s'applique **immédiatement**, y compris aux connexions déjà ouvertes : une rétrogradation retire les droits sans attendre la reconnexion.

## Supprimer un utilisateur

- Supprime le compte, ses passkeys et ses affectations. Ses connexions en cours cessent d'être valides.
- Le journal d'audit **conserve** toutes ses traces : la suppression ne réécrit pas l'historique.
- Vous ne pouvez pas supprimer votre propre compte, ni rétrograder ou supprimer le **dernier administrateur**.

## Mot de passe

Politique appliquée par le serveur à chaque création et changement :

- 8 caractères minimum ;
- au moins une majuscule, une minuscule et un chiffre.

C'est un plancher. Demandez des phrases de passe longues, et un second facteur.

Les mots de passe sont stockés hachés avec **scrypt** et un sel par compte ; ils ne sont jamais réversibles.

## Protection contre la force brute

Les échecs de connexion sont comptés **par identifiant et par adresse IP**, sur une fenêtre glissante de 5 minutes. Au-delà de 10 échecs, les tentatives sont bloquées pour une durée croissante, de 30 secondes à 30 minutes ; même un mot de passe correct est refusé pendant le blocage. Chaque blocage est journalisé (`auth.login.rate_limited`).

Derrière un reverse-proxy, déclarez-le dans `ENDORIUMFORT_TRUSTED_PROXIES` pour que le compteur par IP voie la vraie adresse des clients ([TLS & reverse-proxy](#/tls-reverse-proxy)).

## Événements

`user.create`, `user.update`, `user.delete`, `user.password.change`, ainsi que `auth.login.success`, `auth.login.failure` et `auth.logout`.

## Au-delà de la CE

Fédération d'identité (SSO, annuaire), provisionnement automatique des comptes et accès temporaires relèvent de l'édition Enterprise.
