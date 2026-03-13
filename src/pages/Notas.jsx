import { useEffect, useState } from "react";
import MainLayout from "../components/layout/MainLayout";

import {
  getNotas,
  addNota,
  marcarNotaUsada,
  deleteNota,
  existeNota
} from "../services/notasService";

import { addBoleto } from "../services/boletosService";

import {
  getEmpresaByCNPJ,
  addEmpresa
} from "../services/empresasService";

import { formatarReal } from "../utils/formatCurrency";

export default function Notas() {

  const [notas, setNotas] = useState([]);
  const [selecionadas, setSelecionadas] = useState([]);

  const [modal, setModal] = useState(false);

  const [vencimento, setVencimento] = useState("");
  const [parcelas, setParcelas] = useState(1);

  const [linhaDigitavel, setLinhaDigitavel] = useState("");
  const [pdfBoleto, setPdfBoleto] = useState(null);

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

      const descricao =
        "Fatura NF " +
        notasSelecionadas.map((n) => n.numeroNF).join(",");

      const valorParcela = total / parcelas;

      let primeiroBoletoId = null;

      for (let i = 1; i <= parcelas; i++) {

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
          linhaDigitavel: linhaDigitavel || "",
          pdf: pdfBoleto ? pdfBoleto.name : "",
          parcela: i,
          totalParcelas: parcelas,
          pago: false
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

      {/* IMPORTAR XML */}

      <div className="bg-gray-800 p-4 rounded-xl mb-6">

        <input
          type="file"
          accept=".xml"
          onChange={importarXML}
          className="bg-gray-700 p-2 rounded text-white"
        />

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

        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">

          <div className="bg-gray-800 p-6 rounded-xl w-96">

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

            <input
              placeholder="Linha digitável (opcional)"
              value={linhaDigitavel}
              onChange={(e) =>
                setLinhaDigitavel(e.target.value)
              }
              className="bg-gray-700 p-2 rounded w-full mb-3"
            />

            <input
              type="file"
              accept="application/pdf"
              onChange={(e) =>
                setPdfBoleto(e.target.files[0])
              }
              className="mb-4"
            />

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

    </MainLayout>

  );

}