import { useEffect, useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import { getBoletos } from "../services/boletosService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Legend
} from "recharts";
import { formatarReal } from "../utils/formatCurrency";

export default function Grafico() {
  const [boletos, setBoletos] = useState([]);
  const [anoFiltro, setAnoFiltro] = useState(new Date().getFullYear());

  useEffect(() => {
    async function carregar() {
      const dados = await getBoletos();
      setBoletos(dados || []);
    }
    carregar();
  }, []);

  function converterData(vencimento) {
    if (!vencimento) return null;

    if (typeof vencimento.toDate === "function") {
      return vencimento.toDate();
    }

    // Trata string YYYY-MM-DD para evitar erro de fuso horário
    if (typeof vencimento === "string" && /^\d{4}-\d{2}-\d{2}$/.test(vencimento)) {
      const [year, month, day] = vencimento.split('-').map(Number);
      return new Date(year, month - 1, day);
    }

    const data = new Date(vencimento);
    return data;
  }

  const nomesMeses = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];

  const dadosGrafico = [];

  for (let i = 1; i <= 12; i++) {
    const mesBoletos = boletos.filter(b => {
      const data = converterData(b.vencimento);
      return data && data.getFullYear() === Number(anoFiltro) && data.getMonth() + 1 === i;
    });

    const fixa = mesBoletos
      .filter(b => b.tipoDespesa === "Fixa")
      .reduce((acc, b) => acc + Number(b.valor || 0), 0);

    const variavel = mesBoletos
      .filter(b => b.tipoDespesa === "Variavel")
      .reduce((acc, b) => acc + Number(b.valor || 0), 0);

    dadosGrafico.push({
      mes: nomesMeses[i - 1],
      fixa,
      variavel,
      total: fixa + variavel,
    });
  }

  const totalAnualFixa = dadosGrafico.reduce((acc, d) => acc + d.fixa, 0);
  const totalAnualVariavel = dadosGrafico.reduce((acc, d) => acc + d.variavel, 0);
  const totalAnualGeral = totalAnualFixa + totalAnualVariavel;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // O payload pode vir com 1 ou 2 itens dependendo se há dados para fixa/variavel
      const valFixa = payload.find(p => p.dataKey === "fixa")?.value || 0;
      const valVariavel = payload.find(p => p.dataKey === "variavel")?.value || 0;
      const total = valFixa + valVariavel;

      return (
        <div className="bg-gray-800 border border-gray-600 p-4 rounded-xl shadow-2xl text-white min-w-[200px]">
          <p className="font-bold border-b border-gray-700 pb-2 mb-3 text-lg">{label}</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center gap-4">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#10B981]"></div>
                <span className="text-gray-400 text-sm">Fixa:</span>
              </span>
              <span className="font-mono font-bold text-green-400">R$ {formatarReal(valFixa)}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#8B5CF6]"></div>
                <span className="text-gray-400 text-sm">Variável:</span>
              </span>
              <span className="font-mono font-bold text-purple-400">R$ {formatarReal(valVariavel)}</span>
            </div>
            <div className="pt-2 mt-2 border-t border-gray-700 flex justify-between items-center gap-4">
              <span className="font-bold text-gray-300 text-sm italic">Total:</span>
              <span className="font-mono font-bold text-blue-400 text-lg">R$ {formatarReal(total)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-blue-400 flex items-center gap-3">
          <span>📊</span> Somatório Anual de Despesas
        </h1>

        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 border border-gray-700 p-5 rounded-2xl shadow-xl">
            <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Fixa no Ano</div>
            <div className="text-3xl font-mono font-bold text-green-400">R$ {formatarReal(totalAnualFixa)}</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 p-5 rounded-2xl shadow-xl">
            <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Variável no Ano</div>
            <div className="text-3xl font-mono font-bold text-purple-400">R$ {formatarReal(totalAnualVariavel)}</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 p-5 rounded-2xl shadow-xl bg-gradient-to-br from-gray-800 to-blue-900/20">
            <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Soma Geral</div>
            <div className="text-3xl font-mono font-bold text-blue-400">R$ {formatarReal(totalAnualGeral)}</div>
          </div>
        </div>

        <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h2 className="text-xl text-white font-bold mb-1">Desempenho Mensal</h2>
              <p className="text-gray-400 text-sm">Distribuição entre custos fixos e variáveis</p>
            </div>
            
            <select
              value={anoFiltro}
              onChange={(e) => setAnoFiltro(e.target.value)}
              className="bg-gray-900 p-2 px-4 rounded-xl text-white border border-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
            >
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

          <div className="w-full h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosGrafico} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                <Legend verticalAlign="top" height={36}/>
                <Bar 
                  dataKey="fixa" 
                  name="Fixa" 
                  stackId="a" 
                  fill="#10B981" 
                  radius={[0, 0, 0, 0]} 
                />
                <Bar 
                  dataKey="variavel" 
                  name="Variável" 
                  stackId="a" 
                  fill="#8B5CF6" 
                  radius={[4, 4, 0, 0]}
                >
                  <LabelList 
                    dataKey="total" 
                    position="top" 
                    content={(props) => {
                      const { x, y, width, value } = props;
                      if (!value) return null;
                      return (
                        <text 
                          x={x + width / 2} 
                          y={y - 12} 
                          fill="#FFFFFF" 
                          textAnchor="middle" 
                          fontSize={11} 
                          fontWeight="bold"
                        >
                          R$ {formatarReal(value)}
                        </text>
                      );
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
