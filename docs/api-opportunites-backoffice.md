# Documentation API FONAREV - Opportunites, marches, newsletters et candidatures

Cette documentation couvre les nouvelles API a consommer par :

- le backoffice Angular pour publier, modifier, archiver et suivre les donnees;
- le site public Next.js pour afficher les marches, offres d'emploi, newsletters et formulaires;
- le module RH pour collecter des candidatures professionnelles.

## Base URL

Local :

```txt
http://localhost:5000
```

Production actuelle :

```txt
https://fonarev-api.onrender.com
```

## Authentification backoffice

Les routes de creation, modification, suppression et lecture admin demandent le JWT existant :

```http
Authorization: Bearer <token>
Content-Type: application/json
```

Le site public ne doit utiliser que les routes publiques `GET` et `POST /candidatures`.

## Conventions generales

Les listes publiques renvoient seulement les elements :

- `statut: "publie"`
- `isActive: true`

Les listes backoffice utilisent `/admin/all` et renvoient aussi les brouillons, archives et elements annules.

Filtres communs :

```txt
?page=1&limit=20&sort=-datePublication
?fields=titre,reference,documentUrl
?q=consultant
?etat=ouverts
?etat=expires
```

`sort` accepte plusieurs champs separes par virgule, par exemple :

```txt
?sort=-datePublication,typeMarche
```

## 1. Marches publics

Route principale :

```txt
/marches
```

### Types de marche

Valeurs autorisees pour `typeMarche` :

```txt
travaux
fournitures
services
services_non_intellectuels
prestations_intellectuelles
autre
```

Valeurs autorisees pour `categorie` :

```txt
appel_offres
avis_manifestation_interet
plan_passation
avis_report
appel_candidatures
autre
```

Valeurs autorisees pour `procedure` :

```txt
AAOI
AAON
AON
AMI
PPM
AAC
AUTRE
```

### Endpoints

```http
GET /marches
GET /marches/last?limit=5
GET /marches/:idOrSlug
GET /marches/admin/all
POST /marches
PATCH /marches/:id
DELETE /marches/:id
```

`GET /marches/admin/all`, `POST`, `PATCH` et `DELETE` sont proteges.

### Exemples utiles pour Next.js

Appels d'offres ouverts :

```http
GET /marches?categorie=appel_offres&etat=ouverts&sort=-datePublication
```

PPM 2026 par type :

```http
GET /marches?categorie=plan_passation&anneeExercice=2026&sort=typeMarche
```

Archives :

```http
GET /marches?etat=expires&sort=-dateCloture
```

### Payload creation marche

```json
{
  "titre": "MARCHE DES TRAVAUX DE CONSTRUCTION D'UN CENTRE DES VICTIMES",
  "bigTitle": "AVIS D'APPEL D'OFFRES publie le 13 fevrier 2026",
  "resume": "Document de passation publie par le FONAREV.",
  "description": "Description longue visible dans le backoffice ou une page detail.",
  "reference": "AAON N°09-T/DG FONAREV/CGPMP/PF/02-2026",
  "typeMarche": "travaux",
  "categorie": "appel_offres",
  "procedure": "AAON",
  "anneeExercice": 2026,
  "datePublication": "2026-02-13T00:00:00.000Z",
  "dateCloture": "2026-03-17T23:59:59.000Z",
  "documentUrl": "https://minio2.fonasite.app/minio/files/site/AAO.pdf",
  "documentFileName": "AAO.pdf",
  "statut": "publie",
  "isActive": true,
  "isFeatured": false,
  "tags": ["construction", "kwango"]
}
```

### Reponse liste

```json
{
  "status": "success",
  "results": 1,
  "total": 1,
  "page": 1,
  "limit": 20,
  "marches": []
}
```

## 2. Offres d'emploi, stages et consultances

Route principale :

```txt
/offres-emploi
```

### Valeurs autorisees

`typeOffre` :

```txt
emploi
stage
consultance
```

`contractType` :

```txt
CDI
CDD
Stage
Consultance
Interim
Autre
```

`statut` :

```txt
brouillon
publie
ferme
archive
annule
```

### Endpoints

```http
GET /offres-emploi
GET /offres-emploi/last?limit=5
GET /offres-emploi/:idOrSlug
GET /offres-emploi/admin/all
POST /offres-emploi
PATCH /offres-emploi/:id
DELETE /offres-emploi/:id
```

`GET /offres-emploi/admin/all`, `POST`, `PATCH` et `DELETE` sont proteges.

### Exemples utiles

Offres d'emploi ouvertes :

```http
GET /offres-emploi?typeOffre=emploi&etat=ouverts&sort=-datePublication
```

Stages :

```http
GET /offres-emploi?typeOffre=stage&sort=-datePublication
```

### Payload creation offre

