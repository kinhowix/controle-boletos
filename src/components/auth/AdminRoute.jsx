import { useAuth } from "../../context/AuthContext";
import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
  const { usuario, role, carregando } = useAuth();

  if (carregando) {
    return <div className="p-10 text-white">Carregando permissões...</div>;
  }

  if (!usuario) {
    return <Navigate to="/login" />;
  }

  if (role !== "admin") {
    return <Navigate to="/" />;
  }

  return children;
}

export default AdminRoute;
