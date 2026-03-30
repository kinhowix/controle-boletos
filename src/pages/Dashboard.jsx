import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";

import {
  getBoletos,
  deleteBoleto,
  updateBoleto
} from "../services/boletosService";

import { getBancos, addBanco } from "../services/bancosService";
import { getSettings } from "../services/settingsService";

import { aplicarMascaraReal, parseReal, formatarReal } from "../utils/formatCurrency";
import { cleanLinhaDigitavel } from "../utils/formatDigitavel";

export default function Dashboard() {

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

  const [bancos, setBancos] = useState([]);
  const [modalBaixa, setModalBaixa] = useState(false);
  const [boletoBaixa, setBoletoBaixa] = useState(null);
  const [baixaData, setBaixaData] = useState(new Date().toISOString().substring(0, 10));
  const [baixaBanco, setBaixaBanco] = useState("");
  const [baixaValor, setBaixaValor] = useState("");
  const [novoBanco, setNovoBanco] = useState("");
  const [waNumber, setWaNumber] = useState("");
  const [boletosProximos, setBoletosProximos] = useState([]);
  const [showAvisoVencimento, setShowAvisoVencimento] = useState(false);

  const inputEmpresaRef = useRef(null);

  useEffect(() => {
    carregarBoletos();
    carregarBancos();
    carregarConfiguracoes();
  }, []);

  async function carregarConfiguracoes() {
    const config = await getSettings();
    if (config && config.whatsappNumber) {
      setWaNumber(config.whatsappNumber);
    }
  }

  useEffect(() => {
    focarInputEmpresa();
  }, []);

  useEffect(() => {
    focarInputEmpresa();
  }, [
    boletos,
    mesFiltro,
    anoFiltro,
    empresaFiltro,
    modalEditar,
    modalBoleto,
    modalBaixa
  ]);

  async function carregarBancos() {
    const dados = await getBancos();
    setBancos(dados || []);
  }

  async function carregarBoletos() {
    const dados = await getBoletos();
    setBoletos(dados || []);

    // Verificar boletos vencendo nos próximos 5 dias
    if (dados) {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const limite = new Date();
      limite.setDate(hoje.getDate() + 5);
      limite.setHours(23, 59, 59, 999);

      const proximos = dados.filter(b => {
        if (b.pago) return false;
        const dataVenc = converterData(b.vencimento);
        return dataVenc && dataVenc >= hoje && dataVenc <= limite;
      });

      if (proximos.length > 0) {
        // Verificar se já mostrou nesta sessão
        const jaMostrou = sessionStorage.getItem("avisoVencimentoMostrado");
        if (!jaMostrou) {
          setBoletosProximos(proximos);
          setShowAvisoVencimento(true);
          sessionStorage.setItem("avisoVencimentoMostrado", "true");
        }
      }
    }
  }



  function focarInputEmpresa() {
    setTimeout(() => {
      inputEmpresaRef.current?.focus();
    }, 0);
  }
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  function converterData(vencimento) {

    if (!vencimento) return null;

    if (typeof vencimento.toDate === "function") {
      return vencimento.toDate();
    }

    // Se for string no formato YYYY-MM-DD (comum em inputs de data), trata como data local para evitar erro de fuso horário
    if (typeof vencimento === "string" && /^\d{4}-\d{2}-\d{2}$/.test(vencimento)) {
      const [year, month, day] = vencimento.split('-').map(Number);
      return new Date(year, month - 1, day);
    }

    const data = new Date(vencimento);
    data.setHours(0, 0, 0, 0);
    return data;

  }

  const totalPago = boletos
    .filter(b => {
      if (!b.pago) return false;
      const data = converterData(b.vencimento);
      if (!data) return false;
      if (anoFiltro !== "" && data.getFullYear() !== Number(anoFiltro)) return false;
      if (mesFiltro === "") return true;
      return data.getMonth() + 1 === Number(mesFiltro);
    })
    .reduce((acc, b) => acc + Number(b.valorPago || b.valor || 0), 0);

  const totalPendente = boletos
    .filter(b => {

      if (b.pago) return false;

      const data = converterData(b.vencimento);
      if (!data) return false;

      if (anoFiltro !== "" && data.getFullYear() !== Number(anoFiltro)) return false;

      if (mesFiltro === "") return true;

      return data.getMonth() + 1 === Number(mesFiltro);

    })
    .reduce((acc, b) => acc + Number(b.valor || 0), 0);

  const totalVencido = boletos
    .filter(b => {
      if (b.pago) return false;
      const data = converterData(b.vencimento);
      if (!data || data >= hoje) return false;
      if (anoFiltro !== "" && data.getFullYear() !== Number(anoFiltro)) return false;
      if (mesFiltro === "") return true;
      return data.getMonth() + 1 === Number(mesFiltro);
    })
    .reduce((acc, b) => acc + Number(b.valor || 0), 0);



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
  // MARCAR PAGO (BAIXA)
  // ================================

  async function iniciarBaixa(boleto) {
    if (boleto.pago) {
      // Se já está pago e clica, apenas reverte o status
      await updateBoleto(boleto.id, {
        pago: false,
        dataPagamento: null,
        banco: null,
        valorPago: null,
      });
      carregarBoletos();
      return;
    }

    setBoletoBaixa(boleto);
    setBaixaData(new Date().toISOString().substring(0, 10));
    setBaixaBanco("");
    setBaixaValor(formatarReal(boleto.valor));
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
      valorPago: parseReal(baixaValor),
    });

    setModalBaixa(false);
    carregarBoletos();
  }

  function cancelarBaixa() {
    setModalBaixa(false);
    setBoletoBaixa(null);
  }

  // ================================
  // ARQUIVAR
  // ================================

  async function arquivar(boleto) {
    const confirma = window.confirm("Arquivar este boleto? Ele sairá desta lista mas continuará somando no total.");
    if (!confirma) return;

    await updateBoleto(boleto.id, { arquivado: true });
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

    const dataVenc = converterData(boleto.vencimento);
    const vencFormatado = dataVenc
      ? new Date(dataVenc.getTime() - (dataVenc.getTimezoneOffset() * 60000)).toISOString().substring(0, 10)
      : "";

    setBoletoEditando({
      ...boleto,
      valor: formatarReal(boleto.valor),
      vencimento: vencFormatado
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
  // WHATSAPP
  // ================================

  function enviarWhatsApp(boleto) {
    if (!waNumber) {
      alert("Número de WhatsApp não configurado. Vá na página de Cadastro para definir o número.");
      return;
    }

    const dataVenc = converterData(boleto.vencimento);
    const dataVencFormatada = dataVenc ? dataVenc.toLocaleDateString() : "-";
    const valorFormatado = formatarReal(boleto.valor);

    const mensagem = `Olá Angelo, lembrete do boleto a vencer:\n\n` +
      `Empresa *${boleto.empresa}*\n` +
      `*Valor:* R$ ${valorFormatado}\n` +
      `*Vencimento:* ${dataVencFormatada}\n\n` +
      `Por favor, acesse o sistema para mais detalhes.\n` +
      `https://controle-boletos-sable.vercel.app/login`;

    const url = `https://wa.me/${waNumber.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank");
  }


  // ================================
  // LISTAS SEPARADAS
  // ================================

  const pendentesEVencidos = boletosFiltrados
    .filter(b => !b.pago)
    .sort((a, b) => {
      const dA = converterData(a.vencimento);
      const dB = converterData(b.vencimento);
      if (!dA) return 1;
      if (!dB) return -1;
      return dA - dB;
    });

  const pagos = boletosFiltrados
    .filter(b => b.pago && !b.arquivado)
    .sort((a, b) => {
      const dA = converterData(a.vencimento);
      const dB = converterData(b.vencimento);
      if (!dA) return 1;
      if (!dB) return -1;
      return dB - dA;
    });

  return (

    <div className="flex">

      <Sidebar />

      <div className="flex-1 bg-gray-900 text-white min-h-screen">

        <Header />

        <div className="p-6">



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
              ref={inputEmpresaRef}
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
            <div className="max-h-[260px] overflow-y-auto pr-2 scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-600">
                    <th className="py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Empresa</th>
                    <th className="py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Valor</th>
                    <th className="py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Vencimento</th>
                    <th className="py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">NF / Fatura</th>
                    <th className="py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Status</th>
                    <th className="py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 w-px whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pendentesEVencidos.map((b) => {
                    const data = converterData(b.vencimento);
                    const isVencido = data && data < hoje;

                    return (
                      <tr key={b.id} className="border-b border-gray-700">
                        <td className="py-3">
                          <div className="max-w-[360px] overflow-x-auto whitespace-nowrap scrollbar-thin">
                            {b.empresa} <span className="text-gray-400 text-xs ml-1">- {b.descricao && !b.descricao.startsWith("Fatura NF") ? b.descricao : "-"}</span>
                          </div>
                        </td>
                        <td className="py-3">R$ {formatarReal(b.valor)}</td>
                        <td className="py-3">{data ? data.toLocaleDateString() : ""}</td>
                        <td className="py-3">
                          <div className="max-w-[100px] overflow-x-auto whitespace-nowrap scrollbar-thin">
                            {b.numeroNF || "-"}
                          </div>
                        </td>
                        <td className="py-3">
                          {isVencido ? (
                            <span className="text-red-400 font-bold">Vencido</span>
                          ) : (
                            <span className="text-yellow-400">Pendente</span>
                          )}
                        </td>
                        <td className="flex gap-2 py-3 whitespace-nowrap">
                          <button
                            onClick={() => iniciarBaixa(b)}
                            className="bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded text-xs font-medium text-white"
                            title="Dar baixa"
                          >
                            ✔
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
                          <button
                            onClick={() => enviarWhatsApp(b)}
                            className="bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded text-xs font-medium text-white"
                            title="Enviar lembrete por WhatsApp"
                          >
                            <span className="flex items-center gap-1">
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                            </span>
                          </button>
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
          </div>

          {/* TABELA PAGOS */}

          <div className="bg-gray-800 p-6 rounded-xl">
            <h2 className="text-xl font-bold mb-4 text-green-400">Histórico de Pagamentos</h2>
            <div className="max-h-[320px] overflow-y-auto pr-2 scrollbar-thin">
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
                  {pagos.map((b) => {
                    const dataVenc = converterData(b.vencimento);
                    return (
                      <tr key={b.id} className="border-b border-gray-700">
                        <td className="py-3">
                          <div className="max-w-[200px] overflow-x-auto whitespace-nowrap scrollbar-thin">
                            {b.empresa} <span className="text-gray-400 text-xs ml-1">- {b.descricao && !b.descricao.startsWith("Fatura NF") ? b.descricao : "-"}</span>
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
                            onClick={() => iniciarBaixa(b)}
                            className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1.5 rounded text-xs font-medium text-white"
                            title="Desmarcar pago"
                          >
                            ↩
                          </button>
                          <button
                            onClick={() => arquivar(b)}
                            className="bg-gray-600 hover:bg-gray-700 px-3 py-1.5 rounded text-xs font-medium text-white"
                            title="Arquivar"
                          >
                            📁
                          </button>
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

            <input
              placeholder="Linha digitável"
              className="bg-gray-700 p-2 rounded w-full mb-3 text-white"
              value={boletoEditando.linhaDigitavel || ""}
              onChange={(e) =>
                setBoletoEditando({
                  ...boletoEditando,
                  linhaDigitavel: cleanLinhaDigitavel(e.target.value)
                })
              }
            />

            {/* PDF Management Section */}
            <div className="mb-4 bg-gray-700/50 p-3 rounded border border-gray-600">
              <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
                PDF do Boleto
              </label>

              {boletoEditando.pdf ? (
                <div className="flex items-center justify-between mb-3 bg-green-900/20 p-2 rounded border border-green-700/30">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 text-xs font-bold">✓ PDF ANEXADO</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBoletoEditando({ ...boletoEditando, pdf: null })}
                    className="bg-red-600 hover:bg-red-700 text-white text-[10px] px-2 py-1 rounded transition-colors font-bold uppercase"
                  >
                    Excluir
                  </button>
                </div>
              ) : (
                <div className="mb-3 text-gray-500 text-xs italic">
                  Nenhum arquivo PDF anexado
                </div>
              )}

              <input
                type="file"
                accept="application/pdf"
                className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  if (file.size > 800 * 1024) {
                    alert("O arquivo é muito grande (máximo 800 KB)");
                    e.target.value = "";
                    return;
                  }
                  const reader = new FileReader();
                  reader.readAsDataURL(file);
                  reader.onload = () => {
                    setBoletoEditando({ ...boletoEditando, pdf: reader.result });
                  };
                }}
              />
            </div>

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

      {/* MODAL AVISO DE VENCIMENTO (PRÓXIMOS 5 DIAS) */}
      {showAvisoVencimento && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-gray-800 border border-yellow-500/30 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 p-4 flex justify-between items-center">
              <h2 className="text-gray-900 font-bold flex items-center gap-2">
                <span className="text-xl">⚠️</span> Lembrete de Vencimento (Próximos 5 Dias)
              </h2>
              <button
                onClick={() => setShowAvisoVencimento(false)}
                className="bg-black/20 hover:bg-black/40 text-gray-900 rounded-full w-8 h-8 flex items-center justify-center font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-300 text-sm mb-4">
                Existem <strong>{boletosProximos.length}</strong> boletos vencendo em breve. Por favor, programe os pagamentos:
              </p>

              <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                {boletosProximos.map(b => (
                  <div key={b.id} className="bg-gray-900/50 border border-gray-700 p-3 rounded-xl flex justify-between items-center group hover:border-yellow-500/50 transition-colors">
                    <div>
                      <div className="font-bold text-gray-100 group-hover:text-yellow-400 transition-colors">{b.empresa}</div>
                      <div className="text-xs text-gray-400">Vencimento: {converterData(b.vencimento).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-yellow-500 text-lg">R$ {formatarReal(b.valor)}</div>
                      <button
                        onClick={() => {
                          setShowAvisoVencimento(false);
                          enviarWhatsApp(b);
                        }}
                        className="text-[10px] bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white px-2 py-1 rounded-md transition-all font-bold uppercase mt-1"
                      >
                        Enviar Whats
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowAvisoVencimento(false)}
                className="w-full mt-6 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95"
              >
                Entendido
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
              Boleto Pendente
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
                  className="mt-2 bg-blue-600 px-3 py-1 rounded text-white"
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

      {/* MODAL BAIXA (PAGAMENTO) */}

      {modalBaixa && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-96">
            <h2 className="text-xl mb-4 font-bold text-green-400">Dar Baixa no Boleto</h2>

            <label className="block text-gray-400 text-sm mb-1">Data de Pagamento</label>
            <input
              type="date"
              className="bg-gray-700 p-2 rounded w-full mb-4 text-white"
              value={baixaData}
              onChange={(e) => setBaixaData(e.target.value)}
            />

            <label className="block text-gray-400 text-sm mb-1">Valor Pago (R$)</label>
            <input
              placeholder="0,00"
              className="bg-gray-700 p-2 rounded w-full mb-4 text-white"
              value={baixaValor}
              onChange={(e) => setBaixaValor(aplicarMascaraReal(e.target.value))}
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