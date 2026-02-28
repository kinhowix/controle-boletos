import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {

  const location = useLocation();

  function linkClass(path) {
    return location.pathname === path
      ? "block p-3 rounded-lg bg-blue-600 text-white"
      : "block p-3 rounded-lg hover:bg-gray-200";
  }

  return (
    <div className="w-64 bg-white shadow-lg min-h-screen p-6">

      <h2 className="text-2xl font-bold mb-8">Financeiro</h2>

      <nav className="space-y-3">

        <Link to="/" className={linkClass("/")}>
          📊 Dashboard
        </Link>

        <Link to="/novo-boleto" className={linkClass("/novo-boleto")}>
          ➕ Novo Boleto
        </Link>

        <Link to="/empresas" className={linkClass("/empresas")}>
          🏢 Empresas
        </Link>

      </nav>
    </div>
  );
}