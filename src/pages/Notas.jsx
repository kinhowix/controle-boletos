import { useEffect, useState } from "react";
import MainLayout from "../components/layout/MainLayout";

import {
  getNotas,
  addNota,
  marcarNotaUsada,
  deleteNota,
  existeNota
} from "../services/notasService";

import {
  getEmpresaByCNPJ,
  addEmpresa
} from "../services/empresasService";

import { addBoleto } from "../services/boletosService";

import { formatarReal } from "../utils/formatCurrency";

export default function Notas() {

  const [notas, setNotas] = useState([]);
  const [selecionadas, setSelecionadas] = useState([]);

  const [modal, setModal] = useState(false);

  const [vencimento, setVencimento] = useState("");
  const [parcelas, setParcelas] = useState(1);

  const [linhasDigitaveis, setLinhasDigitaveis] = useState({});
  const [pdfsBoletos, setPdfsBoletos] = useState({});

  // Estados para Código de Barras
  const [modalBarcode, setModalBarcode] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [bcNumero, setBcNumero] = useState("");
  const [bcCnpj, setBcCnpj] = useState("");
  const [bcValor, setBcValor] = useState("");
  const [bcEmpresa, setBcEmpresa] = useState("");
  const [bcCidade, setBcCidade] = useState("");
  const [bcUf, setBcUf] = useState("");

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {

    const dados = await getNotas();

    const disponiveis = dados.filter(
      (n) => !n.usadaEmBoleto
    );

    setNotas(disponiveis);

  }

  // =========================
  // IMPORTAR XML
  // =========================

  async function importarXML(e) {

    const file = e.target.files[0];
    if (!file) return;

    const texto = await file.text();

    const parser = new DOMParser();
    const xml = parser.parseFromString(texto, "text/xml");

    const numero =
      xml.getElementsByTagName("nNF")[0]?.textContent || "";

    const valor =
      xml.getElementsByTagName("vNF")[0]?.textContent || 0;

    const empresa =
      xml.getElementsByTagName("xNome")[0]?.textContent || "";

    const cnpj =
      xml.getElementsByTagName("CNPJ")[0]?.textContent || "";

    const cidade =
      xml.getElementsByTagName("xMun")[0]?.textContent || "";

    const uf =
      xml.getElementsByTagName("UF")[0]?.textContent || "";

    const duplicado = await existeNota(numero, cnpj);

    if (duplicado) {
      alert("Nota já cadastrada");
      return;
    }

    let emp = await getEmpresaByCNPJ(cnpj);

    if (!emp) {

      await addEmpresa({
        razao: empresa,
        cnpj,
        cidade,
        uf
      });

    }

    await addNota({
      numeroNF: numero,
      valor: Number(valor),
      empresa,
      cnpj,
      usadaEmBoleto: false
    });

    carregar();

  }

  // =========================
  // IMPORTAR CÓDIGO DE BARRAS (CHAVE DE ACESSO)
  // =========================

  async function handleBarcodeChange(e) {
    const val = e.target.value;
    setBarcode(val);

    // Se tiver 44 dígitos, é a chave de acesso da NF-e
    if (val.length === 44) {
      const cnpjExtraido = val.substring(6, 20);
      const numeroNFExtraido = Number(val.substring(25, 34)).toString();

      setBcCnpj(cnpjExtraido);
      setBcNumero(numeroNFExtraido);

      // Tenta buscar empresa cadastrada
      const emp = await getEmpresaByCNPJ(cnpjExtraido);
      if (emp) {
        setBcEmpresa(emp.razao || emp.empresa || "");
        setBcCidade(emp.cidade || "");
        setBcUf(emp.uf || "");
      } else {
        setBcEmpresa("");
        setBcCidade("");
        setBcUf("");
      }
    }
  }

  function handleBarcodeKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
    }
    if (e.ctrlKey && e.key.toLowerCase() === "j") {
      e.preventDefault();
    }
  }

  async function salvarBarcode() {
    if (!bcNumero || !bcCnpj || !bcValor || !bcEmpresa) {
      alert("Preencha todos os campos corretamente (ou escaneie o código novamente e informe valor/empresa).");
      return;
    }

    const duplicado = await existeNota(bcNumero, bcCnpj);

    if (duplicado) {
      alert("Nota já cadastrada");
      return;
    }

    let emp = await getEmpresaByCNPJ(bcCnpj);

    if (!emp) {
      await addEmpresa({
        razao: bcEmpresa,
        cnpj: bcCnpj,
        cidade: bcCidade,
        uf: bcUf
      });
    }

    await addNota({
      numeroNF: bcNumero,
      valor: Number(bcValor),
      empresa: bcEmpresa,
      cnpj: bcCnpj,
      usadaEmBoleto: false
    });

    alert("Nota adicionada com sucesso!");
    setModalBarcode(false);
    
    // Limpar estados
    setBarcode("");
    setBcNumero("");
    setBcCnpj("");
    setBcValor("");
    setBcEmpresa("");
    setBcCidade("");
    setBcUf("");

    carregar();
  }

  // =========================
  // SELECIONAR NOTAS
  // =========================

  function toggleNota(id) {

    if (selecionadas.includes(id)) {

      setSelecionadas(
        selecionadas.filter((n) => n !== id)
      );

    } else {

      setSelecionadas([...selecionadas, id]);

    }

  }

  // =========================
  // EXCLUIR NOTA
  // =========================

  async function excluir(id) {

    if (!window.confirm("Excluir nota?")) return;

    await deleteNota(id);

    carregar();

  }

  // =========================
  // GERAR BOLETO
  // =========================

  async function confirmarBoleto() {

    try {

      const notasSelecionadas = notas.filter((n) =>
        selecionadas.includes(n.id)
      );

      if (notasSelecionadas.length === 0) {
        alert("Selecione notas");
        return;
      }

      if (!vencimento) {
        alert("Informe o vencimento");
        return;
      }

      const empresa = notasSelecionadas[0].empresa;

      const total = notasSelecionadas.reduce(
        (acc, n) => acc + Number(n.valor),
        0
      );

      const arrayNumerosNF = notasSelecionadas.map((n) => n.numeroNF).join(", ");
      const descricao = "Fatura NF " + arrayNumerosNF;

      const valorParcela = total / parcelas;

      let primeiroBoletoId = null;

      for (let i = 1; i <= parcelas; i++) {
        const index = i - 1;

        let pdfUrl = "";
        const pdfFile = pdfsBoletos[index];

        // Conversão do PDF para um texto seguro (Base64) //
        if (pdfFile) {
          if (pdfFile.size > 800 * 1024) {
            alert(`O arquivo PDF da parcela ${i} é muito grande. O limite máximo seguro é 800 KB.`);
            return;
          }
          try {
            pdfUrl = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(pdfFile);
              reader.onload = () => resolve(reader.result);
              reader.onerror = (e) => reject(e);
            });
          } catch (error) {
            console.error("Erro na leitura do PDF", error);
            alert(`Não foi possível ler o PDF da parcela ${i}, ele será ignorado.`);
          }
        }

        const dataParcela = new Date(
          vencimento + "T12:00:00"
        );

        dataParcela.setMonth(
          dataParcela.getMonth() + (i - 1)
        );

        const boletoId = await addBoleto({
          empresa,
          valor: valorParcela,
          descricao,
          vencimento: dataParcela,
          linhaDigitavel: linhasDigitaveis[index] || "",
          pdf: pdfUrl,
          parcela: i,
          totalParcelas: parcelas,
          pago: false,
          numeroNF: arrayNumerosNF
        });

        if (!primeiroBoletoId) {
          primeiroBoletoId = boletoId;
        }

      }

      if (!primeiroBoletoId) {
        throw new Error("Boleto não criado");
      }

      for (const nota of notasSelecionadas) {

        await marcarNotaUsada(
          nota.id,
          primeiroBoletoId
        );

      }

      alert("Boletos criados com sucesso");

      setModal(false);
      setSelecionadas([]);

      carregar();

    } catch (erro) {

      console.error("ERRO:", erro);

      alert("Erro ao gerar boleto");

    }

  }

  return (

    <MainLayout>

      <h1 className="text-2xl font-semibold mb-6">
        Notas Fiscais
      </h1>

      {/* IMPORTAR XML E CÓDIGO DE BARRAS */}

      <div className="bg-gray-800 p-4 rounded-xl mb-6 flex items-center gap-4">

        <div>
          <label className="block text-sm text-gray-400 mb-1">Importar XML</label>
          <input
            type="file"
            accept=".xml"
            onChange={importarXML}
            className="bg-gray-700 p-2 rounded text-white"
          />
        </div>

        <div className="text-gray-400">ou</div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Leitor de Código de Barras (NF-e)</label>
          <button
            onClick={() => setModalBarcode(true)}
            className="bg-blue-600 px-4 py-2 rounded text-white font-medium"
          >
            Escanear Código de Barras
          </button>
        </div>

      </div>

      {/* LISTA */}

      <div className="bg-gray-800 p-6 rounded-2xl">

        <table className="w-full">

          <thead>

            <tr className="border-b border-gray-600 text-left text-gray-400">

              <th></th>
              <th>NF</th>
              <th>Empresa</th>
              <th>Valor</th>
              <th>Ações</th>

            </tr>

          </thead>

          <tbody>

            {notas.map((n) => (

              <tr
                key={n.id}
                className="border-b border-gray-700"
              >

                <td>

                  <input
                    type="checkbox"
                    checked={selecionadas.includes(n.id)}
                    onChange={() => toggleNota(n.id)}
                  />

                </td>

                <td>{n.numeroNF}</td>

                <td>{n.empresa}</td>

                <td>
                  R$ {formatarReal(n.valor)}
                </td>

                <td>

                  <button
                    onClick={() => excluir(n.id)}
                    className="text-red-400"
                  >
                    excluir
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

        <button
          onClick={() => setModal(true)}
          className="mt-6 bg-green-600 px-4 py-2 rounded"
        >
          Criar fatura / boleto
        </button>

      </div>

      {/* MODAL */}

      {modal && (

        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">

          <div className="bg-gray-800 p-6 rounded-xl w-96 max-h-[90vh] overflow-y-auto">

            <h2 className="text-xl mb-4">
              Gerar boletos
            </h2>

            <input
              type="date"
              value={vencimento}
              onChange={(e) =>
                setVencimento(e.target.value)
              }
              className="bg-gray-700 p-2 rounded w-full mb-3"
            />

            <input
              type="number"
              placeholder="Parcelas"
              value={parcelas}
              onChange={(e) =>
                setParcelas(Number(e.target.value))
              }
              className="bg-gray-700 p-2 rounded w-full mb-3"
            />

            <div className="mb-4 space-y-4 max-h-60 overflow-y-auto pr-2">
              {Array.from({ length: parcelas || 1 }).map((_, i) => (
                <div key={i} className="bg-gray-700/50 p-4 rounded border border-gray-600">
                  <h3 className="text-sm font-semibold mb-3 text-gray-200">Parcela {i + 1}</h3>
                  <input
                    placeholder="Linha digitável (opcional)"
                    value={linhasDigitaveis[i] || ""}
                    onChange={(e) =>
                      setLinhasDigitaveis({ ...linhasDigitaveis, [i]: e.target.value })
                    }
                    className="bg-gray-800 p-2 rounded w-full mb-3 border border-gray-600"
                  />
                  <label className="block mb-2 text-sm text-gray-400">
                    Anexar PDF do Boleto (Opcional)
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) =>
                      setPdfsBoletos({ ...pdfsBoletos, [i]: e.target.files[0] })
                    }
                    className="w-full text-sm text-gray-300"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3">

              <button
                onClick={confirmarBoleto}
                className="bg-green-600 px-4 py-2 rounded"
              >
                Confirmar
              </button>

              <button
                onClick={() => setModal(false)}
                className="bg-gray-600 px-4 py-2 rounded"
              >
                Cancelar
              </button>

            </div>

          </div>

        </div>

      )}

      {/* MODAL CÓDIGO DE BARRAS */}

      {modalBarcode && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-96">
            <h2 className="text-xl mb-4 font-bold text-blue-400">Adicionar via Código de Barras</h2>

            <label className="block text-gray-400 text-sm mb-1">Passe o leitor aqui (Chave 44 dígitos)</label>
            <input
              autoFocus
              className="bg-gray-700 p-2 rounded w-full mb-3 text-white"
              value={barcode}
              onChange={handleBarcodeChange}
              onKeyDown={handleBarcodeKeyDown}
              placeholder="Escaneie o código de barras..."
            />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Número NF</label>
                <input
                  className="bg-gray-700 p-2 rounded w-full mb-3 text-white"
                  value={bcNumero}
                  onChange={(e) => setBcNumero(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">CNPJ</label>
                <input
                  className="bg-gray-700 p-2 rounded w-full mb-3 text-white"
                  value={bcCnpj}
                  onChange={(e) => setBcCnpj(e.target.value)}
                />
              </div>
            </div>

            <label className="block text-gray-400 text-sm mb-1">Empresa</label>
            <input
              className="bg-gray-700 p-2 rounded w-full mb-3 text-white"
              value={bcEmpresa}
              onChange={(e) => setBcEmpresa(e.target.value)}
              placeholder="Nome da empresa..."
            />

            <label className="block text-gray-400 text-sm mb-1">Valor da NF (R$)</label>
            <input
              type="number"
              step="0.01"
              className="bg-gray-700 p-2 rounded w-full mb-4 text-white"
              value={bcValor}
              onChange={(e) => setBcValor(e.target.value)}
              placeholder="0.00"
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setModalBarcode(false)}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded font-semibold text-white"
              >
                Cancelar
              </button>
              <button
                onClick={salvarBarcode}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold text-white"
              >
                Salvar Nota
              </button>
            </div>
          </div>
        </div>
      )}

    </MainLayout>

  );

}