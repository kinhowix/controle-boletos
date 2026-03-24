import { useEffect, useState } from "react";
import { getBoletos, updateBoleto } from "../services/boletosService";
import { cleanLinhaDigitavel } from "../utils/formatDigitavel";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import { useNavigate } from "react-router-dom";

export default function MigrationBoletos() {
  const [boletos, setBoletos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    carregarBoletos();
  }, []);

  async function carregarBoletos() {
    setLoading(true);
    const dados = await getBoletos();
    // Filtrar apenas os que POSSUEM linha digitável e que possuem caracteres não numéricos
    const paraCorrigir = dados.filter(b => 
      b.linhaDigitavel && /[^\d]/.test(b.linhaDigitavel)
    );
    setBoletos(paraCorrigir);
    setLoading(false);
  }

  async function executarMigracao() {
    if (!window.confirm(`Deseja limpar a linha digitável de ${boletos.length} boletos?`)) return;

    setMigrating(true);
    let count = 0;
    const total = boletos.length;
    setProgress({ current: 0, total });

    for (const boleto of boletos) {
      const limpa = cleanLinhaDigitavel(boleto.linhaDigitavel);
      await updateBoleto(boleto.id, { linhaDigitavel: limpa });
      count++;
      setProgress({ current: count, total });
    }

    alert("Migração concluída com sucesso!");
    setMigrating(false);
    carregarBoletos();
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-gray-900 text-white min-h-screen">
        <Header />
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Migração de Linha Digitável</h1>
          
          <div className="bg-gray-800 p-6 rounded-xl shadow border border-gray-700">
            <p className="mb-4 text-gray-300">
              Esta página identifica boletos que possuem pontos ou espaços na linha digitável e permite limpá-los em massa.
            </p>

            {loading ? (
              <p>Carregando boletos...</p>
            ) : (
              <div>
                <div className="mb-6">
                  <span className="text-lg">
                    Boletos para corrigir: <span className="font-bold text-yellow-400">{boletos.length}</span>
                  </span>
                </div>

                {boletos.length > 0 && !migrating && (
                  <button
                    onClick={executarMigracao}
                    className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-bold transition-all shadow-lg"
                  >
                    Corrigir Todos
                  </button>
                )}

                {migrating && (
                  <div className="mt-4">
                    <p className="mb-2">Corrigindo: {progress.current} / {progress.total}</p>
                    <div className="w-full bg-gray-700 h-4 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full transition-all duration-300"
                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {!migrating && boletos.length === 0 && (
                  <div className="bg-green-900/20 border border-green-700/30 p-4 rounded text-green-400 font-medium">
                    ✓ Todos os boletos já estão com a linha digitável limpa!
                  </div>
                )}

                <div className="mt-8">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Amostra de boletos afetados</h3>
                  <div className="max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-700 text-gray-500">
                          <th className="pb-2">Empresa</th>
                          <th className="pb-2">Linha Atual</th>
                        </tr>
                      </thead>
                      <tbody>
                        {boletos.map(b => (
                          <tr key={b.id} className="border-b border-gray-700/50">
                            <td className="py-2 text-gray-300">{b.empresa}</td>
                            <td className="py-2 font-mono text-xs text-red-400">{b.linhaDigitavel}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-700">
              <button
                onClick={() => navigate("/")}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm transition-colors"
                disabled={migrating}
              >
                Voltar ao Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
