import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";

import {
  addBoleto,
  existeNota,
} from "../services/boletosService";

import {
  getEmpresas,
  getEmpresaByCNPJ,
  addEmpresa,
} from "../services/empresasService";

import { lerXMLNFe } from "../utils/xmlNFeReader";

export default function NovoBoleto() {

  const navigate = useNavigate();

  const [numeroNF, setNumeroNF] = useState("");
  const [cnpjNF, setCnpjNF] = useState("");

  const [empresas, setEmpresas] = useState([]);

  const [empresaId, setEmpresaId] = useState("");
  const [empresaNome, setEmpresaNome] = useState("");

  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [descricao, setDescricao] = useState("");

  // =========================
  // LOAD EMPRESAS
  // =========================

  useEffect(() => {
    carregarEmpresas();
  }, []);

  async function carregarEmpresas() {
    const dados = await getEmpresas();
    setEmpresas(dados || []);
  }

  // =========================
  // SELECIONAR EMPRESA
  // =========================

  function selecionarEmpresa(id) {

    setEmpresaId(id);

    const emp = empresas.find(
      (e) => String(e.id) === String(id)
    );

    if (emp) {
      setEmpresaNome(emp.razao);
    }
  }

  // =========================
  // SALVAR
  // =========================

  async function salvar() {

    if (!empresaId || empresaId === "") {
      alert("Empresa não definida");
      return;
    }

    if (!numeroNF) {
      alert("NF não definida");
      return;
    }

    const duplicado = await existeNota(
      numeroNF,
      cnpjNF
    );

    if (duplicado) {
      alert("Nota já cadastrada");
      return;
    }

    await addBoleto({
      empresaId: empresaId,
      empresa: empresaNome,
      valor,
      descricao,
      vencimento: new Date(vencimento),
      pago: false,
      numeroNF,
      cnpj: cnpjNF,
    });

    alert("Boleto salvo");

    navigate("/dashboard");
  }

  // =========================
  // IMPORTAR XML
  // =========================

  async function importarXML(e) {

    const file = e.target.files[0];

    if (!file) return;

    const texto = await file.text();

    const dados = lerXMLNFe(texto);

    if (!dados) {
      alert("Erro no XML");
      return;
    }

    setValor(dados.valor);
    setDescricao("NF " + dados.numero);
    setNumeroNF(dados.numero);
    setCnpjNF(dados.cnpj);

    if (dados.data) {
      setVencimento(
        dados.data.substring(0, 10)
      );
    }

    // verificar duplicado

    const duplicado = await existeNota(
      dados.numero,
      dados.cnpj
    );

    if (duplicado) {
      alert("NF já cadastrada");
      return;
    }

    // buscar empresa

    let emp = await getEmpresaByCNPJ(
      dados.cnpj
    );

    // criar se não existir

    if (!emp) {

      const novoId = await addEmpresa({
        cnpj: dados.cnpj,
        razao: dados.razao,
      });

      if (!novoId) {
        alert("Erro ao criar empresa");
        return;
      }

      emp = {
        id: novoId,
        razao: dados.razao,
      };

      await carregarEmpresas();
    }

    // definir empresa

    setEmpresaId(emp.id);
    setEmpresaNome(emp.razao);
  }

  // =========================
  // UI
  // =========================

  return (
    <div className="flex">

      <Sidebar />

      <div className="flex-1 bg-gray-100 min-h-screen">

        <Header />

        <div className="p-6">

          <h1 className="text-2xl font-bold mb-4">
            Novo Boleto
          </h1>

          <div className="bg-white p-6 rounded-xl shadow">

            {/* XML */}

            <input
              type="file"
              accept=".xml"
              onChange={importarXML}
              className="mb-4"
            />

            <div className="grid grid-cols-2 gap-4">

              <select
                className="border p-2 rounded"
                value={empresaId}
                onChange={(e) =>
                  selecionarEmpresa(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Selecionar empresa
                </option>

                {empresas.map((e) => (
                  <option
                    key={e.id}
                    value={e.id}
                  >
                    {e.razao}
                  </option>
                ))}

              </select>

              <input
                placeholder="Valor"
                className="border p-2 rounded"
                value={valor}
                onChange={(e) =>
                  setValor(e.target.value)
                }
              />

              <input
                type="date"
                className="border p-2 rounded"
                value={vencimento}
                onChange={(e) =>
                  setVencimento(
                    e.target.value
                  )
                }
              />

              <input
                placeholder="Descrição"
                className="border p-2 rounded"
                value={descricao}
                onChange={(e) =>
                  setDescricao(
                    e.target.value
                  )
                }
              />

            </div>

            {/* BOTÕES */}

            <div className="mt-6 flex gap-4">

              <button
                onClick={salvar}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Salvar boleto
              </button>

              <button
                onClick={() => navigate("/dashboard")}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Voltar
              </button>

              <button
                onClick={() => navigate("/login")}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Sair
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}