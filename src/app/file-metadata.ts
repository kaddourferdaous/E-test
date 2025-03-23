// Déclaration de l'interface VideoMetadata
export interface VideoMetadata {
    filename: string;      // Nom du fichier vidéo
    description: string;   // Description du fichier vidéo
    tags?: string[];       // Liste des tags associés au fichier
    expectation?: string;  // Attente ou description supplémentaire
    upload_date: string;   // Date de téléversement du fichier
    type: 'video';         // Type du fichier (ici 'video')
  }
  
  // Déclaration de l'interface PdfMetadata
  export interface PdfMetadata {
    filename: string;      // Nom du fichier PDF
    description: string;   // Description 
    // du fichier PDF
    tags?: string[];       // Liste des tags associés au fichier
    expectation?: string;  // Attente ou description supplémentaire
    upload_date: string;   // Date de téléversement du fichier
    type: 'pdf';           // Type du fichier (ici 'pdf')
  }
  export interface PowerPointMetadata {
    filename: string;
    description: string;
    tags?: string[];
    expectation?: string;
    upload_date: string;
    type: 'ppt';
  }
  
  export interface WordMetadata {
    filename: string;
    description: string;
    tags?: string[];
    expectation?: string;
    upload_date: string;
    type: 'word';
  }
  