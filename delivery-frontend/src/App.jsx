import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PrivateRoute  from './components/PrivateRoute'
import LoginPage     from './pages/LoginPage'
import RegisterPage  from './pages/RegisterPage'
import DashboardPage from './pages/gestionnaire/DashboardPage'
import LiveMapPage   from './pages/gestionnaire/LiveMapPage'
import OrdersPage    from './pages/gestionnaire/OrdersPage'
import DriversPage   from './pages/gestionnaire/DriversPage'   // ← nouveau
import LivreurPage   from './pages/livreur/LivreurPage'
import TrackingPage  from './pages/client/TrackingPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/dashboard" element={<PrivateRoute allowedRoles={['manager']}><DashboardPage/></PrivateRoute>}/>
        <Route path="/map"       element={<PrivateRoute allowedRoles={['manager']}><LiveMapPage/></PrivateRoute>}/>
        <Route path="/orders"    element={<PrivateRoute allowedRoles={['manager']}><OrdersPage/></PrivateRoute>}/>
        <Route path="/drivers"   element={<PrivateRoute allowedRoles={['manager']}><DriversPage/></PrivateRoute>}/>

        <Route path="/livreur"   element={<PrivateRoute allowedRoles={['driver']}><LivreurPage/></PrivateRoute>}/>
        <Route path="/suivi"     element={<PrivateRoute allowedRoles={['client']}><TrackingPage/></PrivateRoute>}/>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}