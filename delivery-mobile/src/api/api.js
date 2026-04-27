import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const api = axios.create({
  baseURL: 'http://192.168.8.114:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Intercepteur pour ajouter le token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user', 'role'])
      // Émet un événement global capté par le RootNavigator
      // pour rediriger vers Login sans importer navigation ici
      if (api._onUnauthorized) api._onUnauthorized()
    }
    return Promise.reject(error)
  }
)

// Enregistrer le callback de redirection depuis le RootNavigator ou App.js :
//   import api from './api/api'
//   api._onUnauthorized = () => navigationRef.current?.replace('Login')


export default api