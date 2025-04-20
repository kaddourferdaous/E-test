// loginTrainer(credentials: any): Observable<any> {
//   return this.http
//     .post<any>(`${this.apiUrl}/auth/trainer/login`, credentials)
//     .pipe(
//       tap((response) => {
//         console.log('Réponse du serveur:', response);

//         // Vérifie que la réponse contient un ID
//         if (response && response.id) {
//           // Création d'un objet formateur avec les informations nécessaires
//           const trainer = {
//             matricule: credentials.matricule, // Utiliser le matricule fourni dans la connexion
//             email: response.email || '', // Ajouter l'email si disponible
//           };

//           // Récupérer ou définir le token (s'il est présent dans la réponse, sinon utiliser un token fictif)
//           const token = response.token || 'faux_token'; // Adaptez cette logique selon votre besoin

//           // Stocker les informations du formateur dans le localStorage
//           this.storeTrainerInfo(response.id, token, trainer);
//           this.isAuthenticated = true;

//           // Vous pouvez ajouter une redirection ici si la connexion réussit
//           this.router.navigate(['/trainer/dashboard']); // Exemple de redirection vers le dashboard
//         } else {
//           console.error('ID du formateur manquant dans la réponse');
//         }
//       }),
//       catchError((error) => {
//         console.error('Erreur lors de la connexion du formateur:', error);
//         throw error; // Propager l'erreur
//       })
//     );
// }