```json
{
  "titre": "Responsable du numerique et securite de l'information",
  "bigTitle": "Avis d'appel a candidatures",
  "reference": "CDI",
  "typeOffre": "emploi",
  "contractType": "CDI",
  "departement": "Numerique",
  "direction": "Direction Generale",
  "lieuAffectation": "Kinshasa",
  "resume": "Recrutement d'un responsable du numerique.",
  "description": "Description longue du poste.",
  "missions": [
    "Piloter la strategie numerique",
    "Superviser la securite du systeme d'information"
  ],
  "profilRecherche": [
    "Bac+5 en informatique ou equivalent",
    "Experience confirmee en cybersecurite"
  ],
  "piecesRequises": [
    "CV",
    "Lettre de motivation",
    "Diplomes"
  ],
  "nombrePostes": 1,
  "datePublication": "2026-02-01T00:00:00.000Z",
  "dateCloture": "2026-03-01T23:59:59.000Z",
  "documentUrl": "https://minio2.fonasite.app/minio/files/site/recrutement.pdf",
  "formulaire": "64f000000000000000000001",
  "statut": "publie",
  "isActive": true
}
```

## 3. Newsletters

Route principale :

```txt
/newsletters
```

### Endpoints

```http
GET /newsletters
GET /newsletters/last
GET /newsletters/:idOrSlug
GET /newsletters/admin/all
POST /newsletters
PATCH /newsletters/:id
DELETE /newsletters/:id
```

`GET /newsletters/admin/all`, `POST`, `PATCH` et `DELETE` sont proteges.

### Payload creation newsletter

```json
{
  "titre": "Newsletter FONAREV",
  "editionLabel": "Avril-Mai",
  "periode": "bimestrielle",
  "mois": 5,
  "annee": 2026,
  "description": "Les temps forts d'avril et mai.",
  "pdfUrl": "https://minio2.fonasite.app/minio/files/site/newsletter-avril-mai.pdf",
  "coverImageUrl": "https://minio2.fonasite.app/minio/files/site/newsletter-cover.jpg",
  "publishedAt": "2026-05-31T00:00:00.000Z",
  "statut": "publie",
  "isActive": true
}
```

Pour la page Next.js newsletter :

```http
GET /newsletters?sort=-publishedAt
GET /newsletters/last
```

## 4. Formulaires de candidature dynamiques

Route principale :

```txt
/formulaires
```

Ces formulaires permettent au backoffice Angular de definir les champs que le candidat devra remplir pour une offre, un stage, une consultance ou une candidature spontanee.

### Endpoints

```http
GET /formulaires
GET /formulaires/:idOrSlug
GET /formulaires/admin/all
POST /formulaires
PATCH /formulaires/:id
DELETE /formulaires/:id
```

`GET /formulaires/admin/all`, `POST`, `PATCH` et `DELETE` sont proteges.

### targetType

```txt
offre_emploi
stage
candidature_spontanee
consultance
general
```

### Types de champs

```txt
text
textarea
email
phone
number
date
select
multiselect
checkbox
file
url
```

### Payload creation formulaire

```json
{
  "titre": "Formulaire Responsable numerique",
  "description": "Collecte complete des informations candidat.",
  "targetType": "offre_emploi",
  "targetId": "64f000000000000000000010",
  "requireCv": true,
  "requireLettreMotivation": true,
  "statut": "publie",
  "sections": [
    {
      "title": "Informations personnelles",
      "description": "Identite et contacts",
      "order": 1,
      "fields": [
        {
          "name": "nationalite",
          "label": "Nationalite",
          "type": "text",
          "required": true,
          "order": 1
        },
        {
          "name": "disponibilite",
          "label": "Disponibilite",
          "type": "select",
          "required": true,
          "options": ["Immediate", "1 mois", "2 mois", "3 mois et plus"],
          "order": 2
        }
      ]
    },
    {
      "title": "Questions specifiques",
      "order": 2,
      "fields": [
        {
          "name": "experience_cybersecurite",
          "label": "Decrivez votre experience en cybersecurite",
          "type": "textarea",
          "required": true,
          "order": 1
        }
      ]
    }
  ]
}
```

Pour recuperer le formulaire actif d'une offre :

```http
GET /formulaires?targetType=offre_emploi&targetId=<offreId>
```

## 5. Candidatures

Route principale :

```txt
/candidatures
```

Le `POST /candidatures` reste public pour le site Next.js. Les routes de lecture et traitement sont protegees.

### Endpoints

```http
POST /candidatures
GET /candidatures
GET /candidatures/admin/all
GET /candidatures/:id
PATCH /candidatures/:id
DELETE /candidatures/:id
```

### Payload minimal compatible avec le formulaire actuel

```json
{
  "nom": "Kanku",
  "prenom": "Marie",
  "phone": "0812345678",
  "email": "marie.kanku@example.com",
  "ville": "Kinshasa",
  "province": "Kinshasa",
  "cv": "https://minio2.fonasite.app/minio/files/site/cv.pdf",
  "lm": "https://minio2.fonasite.app/minio/files/site/lettre.pdf"
}
```

### Payload complet pour candidature liee a une offre

