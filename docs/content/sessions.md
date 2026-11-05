# Sessions

Chaque ouverture de ressource crée une **session**. La page **Sessions** les montre en temps réel, sans rechargement.

## Qui voit quoi

| Rôle | Sessions visibles | Peut terminer | Peut observer |
|---|---|---|---|
| **Opérateur** | les siennes | les siennes | — |
| **Auditeur** | toutes | — | oui |
| **Administrateur** | toutes | toutes | oui |

## La liste

Deux vues : **Actives** et **Historique**. Filtrez par utilisateur ou cherchez par numéro de session, utilisateur ou ressource. Pour chaque session :

- l'utilisateur, la ressource et le compte utilisé sur la cible ;
- l'heure d'ouverture et la durée ;
- le motif, le ticket et l'objet éventuels ;
- les derniers événements de la session, avec un lien vers le journal complet.

## Reprendre

Une session SSH dont la page s'est fermée reste ouverte quelques minutes. Son propriétaire la retrouve dans **Actives** ou sur la carte, avec **Reprendre la session**. Voir [Session SSH](#/session-ssh).

## Observer

**Observer** ouvre le terminal d'une session SSH en **lecture seule** : vous voyez en direct ce que l'opérateur tape et ce que la cible répond, sans pouvoir rien envoyer. L'opérateur n'est pas interrompu.

Réservé aux administrateurs et aux auditeurs. Chaque observation est journalisée (`session.shadow`) : l'observateur laisse lui aussi une trace.

## Terminer

**Terminer** coupe immédiatement la session : le terminal se ferme, le navigateur isolé s'arrête, le lecteur de fichiers ne peut plus être renouvelé. L'événement `session.terminate` indique qui a coupé.

Un opérateur peut terminer ses propres sessions, un administrateur celles de tout le monde.

## Sessions web et partage de fichiers

- Une session **navigateur isolé** s'affiche dans un onglet séparé. Fermer cet onglet termine la session.
- Une session **partage de fichiers** ouvre le lecteur dans un onglet dédié. La terminer bloque le renouvellement de l'accès : le lecteur se ferme au plus tard 15 minutes après.

## Événements de session

| Événement | Signification |
|---|---|
| `session.create` | ouverture, avec motif, ticket et objet éventuels |
| `session.purpose.bound` | objet de session fourni sur une ressource à risque élevé |
| `session.detached` / `session.resumed` | page fermée puis session reprise |
| `session.shadow` | quelqu'un observe la session |
| `session.terminate` | interruption par un utilisateur |
| `session.close` / `session.expire` | fin normale ou par expiration |
| `policy.decision.deny` | ouverture refusée par une règle, avec la raison |

## Bonnes pratiques

- Passez régulièrement sur **Actives** : une session ouverte depuis des heures est rarement voulue. Le bilan **Sécurité** signale celles de plus de 8 heures.
- Observez plutôt que de demander un partage d'écran : l'observation est tracée.
