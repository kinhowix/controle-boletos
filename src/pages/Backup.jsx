import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getBoletos } from "../services/boletosService";
import { getSettings } from "../services/settingsService";
import { exportarExcel, obterEstatisticas } from "../utils/exportarExcel";
import { formatarReal } from "../utils/formatCurrency";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril",
  "Maio", "Junho", "Julho", "Agosto",
  "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function Backup() {
  const { role } = useAuth();

  // Autenticação por senha
  const [senhaDigitada, setSenhaDigitada] = useState("");
  const [autenticado, setAutenticado] = useState(false);
  const [erroSenha, setErroSenha] = useState(false);
  const [senhaVisivel, setSenhaVisivel] = useState(false);

  // Dados
  const [boletos, setBoletos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [senhaBackup, setSenhaBackup] = useState("");
  const [gerando, setGerando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

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
    if (autenticado) {
      carregarDados();
    }
  }, [autenticado]);

  async function carregarDados() {
    setCarregando(true);
    const [dadosBoletos, config] = await Promise.all([getBoletos(), getSettings()]);
    setBoletos(dadosBoletos || []);
    setSenhaBackup(config?.senhaBackup || "");
    setCarregando(false);
  }

  async function verificarSenha(e) {
    e.preventDefault();
    setErroSenha(false);

    // Busca a senha configurada no Firestore
    const config = await getSettings();
    const senhaCorreta = config?.senhaBackup || "";

    if (!senhaCorreta) {
      alert("⚠️ Nenhuma senha de backup configurada. Configure-a na página de Cadastro antes de usar esta função.");
      return;
    }

    if (senhaDigitada === senhaCorreta) {
      setAutenticado(true);
    } else {
      setErroSenha(true);
      setSenhaDigitada("");
    }
  }

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
  // TELA DE AUTENTICAÇÃO
  // ============================================================
  if (!autenticado) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 bg-gray-900 text-white min-h-screen">
          <Header />
          <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-6">
            <div className="w-full max-w-md">
              {/* Card */}
              <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
                {/* Topo decorativo */}
                <div className="bg-gradient-to-r from-emerald-700 to-teal-600 p-6 text-center">
                  <div className="text-5xl mb-2">🛡️</div>
                  <h1 className="text-xl font-bold text-white">Área Restrita</h1>
                  <p className="text-emerald-200 text-sm mt-1">Backup do Sistema</p>
                </div>

                <div className="p-8">
                  <p className="text-gray-400 text-sm text-center mb-6">
                    Digite a <span className="text-white font-semibold">senha master</span> para acessar
                    a geração de backup em Excel.
                  </p>

                  <form onSubmit={verificarSenha} className="space-y-4">
                    <div className="relative">
                      <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                        Senha Master
                      </label>
                      <div className="relative">
                        <input
                          id="input-senha-backup"
                          type={senhaVisivel ? "text" : "password"}
                          value={senhaDigitada}
                          onChange={(e) => {
                            setSenhaDigitada(e.target.value);
                            setErroSenha(false);
                          }}
                          placeholder="••••••••"
                          className={`w-full bg-gray-900 border ${
                            erroSenha ? "border-red-500" : "border-gray-700"
                          } p-3 pr-12 rounded-xl text-white placeholder-gray-600
                            focus:outline-none focus:ring-2 ${
                              erroSenha ? "focus:ring-red-500" : "focus:ring-emerald-500"
                            } transition`}
                          autoFocus
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setSenhaVisivel(!senhaVisivel)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                          tabIndex={-1}
                        >
                          {senhaVisivel ? "🙈" : "👁️"}
                        </button>
                      </div>

                      {erroSenha && (
                        <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                          ❌ Senha incorreta. Tente novamente.
                        </p>
                      )}
                    </div>

                    <button
                      id="btn-entrar-backup"
                      type="submit"
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500
                        hover:to-teal-500 text-white font-bold py-3 rounded-xl transition-all
                        transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg
                        shadow-emerald-900/30 flex items-center justify-center gap-2"
                    >
                      🔓 Entrar
                    </button>
                  </form>
                </div>
              </div>

              <p className="text-center text-gray-600 text-xs mt-4">
                Acesso disponível apenas para administradores
              </p>
            </div>
          </div>
        </div>
      </div>
    );
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
            <div className="text-4xl">📊</div>
            <div>
              <h1 className="text-3xl font-bold text-emerald-400">Backup do Sistema</h1>
              <p className="text-gray-400 text-sm mt-0.5">
                Gere um arquivo Excel com todos os boletos do sistema
              </p>
            </div>
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
          ) : (
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
                        const { inicio, fim } = calcularPeriodo();
                        const d = converterDataLocal(b.vencimento);
                        if (!d) return false;
                        const fimDia = new Date(fim);
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