```json
{
  "typeCandidature": "offre_emploi",
  "offreEmploi": "64f000000000000000000010",
  "formulaire": "64f000000000000000000001",
  "nom": "Kanku",
  "prenom": "Marie",
  "civilite": "Madame",
  "dateNaissance": "1992-04-12T00:00:00.000Z",
  "nationalite": "Congolaise",
  "email": "marie.kanku@example.com",
  "phone": "0812345678",
  "adresse": "12 Avenue Exemple",
  "ville": "Kinshasa",
  "province": "Kinshasa",
  "paysResidence": "RDC",
  "professionActuelle": "Analyste SI",
  "linkedin": "https://linkedin.com/in/marie-kanku",
  "portfolio": "https://portfolio.example.com",
  "disponibilite": "Immediate",
  "pretentionSalariale": "A discuter",
  "experiencesPro": [
    {
      "poste": "Analyste securite",
      "employeur": "Entreprise X",
      "secteur": "Technologie",
      "lieu": "Kinshasa",
      "dateDebut": "2022-01-01T00:00:00.000Z",
      "dateFin": "2025-12-31T00:00:00.000Z",
      "enCours": false,
      "description": "Analyse et securisation du systeme d'information.",
      "realisations": ["Mise en place d'une politique de sauvegarde"]
    }
  ],
  "parcoursAcademique": [
    {
      "diplome": "Master",
      "domaine": "Informatique",
      "institution": "Universite de Kinshasa",
      "pays": "RDC",
      "ville": "Kinshasa",
      "dateDebut": "2014-10-01T00:00:00.000Z",
      "dateFin": "2019-07-01T00:00:00.000Z",
      "mention": "Distinction"
    }
  ],
  "certifications": ["ISO 27001 Foundation"],
  "competences": ["Cybersecurite", "Administration systeme", "Gestion de projet"],
  "langues": [
    { "langue": "Francais", "niveau": "courant" },
    { "langue": "Anglais", "niveau": "intermediaire" }
  ],
  "referencesProfessionnelles": [
    {
      "nom": "Jean Exemple",
      "fonction": "Directeur IT",
      "organisation": "Entreprise X",
      "email": "jean@example.com",
      "phone": "0999999999",
      "relation": "Ancien superviseur"
    }
  ],
  "documents": [
    {
      "type": "cv",
      "label": "CV",
      "url": "https://minio2.fonasite.app/minio/files/site/cv.pdf"
    },
    {
      "type": "lettre_motivation",
      "label": "Lettre de motivation",
      "url": "https://minio2.fonasite.app/minio/files/site/lettre.pdf"
    },
    {
      "type": "diplome",
      "label": "Diplome master",
      "url": "https://minio2.fonasite.app/minio/files/site/diplome.pdf"
    }
  ],
  "reponsesFormulaire": [
    {
      "fieldName": "experience_cybersecurite",
      "label": "Decrivez votre experience en cybersecurite",
      "value": "5 ans d'experience sur des environnements critiques."
    }
  ],
  "consentementDonnees": true
}
```

### Traitement RH dans le backoffice

Statuts autorises :

```txt
nouvelle
en_etude
preselectionnee
entretien
retenue
rejetee
archivee
```

Exemple de mise a jour :

```http
PATCH /candidatures/:id
Authorization: Bearer <token>
```

```json
{
  "statut": "preselectionnee",
  "score": 82,
  "notesInternes": "Profil solide, a convoquer pour entretien.",
  "tags": ["cybersecurite", "senior"]
}
```

## Workflow recommande

1. Angular cree une offre dans `POST /offres-emploi` avec `statut: "brouillon"`.
2. Angular cree un formulaire dans `POST /formulaires` avec `targetType: "offre_emploi"` et `targetId` de l'offre.
3. Angular rattache le formulaire a l'offre avec `PATCH /offres-emploi/:id`.
4. Angular publie l'offre avec `statut: "publie"` et `isActive: true`.
5. Next affiche les offres avec `GET /offres-emploi?etat=ouverts`.
6. Next recupere le formulaire de l'offre avec `GET /formulaires?targetType=offre_emploi&targetId=<id>`.
7. Next envoie le dossier candidat via `POST /candidatures`.
8. Angular suit et traite les dossiers via `GET /candidatures/admin/all`.

## Notes d'integration front

Pour remplacer les cartes hardcodees actuelles :

- `AppelCard` peut utiliser `marche.bigTitle`, `marche.titre`, `marche.reference`, `marche.dateCloture`, `marche.documentUrl`.
- Les cartes PPM doivent filtrer `categorie=plan_passation` et afficher `typeMarche`.
- `OffreCard` peut utiliser `offre.bigTitle`, `offre.titre`, `offre.contractType`, `offre.datePublication`, `offre.documentUrl`.
- La page newsletter peut utiliser `GET /newsletters/last` pour le hero et `GET /newsletters?sort=-publishedAt` pour les archives.
- Les fichiers restent uploades cote front vers MinIO; l'API stocke les URL retournées par MinIO.
