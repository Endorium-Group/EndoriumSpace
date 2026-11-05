# Rapports

La section **Rapports** établit des statistiques sur une période calendaire, à partir du [journal d'audit](#/audit). Réservée aux administrateurs et aux auditeurs.

## Choisir la période

Quatre granularités : **journalier**, **mensuel**, **trimestriel**, **annuel**. Les flèches passent à la période précédente ou suivante ; **En cours** revient à la période actuelle.

Chaque chiffre est **comparé à la période précédente** de même durée, avec sa tendance.

## Ce que contient un rapport

### Indicateurs

| Indicateur | Ce qui est compté |
|---|---|
| **Événements** | toutes les lignes du journal sur la période |
| **Sessions ouvertes** | ouvertures réussies |
| **Connexions** | connexions réussies à la console |
| **Échecs** | refus et erreurs : mauvais mot de passe, second facteur invalide, accès refusé… |
| **Administration** | modifications de configuration, de comptes, de ressources |
| **Utilisateurs actifs** | comptes distincts apparus dans le journal |

Le détail ajoute notamment les sessions fermées, les **accès refusés** par une règle, les échecs de connexion et les **commandes bloquées** par le garde-fou SSH.

### Chronologie

Un graphique par heure (rapport journalier), par jour (mensuel) ou par mois (trimestriel, annuel) : événements, sessions et échecs, les échecs en rouge.

### Classements

- les utilisateurs les plus actifs ;
- les cibles les plus fréquentes — la ressource ou le compte nommé par l'événement ;
- les types d'événements les plus fréquents.

## Exporter

**Exporter en CSV** télécharge le rapport affiché. L'export est lui-même journalisé (`report.export`) : on sait qui a extrait quoi.

Les valeurs commençant par `=`, `+`, `-` ou `@` sont neutralisées, pour qu'un tableur ne les interprète jamais comme des formules.

## Calcul

Le rapport est calculé **sur le serveur**, à la demande, en relisant le journal, **archives comprises** : il couvre toute la durée de conservation, pas seulement ce qui est en mémoire depuis le dernier redémarrage. Il n'y a ni base statistique séparée ni tâche planifiée. Un rapport reflète donc exactement le journal, et ne peut pas en diverger.

Sur un journal très volumineux, le serveur ne lit que sa partie la plus récente et l'indique en tête du rapport.

## Usages

- Revue mensuelle des accès à privilèges, exigée par la plupart des référentiels.
- Détection de tendances : hausse des échecs de connexion, ressource soudain très sollicitée.
- Pièce jointe à un rapport d'audit, en complément de l'export du journal.

## API

```
GET /api/reports?period=day|month|quarter|year&date=<AAAA-MM-JJ>&top=<1-50>
GET /api/reports/export?…
```

`date` accepte aussi `2026-10` ou `2026`. Permission requise : `audit.read`.
