import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, secondaryAuth } from "../services/firebase";
import { Link } from "react-router-dom";
import { getUsers, setUserRole, deleteUserDoc } from "../services/usersService";

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";

export default function Cadastro() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [roleNovo, setRoleNovo] = useState("usuario");
  const [usuarios, setUsuarios] = useState([]);
  const [mensagem, setMensagem] = useState(null);
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    carregarUsuarios();
  }, []);

  async function carregarUsuarios() {
    const lista = await getUsers();
    setUsuarios(lista);
  }

  async function cadastrar(e) {
    e.preventDefault();
    setMensagem(null);
    setErro(null);
    setCarregando(true);

    try {
      // Usar secondaryAuth para não deslogar o admin atual
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, senha);
      const user = userCredential.user;

      // Salvar papel no Firestore
      await setUserRole(user.uid, email, roleNovo);

      // Deslogar o novo usuário da instância secundária para mantê-la limpa
      await signOut(secondaryAuth);

      setMensagem("Usuário criado com sucesso!");
      setEmail("");
      setSenha("");
      setRoleNovo("usuario");
      carregarUsuarios();
    } catch (error) {
      console.error(error);
      if (error.code === "auth/email-already-in-use") {
        setErro("Este e-mail já está em uso.");
      } else if (error.code === "auth/weak-password") {
        setErro("A senha deve ter pelo menos 6 caracteres.");
      } else if (error.code === "auth/admin-restricted-operation") {
        setErro("Operação restrita. Verifique as configurações do Firebase.");
      } else {
        setErro("Erro ao criar usuário.");
      }
    } finally {
      setCarregando(false);
    }
  }

  async function excluirUsuario(userId, userEmail) {
    if (userEmail === auth.currentUser?.email) {
      alert("Você não pode excluir a si mesmo.");
      return;
    }

    const confirma = window.confirm(`Remover permissões do usuário ${userEmail}? Ele não poderá mais acessar o sistema.`);
    if (!confirma) return;

    const sucesso = await deleteUserDoc(userId);
    if (sucesso) {
      setMensagem("Permissões do usuário removidas com sucesso!");
      carregarUsuarios();
    } else {
      setErro("Erro ao remover usuário.");
    }
  }

  return (
    <div className="flex bg-gray-900 min-h-screen">
      <Sidebar />

      <div className="flex-1 text-white">
        <Header />

        <div className="p-6 max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-blue-400">Controle de Acessos</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* FORMULÁRIO */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <span>➕</span> Novo Usuário
                </h2>

                {mensagem && (
                  <div className="mb-4 p-3 bg-green-700/50 text-green-200 border border-green-600 rounded-lg text-sm">
                    ✅ {mensagem}
                  </div>
                )}

                {erro && (
                  <div className="mb-4 p-3 bg-red-700/50 text-red-200 border border-red-600 rounded-lg text-sm">
                    ❌ {erro}
                  </div>
                )}

                <form onSubmit={cadastrar} className="flex flex-col gap-5">
                  <div>
                    <label className="block mb-2 text-sm text-gray-400 uppercase tracking-wider">Email</label>
                    <input
                      type="email"
                      placeholder="email@exemplo.com"
                      className="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 selection:bg-blue-500"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm text-gray-400 uppercase tracking-wider">Senha Provisória</label>
                    <input
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      className="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm text-gray-400 uppercase tracking-wider">Nível de Acesso</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRoleNovo("usuario")}
                        className={`flex-1 p-2 rounded-lg text-sm font-bold border transition ${
                          roleNovo === "usuario"
                            ? "bg-blue-600 border-blue-400 text-white"
                            : "bg-gray-900 border-gray-700 text-gray-500 hover:border-gray-500"
                        }`}
                      >
                        Comum
                      </button>
                      <button
                        type="button"
                        onClick={() => setRoleNovo("admin")}
                        className={`flex-1 p-2 rounded-lg text-sm font-bold border transition ${
                          roleNovo === "admin"
                            ? "bg-purple-600 border-purple-400 text-white"
                            : "bg-gray-900 border-gray-700 text-gray-500 hover:border-gray-500"
                        }`}
                      >
                        Administrador
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={carregando}
                    className={`w-full p-4 rounded-xl font-bold text-white transition-all shadow-lg ${
                      carregando
                        ? "bg-gray-600 cursor-not-allowed opacity-50"
                        : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 transform hover:-translate-y-1 active:translate-y-0"
                    }`}
                  >
                    {carregando ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processando...
                      </span>
                    ) : "Registrar Usuário"}
                  </button>
                </form>
              </div>
            </div>

            {/* LISTAGEM */}
            <div className="lg:col-span-2">
              <div className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-700">
                <div className="p-6 bg-gray-800/50 border-b border-gray-700 flex justify-between items-center">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <span>👥</span> Usuários Cadastrados
                  </h2>
                  <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold uppercase">
                    {usuarios.length} Ativos
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-900/50">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Usuário</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Nível</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                      {usuarios.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-700/50 transition duration-150">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-200">{u.email}</div>
                            {u.email === auth.currentUser?.email && (
                              <span className="text-[10px] bg-green-600/20 text-green-400 px-1.5 py-0.5 rounded uppercase font-bold">Você</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              u.role === "admin" 
                                ? "bg-purple-600/20 text-purple-400 border border-purple-600/50" 
                                : "bg-gray-600/20 text-gray-400 border border-gray-600/50"
                            }`}>
                              {u.role === "admin" ? "Admin" : "Comum"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => excluirUsuario(u.id, u.email)}
                              disabled={u.email === auth.currentUser?.email}
                              className={`p-2 rounded-lg transition-all ${
                                u.email === auth.currentUser?.email
                                  ? "text-gray-600 cursor-not-allowed"
                                  : "text-red-400 hover:bg-red-400/10 hover:text-red-300 transform hover:scale-110"
                              }`}
                              title="Remover acesso"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                      {usuarios.length === 0 && (
                        <tr>
                          <td colSpan="3" className="px-6 py-10 text-center text-gray-500 italic">
                            Nenhum usuário encontrado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
