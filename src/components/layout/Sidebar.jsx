import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../../services/firebase";

export default function Sidebar() {
  const { role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  async function sair() {
    await signOut(auth);
    navigate("/login");
  }

  function linkClass(path) {
    return location.pathname === path
      ? "block p-3 rounded-lg bg-blue-600 text-white"
      : "block p-3 rounded-lg hover:bg-gray-600 text-gray-300";
  }

  return (
    <div className="w-64 bg-gray-950 border-r border-gray-800 p-6 flex flex-col h-screen">
      <h2 className="text-xl font-bold text-gray-200 mb-8">
        Financeiro
      </h2>

      <nav className="space-y-3 flex-1">

        <Link to="/" className={linkClass("/")}>
          📊 Painel de Controle
        </Link>

        <Link to="/novo-boleto" className={linkClass("/novo-boleto")}>
          ➕ Novo Boleto
        </Link>

        <Link to="/notas" className={linkClass("/notas")}>
          📄 Notas
        </Link>

        <Link to="/empresas" className={linkClass("/empresas")}>
          🏢 Empresas
        </Link>

        <Link to="/grafico" className={linkClass("/grafico")}>
          📊 Gráfico
        </Link>

        {role === "admin" && (
          <Link to="/cadastro" className={linkClass("/cadastro")}>
            👤 Cadastro
          </Link>
        )}


        <Link to="/arquivados" className={linkClass("/arquivados")}>
          📁 Arquivados
        </Link>


      </nav>

      <div className="mt-auto pt-6 border-t border-gray-800">
        <button
          onClick={sair}
          className="w-full flex items-center gap-3 p-3 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors font-medium border border-transparent hover:border-red-400/20"
        >
          🚪 Sair do Sistema
        </button>
      </div>
    </div>
  );
}