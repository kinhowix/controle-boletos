import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {

  const location = useLocation();

  function linkClass(path) {
    return location.pathname === path
      ? "block p-3 rounded-lg bg-blue-600 text-white"
      : "block p-3 rounded-lg hover:bg-gray-600 text-gray-300";
  }

  return (
    <div className="w-64 bg-gray-950 border-r border-gray-800 p-6">
      <h2 className="text-xl font-bold text-gray-200 mb-8">
        Financeiro
      </h2>

      <nav className="space-y-3">

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

      </nav>
    </div>
  );
}