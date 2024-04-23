import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';

// Import Pages
import PrivateRoute from './Components/Authentication/PrivateRoute';
import GuestRoute from './Components/Authentication/GuestRoute';
import UnverifiedPage from './Pages/Auth/UnverifiedPage';
import ConfirmPage from './Pages/Auth/ConfirmPage';
import RegisterPage from "./Pages/Auth/RegisterPage"
import LoginPage from './Pages/Auth/LoginPage';
import ResetPasswordPage from './Pages/Auth/ResetPasswordPage';
import ConfirmResetPasswordPage from './Pages/Auth/ConfirmResetPassword';
import HomePage from './Pages/HomePage';
import AdminDashboardPage from './Pages/Admin/AdminDashboardPage';
import AuthProvider from './Components/Authentication/AuthContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_REACT_APP_GOOGLE_CLIENT_ID}>
  <AuthProvider>
    <BrowserRouter>
      <Routes>

        <Route path="/" 
        element={<HomePage />}/>

        <Route path="/reset-password" 
        element={<GuestRoute><ResetPasswordPage /></GuestRoute>}/>

        <Route path="/reset-password/:token" 
        element={<GuestRoute><ConfirmResetPasswordPage/></GuestRoute>}/>

        <Route path="/register" 
        element={<GuestRoute><RegisterPage /></GuestRoute>}/>

        <Route path="/login" 
        element={<GuestRoute><LoginPage /></GuestRoute>}/>

        <Route path="/unverified"
        element={<PrivateRoute requiredRoles={["admin","regular","premium"]} verified={false}><UnverifiedPage /></PrivateRoute>}/>

        <Route path="/admin/dashboard"
        element={<PrivateRoute requiredRoles={["admin"]} verified={true}><AdminDashboardPage /></PrivateRoute>}/>

        <Route path="/confirm/:token" 
        element={<PrivateRoute requiredRoles={["admin","regular","premium"]} verified={false}><ConfirmPage /></PrivateRoute>}/>

      </Routes>
    </BrowserRouter>
  </AuthProvider>
  </GoogleOAuthProvider>
);
