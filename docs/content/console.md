# Visite de la console

La console est une application web unique : tout se fait depuis le navigateur. Elle est disponible en français et en anglais, en thème clair ou sombre.

## Barre de navigation

| Section | Pour qui | Ce qu'on y fait |
|---|---|---|
| **Carte** | tous | Voir les ressources de son périmètre et s'y connecter. |
| **Sessions** | tous | Suivre les sessions ouvertes, les reprendre, les observer ou les terminer selon son rôle. |
| **Journal** | administrateurs, auditeurs | Parcourir, filtrer, vérifier et exporter le journal d'audit. |
| **Rapports** | administrateurs, auditeurs | Statistiques par période. |
| **Administration** | administrateurs | Ressources, utilisateurs, coffre, sécurité, intégrations, licence. |

Les sections propres à l'édition Enterprise apparaissent avec un cadenas : un clic explique ce qu'elles apportent, sans rien débloquer.

## Carte

La page d'accueil. Chaque ressource de votre périmètre y figure, regroupée par **zone** (un regroupement libre défini par les administrateurs, par site ou par environnement par exemple).

- **Un clic** sur une ressource affiche ses informations : adresse, type d'identifiants, niveau de risque, conditions d'accès, et qui y est connecté.
- **Un double-clic**, ou **Se connecter**, ouvre la session. Si la ressource exige un motif ou un ticket, une fenêtre le demande d'abord.
- Une ressource où vous avez déjà une session ouverte propose **Reprendre la session**.

## Sessions

La liste temps réel des sessions. Voir [Sessions](#/sessions).

## Journal et rapports

Voir [Journal d'audit](#/audit) et [Rapports](#/rapports).

## Administration

| Onglet | Contenu |
|---|---|
| **Ressources** | Créer, modifier, supprimer des ressources et leurs règles d'accès ([Déclarer une ressource](#/ressources)). |
| **Utilisateurs** | Comptes, rôles, affectation des ressources, état MFA ([Utilisateurs & rôles](#/utilisateurs)). |
| **Coffre-fort** | Identifiants stockés pour les ressources ([Coffre-fort](#/coffre)). |
| **Sécurité** | Bilan de configuration, vos facteurs MFA, règles du [garde-fou SSH](#/garde-fou-ssh) et plafond des [transferts de fichiers SSH](#/session-ssh). |
| **Licence** | Édition et état de la licence. |

### Le bilan de sécurité

L'onglet **Sécurité** passe la configuration en revue et classe chaque point en « À corriger » ou « En ordre », avec un lien vers l'écran concerné. Parmi les contrôles :

- administrateurs sans MFA ;
- administrateurs encore sur un mot de passe initial ;
- ressources SSH à risque élevé sans garde-fou de commandes ;
- sessions ouvertes depuis plus de 8 heures ;
- réglages des clés de sécurité (domaine WebAuthn) invalides.

Consultez-le après chaque changement de configuration.

## Mon compte

Accessible depuis le menu utilisateur :

- **Préférences** — thème, vue par défaut de la carte, nombre d'alertes affichées. Conservées dans le navigateur.
- **Mot de passe** — le changer ; les autres connexions restent ouvertes.
- **Sécurité** — gérer ses seconds facteurs : TOTP et passkeys, et la méthode proposée en premier à la connexion ([MFA](#/mfa)).

## Fin de session de console

La connexion à la console expire au bout d'une heure par défaut (`ENDORIUMFORT_TOKEN_TTL_SECONDS`). Un bandeau prévient avant l'échéance et propose de se reconnecter sans quitter la page.
