module.exports = {
    apiKey: 'votre_api_key', // Clé API disponible dans les paramètres du projet Lokalise
    projectId: 'votre_project_id', // ID visible dans l'URL du projet
    inputFormat: 'json',
    outputFormat: 'json',
    languages: ['ar', 'fr'], // Langues cibles
    originalLanguage: 'en', // Langue source
    outputPath: './src/assets/i18n/', // Dossier de sortie des fichiers traduits
    replaceModified: true
  };