import api from './api';

export const reviewsApi = {
  
  getAllReviews: async () => {
    try {
      const response = await api.get('/reviews');
      return response.data || [];
    } catch (error) {
      console.error('Erreur chargement avis:', error);
      return [];
    }
  },

  // Récupérer les statistiques des avis
  getReviewsStats: async () => {
    try {
      const response = await api.get('/reviews/stats');
      return response.data;
    } catch (error) {
      console.error('Erreur chargement stats:', error);
      return { average: 0, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    }
  }
};