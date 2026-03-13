import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";

import { addBoleto, existeNota } from "../services/boletosService";

import {
  getEmpresas,
  getEmpresaByCNPJ,
  addEmpresa,
} from "../services/empresasService";

import { lerXMLNFe } from "../utils/xmlNFeReader";
import { aplicarMascaraReal, parseReal, formatarReal } from "../utils/formatCurrency";

export default function NovoBoleto() {

  const navigate = useNavigate();

  const [empresas, setEmpresas] = useState([]);
  const [buscaEmpresa, setBuscaEmpresa] = useState("");

  const [empresaId, setEmpresaId] = useState("");
  const [empresaNome, setEmpresaNome] = useState("");

  const [novaEmpresa, setNovaEmpresa] = useState("");

  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [vencimento, setVencimento] = useState("");

  const [numeroNF, setNumeroNF] = useState("");
  const [cnpjNF, setCnpjNF] = useState("");

  const [grupo, setGrupo] = useState("");
  const [parcelas, setParcelas] = useState(1);
  const [linhaDigitavel, setLinhaDigitavel] = useState("");
  const [pdfBoleto, setPdfBoleto] = useState(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarEmpresas();
  }, []);

  async function carregarEmpresas() {
    const dados = await getEmpresas();
    setEmpresas(dados || []);
  }

  function selecionarEmpresa(id) {

    setEmpresaId(id);

    const emp = empresas.find(
      (e) => String(e.id) === String(id)
    );

    if (emp) {
      setEmpresaNome(emp.razao);
    }
  }

  async function criarEmpresaManual() {

    if (!novaEmpresa) {
      alert("Digite o nome da empresa");
      return;
    }

    const novoId = await addEmpresa({
      razao: novaEmpresa,
      cnpj: "",
    });

    await carregarEmpresas();

    setEmpresaId(novoId);
    setEmpresaNome(novaEmpresa);

    setNovaEmpresa("");
  }

  // =========================
  // SALVAR BOLETO
  // =========================

  async function salvar() {

    if (!empresaId) {
      alert("Selecione empresa");
      return;
    }

    if (!valor) {
      alert("Informe valor");
      return;
    }

    if (!vencimento) {
      alert("Informe o vencimento");
      setSalvando(false);
      return;
    }

    if (numeroNF) {

      const duplicado = await existeNota(
        numeroNF,
        cnpjNF
      );

      if (duplicado) {
        alert("Nota já cadastrada");
        return;
      }
    }

    const valorTotal = parseReal(valor);

    if (valorTotal <= 0) {
      alert("Informe um valor válido");
      return;
    }

    setSalvando(true);

    try {
      const valorParcela = valorTotal / parcelas;

      let pdfUrl = "";

      // Conversão do PDF para texto (Base64) //
      if (pdfBoleto) {
        if (pdfBoleto.size > 800 * 1024) {
          alert("O arquivo PDF é muito grande. O limite máximo seguro é 800 KB.");
          setSalvando(false);
          return;
        }
        try {
          pdfUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(pdfBoleto);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (e) => reject(e);
          });
        } catch (error) {
          console.error("Erro na leitura do PDF", error);
          alert("Não foi possível ler o PDF, ele será ignorado.");
        }
      }

      // CORREÇÃO DA DATA
      const [ano, mes, dia] = vencimento.split("-");
      const dataBase = new Date(ano, mes - 1, dia);

      for (let i = 1; i <= parcelas; i++) {

        const dataParcela = new Date(dataBase);

        dataParcela.setMonth(
          dataBase.getMonth() + (i - 1)
        );

        await addBoleto({
          empresaId,
          empresa: empresaNome,
          valor: valorParcela,
          descricao,
          vencimento: dataParcela,
          numeroNF,
          cnpj: cnpjNF,
          grupo,
          linhaDigitavel: linhaDigitavel || "",
          pdf: pdfUrl,
          parcela: i,
          totalParcelas: parcelas,
          pago: false,
        });
      }

      alert("Boletos criados");
      navigate("/");

    } catch (erro) {
      console.error("Erro geral ao salvar:", erro);
      alert("Ocorreu um erro ao salvar o boleto. A página pode ter informações pendentes.");
    } finally {
      setSalvando(false);
    }
  }

  // =========================
  // IMPORTAR XML MELHORADO
  // =========================

  async function importarXML(e) {

    const file = e.target.files[0];
    if (!file) return;

    const texto = await file.text();

    const parser = new DOMParser();
    const xml = parser.parseFromString(
      texto,
      "text/xml"
    );

    // dados principais

    const numero =
      xml.getElementsByTagName("nNF")[0]?.textContent || "";

    const valor =
      xml.getElementsByTagName("vNF")[0]?.textContent || "";

    const cnpj =
      xml.getElementsByTagName("CNPJ")[0]?.textContent || "";

    const razao =
      xml.getElementsByTagName("xNome")[0]?.textContent || "";

    const rua =
      xml.getElementsByTagName("xLgr")[0]?.textContent || "";

    const numeroEndereco =
      xml.getElementsByTagName("nro")[0]?.textContent || "";

    const cidade =
      xml.getElementsByTagName("xMun")[0]?.textContent || "";

    const uf =
      xml.getElementsByTagName("UF")[0]?.textContent || "";

    const data =
      xml.getElementsByTagName("dhEmi")[0]?.textContent || "";

    const endereco = `${rua} ${numeroEndereco}`;

    setValor(aplicarMascaraReal(valor));
    setDescricao("NF " + numero);
    setNumeroNF(numero);
    setCnpjNF(cnpj);

    if (data) {
      setVencimento(data.substring(0, 10));
    }

    // verificar duplicado

    const duplicado = await existeNota(
      numero,
      cnpj
    );

    if (duplicado) {
      alert("NF já cadastrada");
      return;
    }

    // verificar empresa

    let emp = await getEmpresaByCNPJ(cnpj);

    if (!emp) {

      const novoId = await addEmpresa({
        cnpj: cnpj,
        razao: razao,
        endereco: endereco,
        cidade: cidade,
        uf: uf,
      });

      emp = {
        id: novoId,
        razao: razao,
      };

      await carregarEmpresas();
    }

    setEmpresaId(emp.id);
    setEmpresaNome(emp.razao);
  }

  // =========================
  // FILTRO EMPRESAS
  // =========================

  const empresasFiltradas = empresas.filter((e) =>
    e.razao
      ?.toLowerCase()
      .includes(buscaEmpresa.toLowerCase())
  );

  return (
    <div className="flex">

      <Sidebar />

      <div className="flex-1 bg-gray-900 text-white min-h-screen">

        <Header />

        <div className="p-6">

          <h1 className="text-2xl font-bold mb-6">
            Novo Boleto
          </h1>

          <div className="bg-gray-800 p-6 rounded-xl shadow">

            {/* IMPORTAR XML */}

            <div className="mb-6">

              <label className="block mb-2 text-sm text-gray-300">
                Importar XML da NF-e
              </label>

              <input
                type="file"
                accept=".xml"
                onChange={importarXML}
                className="bg-gray-700 p-2 rounded"
              />

            </div>

            {/* BUSCAR EMPRESA */}

            <input
              placeholder="Pesquisar empresa..."
              className="bg-gray-700 p-2 rounded w-full mb-4"
              value={buscaEmpresa}
              onChange={(e) =>
                setBuscaEmpresa(e.target.value)
              }
            />

            <select
              className="bg-gray-700 p-2 rounded w-full mb-4"
              value={empresaId}
              onChange={(e) =>
                selecionarEmpresa(e.target.value)
              }
            >
              <option value="">
                Selecionar empresa
              </option>

              {empresasFiltradas.map((e) => (
                <option
                  key={e.id}
                  value={e.id}
                >
                  {e.razao}
                </option>
              ))}

            </select>

            {/* NOVA EMPRESA */}

            <div className="flex gap-2 mb-6">

              <input
                placeholder="Cadastrar nova empresa"
                className="bg-gray-700 p-2 rounded w-full"
                value={novaEmpresa}
                onChange={(e) =>
                  setNovaEmpresa(e.target.value)
                }
              />

              <button
                onClick={criarEmpresaManual}
                className="bg-blue-600 px-4 rounded"
              >
                Criar
              </button>

            </div>

            {/* FORM BOLETO */}

            <div className="grid grid-cols-2 gap-4">

              <input
                placeholder="Valor total (R$)"
                className="bg-gray-700 p-2 rounded"
                value={valor}
                onChange={(e) =>
                  setValor(aplicarMascaraReal(e.target.value))
                }
              />

              <input
                type="date"
                className="bg-gray-700 p-2 rounded"
                value={vencimento}
                onChange={(e) =>
                  setVencimento(e.target.value)
                }
              />

              <input
                placeholder="Descrição"
                className="bg-gray-700 p-2 rounded"
                value={descricao}
                onChange={(e) =>
                  setDescricao(e.target.value)
                }
              />

              <input
                placeholder="Número NF (opcional)"
                className="bg-gray-700 p-2 rounded"
                value={numeroNF}
                onChange={(e) =>
                  setNumeroNF(e.target.value)
                }
              />

              <input
                placeholder="Grupo de notas"
                className="bg-gray-700 p-2 rounded"
                value={grupo}
                onChange={(e) =>
                  setGrupo(e.target.value)
                }
              />

              <input
                type="number"
                placeholder="Parcelas"
                className="bg-gray-700 p-2 rounded"
                value={parcelas}
                onChange={(e) =>
                  setParcelas(
                    Number(e.target.value)
                  )
                }
              />

              <input
                placeholder="Linha digitável (opcional)"
                className="bg-gray-700 p-2 rounded col-span-2"
                value={linhaDigitavel}
                onChange={(e) =>
                  setLinhaDigitavel(e.target.value)
                }
              />

              <div className="col-span-2">
                <label className="block mb-2 text-sm text-gray-400">
                  Anexar PDF do Boleto (Opcional)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  className="bg-gray-700 p-2 rounded w-full text-sm text-gray-300"
                  onChange={(e) =>
                    setPdfBoleto(e.target.files[0])
                  }
                />
              </div>

            </div>

            <div className="mt-6 flex gap-4">

              <button
                onClick={salvar}
                disabled={salvando}
                className={`px-4 py-2 rounded text-white font-semibold transition ${
                  salvando ? "bg-gray-500 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {salvando ? "Salvando..." : "Criar boletos"}
              </button>

              <button
                onClick={() => navigate("/")}
                className="bg-gray-600 px-4 py-2 rounded"
              >
                Voltar
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}