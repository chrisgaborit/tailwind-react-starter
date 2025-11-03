// @ts-nocheck
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Public app
import GeneratorApp from "./GeneratorApp";

// Auth + Admin
import Login from "./routes/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./routes/admin/AdminLayout";
import Dashboard from "./routes/admin/Dashboard";
import UsersPage from "./routes/admin/UsersPage";
import StoryboardsPage from "./routes/admin/StoryboardsPage";
import BillingPage from "./routes/admin/BillingPage";
import SettingsPage from "./routes/admin/SettingsPage";
import PrintPage from "./pages/Print";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<GeneratorApp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/print" element={<PrintPage />} />

        {/* Admin (protected) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="storyboards" element={<StoryboardsPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<GeneratorApp />} />
      </Routes>
    </BrowserRouter>
  );
}
