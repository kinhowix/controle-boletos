import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import { useNavigate } from "react-router-dom";

export default function Login() {

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const navigate = useNavigate();

  async function entrar(e) {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(auth, email, senha);
      navigate("/");
    } catch (error) {
      alert("Erro ao fazer login");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">

      <form onSubmit={entrar} className="bg-white p-8 rounded-2xl shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 border rounded-lg mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Senha"
          className="w-full p-3 border rounded-lg mb-6"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />

        <button className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700">
          Entrar
        </button>
      </form>
    </div>
  );
}