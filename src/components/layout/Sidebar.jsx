import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../../services/firebase";

export default function Sidebar() {
  const { role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

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
    <>
      {/* Botão Hambúrguer Mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] bg-gray-800 p-2 rounded-md border border-gray-700 text-white shadow-lg"
        aria-label="Abrir menu"
      >
        {isOpen ? (
          <span className="text-xl">✕</span>
        ) : (
          <span className="text-xl">☰</span>
        )}
      </button>

      {/* Backdrop Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[50] lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-[55] w-64 bg-gray-950 border-r border-gray-800 p-6 flex flex-col h-screen transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:relative lg:translate-x-0 lg:flex
      `}>
      <h2 className="text-xl font-bold text-gray-200 mb-8">
        Financeiro
      </h2>

      <nav className="space-y-3 flex-1">

        <Link to="/" className={linkClass("/")}>
          📊 Painel de Controle
        </Link>

        <Link to="/novo-boleto" className={linkClass("/novo-boleto")}>
          ➕ Novo Boleto {role !== "admin" && "🔒"}
        </Link>

        <Link to="/notas" className={linkClass("/notas")}>
          📄 Notas {role !== "admin" && "🔒"}
        </Link>

        <Link to="/empresas" className={linkClass("/empresas")}>
          🏢 Empresas
        </Link>

        <Link to="/grafico" className={linkClass("/grafico")}>
          📊 Gráfico
        </Link>

        {role === "admin" && (
          <>
            <Link to="/cadastro" className={linkClass("/cadastro")}>
              👤 Cadastro
            </Link>

          </>
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
    </>
  );
}