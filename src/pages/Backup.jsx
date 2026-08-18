import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getBoletos } from "../services/boletosService";
import { getSettings } from "../services/settingsService";
import { exportarExcel, obterEstatisticas } from "../utils/exportarExcel";
import { formatarReal } from "../utils/formatCurrency";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import { getBoletosFixos, addBoletoFixo, updateBoletoFixo, deleteBoletoFixo } from "../services/boletosFixosService";
import { getEmpresas } from "../services/empresasService";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril",
  "Maio", "Junho", "Julho", "Agosto",
  "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function Backup() {
  const { role } = useAuth();

  // Dados
  const [boletos, setBoletos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  // Boletos Fixos
  const [tabAtiva, setTabAtiva] = useState("backup"); // "backup" ou "boletosFixos"
  const [boletosFixos, setBoletosFixos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [boletosFixosFaltantes, setBoletosFixosFaltantes] = useState([]);
  const [showAvisoBoletosFixos, setShowAvisoBoletosFixos] = useState(false);

  // Form de Boleto Fixo
  const [nomeFixo, setNomeFixo] = useState("");
  const [empresaFixoId, setEmpresaFixoId] = useState("");
  const [descricaoFixo, setDescricaoFixo] = useState("");
  const [editandoFixoId, setEditandoFixoId] = useState(null);
  const [salvandoFixo, setSalvandoFixo] = useState(false);

  // Filtros de período (para aba "A Vencer")
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;

  const [anoInicio, setAnoInicio] = useState(anoAtual);
  const [mesInicio, setMesInicio] = useState(mesAtual);
  const [anoFim, setAnoFim] = useState(anoAtual + 1);
  const [mesFim, setMesFim] = useState(mesAtual);

  // Anos disponíveis no seletor
  const anos = Array.from({ length: 10 }, (_, i) => anoAtual - 2 + i);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setCarregando(true);
    try {
      const [dadosBoletos, dadosBoletosFixos, dadosEmpresas] = await Promise.all([
        getBoletos(),
        getBoletosFixos(),
        getEmpresas(),
      ]);
      const todosBoletos = dadosBoletos || [];
      const todosFixos = dadosBoletosFixos || [];
      setBoletos(todosBoletos);
      setBoletosFixos(todosFixos);
      setEmpresas(dadosEmpresas || []);
      
      // Executa verificação de boletos fixos faltantes
      verificarBoletosFixosFaltantes(todosFixos, todosBoletos);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setCarregando(false);
    }
  }

  function verificarBoletosFixosFaltantes(templates, todosBoletos) {
    const avisoMostrado = sessionStorage.getItem("avisoBoletosFixosMostrado");
    if (avisoMostrado) return;

    if (!templates || templates.length === 0) return;

    const hoje = new Date();
    const mesAtualIndex = hoje.getMonth();
    const anoAtualVal = hoje.getFullYear();

    const faltantes = templates.filter(fixo => {
      const lancado = todosBoletos.some(b => {
        const venc = converterDataLocal(b.vencimento);
        if (!venc) return false;

        const mesmoMes = venc.getMonth() === mesAtualIndex && venc.getFullYear() === anoAtualVal;
        if (!mesmoMes) return false;

        const mesmaEmpresa = b.empresaId === fixo.empresaId;
        if (!mesmaEmpresa) return false;

        if (fixo.descricao && fixo.descricao.trim() !== "") {
          const descBoleto = (b.descricao || "").toLowerCase();
          const descFixo = fixo.descricao.toLowerCase().trim();
          return descBoleto.includes(descFixo);
        }

        return true;
      });

      return !lancado;
    });

    if (faltantes.length > 0) {
      setBoletosFixosFaltantes(faltantes);
      setShowAvisoBoletosFixos(true);
      sessionStorage.setItem("avisoBoletosFixosMostrado", "true");
    }
  }

  async function salvarBoletoFixo(e) {
    e.preventDefault();
    if (!nomeFixo.trim()) {
      alert("Por favor, digite o nome do boleto fixo (ex: Aluguel).");
      return;
    }
    if (!empresaFixoId) {
      alert("Por favor, selecione a empresa.");
      return;
    }

    setSalvandoFixo(true);

    const emp = empresas.find(e => e.id === empresaFixoId);
    const empresaNome = emp ? (emp.fantasia || emp.razao) : "";

    const dados = {
      nome: nomeFixo.trim(),
      empresaId: empresaFixoId,
      empresaNome,
      descricao: descricaoFixo.trim()
    };

    try {
      if (editandoFixoId) {
        await updateBoletoFixo(editandoFixoId, dados);
        alert("Boleto fixo atualizado com sucesso!");
      } else {
        await addBoletoFixo(dados);
        alert("Boleto fixo cadastrado com sucesso!");
      }

      // Limpar formulário
      setNomeFixo("");
      setEmpresaFixoId("");
      setDescricaoFixo("");
      setEditandoFixoId(null);

      // Recarregar
      const novosFixos = await getBoletosFixos();
      setBoletosFixos(novosFixos || []);
      
      // Re-executar a verificação
      const hoje = new Date();
      const mesAtualIndex = hoje.getMonth();
      const anoAtualVal = hoje.getFullYear();

      const faltantes = (novosFixos || []).filter(fixo => {
        const lancado = boletos.some(b => {
          const venc = converterDataLocal(b.vencimento);
          if (!venc) return false;

          const mesmoMes = venc.getMonth() === mesAtualIndex && venc.getFullYear() === anoAtualVal;
          if (!mesmoMes) return false;

          const mesmaEmpresa = b.empresaId === fixo.empresaId;
          if (!mesmaEmpresa) return false;

          if (fixo.descricao && fixo.descricao.trim() !== "") {
            const descBoleto = (b.descricao || "").toLowerCase();
            const descFixo = fixo.descricao.toLowerCase().trim();
            return descBoleto.includes(descFixo);
          }

          return true;
        });

        return !lancado;
      });
      setBoletosFixosFaltantes(faltantes);

    } catch (err) {
      console.error(err);
      alert("Erro ao salvar boleto fixo.");
    } finally {
      setSalvandoFixo(false);
    }
  }

  function iniciarEdicaoFixo(fixo) {
    setEditandoFixoId(fixo.id);
    setNomeFixo(fixo.nome);
    setEmpresaFixoId(fixo.empresaId);
    setDescricaoFixo(fixo.descricao || "");
  }

  function cancelarEdicaoFixo() {
    setEditandoFixoId(null);
    setNomeFixo("");
    setEmpresaFixoId("");
    setDescricaoFixo("");
  }

  async function handleExcluirFixo(id) {
    if (!window.confirm("Deseja realmente excluir este boleto fixo? Ele deixará de ser monitorado.")) return;

    try {
      await deleteBoletoFixo(id);
      
      // Recarregar
      const novosFixos = await getBoletosFixos();
      setBoletosFixos(novosFixos || []);

      // Re-executar verificação
      const hoje = new Date();
      const mesAtualIndex = hoje.getMonth();
      const anoAtualVal = hoje.getFullYear();

      const faltantes = (novosFixos || []).filter(fixo => {
        const lancado = boletos.some(b => {
          const venc = converterDataLocal(b.vencimento);
          if (!venc) return false;

          const mesmoMes = venc.getMonth() === mesAtualIndex && venc.getFullYear() === anoAtualVal;
          if (!mesmoMes) return false;

          const mesmaEmpresa = b.empresaId === fixo.empresaId;
          if (!mesmaEmpresa) return false;

          if (fixo.descricao && fixo.descricao.trim() !== "") {
            const descBoleto = (b.descricao || "").toLowerCase();
            const descFixo = fixo.descricao.toLowerCase().trim();
            return descBoleto.includes(descFixo);
          }

          return true;
        });

        return !lancado;
      });
      setBoletosFixosFaltantes(faltantes);
      
      alert("Boleto fixo removido!");
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir boleto fixo.");
    }
  }

  const statusFixoNoMes = (fixo) => {
    const hoje = new Date();
    const mesAtualIndex = hoje.getMonth();
    const anoAtualVal = hoje.getFullYear();

    const boletoCorrespondente = boletos.find(b => {
      const venc = converterDataLocal(b.vencimento);
      if (!venc) return false;

      const mesmoMes = venc.getMonth() === mesAtualIndex && venc.getFullYear() === anoAtualVal;
      if (!mesmoMes) return false;

      const mesmaEmpresa = b.empresaId === fixo.empresaId;
      if (!mesmaEmpresa) return false;

      if (fixo.descricao && fixo.descricao.trim() !== "") {
        const descBoleto = (b.descricao || "").toLowerCase();
        const descFixo = fixo.descricao.toLowerCase().trim();
        return descBoleto.includes(descFixo);
      }

      return true;
    });

    return boletoCorrespondente ? { lancado: true, boleto: boletoCorrespondente } : { lancado: false };
  };

  function calcularPeriodo() {
    const inicio = new Date(anoInicio, mesInicio - 1, 1);
    const fim = new Date(anoFim, mesFim - 1 + 1, 0); // último dia do mês fim
    return { inicio, fim };
  }

  const stats = boletos.length > 0
    ? obterEstatisticas(boletos, calcularPeriodo().inicio, calcularPeriodo().fim)
    : null;

  async function gerarExcel() {
    setGerando(true);
    setSucesso(false);
    try {
      const { inicio, fim } = calcularPeriodo();
      exportarExcel(boletos, inicio, fim);
      setSucesso(true);
      setTimeout(() => setSucesso(false), 4000);
    } catch (err) {
      console.error("Erro ao gerar Excel:", err);
      alert("Erro ao gerar o arquivo Excel. Tente novamente.");
    } finally {
      setGerando(false);
    }
  }

  // ============================================================
  // TELA PRINCIPAL DE BACKUP
  // ============================================================
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-gray-900 text-white min-h-screen">
        <Header />

        <div className="p-6 max-w-5xl mx-auto">

          {/* Cabeçalho */}
          <div className="flex items-center gap-4 mb-8">
            <div className="text-4xl">⚙️</div>
            <div>
              <h1 className="text-3xl font-bold text-emerald-400">Configurações Master</h1>
              <p className="text-gray-400 text-sm mt-0.5">
                Backup do sistema e gerenciamento de boletos fixos mensais
              </p>
            </div>
          </div>

          {/* Navegação por Abas */}
          <div className="flex gap-4 border-b border-gray-800 mb-8 pb-px">
            <button
              onClick={() => setTabAtiva("backup")}
              className={`py-3 px-1 font-semibold text-sm border-b-2 transition-all ${
                tabAtiva === "backup"
                  ? "border-emerald-500 text-emerald-400 font-bold"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              📊 Backup & Estatísticas
            </button>
            <button
              onClick={() => setTabAtiva("boletosFixos")}
              className={`py-3 px-1 font-semibold text-sm border-b-2 transition-all ${
                tabAtiva === "boletosFixos"
                  ? "border-emerald-500 text-emerald-400 font-bold"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              📋 Gerenciar Boletos Fixos
            </button>
          </div>

          {carregando ? (
            <div className="flex items-center justify-center h-48 text-gray-400">
              <svg className="animate-spin h-8 w-8 mr-3 text-emerald-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Carregando dados...
            </div>
          ) : tabAtiva === "backup" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* ============ PAINEL ESQUERDO: FILTROS ============ */}
              <div className="lg:col-span-1 space-y-5">

                {/* Período - Boletos A Vencer */}
                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 shadow-lg">
                  <h2 className="font-bold text-yellow-400 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                    📅 Período — Boletos a Vencer
                  </h2>
                  <p className="text-gray-500 text-xs mb-4">
                    Filtra os boletos pendentes/vencidos que serão incluídos na Aba "A Vencer" do Excel.
                    Os arquivados são sempre exportados completos.
                  </p>

                  {/* Início */}
                  <div className="mb-4">
                    <label className="block text-xs text-gray-400 uppercase mb-1.5">De (Início)</label>
                    <div className="flex gap-2">
                      <select
                        value={mesInicio}
                        onChange={(e) => setMesInicio(Number(e.target.value))}
                        className="flex-1 bg-gray-700 border border-gray-600 p-2 rounded-lg text-sm
                          focus:outline-none focus:border-emerald-500"
                      >
                        {MESES.map((m, i) => (
                          <option key={i} value={i + 1}>{m}</option>
                        ))}
                      </select>
                      <select
                        value={anoInicio}
                        onChange={(e) => setAnoInicio(Number(e.target.value))}
                        className="bg-gray-700 border border-gray-600 p-2 rounded-lg text-sm
                          focus:outline-none focus:border-emerald-500 w-24"
                      >
                        {anos.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Fim */}
                  <div>
                    <label className="block text-xs text-gray-400 uppercase mb-1.5">Até (Fim)</label>
                    <div className="flex gap-2">
                      <select
                        value={mesFim}
                        onChange={(e) => setMesFim(Number(e.target.value))}
                        className="flex-1 bg-gray-700 border border-gray-600 p-2 rounded-lg text-sm
                          focus:outline-none focus:border-emerald-500"
                      >
                        {MESES.map((m, i) => (
                          <option key={i} value={i + 1}>{m}</option>
                        ))}
                      </select>
                      <select
                        value={anoFim}
                        onChange={(e) => setAnoFim(Number(e.target.value))}
                        className="bg-gray-700 border border-gray-600 p-2 rounded-lg text-sm
                          focus:outline-none focus:border-emerald-500 w-24"
                      >
                        {anos.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Botão Gerar */}
                <button
                  id="btn-gerar-excel"
                  onClick={gerarExcel}
                  disabled={gerando}
                  className={`w-full py-4 rounded-xl font-bold text-white text-base transition-all shadow-xl
                    flex items-center justify-center gap-3 ${
                      gerando
                        ? "bg-gray-600 cursor-not-allowed opacity-60"
                        : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transform hover:-translate-y-1 active:translate-y-0 shadow-emerald-900/40"
                    }`}
                >
                  {gerando ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Gerando...
                    </>
                  ) : (
                    <>
                      📥 Gerar Excel (.xlsx)
                    </>
                  )}
                </button>

                {/* Sucesso */}
                {sucesso && (
                  <div className="bg-emerald-700/20 border border-emerald-600/50 rounded-xl p-4 text-center
                    animate-pulse">
                    <div className="text-2xl mb-1">✅</div>
                    <p className="text-emerald-400 font-semibold text-sm">
                      Arquivo gerado com sucesso!
                    </p>
                    <p className="text-emerald-600 text-xs mt-0.5">
                      Verifique sua pasta de downloads
                    </p>
                  </div>
                )}

                {/* Info */}
                <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4 text-xs text-blue-400 space-y-1">
                  <p className="font-semibold">📋 O arquivo conterá:</p>
                  <p>• <span className="text-yellow-400">Aba 1 — "A Vencer":</span> pendentes e vencidos no período</p>
                  <p>• <span className="text-blue-300">Aba 2 — "Arquivados":</span> histórico completo</p>
                  <p>• Totais por aba</p>
                  <p>• Formatação com cores</p>
                </div>
              </div>

              {/* ============ PAINEL DIREITO: PRÉVIA ============ */}
              <div className="lg:col-span-2 space-y-5">

                {/* Cards de resumo */}
                {stats && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-400">{stats.totalAVencer}</div>
                        <div className="text-xs text-gray-400 mt-1 uppercase tracking-wide">Boletos a Vencer</div>
                        <div className="text-xs text-yellow-600 mt-0.5">R$ {formatarReal(stats.valorAVencer)}</div>
                      </div>
                      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-red-400">{stats.totalVencidos}</div>
                        <div className="text-xs text-gray-400 mt-1 uppercase tracking-wide">Vencidos (no período)</div>
                      </div>
                      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center col-span-2 md:col-span-1">
                        <div className="text-2xl font-bold text-blue-400">{stats.totalArquivados}</div>
                        <div className="text-xs text-gray-400 mt-1 uppercase tracking-wide">Arquivados</div>
                        <div className="text-xs text-blue-600 mt-0.5">R$ {formatarReal(stats.valorArquivados)}</div>
                      </div>
                    </div>

                    {/* Prévia — Boletos a vencer */}
                    <PreviewTabela
                      titulo="📋 Prévia — A Vencer"
                      cor="yellow"
                      boletos={boletos}
                      filtro={(b) => {
                        if (b.pago || b.arquivado) return false;
                        const { inicio, fmt } = { inicio: calcularPeriodo().inicio, fmt: calcularPeriodo().fim };
                        const d = converterDataLocal(b.vencimento);
                        if (!d) return false;
                        const fimDia = new Date(fmt);
                        fimDia.setHours(23, 59, 59, 999);
                        return d >= inicio && d <= fimDia;
                      }}
                      colunas={["Empresa", "Valor", "Vencimento", "NF", "Status"]}
                      renderLinha={(b) => {
                        const hoje = new Date(); hoje.setHours(0,0,0,0);
                        const d = converterDataLocal(b.vencimento);
                        const vencido = d && d < hoje;
                        return [
                          b.empresa || "-",
                          `R$ ${formatarReal(b.valor)}`,
                          d ? d.toLocaleDateString("pt-BR") : "-",
                          b.numeroNF || "-",
                          <span className={vencido ? "text-red-400 font-bold" : "text-yellow-400"}>
                            {vencido ? "Vencido" : "Pendente"}
                          </span>,
                        ];
                      }}
                    />

                    {/* Prévia — Arquivados */}
                    <PreviewTabela
                      titulo="📁 Prévia — Arquivados"
                      cor="blue"
                      boletos={boletos}
                      filtro={(b) => b.arquivado}
                      colunas={["Empresa", "Valor Pago", "Vencimento", "Data Pago", "Banco"]}
                      renderLinha={(b) => {
                        const d = converterDataLocal(b.vencimento);
                        const dp = b.dataPagamento
                          ? new Date(b.dataPagamento + "T12:00:00").toLocaleDateString("pt-BR")
                          : "-";
                        return [
                          b.empresa || "-",
                          `R$ ${formatarReal(b.valorPago || b.valor)}`,
                          d ? d.toLocaleDateString("pt-BR") : "-",
                          dp,
                          b.banco || "-",
                        ];
                      }}
                    />
                  </>
                )}

                {boletos.length === 0 && !carregando && (
                  <div className="bg-gray-800 border border-gray-700 rounded-2xl p-10 text-center text-gray-500">
                    Nenhum boleto encontrado no sistema.
                  </div>
                )}
              </div>
            </div>
          ) : (
            // ==================== TELA DE GERENCIAMENTO DE BOLETOS FIXOS ====================
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ============ PAINEL ESQUERDO: CADASTRO ============ */}
              <div className="lg:col-span-1 font-sans">
                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 shadow-lg">
                  <h2 className="font-bold text-yellow-400 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                    {editandoFixoId ? "✏️ Editar Boleto Fixo" : "➕ Novo Boleto Fixo"}
                  </h2>
                  <p className="text-gray-500 text-xs mb-5">
                    Cadastre os boletos que vencem todo mês para monitorar se foram lançados.
                  </p>

                  <form onSubmit={salvarBoletoFixo} className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-400 uppercase mb-1.5 font-semibold">Nome do Aviso (ex: Aluguel)</label>
                      <input
                        type="text"
                        value={nomeFixo}
                        onChange={(e) => setNomeFixo(e.target.value)}
                        placeholder="Ex: Aluguel, Plano de Saúde, CDL"
                        className="w-full bg-gray-700 border border-gray-600 p-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 placeholder-gray-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 uppercase mb-1.5 font-semibold">Empresa Associada</label>
                      <select
                        value={empresaFixoId}
                        onChange={(e) => setEmpresaFixoId(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 p-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                        required
                      >
                        <option value="">Selecione uma empresa...</option>
                        {empresas.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.fantasia || emp.razao}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 uppercase mb-1.5 font-semibold">Filtro de Descrição (Opcional)</label>
                      <input
                        type="text"
                        value={descricaoFixo}
                        onChange={(e) => setDescricaoFixo(e.target.value)}
                        placeholder="Palavra-chave na descrição do boleto"
                        className="w-full bg-gray-700 border border-gray-600 p-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 placeholder-gray-500"
                      />
                      <p className="text-[10px] text-gray-500 mt-1">
                        Se vazio, qualquer lançamento para esta empresa no mês conta. Se preenchido, filtra pela descrição do boleto.
                      </p>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={salvandoFixo}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition shadow-lg active:scale-95 disabled:opacity-50"
                      >
                        {salvandoFixo ? "Salvando..." : editandoFixoId ? "Salvar" : "Cadastrar"}
                      </button>
                      {editandoFixoId && (
                        <button
                          type="button"
                          onClick={cancelarEdicaoFixo}
                          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              {/* ============ PAINEL DIREITO: LISTAGEM ============ */}
              <div className="lg:col-span-2 space-y-5">
                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 shadow-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-yellow-400 flex items-center gap-2 text-sm uppercase tracking-wider">
                      📋 Boletos Fixos Monitorados
                    </h2>
                    <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full text-xs font-bold border border-emerald-500/20">
                      {boletosFixos.length} total
                    </span>
                  </div>

                  {boletosFixos.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 italic text-sm">
                      Nenhum boleto fixo cadastrado para monitoramento.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-900/50">
                          <tr>
                            <th className="px-4 py-3 text-left text-gray-400 uppercase tracking-wide font-semibold">Nome do Aviso</th>
                            <th className="px-4 py-3 text-left text-gray-400 uppercase tracking-wide font-semibold">Empresa</th>
                            <th className="px-4 py-3 text-left text-gray-400 uppercase tracking-wide font-semibold">Filtro Descrição</th>
                            <th className="px-4 py-3 text-left text-gray-400 uppercase tracking-wide font-semibold text-center">Status este Mês</th>
                            <th className="px-4 py-3 text-center text-gray-400 uppercase tracking-wide font-semibold">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/40">
                          {boletosFixos.map((fixo) => {
                            const status = statusFixoNoMes(fixo);
                            return (
                              <tr key={fixo.id} className="hover:bg-gray-700/20 transition-colors">
                                <td className="px-4 py-3 font-semibold text-gray-200">{fixo.nome}</td>
                                <td className="px-4 py-3 text-gray-300">{fixo.empresaNome}</td>
                                <td className="px-4 py-3 text-gray-400 italic">{fixo.descricao || "Qualquer"}</td>
                                <td className="px-4 py-3 text-center">
                                  {status.lancado ? (
                                    <div className="inline-flex flex-col items-center">
                                      <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                        Lançado
                                      </span>
                                      <span className="text-[9px] text-gray-500 mt-0.5">
                                        R$ {formatarReal(status.boleto.valor)}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                      Pendente
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex gap-2 justify-center">
                                    <button
                                      onClick={() => iniciarEdicaoFixo(fixo)}
                                      className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                                      title="Editar"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      onClick={() => handleExcluirFixo(fixo.id)}
                                      className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                      title="Excluir"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MODAL AVISO BOLETOS FIXOS FALTANTES */}
          {showAvisoBoletosFixos && boletosFixosFaltantes.length > 0 && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-3 md:p-4 backdrop-blur-sm">
              <div className="bg-gray-800 border border-red-500/30 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="bg-gradient-to-r from-red-600 to-red-500 p-3 md:p-4 flex justify-between items-center">
                  <h2 className="text-white font-bold flex items-center gap-2 text-sm md:text-base">
                    <span className="text-lg md:text-xl">🚨</span> Boletos Fixos Faltantes no Mês
                  </h2>
                  <button
                    onClick={() => setShowAvisoBoletosFixos(false)}
                    className="bg-black/20 hover:bg-black/40 text-white rounded-full w-7 h-7 md:w-8 md:h-8 flex items-center justify-center font-bold transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-4 md:p-6">
                  <p className="text-gray-300 text-xs md:text-sm mb-4">
                    Os seguintes boletos fixos cadastrados ainda não foram lançados no mês corrente:
                  </p>

                  <div className="max-h-[250px] md:max-h-[300px] overflow-y-auto space-y-2 md:space-y-3 pr-2 scrollbar-thin">
                    {boletosFixosFaltantes.map(fixo => (
                      <div key={fixo.id} className="bg-gray-900/50 border border-gray-700 p-3 rounded-xl flex justify-between items-center group hover:border-red-500/50 transition-colors">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-gray-100 group-hover:text-red-400 transition-colors truncate text-xs md:text-sm">{fixo.nome}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">Empresa: {fixo.empresaNome}</div>
                          {fixo.descricao && (
                            <div className="text-[9px] text-gray-500 mt-0.5">Busca por: "{fixo.descricao}"</div>
                          )}
                        </div>
                        <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse">
                          Pendente
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowAvisoBoletosFixos(false)}
                    className="w-full mt-4 md:mt-6 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 md:py-3 rounded-xl transition-all shadow-lg active:scale-95 text-sm md:text-base"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Componente auxiliar: tabela de prévia
// ============================================================

function converterDataLocal(vencimento) {
  if (!vencimento) return null;
  if (typeof vencimento.toDate === "function") return vencimento.toDate();
  if (typeof vencimento === "string" && /^\d{4}-\d{2}-\d{2}$/.test(vencimento)) {
    const [y, m, d] = vencimento.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date(vencimento);
  d.setHours(0, 0, 0, 0);
  return d;
}

function PreviewTabela({ titulo, cor, boletos, filtro, colunas, renderLinha }) {
  const lista = boletos
    .filter(filtro)
    .slice(0, 8); // mostra apenas os 8 primeiros na prévia

  const total = boletos.filter(filtro).length;

  const corMap = {
    yellow: "text-yellow-400 border-yellow-800/40",
    blue: "text-blue-400 border-blue-800/40",
    green: "text-green-400 border-green-800/40",
  };

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden shadow-lg`}>
      <div className={`px-5 py-3 border-b border-gray-700 flex items-center justify-between`}>
        <h3 className={`font-bold text-sm ${cor === "yellow" ? "text-yellow-400" : "text-blue-400"}`}>
          {titulo}
        </h3>
        <span className="text-xs text-gray-500">
          {total} registro(s){total > 8 ? ` — mostrando 8` : ""}
        </span>
      </div>

      {lista.length === 0 ? (
        <div className="p-6 text-center text-gray-500 text-sm">
          Nenhum registro para o período selecionado.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-900/50">
              <tr>
                {colunas.map((c, i) => (
                  <th key={i} className="px-4 py-2.5 text-left text-gray-400 uppercase tracking-wide font-semibold">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map((b, idx) => {
                const cells = renderLinha(b);
                return (
                  <tr key={b.id || idx} className={`border-t border-gray-700/50 ${idx % 2 === 1 ? "bg-gray-900/20" : ""}`}>
                    {cells.map((cell, ci) => (
                      <td key={ci} className="px-4 py-2 text-gray-300 max-w-[200px] truncate">
                        {cell}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {total > 8 && (
            <div className="px-4 py-2 text-center text-xs text-gray-500 border-t border-gray-700/50">
              + {total - 8} registro(s) adicionais serão incluídos no Excel
            </div>
          )}
        </div>
      )}
    </div>
  );
}
