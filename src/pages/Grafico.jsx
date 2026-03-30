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
  LabelList
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
    return new Date(vencimento);
  }

  const dadosGrafico = [];
  const nomesMeses = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];

  for (let i = 1; i <= 12; i++) {
    const boletosDoMes = boletos.filter(b => {
      const data = converterData(b.vencimento);
      return data && data.getFullYear() === Number(anoFiltro) && data.getMonth() + 1 === i;
    });

    const fixa = boletosDoMes
      .filter(b => b.tipoDespesa === "Fixa")
      .reduce((acc, b) => acc + Number(b.valor || 0), 0);

    const variavel = boletosDoMes
      .filter(b => b.tipoDespesa === "Variavel")
      .reduce((acc, b) => acc + Number(b.valor || 0), 0);

    dadosGrafico.push({
      mes: nomesMeses[i - 1],
      Fixa: fixa,
      Variavel: variavel,
      total: fixa + variavel,
    });
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((acc, p) => acc + p.value, 0);
      return (
        <div className="bg-gray-800 border border-gray-600 p-4 rounded-xl shadow-2xl text-white">
          <p className="font-bold text-lg mb-2 border-b border-gray-700 pb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="flex justify-between gap-4 text-sm font-medium">
              <span>{entry.name}:</span>
              <span>R$ {formatarReal(entry.value)}</span>
            </p>
          ))}
          <div className="mt-2 pt-2 border-t border-gray-700 font-bold text-blue-400 flex justify-between gap-4">
            <span>Total:</span>
            <span>R$ {formatarReal(total)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <MainLayout>
      <h1 className="text-3xl font-bold mb-8 text-blue-400">Somatório Anual</h1>

      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl text-white font-bold">
              Despesas por Mês
            </h2>
            <p className="text-gray-400 text-sm">Divisão entre Fixas e Variáveis</p>
          </div>
          <select
            value={anoFiltro}
            onChange={(e) => setAnoFiltro(e.target.value)}
            className="bg-gray-700 p-2 px-4 rounded-lg text-white border border-gray-600 outline-none focus:border-blue-500 transition-all font-semibold"
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

        <div className="w-full h-[450px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={dadosGrafico}
              margin={{ top: 20, right: 10, left: 20, bottom: 0 }}
            >
              <XAxis 
                dataKey="mes" 
                stroke="#94a3b8" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `R$ ${value}`}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }} 
              />
              
              <Bar 
                dataKey="Fixa" 
                stackId="a" 
                fill="#126DEB" 
                radius={[0, 0, 0, 0]} 
                name="Fixa"
              />
              <Bar 
                dataKey="Variavel" 
                stackId="a" 
                fill="#9333ea" 
                radius={[6, 6, 0, 0]} 
                name="Variável"
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
                        y={y - 10}
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

        <div className="flex justify-center gap-8 mt-6 border-t border-gray-700 pt-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#126DEB]"></div>
            <span className="text-gray-300 text-sm font-medium">Despesas Fixas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#9333ea]"></div>
            <span className="text-gray-300 text-sm font-medium">Despesas Variáveis</span>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
