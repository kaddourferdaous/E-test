import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {
  API_BASE = '/api';

  formationData: any = {
    totalDays: 0,
    totalModels: 0,
    totalVideos: 0,
    totalTime: '0h 0m',
    days: []
  };

  ngOnInit(): void {
    console.log('Initialisation de la page About Formation...');
    this.createParticles();
    this.loadFormationData();

    // Actualisation auto toutes les 5 min
    setInterval(() => this.loadFormationData(), 300000);
  }

  // Créer des particules animées
  createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;

    for (let i = 0; i < 50; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 6 + 's';
      particle.style.animationDuration = (Math.random() * 4 + 6) + 's';
      particlesContainer.appendChild(particle);
    }
  }

  // Charger les données depuis l'API
  async loadFormationData() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) loadingIndicator.style.display = 'block';

    try {
      console.log('Chargement des données de formation...');
      const response = await fetch(`https://training-backend-1pda.onrender.com/api/supports/drive/all/metadata-format`);
      
      if (!response.ok) throw new Error(`Erreur API: ${response.status}`);

      const apiData = await response.json();
      console.log('Données API reçues:', apiData);

      if (apiData.success && apiData.metadata) {
        this.processFormationData(apiData.metadata);
      } else {
        throw new Error(apiData.error || 'Erreur lors du chargement');
      }

    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      const exampleData = this.generateExampleData();
      this.processFormationData(exampleData);
      this.showNotification('Données d\'exemple utilisées - Vérifiez la connexion à l\'API', 'warning');
    }

    if (loadingIndicator) loadingIndicator.style.display = 'none';
  }

  // Données d'exemple
  generateExampleData() {
    const exampleData: any[] = [];
    for (let day = 0; day <= 4; day++) {
      const modelsPerDay = Math.floor(Math.random() * 3) + 2; // 2-4 modèles par jour
      for (let model = 1; model <= modelsPerDay; model++) {
        const duration = Math.floor(Math.random() * 120) + 30;
        exampleData.push({
          model_name: `Modèle ${day}.${model}`,
          model_day: day,
          filename: `video_day${day}_model${model}.mp4`,
          file_type: 'video',
          questions: new Array(Math.floor(Math.random() * 8) + 3).fill(null).map((_, i) => ({
            id: `q${day}${model}${i}`,
            text: `Question ${i + 1}`,
            correct_answer: ['Option A'],
            is_multiple_choice: Math.random() > 0.7
          })),
          metadata: { description: `Formation du jour ${day} - Module ${model}` },
          duration: duration,
          size: '45MB'
        });
      }
    }
    return exampleData;
  }

  // Traitement des données
  processFormationData(metadata: any[]) {
    console.log('Données brutes reçues:', metadata);
    
    const daysByDay: any = {};
    const modelsByKey: any = {}; // Pour agréger les données des modèles

    // Première passe : agréger tous les éléments par modèle
    metadata.forEach(item => {
      const day = item.model_day !== undefined ? item.model_day : 0;
      const modelName = item.model_name || `Modèle ${day}`;
      const modelKey = `${day}-${modelName}`;
      
      if (!modelsByKey[modelKey]) {
        modelsByKey[modelKey] = {
          name: modelName,
          day: day,
          filenames: [],
          types: new Set(),
          questions: [],
          duration: 0,
          descriptions: new Set(),
          videoCount: 0,
          fileCount: 0
        };
      }

      // Agréger les données
      const model = modelsByKey[modelKey];
      
      if (item.filename) {
        model.filenames.push(item.filename);
        model.fileCount++;
      }
      
      if (item.file_type) {
        model.types.add(item.file_type);
        if (item.file_type === 'video') {
          model.videoCount++;
        }
      }
      
      if (item.questions && Array.isArray(item.questions)) {
        model.questions.push(...item.questions);
      }
      
      if (item.duration) {
        model.duration += Number(item.duration);
      } else {
        // Durée estimée si pas fournie
        model.duration += Math.floor(Math.random() * 60) + 15;
      }
      
      if (item.metadata?.description) {
        model.descriptions.add(item.metadata.description);
      }
    });

    console.log('Modèles agrégés:', modelsByKey);

    // Deuxième passe : organiser par jour et calculer les totaux
    let totalVideos = 0;
    let totalTimeMinutes = 0;

    Object.values(modelsByKey).forEach((model: any) => {
      const day = model.day;
      
      if (!daysByDay[day]) {
        daysByDay[day] = { 
          day, 
          models: [], 
          totalVideos: 0, 
          totalQuestions: 0, 
          totalTime: 0 
        };
      }

      const modelInfo = {
        name: model.name,
        filename: model.filenames.length > 1 ? `${model.filenames.length} fichiers` : (model.filenames[0] || 'N/A'),
        type: Array.from(model.types).join(', ') || 'unknown',
        questions: model.questions,
        duration: model.duration,
        description: Array.from(model.descriptions).join(' | ') || 'Formation théorique',
        videoCount: model.videoCount,
        fileCount: model.fileCount
      };

      daysByDay[day].models.push(modelInfo);
      daysByDay[day].totalVideos += model.videoCount;
      daysByDay[day].totalQuestions += model.questions.length;
      daysByDay[day].totalTime += model.duration;

      totalVideos += model.videoCount;
      totalTimeMinutes += model.duration;
    });

    // CORRECTION : Le nombre total de modèles doit être le nombre de clés uniques dans modelsByKey
    const totalModels = Object.keys(modelsByKey).length;

    console.log('Données finales calculées:', {
      totalDays: Object.keys(daysByDay).length,
      totalModels,
      totalVideos,
      totalTime: this.formatTime(totalTimeMinutes),
      daysByDay
    });

    this.formationData = {
      totalDays: Object.keys(daysByDay).length,
      totalModels, // Ici c'est maintenant correct
      totalVideos,
      totalTime: this.formatTime(totalTimeMinutes),
      days: Object.values(daysByDay).sort((a: any, b: any) => a.day - b.day)
    };

    // AJOUT CRUCIAL : Mettre à jour l'affichage
    this.updateDisplay();
  }

  // NOUVELLE MÉTHODE : Mettre à jour l'affichage des données
  updateDisplay() {
    // Mise à jour des statistiques
    this.updateElement('totalDays', this.formationData.totalDays.toString());
    this.updateElement('totalModels', this.formationData.totalModels.toString());
    this.updateElement('totalVideos', this.formationData.totalVideos.toString());
    this.updateElement('totalTime', this.formationData.totalTime);

    // Mise à jour de la section des jours
    this.updateDaysSection();
  }

  // NOUVELLE MÉTHODE : Mettre à jour un élément par son ID
  updateElement(id: string, value: string) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  // NOUVELLE MÉTHODE : Mettre à jour la section des jours
  updateDaysSection() {
    const daysContainer = document.getElementById('daysContainer');
    if (!daysContainer) return;

    daysContainer.innerHTML = ''; // Vider le contenu existant

    this.formationData.days.forEach((dayData: any) => {
      const dayCard = document.createElement('div');
      dayCard.className = 'day-card';
      
      dayCard.innerHTML = `
        <div class="day-header">
          <h3>Jour ${dayData.day}</h3>
          <div class="day-stats">
            <span  >📚 ${dayData.models.length} modèles</span>
            <span>🎥 ${dayData.totalVideos} vidéos</span>
            <span>❓ ${dayData.totalQuestions} questions</span>
            <span>⏱️ ${this.formatTime(dayData.totalTime)}</span>
          </div>
        </div>
        <div class="models-list">
          ${dayData.models.map((model: any) => `
      
          `).join('')}
        </div>
      `;

      daysContainer.appendChild(dayCard);
    });
  }

  // Formatage du temps
  formatTime(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  // Notifications
  showNotification(message: string, type: 'info' | 'warning' = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px;
      background: ${type === 'warning'
        ? 'linear-gradient(45deg, #ff6b6b, #ff8e53)'
        : 'linear-gradient(45deg, #4facfe, #00f2fe)'};
      color: white; padding: 1rem 1.5rem; border-radius: 10px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2); z-index: 1001;
      font-family: Arial, sans-serif; font-size: 14px;
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 4000);
  }
}