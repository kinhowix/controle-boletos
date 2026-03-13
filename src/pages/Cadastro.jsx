import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import { Link } from "react-router-dom";

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";

export default function Cadastro() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState(null);
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(false);

  async function cadastrar(e) {
    e.preventDefault();
    setMensagem(null);
    setErro(null);
    setCarregando(true);

    try {
      await createUserWithEmailAndPassword(auth, email, senha);
      setMensagem("Usuário criado com sucesso!");
      setEmail("");
      setSenha("");
    } catch (error) {
      console.error(error);
      if (error.code === "auth/email-already-in-use") {
        setErro("Este e-mail já está em uso.");
      } else if (error.code === "auth/weak-password") {
        setErro("A senha deve ter pelo menos 6 caracteres.");
      } else {
        setErro("Erro ao criar usuário.");
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 bg-gray-900 text-white min-h-screen">
        <Header />

        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Cadastro de Usuário</h1>

          <div className="bg-gray-800 p-6 rounded-xl shadow max-w-md">

            {mensagem && (
              <div className="mb-4 p-3 bg-green-700 text-white rounded-lg text-sm">
                ✅ {mensagem}
              </div>
            )}

            {erro && (
              <div className="mb-4 p-3 bg-red-700 text-white rounded-lg text-sm">
                ❌ {erro}
              </div>
            )}

            <form onSubmit={cadastrar} className="flex flex-col gap-4">
              <div>
                <label className="block mb-1 text-sm text-gray-400">Email</label>
                <input
                  type="email"
                  placeholder="email@exemplo.com"
                  className="w-full bg-gray-700 p-3 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-sm text-gray-400">Senha</label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-gray-700 p-3 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={carregando}
                className={`w-full p-3 rounded-lg font-semibold transition cursor-pointer ${
                  carregando
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {carregando ? "Criando..." : "Criar Conta"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
