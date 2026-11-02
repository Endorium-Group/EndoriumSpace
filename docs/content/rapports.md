# Rapports d'activité

L'onglet **Rapports** établit des statistiques à partir du journal d'audit, **archives comprises** : un rapport couvre toute la durée de conservation, pas seulement ce qui est en mémoire depuis le dernier redémarrage.

**Édition** : Community et Enterprise. **Accès** : la permission `audit.read`, détenue par défaut par les administrateurs et les auditeurs.

## Périodes

Choisissez une période **journalière, mensuelle, trimestrielle ou annuelle**, puis naviguez vers la période précédente ou suivante. Chaque chiffre est affiché **à côté du même chiffre pour la période précédente**, pour lire une tendance d'un coup d'œil.

## Contenu

- Sessions ouvertes, fermées et refusées.
- Connexions réussies et échouées.
- Demandes d'accès et leurs décisions.
- Commandes bloquées par la garde SSH, incidents ouverts.
- Changements d'administration, échecs, utilisateurs actifs, ressources sollicitées.
- Une courbe par tranche (les 24 heures d'un jour, les jours d'un mois ou d'un trimestre, les 12 mois d'une année).
- Les utilisateurs les plus actifs, les cibles et les types d'événements les plus fréquents.

## Export CSV

Le bouton **Exporter en CSV** télécharge le même rapport. Les valeurs commençant par `=`, `+`, `-` ou `@` sont neutralisées pour qu'un tableur ne les interprète jamais comme des formules.

Le téléchargement est lui-même journalisé (`report.export`) : un rapport qui quitte le bastion est un acte auditable.

## API

```
GET /api/reports?period=day|month|quarter|year&date=<AAAA-MM-JJ>&top=<1-50>
GET /api/reports/export?…
```

`date` accepte aussi `2026-10` ou `2026`.
