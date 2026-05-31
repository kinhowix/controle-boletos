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
import { getNotas } from "../services/notasService";
import { getSettings } from "../services/settingsService";

import { aplicarMascaraReal, parseReal, formatarReal } from "../utils/formatCurrency";
import { cleanLinhaDigitavel } from "../utils/formatDigitavel";

export default function Dashboard() {

  const navigate = useNavigate();
  const { role, avisoVencimentoMostrado, setAvisoVencimentoMostrado } = useAuth();

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

  const [notasAtrasadas, setNotasAtrasadas] = useState([]);
  const [showAvisoNotas, setShowAvisoNotas] = useState(false);

  const inputEmpresaRef = useRef(null);

  useEffect(() => {
    carregarBoletos();
    carregarBancos();
    carregarConfiguracoes();
  }, []);

  useEffect(() => {
    if (role === "admin") {
      verificarNotasAtrasadas();
    }
  }, [role]);

  async function verificarNotasAtrasadas() {
    const avisoMostrado = sessionStorage.getItem("avisoNotasMostrado");
    if (avisoMostrado) return;

    const dados = await getNotas();
    if (!dados) return;

    const hojeData = new Date();
    hojeData.setHours(0, 0, 0, 0);

    const atrasadas = dados.filter(n => {
      if (n.usadaEmBoleto) return false;
      const dataNota = converterData(n.data);
      if (!dataNota) return false;
      
      const diffTime = Math.abs(hojeData - dataNota);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      return (hojeData > dataNota) && (diffDays > 15);
    });

    if (atrasadas.length > 0) {
      setNotasAtrasadas(atrasadas);
      setShowAvisoNotas(true);
      sessionStorage.setItem("avisoNotasMostrado", "true");
    }
  }

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
        // Mostra o aviso apenas se ainda não foi exibido na sessão atual
        if (!avisoVencimentoMostrado) {
          setBoletosProximos(proximos);
          setShowAvisoVencimento(true);
          setAvisoVencimentoMostrado(true);
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

        <div className="p-2">



          {/* RESUMO E FILTROS */}
          <div className="flex flex-col lg:flex-row gap-4 mb-2 items-stretch">

            {/* RESUMO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">

              <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-sm flex flex-col justify-center">
                <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Pago</span>
                <div className="text-green-400 text-lg font-bold truncate">
                  R$ {formatarReal(totalPago)}
                </div>
              </div>

              <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-sm flex flex-col justify-center">
                <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Pendente</span>
                <div className="text-yellow-400 text-lg font-bold truncate">
                  R$ {formatarReal(totalPendente)}
                </div>
              </div>

              <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-sm flex flex-col justify-center">
                <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Vencido</span>
                <div className="text-red-400 text-lg font-bold truncate">
                  R$ {formatarReal(totalVencido)}
                </div>
              </div>

            </div>

            {/* FILTROS */}
            <div className="bg-gray-800 p-3 rounded-lg flex flex-wrap md:flex-nowrap items-end gap-3 border border-gray-700 shadow-sm">

              <div className="flex flex-col">
                <span className="text-gray-500 text-[10px] font-bold uppercase mb-1 ml-1">Ano</span>
                <select
                  value={anoFiltro}
                  onChange={(e) => setAnoFiltro(e.target.value)}
                  className="bg-gray-700 p-1.5 rounded text-xs border border-gray-600 focus:border-blue-500 outline-none"
                >
                  <option value="">Todos</option>
                  {Array.from({ length: 15 }).map((_, i) => {
                    const year = new Date().getFullYear() - 5 + i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex flex-col">
                <span className="text-gray-500 text-[10px] font-bold uppercase mb-1 ml-1">Mês</span>
                <select
                  value={mesFiltro}
                  onChange={(e) => setMesFiltro(e.target.value)}
                  className="bg-gray-700 p-1.5 rounded text-xs border border-gray-600 focus:border-blue-500 outline-none"
                >
                  <option value="">Todos</option>
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
              </div>

              <div className="flex flex-col flex-1 min-w-[150px]">
                <span className="text-gray-500 text-[10px] font-bold uppercase mb-1 ml-1">Empresa</span>
                <input
                  ref={inputEmpresaRef}
                  placeholder="Pesquisar..."
                  value={empresaFiltro}
                  onChange={(e) => setEmpresaFiltro(e.target.value)}
                  className="bg-gray-700 p-1.5 rounded text-xs border border-gray-600 focus:border-blue-500 outline-none w-full"
                />
              </div>

            </div>

          </div>

          {/* TABELA PENDENTES */}

          <div className="bg-gray-800 p-4 rounded-xl mb-1">
            <h2 className="text-xl font-bold mb-4 text-yellow-400">Boletos Pendentes / Vencidos</h2>
            
            {/* VISTA MOBILE (CASCATA) */}
            <div className="lg:hidden space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
              {pendentesEVencidos.map((b) => {
                const data = converterData(b.vencimento);
                const isVencido = data && data < hoje;

                return (
                  <div key={b.id} className="bg-gray-900/40 p-3 rounded-lg border border-gray-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-100 truncate text-sm">{b.empresa}</div>
                        <div className="text-[10px] text-gray-500 truncate">
                          {b.descricao && !b.descricao.startsWith("Fatura NF") ? b.descricao : "-"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-yellow-400 text-sm">R$ {formatarReal(b.valor)}</div>
                        <div className="text-[10px] text-gray-400">{data ? data.toLocaleDateString() : ""}</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t border-gray-800">
                      <div className="flex flex-col">
                        {isVencido ? (
                          <span className="text-red-400 text-[10px] font-bold uppercase">Vencido</span>
                        ) : (
                          <span className="text-yellow-400 text-[10px] font-bold uppercase">Pendente</span>
                        )}
                        <span className="text-gray-500 text-[9px]">NF: {b.numeroNF || "-"}</span>
                      </div>
                      
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        <button
                          onClick={() => iniciarBaixa(b)}
                          className="bg-green-600 hover:bg-green-700 w-8 h-8 flex items-center justify-center rounded text-xs font-medium text-white shadow-sm"
                          title="Dar baixa"
                        >
                          ✔
                        </button>
                        
                        {role === "admin" && (
                          <>
                            <button
                              onClick={() => abrirEditar(b)}
                              className="bg-blue-600 hover:bg-blue-700 w-8 h-8 flex items-center justify-center rounded text-xs font-medium text-white shadow-sm"
                              title="Editar"
                            >
                              ✏
                            </button>
                            <button
                              onClick={() => excluir(b)}
                              className="bg-red-600 hover:bg-red-700 w-8 h-8 flex items-center justify-center rounded text-xs font-medium text-white shadow-sm"
                              title="Excluir"
                            >
                              🗑
                            </button>
                          </>
                        )}
                        <button onClick={() => abrirBoleto(b)} className="bg-purple-600 hover:bg-purple-700 w-8 h-8 flex items-center justify-center rounded text-xs font-medium text-white shadow-sm" title="Visualizar">📄</button>
                        
                        {role === "admin" && (
                          <button
                            onClick={() => enviarWhatsApp(b)}
                            className="bg-green-500 hover:bg-green-600 w-8 h-8 flex items-center justify-center rounded text-xs font-medium text-white shadow-sm"
                            title="WhatsApp"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {pendentesEVencidos.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-sm">Nenhum boleto pendente.</div>
              )}
            </div>

            {/* VISTA DESKTOP (TABELA) */}
            <div className="hidden lg:block max-h-[200px] overflow-y-auto pr-2 scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-800 z-10 shadow-sm">
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
                        <td className="py-1.5">
                          <div className="max-w-[360px] overflow-x-auto whitespace-nowrap scrollbar-thin">
                            {b.empresa} <span className="text-gray-400 text-xs ml-1">- {b.descricao && !b.descricao.startsWith("Fatura NF") ? b.descricao : "-"}</span>
                          </div>
                        </td>
                        <td className="py-1.5">R$ {formatarReal(b.valor)}</td>
                        <td className="py-1.5">{data ? data.toLocaleDateString() : ""}</td>
                        <td className="py-1.5">
                          <div className="max-w-[100px] overflow-x-auto whitespace-nowrap scrollbar-thin">
                            {b.numeroNF || "-"}
                          </div>
                        </td>
                        <td className="py-1.5">
                          {isVencido ? (
                            <span className="text-red-400 font-bold">Vencido</span>
                          ) : (
                            <span className="text-yellow-400">Pendente</span>
                          )}
                        </td>
                        <td className="flex gap-2 py-2 whitespace-nowrap">
                          <button
                            onClick={() => iniciarBaixa(b)}
                            className="bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded text-xs font-medium text-white shadow-sm"
                            title="Dar baixa"
                          >
                            ✔
                          </button>

                          {role === "admin" && (
                            <>
                              <button
                                onClick={() => abrirEditar(b)}
                                className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-xs font-medium text-white shadow-sm"
                                title="Editar"
                              >
                                ✏
                              </button>
                              <button
                                onClick={() => excluir(b)}
                                className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded text-xs font-medium text-white shadow-sm"
                                title="Excluir"
                              >
                                🗑
                              </button>
                            </>
                          )}

                          <button onClick={() => abrirBoleto(b)} className="bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded text-xs font-medium text-white shadow-sm" title="Visualizar">📄</button>

                          {role === "admin" && (
                            <button
                              onClick={() => enviarWhatsApp(b)}
                              className="bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded text-xs font-medium text-white shadow-sm flex items-center justify-center"
                              title="WhatsApp"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                              </svg>
                            </button>
                          )}
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

            {/* VISTA MOBILE (CASCATA) */}
            <div className="lg:hidden space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
              {pagos.map((b) => {
                const dataVenc = converterData(b.vencimento);
                return (
                  <div key={b.id} className="bg-gray-900/40 p-3 rounded-lg border border-gray-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-100 truncate text-sm">{b.empresa}</div>
                        <div className="text-[10px] text-gray-500 truncate">
                          {b.descricao && !b.descricao.startsWith("Fatura NF") ? b.descricao : "-"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-400 text-sm">R$ {formatarReal(b.valorPago || b.valor)}</div>
                        <div className="text-[10px] text-gray-400">Pago em: {b.dataPagamento ? new Date(b.dataPagamento + "T12:00:00").toLocaleDateString() : "-"}</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-gray-800">
                      <div className="flex flex-col">
                        <span className="text-gray-400 text-[10px]">Banco: {b.banco || "-"}</span>
                        <span className="text-gray-500 text-[9px]">Venc: {dataVenc ? dataVenc.toLocaleDateString() : ""} | NF: {b.numeroNF || "-"}</span>
                      </div>

                      <div className="flex gap-1.5 flex-wrap justify-end">
                        <button
                          onClick={() => iniciarBaixa(b)}
                          className="bg-yellow-600 hover:bg-yellow-700 w-8 h-8 flex items-center justify-center rounded text-xs font-medium text-white"
                          title="Desmarcar pago"
                        >
                          ↩
                        </button>
                        <button
                          onClick={() => arquivar(b)}
                          className="bg-gray-600 hover:bg-gray-700 w-8 h-8 flex items-center justify-center rounded text-xs font-medium text-white"
                          title="Arquivar"
                        >
                          📁
                        </button>
                        <button onClick={() => abrirBoleto(b)} className="bg-purple-600 hover:bg-purple-700 w-8 h-8 flex items-center justify-center rounded text-xs font-medium text-white" title="Visualizar">📄</button>
                        
                        {role === "admin" && (
                          <button
                            onClick={() => excluir(b)}
                            className="bg-red-600 hover:bg-red-700 w-8 h-8 flex items-center justify-center rounded text-xs font-medium text-white"
                            title="Excluir"
                          >
                            🗑
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {pagos.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-sm">Nenhum boleto pago.</div>
              )}
            </div>

            {/* VISTA DESKTOP (TABELA) */}
            <div className="hidden lg:block max-h-[200px] overflow-y-auto pr-2 scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-800 z-10 shadow-sm">
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
                        <td className="py-1.5">
                          <div className="max-w-[200px] overflow-x-auto whitespace-nowrap scrollbar-thin">
                            {b.empresa} <span className="text-gray-400 text-xs ml-1">- {b.descricao && !b.descricao.startsWith("Fatura NF") ? b.descricao : "-"}</span>
                          </div>
                        </td>
                        <td className="py-1.5">R$ {formatarReal(b.valorPago || b.valor)}</td>
                        <td className="py-1.5">
                          <div className="max-w-[100px] overflow-x-auto whitespace-nowrap scrollbar-thin">
                            {b.numeroNF || "-"}
                          </div>
                        </td>
                        <td className="py-1.5">{dataVenc ? dataVenc.toLocaleDateString() : ""}</td>
                        <td className="py-1.5">{b.dataPagamento ? new Date(b.dataPagamento + "T12:00:00").toLocaleDateString() : "-"}</td>
                        <td className="py-1.5">{b.banco || "-"}</td>
                        <td className="flex gap-2 py-1.5 whitespace-nowrap">
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
                          
                          {role === "admin" && (
                            <button
                              onClick={() => excluir(b)}
                              className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded text-xs font-medium text-white"
                              title="Excluir"
                            >
                              🗑
                            </button>
                          )}
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
              placeholder="Linha digitável do PIX"
              className="bg-gray-700 p-2 rounded w-full mb-3 text-white border-l-4 border-blue-500"
              value={boletoEditando.linhaDigitavelPix || ""}
              onChange={(e) =>
                setBoletoEditando({
                  ...boletoEditando,
                  linhaDigitavelPix: e.target.value
                })
              }
            />

            <input
              placeholder="Linha digitável"
              className="bg-gray-700 p-2 rounded w-full mb-3 text-white border-l-4 border-gray-500"
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-3 md:p-4 backdrop-blur-sm">
          <div className="bg-gray-800 border border-yellow-500/30 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 p-3 md:p-4 flex justify-between items-center">
              <h2 className="text-gray-900 font-bold flex items-center gap-2 text-sm md:text-base">
                <span className="text-lg md:text-xl">⚠️</span> Vencimento (Próximos 5 Dias)
              </h2>
              <button
                onClick={() => setShowAvisoVencimento(false)}
                className="bg-black/20 hover:bg-black/40 text-gray-900 rounded-full w-7 h-7 md:w-8 md:h-8 flex items-center justify-center font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-4 md:p-6">
              <p className="text-gray-300 text-[11px] md:text-sm mb-4">
                Existem <strong>{boletosProximos.length}</strong> boletos vencendo em breve. Por favor, programe os pagamentos:
              </p>

              <div className="max-h-[250px] md:max-h-[300px] overflow-y-auto space-y-2 md:space-y-3 pr-2 scrollbar-thin">
                {boletosProximos.map(b => (
                  <div key={b.id} className="bg-gray-900/50 border border-gray-700 p-2 md:p-3 rounded-xl flex justify-between items-center group hover:border-yellow-500/50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-gray-100 group-hover:text-yellow-400 transition-colors truncate text-xs md:text-sm">{b.empresa}</div>
                      <div className="text-[10px] text-gray-400">Venc: {converterData(b.vencimento).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right ml-2">
                      <div className="font-bold text-yellow-500 text-sm md:text-lg">R$ {formatarReal(b.valor)}</div>
                      <button
                        onClick={() => {
                          setShowAvisoVencimento(false);
                          enviarWhatsApp(b);
                        }}
                        className="text-[9px] md:text-[10px] bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white px-2 py-1 rounded-md transition-all font-bold uppercase mt-1"
                      >
                        Whats
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowAvisoVencimento(false)}
                className="w-full mt-4 md:mt-6 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 md:py-3 rounded-xl transition-all shadow-lg active:scale-95 text-sm md:text-base"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AVISO NOTAS ATRASADAS */}
      {showAvisoNotas && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-gray-800 p-6 md:p-8 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-700 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 border border-red-500/50">
                <span className="text-3xl">⚠️</span>
              </div>
              <h2 className="text-2xl font-bold text-red-400 mb-2">
                Atenção: Notas Atrasadas
              </h2>
              <p className="text-gray-300 text-sm md:text-base mb-6 px-4">
                Existem notas recebidas há <strong>mais de 15 dias</strong> que ainda não foram geradas como boletos.
              </p>

              <div className="w-full max-h-[250px] md:max-h-[300px] overflow-y-auto space-y-2 pr-2 scrollbar-thin text-left mb-6">
                {notasAtrasadas.map(n => {
                  const dataNota = converterData(n.data);
                  return (
                    <div key={n.id} className="bg-gray-900/50 border border-gray-700 p-3 rounded-xl flex justify-between items-center">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-gray-100 truncate text-sm">{n.empresa}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">NF: {n.numeroNF || "-"} | Data: {dataNota ? dataNota.toLocaleDateString() : ""}</div>
                      </div>
                      <div className="text-right ml-2 font-bold text-yellow-500">
                        R$ {formatarReal(n.valor)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex w-full gap-3">
                <button
                  onClick={() => setShowAvisoNotas(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg text-sm"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    setShowAvisoNotas(false);
                    navigate("/notas");
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg text-sm"
                >
                  Ver Notas
                </button>
              </div>
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

            {boletoVisualizando?.linhaDigitavelPix && (
              <div className="mb-4">
                <div className="text-sm p-1 rounded font-semibold text-blue-400 uppercase tracking-widest">
                  PIX Copia e Cola / Chave
                </div>
                <div className="bg-gray-700 p-2 rounded break-all text-white font-mono text-sm border border-blue-500/30">
                  {boletoVisualizando.linhaDigitavelPix}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(boletoVisualizando.linhaDigitavelPix)
                  }}
                  className="mt-2 bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-white font-bold text-sm shadow-lg"
                >
                  Copiar PIX
                </button>
              </div>
            )}

            {boletoVisualizando?.linhaDigitavel && (
              <div className="mb-4">
                <div className="text-sm p-1 rounded font-semibold text-gray-400 uppercase tracking-widest">
                  Linha digitável (Boleto)
                </div>
                <div className="bg-gray-700 p-2 rounded break-all text-white font-mono text-sm border border-gray-600">
                  {cleanLinhaDigitavel(boletoVisualizando.linhaDigitavel)}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      cleanLinhaDigitavel(boletoVisualizando.linhaDigitavel)
                    )
                  }}
                  className="mt-2 bg-gray-600 hover:bg-gray-500 px-3 py-1.5 rounded text-white font-bold text-sm"
                >
                  Copiar Linha Digitável
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