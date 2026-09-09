# Logs d'audit

Le système de logs enregistre automatiquement les actions HTTP traitées par l'API.

## Données enregistrées

- utilisateur identifié quand disponible ;
- module concerné ;
- action (`read`, `create`, `update`, `delete`, `login`, `signup`, etc.) ;
- méthode HTTP ;
- chemin sans query string ;
- statut de réponse ;
- durée de traitement ;
- identifiant de ressource quand présent ;
- noms des paramètres/query utilisés.

Les bodies de requête, réponses, mots de passe, tokens et IP ne sont pas stockés.

## Lecture

Toutes les routes ci-dessous nécessitent un token valide et un rôle autorisé :
`admin`, `administrateur`, `superadmin`, `rh`, `drh`, `dg`.

### Liste paginée

`GET /logs?page=1&limit=50`

Filtres disponibles :

- `module=agents`
- `action=update`
- `method=PATCH`
- `success=true`
- `statusCode=200`
- `actor=<accountId>`
- `from=2026-09-01`
- `to=2026-09-30`
- `search=agent`

### Détail

`GET /logs/:id`

### Statistiques

`GET /logs/stats`

Retourne les totaux par module, action et utilisateur.

## Option

Par défaut, consulter `/logs` ne crée pas un nouveau log pour éviter de polluer l'audit.
Pour auditer aussi les consultations des logs :

`AUDIT_LOG_LOG_READS=true`
