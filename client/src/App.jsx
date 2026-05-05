import React from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Home from "./pages/Home";
import Signin from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import About from "./pages/About";
import Header from "./components/Header";
import { BrowserRouter } from "react-router-dom";
import UserMessages from './pages/UserMessages';
import PrivateRoute from "./components/PrivateRoute";
import RoleBasedRoute from "./components/RoleBasedRoute";
import LandListings from "./pages/LandListings";
import LandDetail from "./pages/LandDetail";
import CreateLandListing from "./pages/CreateLandListing";
import UpdateLandListing from "./pages/UpdateLandListing";
import VerificationCenter from "./pages/VerificationCenter";
import AdminDashboard from "./pages/AdminDashboard";
import TransactionHistory from "./pages/TransactionHistory";
import FraudReport from "./pages/FraudReport";
import VerifySellerDetails from "./pages/VerifySellerDetails";
import Dashboard from "./pages/Dashboard";
import VerifyEmail from "./pages/VerifyEmail";
import ManageUsers from "./pages/ManageUsers";
import ReportsView from "./pages/ReportsView";
import SystemSettings from "./pages/SystemSettings";

function App() {
  return (
    <div>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sign-in" element={<Signin />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/about" element={<About />} />

          <Route path="/report-fraud" element={<FraudReport />} />

          <Route element={<PrivateRoute />}>
            <Route path="/lands" element={<LandListings />} />
            <Route path="/lands/:landId" element={<LandDetail />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/verify-seller-details" element={<VerifySellerDetails />} />
            <Route path="/messages" element={<UserMessages />} />
            <Route path="/create-land-listing" element={<CreateLandListing />} />
            <Route path="/update-land/:landId" element={<UpdateLandListing />} />
            <Route path="/transactions" element={<TransactionHistory />} />
          </Route>

          <Route element={<RoleBasedRoute allowedRoles={['VERIFICATION_OFFICER', 'MUNICIPAL_OFFICER', 'SYSTEM_ADMIN']} />}>
            <Route path="/verify-land" element={<VerificationCenter />} />
          </Route>

          <Route element={<RoleBasedRoute allowedRoles={['SYSTEM_ADMIN']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/manage-users" element={<ManageUsers />} />
            <Route path="/admin/reports" element={<ReportsView />} />
            <Route path="/admin/settings" element={<SystemSettings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;