import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import api from '../api/api'

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoading: false,

  // Ajoutez cette fonction
  loadFromStorage: async () => {
    const token = await AsyncStorage.getItem('token')
    const user = await AsyncStorage.getItem('user')
    if (token && user) {
      set({ token, user: JSON.parse(user) })
    }
  },

  initialize: async () => {
    const token = await AsyncStorage.getItem('token')
    const user = await AsyncStorage.getItem('user')
    if (token && user) {
      set({ token, user: JSON.parse(user) })
    }
  },

  login: async (token, user) => {
    set({ isLoading: true })
    try {
      await AsyncStorage.setItem('token', token)
      await AsyncStorage.setItem('user', JSON.stringify(user))
      set({ token, user, isLoading: false })
      return { success: true }
    } catch (error) {
      set({ isLoading: false })
      return { success: false, error: error.message }
    }
  },

  register: async (token, user) => {
    set({ isLoading: true })
    try {
      await AsyncStorage.setItem('token', token)
      await AsyncStorage.setItem('user', JSON.stringify(user))
      set({ token, user, isLoading: false })
      return { success: true }
    } catch (error) {
      set({ isLoading: false })
      return { success: false, error: error.message }
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('token')
    await AsyncStorage.removeItem('user')
    set({ user: null, token: null })
  },
}))

export default useAuthStore