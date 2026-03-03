import { useEffect, useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import {
  getEmpresas,
  addEmpresa,
} from "../services/empresasService";

export default function Empresas() {

  const [empresas, setEmpresas] = useState([]);
  const [cnpj, setCnpj] = useState("");
  const [razao, setRazao] = useState("");
  const [fantasia, setFantasia] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const dados = await getEmpresas();
    setEmpresas(dados);
  }

  async function buscarCNPJ() {
    if (cnpj.length < 14) {
      alert("CNPJ inválido");
      return;
    }

    try {
      const res = await fetch(
        `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`
      );

      const data = await res.json();

      setRazao(data.razao_social || "");
      setFantasia(data.nome_fantasia || "");
      setCidade(data.municipio || "");
      setUf(data.uf || "");

    } catch {
      alert("Erro ao buscar CNPJ");
    }
  }

  async function salvar() {
    if (!razao) {
      alert("Informe a empresa");
      return;
    }

    await addEmpresa({
      cnpj,
      razao,
      fantasia,
      cidade,
      uf,
    });

    setCnpj("");
    setRazao("");
    setFantasia("");
    setCidade("");
    setUf("");

    carregar();
  }

  return (
    <MainLayout>

      <h1 className="text-2xl font-semibold mb-6">
        Empresas
      </h1>

      {/* FORM */}
      <div className="bg-gray-800 p-6 rounded-2xl shadow-lg mb-8">

        <div className="grid grid-cols-2 gap-4">

          <input
            placeholder="CNPJ"
            className="bg-gray-700 border border-gray-600 p-2 rounded text-white"
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
          />

          <button
            onClick={buscarCNPJ}
            className="bg-blue-600 hover:bg-blue-700 rounded text-white"
          >
            Buscar CNPJ
          </button>

          <input
            placeholder="Razão Social"
            className="bg-gray-700 border border-gray-600 p-2 rounded text-white"
            value={razao}
            onChange={(e) => setRazao(e.target.value)}
          />

          <input
            placeholder="Fantasia"
            className="bg-gray-700 border border-gray-600 p-2 rounded text-white"
            value={fantasia}
            onChange={(e) => setFantasia(e.target.value)}
          />

          <input
            placeholder="Cidade"
            className="bg-gray-700 border border-gray-600 p-2 rounded text-white"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
          />

          <input
            placeholder="UF"
            className="bg-gray-700 border border-gray-600 p-2 rounded text-white"
            value={uf}
            onChange={(e) => setUf(e.target.value)}
          />

        </div>

        <button
          onClick={salvar}
          className="mt-6 bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white"
        >
          Salvar Empresa
        </button>

      </div>

      {/* LISTA */}
      <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">

        <table className="w-full text-sm">

          <thead>
            <tr className="text-left border-b border-gray-600 text-gray-400">
              <th className="pb-2">CNPJ</th>
              <th className="pb-2">Empresa</th>
              <th className="pb-2">Cidade</th>
              <th className="pb-2">UF</th>
            </tr>
          </thead>

          <tbody>
            {empresas.map((e) => (
              <tr key={e.id} className="border-b border-gray-700 hover:bg-gray-700">
                <td className="py-2">{e.cnpj}</td>
                <td>{e.razao}</td>
                <td>{e.cidade}</td>
                <td>{e.uf}</td>
              </tr>
            ))}
          </tbody>

        </table>

      </div>

    </MainLayout>
  );
}