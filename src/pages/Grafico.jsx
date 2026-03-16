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

  const nomesMeses = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  const dadosGrafico = [];

  for (let i = 1; i <= 12; i++) {
    const total = boletos.reduce((acc, b) => {
      const data = converterData(b.vencimento);
      if (data && data.getFullYear() === Number(anoFiltro) && data.getMonth() + 1 === i) {
        return acc + Number(b.valor || 0);
      }
      return acc;
    }, 0);

    dadosGrafico.push({
      mes: nomesMeses[i - 1],
      total,
    });
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-600 p-3 rounded shadow-lg text-white">
          <p className="font-bold mb-1">{label}</p>
          <p className="text-blue-400">
            Total: R$ {formatarReal(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <MainLayout>
      <h1 className="text-3xl font-bold mb-8 text-blue-400">Desempenho Anual</h1>

      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg text-gray-400 font-semibold">
            Total de Boletos por Mês
          </h2>
          <select
            value={anoFiltro}
            onChange={(e) => setAnoFiltro(e.target.value)}
            className="bg-gray-700 p-2 rounded text-white border border-gray-600 outline-none"
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

        <div className="w-full h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosGrafico}>
              <XAxis dataKey="mes" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
              <Bar
                dataKey="total"
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </MainLayout>
  );
}
