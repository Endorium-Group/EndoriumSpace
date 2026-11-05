# Éditions (CE / EE)

EndoriumFort suit un modèle **open-core** : un socle au code public et auditable, l'édition Community, et une édition Enterprise sous licence commerciale.

## Community Edition (CE)

- **Code public**, lisible et auditable : [Endorium-Group/EndoriumFort-CE](https://github.com/Endorium-Group/EndoriumFort-CE).
- Se construit et fonctionne **seule**, sans licence ni connexion à un service tiers.
- Couvre tout ce que décrit cette documentation : terminal SSH et transfert de fichiers, navigateur isolé, partage de fichiers, coffre-fort, MFA, rôles et périmètre, règles d'accès, garde-fou de commandes, sessions en direct et observation, journal d'audit infalsifiable, rapports, API.
- Un nœud, en Docker, en paquet Debian ou sur Kubernetes.

### Ce que la licence CE autorise

La CE est publiée sous la **licence source-available EndoriumFort Community Edition**. Ce n'est **pas** une licence open source au sens de l'OSI.

| | |
|---|---|
| **Gratuit** | usage personnel, pédagogique, recherche, évaluation, test, et usage interne **hors production** |
| **Licence Enterprise requise** | tout **usage commercial ou en production**, y compris la revente en service hébergé ou managé |
| **Redistribution** | copies conformes autorisées, avec attribution |
| **Modifications** | permises pour votre usage autorisé ; leur redistribution passe par une contribution au dépôt d'origine |

Le texte qui fait foi est le fichier `LICENSE` du dépôt. Faites-le relire avant de fonder un usage commercial dessus.

## Enterprise Edition (EE)

L'édition Enterprise s'adresse aux organisations qui exploitent un bastion en production. Elle ajoute notamment :

- des **protocoles** supplémentaires, dont les accès graphiques ;
- l'**intégration à l'annuaire** et l'authentification unique de l'organisation ;
- la **gouvernance des accès** : validations, accès temporaires, politiques centralisées ;
- l'**enregistrement des sessions** et la production de preuves ;
- l'**exploitation à grande échelle** : sites distants, haute disponibilité, intégration au SOC ;
- le **support** de l'éditeur.

Elle se déploie hors-ligne, sans serveur de licence ni appel extérieur : elle convient aux environnements isolés. Arrivée à expiration, sa licence désactive les fonctions Enterprise sans toucher au socle.

Dans la console CE, les sections Enterprise apparaissent avec un cadenas : elles indiquent ce qu'elles apportent, sans rien débloquer.

> Besoin de l'EE, d'une évaluation ou d'un devis ? Écrivez à **contact@endorium.space**, ou passez par le [site](../index.html#contact).
