import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CategoryListPage } from "./pages/CategoryListPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { DepartmentListPage } from "./pages/DepartmentListPage";
import { LoginPage } from "./pages/LoginPage";
import { TicketCreatePage } from "./pages/TicketCreatePage";
import { TicketDetailPage } from "./pages/TicketDetailPage";
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
        
        <Route path="/users" element={<ProtectedRoute allowedRoles={["admin"]}><UserListPage /></ProtectedRoute>} />
        <Route path="/users/new" element={<ProtectedRoute allowedRoles={["admin"]}><UserCreatePage /></ProtectedRoute>} />
        <Route path="/users/:id" element={<ProtectedRoute allowedRoles={["admin"]}><UserDetailPage /></ProtectedRoute>} />

        <Route path="/categories" element={<ProtectedRoute allowedRoles={["admin"]}><CategoryListPage /></ProtectedRoute>} />
        <Route path="/departments" element={<ProtectedRoute allowedRoles={["admin"]}><DepartmentListPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
