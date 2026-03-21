import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import NovoBoleto from "./pages/NovoBoleto";
import Empresas from "./pages/Empresas";
import Notas from "./pages/Notas";
import Grafico from "./pages/Grafico";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Arquivados from "./pages/Arquivados";
import PrivateRoute from "./components/auth/PrivateRoute";
import AdminRoute from "./components/auth/AdminRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/cadastro"
        element={
          <AdminRoute>
            <Cadastro />
          </AdminRoute>
        }
      />


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

      <Route
        path="/grafico"
        element={
          <PrivateRoute>
            <Grafico />
          </PrivateRoute>
        }
      />

      <Route
        path="/arquivados"
        element={
          <PrivateRoute>
            <Arquivados />
          </PrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}