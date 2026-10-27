# Pièces des candidatures — MinIO

Node.js 18+ requis. Le backend utilise le même service HTTP que les photos HRMS : multipart `file`, réponse `url`, `data` ou `data.src`.

Configuration serveur (ne pas exposer le token au navigateur) :

```
FONAREV_FILE_BASE_ROUTE=https://minio2.fonasite.app/minio/files
FONAREV_FILE_UPLOAD_ROUTE=https://minio2.fonasite.app/minio/files/upload
# FONAREV_FILE_TOKEN= jeton de service si requis par le service de fichiers
```

Les nouveaux fichiers PDF sont envoyés au service MinIO. MongoDB conserve le lien, le libellé de la pièce requise et son association à la candidature. Les anciens buffers restent lisibles sans migration. La consultation passe par la route authentifiée HRMS, qui récupère le fichier sans transmettre le jeton HRMS à MinIO.

Déployer le backend et HRMS, puis vérifier un dépôt et une consultation sur l'environnement cible. Les tests locaux simulent le service et ne vérifient pas ses permissions de stockage. Les objets ne doivent pas être exposés par un bucket listable. Si le service retourne des liens signés temporaires, il doit retourner une clé stable à résoudre via le endpoint de fichiers plutôt que conserver ces liens temporaires.

Un échec de transaction après upload peut laisser un objet sans candidature dans MinIO : aucun endpoint de suppression du service n'est actuellement connu. Prévoir une politique de nettoyage des objets non référencés avant un usage à grande échelle.
