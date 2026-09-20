import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { DictionaryPage } from "./pages/DictionaryPage";
import { LoginPage } from "./pages/LoginPage";
import { TicketCreatePage } from "./pages/TicketCreatePage";
import { TicketDetailPage } from "./pages/TicketDetailPage";
import { TicketEditPage } from "./pages/TicketEditPage";
import { TicketListPage } from "./pages/TicketListPage";
import { UserCreatePage } from "./pages/UserCreatePage";
import { UserDetailPage } from "./pages/UserDetailPage";
import { UserListPage } from "./pages/UserListPage";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/" element={<ProtectedRoute><TicketListPage /></ProtectedRoute>} />
        <Route path="/tickets/new" element={<ProtectedRoute allowedRoles={["reporter"]}><TicketCreatePage /></ProtectedRoute>} />
        <Route path="/tickets/:id" element={<ProtectedRoute><TicketDetailPage /></ProtectedRoute>} />
        <Route path="/tickets/:id/edit" element={<ProtectedRoute allowedRoles={["admin", "support"]}><TicketEditPage /></ProtectedRoute>} />

        <Route path="/users" element={<ProtectedRoute allowedRoles={["admin"]}><UserListPage /></ProtectedRoute>} />
        <Route path="/users/new" element={<ProtectedRoute allowedRoles={["admin"]}><UserCreatePage /></ProtectedRoute>} />
        <Route path="/users/:id" element={<ProtectedRoute allowedRoles={["admin"]}><UserDetailPage /></ProtectedRoute>} />

        <Route path="/dictionary" element={<ProtectedRoute allowedRoles={["admin"]}><DictionaryPage /></ProtectedRoute>} />

        {/* Przekierowanie starych ścieżek dla kompatybilności */}
        <Route path="/categories" element={<ProtectedRoute allowedRoles={["admin"]}><DictionaryPage /></ProtectedRoute>} />
        <Route path="/departments" element={<ProtectedRoute allowedRoles={["admin"]}><DictionaryPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
