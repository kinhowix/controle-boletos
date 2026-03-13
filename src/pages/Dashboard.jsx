import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";

import {
  getBoletos,
  deleteBoleto,
  updateBoleto
} from "../services/boletosService";

import { getBancos, addBanco } from "../services/bancosService";

import { aplicarMascaraReal, parseReal, formatarReal } from "../utils/formatCurrency";

export default function Dashboard() {

  const navigate = useNavigate();

  const [boletos, setBoletos] = useState([]);

  const [mesFiltro, setMesFiltro] = useState(
    new Date().getMonth() + 1
  );

  const [empresaFiltro, setEmpresaFiltro] = useState("");

  const [modalEditar, setModalEditar] = useState(false);
  const [boletoEditando, setBoletoEditando] = useState(null);

  const [modalBoleto, setModalBoleto] = useState(false);
  const [boletoVisualizando, setBoletoVisualizando] = useState(null);

  const [bancos, setBancos] = useState([]);
  const [modalBaixa, setModalBaixa] = useState(false);
  const [boletoBaixa, setBoletoBaixa] = useState(null);
  const [baixaData, setBaixaData] = useState(new Date().toISOString().substring(0, 10));
  const [baixaBanco, setBaixaBanco] = useState("");
  const [novoBanco, setNovoBanco] = useState("");

  useEffect(() => {
    carregarBoletos();
    carregarBancos();
  }, []);

  async function carregarBancos() {
    const dados = await getBancos();
    setBancos(dados || []);
  }

  async function carregarBoletos() {
    const dados = await getBoletos();
    setBoletos(dados || []);
  }

  const hoje = new Date();

  function converterData(vencimento) {

    if (!vencimento) return null;

    if (typeof vencimento.toDate === "function") {
      return vencimento.toDate();
    }

    return new Date(vencimento);

  }

  const totalPago = boletos
    .filter(b => b.pago)
    .reduce((acc, b) => acc + Number(b.valor || 0), 0);

  const totalPendente = boletos
  .filter(b => {

    if (b.pago) return false;

    if (mesFiltro === "") return true;

    const data = converterData(b.vencimento);

    return data && data.getMonth() + 1 === Number(mesFiltro);

  })
  .reduce((acc, b) => acc + Number(b.valor || 0), 0);
  const totalVencido = boletos
    .filter(b => {
      const data = converterData(b.vencimento);
      return !b.pago && data && data < hoje;
    })
    .reduce((acc, b) => acc + Number(b.valor || 0), 0);

  async function sair() {
    await signOut(auth);
    navigate("/login");
  }

  // ================================
  // FILTROS
  // ================================

  const boletosFiltrados = boletos.filter((b) => {

    const data = converterData(b.vencimento);

    const filtroMes =
      mesFiltro === "" ||
      (data && data.getMonth() + 1 === Number(mesFiltro));

    const filtroEmpresa =
      empresaFiltro === "" ||
      b.empresa?.toLowerCase().includes(
        empresaFiltro.toLowerCase()
      );

    return filtroMes && filtroEmpresa;

  });

  // ================================
  // MARCAR PAGO (BAIXA)
  // ================================

  async function iniciarBaixa(boleto) {
    if (boleto.pago) {
      // Se já está pago e clica, apenas reverte o status
      await updateBoleto(boleto.id, {
        pago: false,
        dataPagamento: null,
        banco: null,
      });
      carregarBoletos();
      return;
    }

    setBoletoBaixa(boleto);
    setBaixaData(new Date().toISOString().substring(0, 10));
    setBaixaBanco("");
    setNovoBanco("");
    setModalBaixa(true);
  }

  async function confirmarBaixa() {
    let bancoSelecionado = baixaBanco;

    if (bancoSelecionado === "novo") {
      if (!novoBanco) {
        alert("Informe o nome do novo banco.");
        return;
      }
      bancoSelecionado = novoBanco;
      await addBanco({ nome: novoBanco });
      carregarBancos();
    } else if (!bancoSelecionado) {
      alert("Selecione um banco.");
      return;
    }

    await updateBoleto(boletoBaixa.id, {
      pago: true,
      dataPagamento: baixaData,
      banco: bancoSelecionado,
    });

    setModalBaixa(false);
    carregarBoletos();
  }

  function cancelarBaixa() {
    setModalBaixa(false);
    setBoletoBaixa(null);
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

  // ================================
  // LISTAS SEPARADAS
  // ================================

  const pendentesEVencidos = boletosFiltrados.filter(b => !b.pago);
  const pagos = boletosFiltrados.filter(b => b.pago);

  return (

    <div className="flex">

      <Sidebar />

      <div className="flex-1 bg-gray-900 text-white min-h-screen">

        <Header />

        <div className="p-6">

          {/* TOPO */}

          <div className="flex justify-between mb-6">

            <h1 className="text-2xl font-bold">
              Painel Financeiro
            </h1>

            <button
              onClick={sair}
              className="bg-red-600 px-4 py-2 rounded"
            >
              Sair
            </button>

          </div>

          {/* RESUMO */}

          <div className="grid grid-cols-3 gap-4 mb-6">

            <div className="bg-gray-800 p-4 rounded">
              Pago
              <div className="text-green-400 text-xl">
                R$ {formatarReal(totalPago)}
              </div>
            </div>

            <div className="bg-gray-800 p-4 rounded">
              Pendente no Período 
              <div className="text-yellow-400 text-xl">
                R$ {formatarReal(totalPendente)}
              </div>
            </div>

            <div className="bg-gray-800 p-4 rounded">
              Vencido
              <div className="text-red-400 text-xl">
                R$ {formatarReal(totalVencido)}
              </div>
            </div>

          </div>

          {/* FILTROS */}

          <div className="bg-gray-800 p-4 rounded-xl mb-6 flex gap-4">

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
                "Janeiro","Fevereiro","Março","Abril",
                "Maio","Junho","Julho","Agosto",
                "Setembro","Outubro","Novembro","Dezembro"
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

          {/* TABELA PENDENTES */}

          <div className="bg-gray-800 p-6 rounded-xl mb-6">
            <h2 className="text-xl font-bold mb-4 text-yellow-400">Boletos Pendentes / Vencidos</h2>
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-600">
                  <th className="pb-2">Empresa</th>
                  <th className="pb-2">Valor</th>
                  <th className="pb-2">Vencimento</th>
                  <th className="pb-2">NF</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pendentesEVencidos.map((b) => {
                  const data = converterData(b.vencimento);
                  const isVencido = data && data < hoje;

                  return (
                    <tr key={b.id} className="border-b border-gray-700">
                      <td className="py-2">{b.empresa}</td>
                      <td>R$ {formatarReal(b.valor)}</td>
                      <td>{data ? data.toLocaleDateString() : ""}</td>
                      <td>{b.numeroNF || "-"}</td>
                      <td>
                        {isVencido ? (
                          <span className="text-red-400 font-bold">Vencido</span>
                        ) : (
                          <span className="text-yellow-400">Pendente</span>
                        )}
                      </td>
                      <td className="flex gap-2 py-2">
                        <button
                          onClick={() => iniciarBaixa(b)}
                          className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-white"
                          title="Dar baixa"
                        >
                          ✔ Baixa
                        </button>
                        <button onClick={() => abrirEditar(b)} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white" title="Editar">✏</button>
                        <button onClick={() => abrirBoleto(b)} className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-white" title="Visualizar">📄</button>
                        <button onClick={() => excluir(b)} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white" title="Excluir">🗑</button>
                      </td>
                    </tr>
                  );
                })}
                {pendentesEVencidos.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-gray-400">Nenhum boleto pendente neste período.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* TABELA PAGOS */}

          <div className="bg-gray-800 p-6 rounded-xl">
            <h2 className="text-xl font-bold mb-4 text-green-400">Histórico de Pagamentos</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-600">
                  <th className="pb-2">Empresa</th>
                  <th className="pb-2">Valor</th>
                  <th className="pb-2">NF</th>
                  <th className="pb-2">Vencimento</th>
                  <th className="pb-2">Data Pago</th>
                  <th className="pb-2">Banco</th>
                  <th className="pb-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((b) => {
                  const dataVenc = converterData(b.vencimento);
                  return (
                    <tr key={b.id} className="border-b border-gray-700">
                      <td className="py-2">{b.empresa}</td>
                      <td>R$ {formatarReal(b.valor)}</td>
                      <td>{b.numeroNF || "-"}</td>
                      <td>{dataVenc ? dataVenc.toLocaleDateString() : ""}</td>
                      <td>{b.dataPagamento ? new Date(b.dataPagamento + "T12:00:00").toLocaleDateString() : "-"}</td>
                      <td>{b.banco || "-"}</td>
                      <td className="flex gap-2 py-2">
                        <button
                          onClick={() => iniciarBaixa(b)}
                          className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-white"
                          title="Desmarcar pago"
                        >
                          Desfazer
                        </button>
                        <button onClick={() => abrirBoleto(b)} className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-white" title="Visualizar">📄</button>
                        <button onClick={() => excluir(b)} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white" title="Excluir">🗑</button>
                      </td>
                    </tr>
                  );
                })}
                {pagos.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-gray-400">Nenhum boleto pago neste período.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      {/* MODAL EDITAR */}

      {modalEditar && (

        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">

          <div className="bg-gray-800 p-6 rounded-xl w-96">

            <h2 className="text-xl mb-4">
              Editar boleto
            </h2>

            <input
              className="bg-gray-700 p-2 rounded w-full mb-3"
              value={boletoEditando.empresa}
              onChange={(e)=>
                setBoletoEditando({
                  ...boletoEditando,
                  empresa:e.target.value
                })
              }
            />

            <input
              placeholder="Valor (R$)"
              className="bg-gray-700 p-2 rounded w-full mb-3"
              value={boletoEditando.valor}
              onChange={(e)=>
                setBoletoEditando({
                  ...boletoEditando,
                  valor: aplicarMascaraReal(e.target.value)
                })
              }
            />

            <input
              type="date"
              className="bg-gray-700 p-2 rounded w-full mb-3"
              value={boletoEditando.vencimento}
              onChange={(e)=>
                setBoletoEditando({
                  ...boletoEditando,
                  vencimento:e.target.value
                })
              }
            />

            <input
              placeholder="NF"
              className="bg-gray-700 p-2 rounded w-full mb-3"
              value={boletoEditando.numeroNF || ""}
              onChange={(e)=>
                setBoletoEditando({
                  ...boletoEditando,
                  numeroNF:e.target.value
                })
              }
            />

            <input
              placeholder="Linha digitável"
              className="bg-gray-700 p-2 rounded w-full mb-3"
              value={boletoEditando.linhaDigitavel || ""}
              onChange={(e)=>
                setBoletoEditando({
                  ...boletoEditando,
                  linhaDigitavel:e.target.value
                })
              }
            />

            <div className="flex gap-3">

              <button
                onClick={salvarEdicao}
                className="bg-green-600 px-4 py-2 rounded"
              >
                Salvar
              </button>

              <button
                onClick={()=>setModalEditar(false)}
                className="bg-gray-600 px-4 py-2 rounded"
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

            <h2 className="text-xl mb-4">
              Boleto
            </h2>

            {boletoVisualizando?.linhaDigitavel && (

              <div className="mb-4">

                <div className="text-sm text-gray-400">
                  Linha digitável
                </div>

                <div className="bg-gray-700 p-2 rounded break-all">
                  {boletoVisualizando.linhaDigitavel}
                </div>

                <button
                  onClick={()=>{
                    navigator.clipboard.writeText(
                      boletoVisualizando.linhaDigitavel
                    )
                  }}
                  className="mt-2 bg-blue-600 px-3 py-1 rounded"
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
              onClick={()=>setModalBoleto(false)}
              className="mt-4 bg-gray-600 px-4 py-2 rounded w-full"
            >
              Fechar
            </button>

          </div>

        </div>

      )}

      {/* MODAL BAIXA (PAGAMENTO) */}

      {modalBaixa && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-96">
            <h2 className="text-xl mb-4 font-bold text-green-400">Dar Baixa no Boleto</h2>
            
            <label className="block text-gray-400 text-sm mb-1">Data de Pagamento</label>
            <input
              type="date"
              className="bg-gray-700 p-2 rounded w-full mb-4"
              value={baixaData}
              onChange={(e) => setBaixaData(e.target.value)}
            />

            <label className="block text-gray-400 text-sm mb-1">Conta Bancária</label>
            <select
              className="bg-gray-700 p-2 rounded w-full mb-4 text-white"
              value={baixaBanco}
              onChange={(e) => setBaixaBanco(e.target.value)}
            >
              <option value="">Selecione um banco</option>
              {bancos.map((b) => (
                <option key={b.id} value={b.nome}>{b.nome}</option>
              ))}
              <option value="novo">+ Adicionar novo banco...</option>
            </select>

            {baixaBanco === "novo" && (
              <input
                placeholder="Nome do novo banco"
                className="bg-gray-700 p-2 rounded w-full mb-4 border border-blue-500"
                value={novoBanco}
                onChange={(e) => setNovoBanco(e.target.value)}
              />
            )}

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={cancelarBaixa}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded font-semibold text-white"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarBaixa}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold text-white"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>

  );

}