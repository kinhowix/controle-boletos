import { useEffect, useState } from "react";
import { getBoletos, updateBoleto } from "../services/boletosService";
import MainLayout from "../components/layout/MainLayout";

export default function Migracao() {
  const [boletos, setBoletos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    const dados = await getBoletos();
    // Filtra apenas os que NÃO tem tipoDespesa
    const semTipo = dados.filter(b => !b.tipoDespesa);
    setBoletos(semTipo);
    setCarregando(false);
  }

  async function atualizarTipo(id, tipo) {
    try {
      await updateBoleto(id, { tipoDespesa: tipo });
      setBoletos(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      alert("Erro ao atualizar boleto");
    }
  }

  async function marcarTodosFixa() {
    if (!window.confirm(`Deseja classificar todos os ${boletos.length} boletos como FIXA?`)) return;
    
    setProcessando(true);
    try {
      for (const b of boletos) {
        await updateBoleto(b.id, { tipoDespesa: "Fixa" });
      }
      setBoletos([]);
      alert("Todos os boletos foram atualizados!");
    } catch (error) {
      alert("Ocorreu um erro durante a atualização em massa.");
    } finally {
      setProcessando(false);
    }
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Migração de Dados</h1>
            <p className="text-gray-400 mt-1 uppercase text-xs font-bold tracking-widest">Atribuição de Tipo de Despesa</p>
          </div>
          
          {boletos.length > 0 && (
            <button
              onClick={marcarTodosFixa}
              disabled={processando}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full transition-all flex items-center gap-2 shadow-lg shadow-green-900/20 disabled:opacity-50"
            >
              {processando ? "Processando..." : "🚀 Marcar Todos como Fixa"}
            </button>
          )}
        </div>

        {carregando ? (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-800/20 rounded-3xl border border-gray-700/30 border-dashed">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-400 font-medium">Buscando boletos sem classificação...</p>
          </div>
        ) : boletos.length === 0 ? (
          <div className="bg-gradient-to-br from-green-950/40 to-emerald-900/20 p-12 rounded-3xl border border-green-700/30 text-center shadow-2xl">
            <div className="text-6xl mb-6">✨</div>
            <h2 className="text-2xl font-bold text-green-400 mb-2">Tudo em ordem!</h2>
            <p className="text-green-300/60 max-w-md mx-auto">Todos os registros da base de dados já possuem a classificação de Tipo de Despesa.</p>
          </div>
        ) : (
          <div className="bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 shadow-2xl overflow-hidden">
            <div className="bg-gray-900/50 p-4 border-b border-gray-700/50 flex justify-between items-center px-8">
              <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Lista de Pendências</span>
              <span className="bg-blue-600/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-600/20">
                {boletos.length} ENCONTRADOS
              </span>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-gray-800 z-10 shadow-sm">
                  <tr className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">
                    <th className="py-4 px-8">Empresa / Beneficiário</th>
                    <th className="py-4 px-4 text-center">Data Vencimento</th>
                    <th className="py-4 px-4 text-right">Valor Total</th>
                    <th className="py-4 px-8 text-center">Classificar Como</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {boletos.map((b) => (
                    <tr key={b.id} className="group hover:bg-gray-700/20 transition-all">
                      <td className="py-5 px-8">
                        <div className="font-bold text-gray-200 group-hover:text-blue-400 transition-colors uppercase text-sm tracking-tight">{b.empresa}</div>
                        <div className="text-[10px] text-gray-500 font-medium mt-0.5">ID: {b.id.substring(0,8)}...</div>
                      </td>
                      <td className="py-5 px-4 text-center">
                        <span className="text-xs font-bold text-gray-400 bg-gray-900/50 px-3 py-1 rounded-md border border-gray-700/50">
                          {b.vencimento?.toDate 
                            ? b.vencimento.toDate().toLocaleDateString('pt-BR') 
                            : b.vencimento 
                              ? new Date(b.vencimento + "T12:00:00").toLocaleDateString('pt-BR') 
                              : "-"
                          }
                        </span>
                      </td>
                      <td className="py-5 px-4 text-right">
                        <span className="text-sm font-black text-gray-100 italic">
                          R$ {b.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-5 px-8">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => atualizarTipo(b.id, "Fixa")}
                            className="bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white text-[10px] font-black py-2.5 px-6 rounded-xl transition-all uppercase border border-blue-600/30 tracking-widest"
                          >
                            FIXA
                          </button>
                          <button
                            onClick={() => atualizarTipo(b.id, "Variavel")}
                            className="bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white text-[10px] font-black py-2.5 px-6 rounded-xl transition-all uppercase border border-purple-600/30 tracking-widest"
                          >
                            VARIÁVEL
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
