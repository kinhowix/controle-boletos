import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";

import {
  getBoletos,
  deleteBoleto,
  updateBoleto
} from "../services/boletosService";

import { getBancos } from "../services/bancosService";

import { aplicarMascaraReal, parseReal, formatarReal } from "../utils/formatCurrency";
import { cleanLinhaDigitavel } from "../utils/formatDigitavel";

export default function Arquivados() {

  const navigate = useNavigate();
  const { role } = useAuth();
  const [boletos, setBoletos] = useState([]);

  const [mesFiltro, setMesFiltro] = useState(
    new Date().getMonth() + 1
  );

  const [anoFiltro, setAnoFiltro] = useState(
    new Date().getFullYear()
  );

  const [empresaFiltro, setEmpresaFiltro] = useState("");

  const [modalEditar, setModalEditar] = useState(false);
  const [boletoEditando, setBoletoEditando] = useState(null);

  const [modalBoleto, setModalBoleto] = useState(false);
  const [boletoVisualizando, setBoletoVisualizando] = useState(null);

  useEffect(() => {
    carregarBoletos();
  }, []);

  async function carregarBoletos() {
    const dados = await getBoletos();
    setBoletos(dados || []);
  }

  function converterData(vencimento) {
    if (!vencimento) return null;
    if (typeof vencimento.toDate === "function") {
      return vencimento.toDate();
    }
    return new Date(vencimento);
  }

  async function sair() {
    await signOut(auth);
    navigate("/login");
  }

  // ================================
  // FILTROS
  // ================================

  const boletosFiltrados = boletos.filter((b) => {
    const data = converterData(b.vencimento);
    const filtroAno =
      anoFiltro === "" ||
      (data && data.getFullYear() === Number(anoFiltro));
    const filtroMes =
      mesFiltro === "" ||
      (data && data.getMonth() + 1 === Number(mesFiltro));
    const filtroEmpresa =
      empresaFiltro === "" ||
      b.empresa?.toLowerCase().includes(
        empresaFiltro.toLowerCase()
      );
    return filtroAno && filtroMes && filtroEmpresa;
  });

  // ================================
  // ARQUIVAMENTO
  // ================================

  async function desarquivar(boleto) {
    await updateBoleto(boleto.id, { arquivado: false });
    carregarBoletos();
  }

  // ================================
  // EXCLUIR
  // ================================

  async function excluir(boleto) {
    const confirma = window.confirm(
      "Excluir boleto permanentemente?"
    );
    if (!confirma) return;
    await deleteBoleto(boleto.id);
    carregarBoletos();
  }

  // ================================
  // EDITAR BOLETO
  // ================================

  function abrirEditar(boleto) {
    setBoletoEditando({
      ...boleto,
      valor: formatarReal(boleto.valor),
      vencimento: converterData(boleto.vencimento)
        ?.toISOString()
        .substring(0, 10)
    });
    setModalEditar(true);
  }

  async function salvarEdicao() {
    const dadosAtualizados = {
      ...boletoEditando,
      valor: parseReal(boletoEditando.valor)
    };
    await updateBoleto(
      boletoEditando.id,
      dadosAtualizados
    );
    setModalEditar(false);
    carregarBoletos();
  }

  // ================================
  // VISUALIZAR BOLETO
  // ================================

  function abrirBoleto(boleto) {
    setBoletoVisualizando(boleto);
    setModalBoleto(true);
  }

  const arquivados = boletosFiltrados.filter(b => b.arquivado);

  return (

    <div className="flex">

      <Sidebar />

      <div className="flex-1 bg-gray-900 text-white min-h-screen">

        <Header />

        <div className="p-6">

          {/* TOPO */}

          <div className="flex justify-between mb-6">

            <h1 className="text-2xl font-bold">
              Boletos Arquivados
            </h1>

            <button
              onClick={sair}
              className="bg-red-600 px-4 py-2 rounded"
            >
              Sair
            </button>

          </div>

          {/* FILTROS */}

          <div className="bg-gray-800 p-4 rounded-xl mb-6 flex gap-4">

            <select
              value={anoFiltro}
              onChange={(e) =>
                setAnoFiltro(e.target.value)
              }
              className="bg-gray-700 p-2 rounded"
            >
              <option value="">Todos os anos</option>
              {Array.from({ length: 15 }).map((_, i) => {
                const year = new Date().getFullYear() - 5 + i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>

            <select
              value={mesFiltro}
              onChange={(e) =>
                setMesFiltro(e.target.value)
              }
              className="bg-gray-700 p-2 rounded"
            >

              <option value="">
                Todos os meses
              </option>

              {[
                "Janeiro", "Fevereiro", "Março", "Abril",
                "Maio", "Junho", "Julho", "Agosto",
                "Setembro", "Outubro", "Novembro", "Dezembro"
              ].map((nome, i) => (

                <option key={i} value={i + 1}>
                  {nome}
                </option>

              ))}

            </select>

            <input
              placeholder="Filtrar empresa"
              value={empresaFiltro}
              onChange={(e) =>
                setEmpresaFiltro(e.target.value)
              }
              className="bg-gray-700 p-2 rounded"
            />

          </div>

          {/* TABELA ARQUIVADOS */}

          <div className="bg-gray-800 p-6 rounded-xl">
            <h2 className="text-xl font-bold mb-4 text-blue-400">Boletos Arquivados</h2>

            <div className="max-h-[280px] overflow-y-auto pr-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-600">
                    <th className="py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Empresa</th>
                    <th className="py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Valor</th>
                    <th className="py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">NF</th>
                    <th className="py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Vencimento</th>
                    <th className="py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Data Pago</th>
                    <th className="py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Banco</th>
                    <th className="py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 w-px whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {arquivados.map((b) => {
                    const dataVenc = converterData(b.vencimento);
                    return (
                      <tr key={b.id} className="border-b border-gray-700">
                        <td className="py-3">
                          <div className="max-w-[200px] overflow-x-auto whitespace-nowrap scrollbar-thin">
                            {b.empresa}
                          </div>
                        </td>
                        <td className="py-3">R$ {formatarReal(b.valorPago || b.valor)}</td>
                        <td className="py-3">
                          <div className="max-w-[100px] overflow-x-auto whitespace-nowrap scrollbar-thin">
                            {b.numeroNF || "-"}
                          </div>
                        </td>
                        <td className="py-3">{dataVenc ? dataVenc.toLocaleDateString() : ""}</td>
                        <td className="py-3">{b.dataPagamento ? new Date(b.dataPagamento + "T12:00:00").toLocaleDateString() : "-"}</td>
                        <td className="py-3">{b.banco || "-"}</td>
                        <td className="flex gap-2 py-3 whitespace-nowrap">
                          <button
                            onClick={() => desarquivar(b)}
                            className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-xs font-medium text-white"
                            title="Desarquivar"
                          >
                            📤
                          </button>
                          <button onClick={() => abrirEditar(b)} className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-xs font-medium text-white" title="Editar">✏</button>
                          <button onClick={() => abrirBoleto(b)} className="bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded text-xs font-medium text-white" title="Visualizar">📄</button>
                          <button 
                            onClick={() => excluir(b)} 
                            disabled={role !== "admin"}
                            className={`${role === "admin" ? "bg-red-600 hover:bg-red-700" : "bg-gray-600 cursor-not-allowed"} px-3 py-1.5 rounded text-xs font-medium text-white`} 
                            title={role === "admin" ? "Excluir" : "Acesso Restrito"}
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {arquivados.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-gray-400">Nenhum boleto arquivado neste período.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

      {/* MODAL EDITAR */}

      {modalEditar && (

        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">

          <div className="bg-gray-800 p-6 rounded-xl w-96">

            <h2 className="text-xl mb-4 font-bold text-yellow-400">
              Editar boleto
            </h2>

            <input
              className="bg-gray-700 p-2 rounded w-full mb-3 text-white"
              value={boletoEditando.empresa}
              onChange={(e) =>
                setBoletoEditando({
                  ...boletoEditando,
                  empresa: e.target.value
                })
              }
            />

            <input
              placeholder="Valor (R$)"
              className="bg-gray-700 p-2 rounded w-full mb-3 text-white"
              value={boletoEditando.valor}
              onChange={(e) =>
                setBoletoEditando({
                  ...boletoEditando,
                  valor: aplicarMascaraReal(e.target.value)
                })
              }
            />

            <input
              type="date"
              className="bg-gray-700 p-2 rounded w-full mb-3 text-white"
              value={boletoEditando.vencimento}
              onChange={(e) =>
                setBoletoEditando({
                  ...boletoEditando,
                  vencimento: e.target.value
                })
              }
            />

            <input
              placeholder="NF"
              className="bg-gray-700 p-2 rounded w-full mb-3 text-white"
              value={boletoEditando.numeroNF || ""}
              onChange={(e) =>
                setBoletoEditando({
                  ...boletoEditando,
                  numeroNF: e.target.value
                })
              }
            />

            <div className="flex gap-3">

              <button
                onClick={salvarEdicao}
                className="bg-green-600 px-4 py-2 rounded text-white"
              >
                Salvar
              </button>

              <button
                onClick={() => setModalEditar(false)}
                className="bg-gray-600 px-4 py-2 rounded text-white"
              >
                Cancelar
              </button>

            </div>

          </div>

        </div>

      )}

      {/* MODAL BOLETO */}

      {modalBoleto && (

        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">

          <div className="bg-gray-800 p-6 rounded-xl w-96">

            <h2 className="text-xl mb-4 font-bold text-yellow-400">
              Boleto
            </h2>

            {boletoVisualizando?.linhaDigitavel && (

              <div className="mb-4">

                <div className="text-xl p-2 rounded font-semibold text-gray-400">
                  Linha digitável
                </div>

                <div className="bg-gray-700 p-2 rounded break-all text-white">
                  {cleanLinhaDigitavel(boletoVisualizando.linhaDigitavel)}
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      cleanLinhaDigitavel(boletoVisualizando.linhaDigitavel)
                    )
                  }}
                  className="mt-2 bg-blue-600 px-3 py-1 rounded text-gray-400"
                >
                  Copiar
                </button>

              </div>

            )}

            {boletoVisualizando?.pdf && (

              <button
                onClick={() => {
                  const pdf = boletoVisualizando.pdf;
                  if (pdf.startsWith("data:application/pdf")) {
                    try {
                      const byteString = atob(pdf.split(",")[1]);
                      const ab = new ArrayBuffer(byteString.length);
                      const ia = new Uint8Array(ab);
                      for (let i = 0; i < byteString.length; i++) {
                        ia[i] = byteString.charCodeAt(i);
                      }
                      const blob = new Blob([ab], { type: "application/pdf" });
                      const url = URL.createObjectURL(blob);
                      window.open(url, "_blank");
                    } catch (e) {
                      alert("Erro ao abrir o PDF salvo.");
                    }
                  } else if (pdf.startsWith("http")) {
                    window.open(pdf, "_blank");
                  } else {
                    alert("Este boleto possui apenas o nome do arquivo gravado antigamente e não pode ser aberto de forma automática.");
                  }
                }}
                className="bg-green-600 px-4 py-2 rounded block w-full text-center font-bold text-white mb-2"
              >
                Abrir PDF
              </button>

            )}

            <button
              onClick={() => setModalBoleto(false)}
              className="mt-4 bg-gray-600 px-4 py-2 rounded w-full text-white"
            >
              Fechar
            </button>

          </div>

        </div>

      )}

    </div>

  );

}
