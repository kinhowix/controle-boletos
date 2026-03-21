import { useAuth } from "../../context/AuthContext";
import { Navigate } from "react-router-dom";

function PrivateRoute({ children }) {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return <div className="p-10">Carregando...</div>;
  }

  if (!usuario) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default PrivateRoute;