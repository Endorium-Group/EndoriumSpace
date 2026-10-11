# Éditions (CE / EE)

EndoriumFort suit un modèle **open-core**.

## Community Edition (CE)

- **Gratuite et open-source**, dépôt public.
- Buildable et exécutable **seule**, sans licence.
- Couvre tout ce que décrit cette documentation : SSH web, proxy HTTP, navigateur isolé, MFA, coffre-fort, RBAC, audit infalsifiable, 1 nœud autonome.

## Enterprise Edition (EE)

Ajoute des modules premium, **physiquement absents** du dépôt public et activés par une **licence hors-ligne** :

- Accès **RDP & VNC**, **relais** multi-sites.
- **SSO** (OIDC/SAML), **LDAP/AD**, **SCIM**.
- **Cluster / haute disponibilité**.
- **Enregistrement & relecture** de sessions, Session DNA, evidence packs.
- **Gouvernance JIT** : double approbation, accès temporaires, identifiants éphémères, élévation.
- **Security Center**, incidents, ITDR, **SIEM/ITSM**.
- **Rotation automatique** des secrets + planificateur.

## La licence Enterprise

- Fichier signé par une **signature hybride post-quantique** (Ed25519 + ML-DSA-65).
- Vérifiée **100 % hors-ligne** — compatible air-gap.
- À l'expiration, le premium se désactive proprement **sans casser le socle gratuit**.

## Passer à l'EE

L'image Enterprise peut être diffusée par **tarball signé** (`docker load` + vérification), idéale pour les environnements isolés. Déposez le fichier de licence dans `/app/data/` pour déverrouiller le premium.

> Besoin de l'EE ? Contactez l'équipe depuis le [site](../index.html#contact).
