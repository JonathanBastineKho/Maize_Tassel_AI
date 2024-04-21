import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Routes, Route } from "react-router-dom";

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
import { GoogleOAuthProvider } from '@react-oauth/google';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
  <AuthProvider>
    <BrowserRouter>
      <Routes>

        <Route exact path="/" 
        element={<HomePage />}/>

        <Route exact path="/reset-password" 
        element={<GuestRoute><ResetPasswordPage /></GuestRoute>}/>

        <Route exact path="/reset-password/:token" 
        element={<GuestRoute><ConfirmResetPasswordPage/></GuestRoute>}/>

        <Route exact path="/register" 
        element={<GuestRoute><RegisterPage /></GuestRoute>}/>

        <Route exact path="/login" 
        element={<GuestRoute><LoginPage /></GuestRoute>}/>

        <Route exact path="/unverified"
        element={<PrivateRoute requiredRoles={["admin","regular","premium"]} verified={false}><UnverifiedPage /></PrivateRoute>}/>

        <Route exact path="/admin/dashboard"
        element={<PrivateRoute requiredRoles={["admin"]} verified={true}><AdminDashboardPage /></PrivateRoute>}/>

        <Route path="/confirm/:token" 
        element={<PrivateRoute requiredRoles={["admin","regular","premium"]} verified={false}><ConfirmPage /></PrivateRoute>}/>

      </Routes>
    </BrowserRouter>
  </AuthProvider>
  </GoogleOAuthProvider>
  
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
