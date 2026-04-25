import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PrivateRoute  from './components/PrivateRoute'
import LoginPage     from './pages/LoginPage'
import DashboardPage from './pages/gestionnaire/DashboardPage'
import LiveMapPage   from './pages/gestionnaire/LiveMapPage'
import OrdersPage    from './pages/gestionnaire/OrdersPage'
import DriversPage   from './pages/gestionnaire/DriversPage'
import 'leaflet/dist/leaflet.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Page d'accueil publique - redirige vers login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Authentification */}
        <Route path="/login" element={<LoginPage />} />

        {/* Routes protégées pour le gestionnaire uniquement */}
        <Route path="/dashboard" element={
          <PrivateRoute allowedRoles={['manager']}>
            <DashboardPage />
          </PrivateRoute>
        } />
        
        <Route path="/map" element={
          <PrivateRoute allowedRoles={['manager']}>
            <LiveMapPage />
          </PrivateRoute>
        } />
        
        <Route path="/orders" element={
          <PrivateRoute allowedRoles={['manager']}>
            <OrdersPage />
          </PrivateRoute>
        } />
        
        <Route path="/drivers" element={
          <PrivateRoute allowedRoles={['manager']}>
            <DriversPage />
          </PrivateRoute>
        } />

        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}