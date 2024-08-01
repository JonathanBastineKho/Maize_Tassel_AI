import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';

// Import Layout
import PublicLayout from "./Pages/Public/PublicLayout";
import UserLayout from './Pages/User/UserLayout';
import AdminLayout from './Pages/Admin/AdminLayout';

// Import Pages
import PrivateRoute from './Components/Authentication/PrivateRoute';
import GuestRoute from './Components/Authentication/GuestRoute';
import UnverifiedPage from './Pages/Auth/UnverifiedPage';
import ConfirmPage from './Pages/Auth/ConfirmPage';
import RegisterPage from "./Pages/Auth/RegisterPage"
import LoginPage from './Pages/Auth/LoginPage';
import ResetPasswordPage from './Pages/Auth/ResetPasswordPage';
import ConfirmResetPasswordPage from './Pages/Auth/ConfirmResetPassword';
import HomePage from './Pages/Public/HomePage';
import AuthProvider from './Components/Authentication/AuthContext';

import UserDashboardPage from './Pages/User/UserDashboardPage';
import UserImagePage from './Pages/User/UserImagePage';
import AdminDashboardPage from './Pages/Admin/AdminDashboardPage';
import AdminUsersPage from './Pages/Admin/AdminUsersPage';

import TestPage from './Pages/TestPage';
import UserSubscriptionPage from './Pages/User/UserSubscriptionPage';
import UserProfilePage from './Pages/User/UserProfilePage';
import SuccessSubscriptionPage from './Pages/User/SuccessSubscriptionPage';
import AdminImagePage from './Pages/Admin/AdminImagePage';
import AdminModelPage from './Pages/Admin/AdminModelPage';
import AdminDatasetPage from './Pages/Admin/AdminDatasetPage';
import AdminDatasetImagePage from './Pages/Admin/AdminDatasetImagePage';
import ChatPage from './Components/User/PlantDisease.jsx/ChatPage';
import InterpolationPage from './Pages/User/InterpolationPage';
import InterpolationCanvas from './Components/User/Interpolation/InterpolationCanvas';

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_REACT_APP_GOOGLE_CLIENT_ID}>
  <AuthProvider>
    <BrowserRouter>
      <Routes>
    {/* Public Routes */}
        <Route path="/" element={<PublicLayout />}>
          <Route path="" element={<HomePage />}/>
        </Route>
    {/* Auth Path */}
        <Route>
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

          <Route path="/confirm/:token" 
          element={<PrivateRoute requiredRoles={["admin","regular","premium"]} verified={false}><ConfirmPage /></PrivateRoute>}/>
          
          <Route path="/subscription/success/" 
          element={<PrivateRoute requiredRoles={["regular","premium"]} verified={true}><SuccessSubscriptionPage /></PrivateRoute>}/>
        </Route>
    {/* User Path */}
        <Route path="/user" element={<PrivateRoute requiredRoles={["regular","premium"]} verified={true}><UserLayout /></PrivateRoute>}>
          <Route path="dashboard" element={<UserDashboardPage />}/>
          <Route path="images" element={<UserImagePage />} index />
          <Route path="images/:folderId/:imageName" element={<UserImagePage />}/>
          <Route path="images/:folderId/" element={<UserImagePage />}/>
          <Route path="images/root/:imageName" element={<UserImagePage />}/>
          <Route path="subscription" element={<UserSubscriptionPage />}/>
          <Route path="profile" element={<UserProfilePage />} />
          <Route path="chat" element={<ChatPage />} />
        </Route>
        <Route path="/user" element={<PrivateRoute requiredRoles={["premium"]} verified={true}><InterpolationPage /></PrivateRoute>}>
          <Route path="quick-count" element={<InterpolationCanvas />} />
        </Route>
    {/* Admin Path */}
        <Route path="/admin" element={<PrivateRoute requiredRoles={["admin"]} verified={true}><AdminLayout /></PrivateRoute>}>
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="images" element={<AdminImagePage />} />
          <Route path="datasets" element={<AdminDatasetPage />} />
          <Route path="datasets/:dataset_name" element={<AdminDatasetImagePage />} />
          <Route path="datasets/:dataset_name/:folder_id/:imageName" element={<AdminDatasetImagePage />} />
          <Route path="models" element={<AdminModelPage />} />
        </Route>
   {/* Other Path */}
      <Route path="/test" element={<TestPage />}/>
      </Routes>
    </BrowserRouter>
  </AuthProvider>
  </GoogleOAuthProvider>
);
