import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import NovoBoleto from "./pages/NovoBoleto";
import Empresas from "./pages/Empresas";
import Notas from "./pages/Notas";
import Login from "./pages/Login";
import PrivateRoute from "./components/auth/PrivateRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/novo-boleto"
        element={
          <PrivateRoute>
            <NovoBoleto />
          </PrivateRoute>
        }
      />

      <Route
        path="/empresas"
        element={
          <PrivateRoute>
            <Empresas />
          </PrivateRoute>
        }
      />

      <Route path="/notas" element={<Notas />} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}