import { create } from 'zustand'

const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  user:  JSON.parse(localStorage.getItem('user') || 'null'),
  role:  localStorage.getItem('role') || null,

  login: (token, user) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('role', user.role)
    set({ token, user, role: user.role })
  },

  logout: () => {
    localStorage.clear()
    set({ token: null, user: null, role: null })
  },
}))

export default useAuthStore