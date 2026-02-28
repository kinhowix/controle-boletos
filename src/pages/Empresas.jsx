import { useEffect, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
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

    } catch (e) {
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
    <div className="flex">

      <Sidebar />

      <div className="flex-1 bg-gray-100 min-h-screen">

        <Header />

        <div className="p-6">

          <h1 className="text-2xl font-bold mb-4">
            Empresas
          </h1>

          {/* FORM */}

          <div className="bg-white p-6 rounded-xl shadow mb-6">

            <div className="grid grid-cols-2 gap-4">

              <input
                placeholder="CNPJ"
                className="border p-2 rounded"
                value={cnpj}
                onChange={(e) =>
                  setCnpj(e.target.value)
                }
              />

              <button
                onClick={buscarCNPJ}
                className="bg-blue-600 text-white rounded"
              >
                Buscar CNPJ
              </button>

              <input
                placeholder="Razão Social"
                className="border p-2 rounded"
                value={razao}
                onChange={(e) =>
                  setRazao(e.target.value)
                }
              />

              <input
                placeholder="Fantasia"
                className="border p-2 rounded"
                value={fantasia}
                onChange={(e) =>
                  setFantasia(e.target.value)
                }
              />

              <input
                placeholder="Cidade"
                className="border p-2 rounded"
                value={cidade}
                onChange={(e) =>
                  setCidade(e.target.value)
                }
              />

              <input
                placeholder="UF"
                className="border p-2 rounded"
                value={uf}
                onChange={(e) =>
                  setUf(e.target.value)
                }
              />

            </div>

            <button
              onClick={salvar}
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
            >
              Salvar Empresa
            </button>

          </div>

          {/* LISTA */}

          <div className="bg-white p-6 rounded-xl shadow">

            <table className="w-full">

              <thead>
                <tr className="text-left border-b">
                  <th>CNPJ</th>
                  <th>Empresa</th>
                  <th>Cidade</th>
                  <th>UF</th>
                </tr>
              </thead>

              <tbody>

                {empresas.map((e) => (
                  <tr key={e.id} className="border-b">
                    <td>{e.cnpj}</td>
                    <td>{e.razao}</td>
                    <td>{e.cidade}</td>
                    <td>{e.uf}</td>
                  </tr>
                ))}

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </div>
  );
}