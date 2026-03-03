import { useEffect, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import DashboardCards from "../components/dashboard/DashboardCards";
import BoletosTable from "../components/dashboard/BoletosTable";
import { getBoletos } from "../services/boletosService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {

  const [boletos, setBoletos] = useState([]);
  const [mesFiltro, setMesFiltro] = useState("");
  const [buscaEmpresa, setBuscaEmpresa] = useState("");

  useEffect(() => {
    async function carregar() {
      const dados = await getBoletos();
      setBoletos(dados);
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

  const boletosFiltrados = boletos.filter((b) => {
    const data = converterData(b.vencimento);

    const filtroMes =
      mesFiltro === "" ||
      (data && data.getMonth() + 1 === Number(mesFiltro));

    const filtroEmpresa =
      buscaEmpresa === "" ||
      b.empresa?.toLowerCase().includes(buscaEmpresa.toLowerCase());

    return filtroMes && filtroEmpresa;
  });

  const nomesMeses = [
    "Jan","Fev","Mar","Abr","Mai","Jun",
    "Jul","Ago","Set","Out","Nov","Dez"
  ];

  const dadosGrafico = [];

  for (let i = 1; i <= 12; i++) {
    const total = boletos.reduce((acc, b) => {
      const data = converterData(b.vencimento);
      if (data && data.getMonth() + 1 === i) {
        return acc + Number(b.valor || 0);
      }
      return acc;
    }, 0);

    dadosGrafico.push({
      mes: nomesMeses[i - 1],
      total,
    });
  }

  return (
    <div className="flex bg-gray-900 text-gray-100 min-h-screen">

      <Sidebar />

      <div className="flex-1 bg-gray-950">

        <Header />

        <div className="p-8">

          {/* FILTROS */}
          <div className="bg-gray-800 p-4 rounded-2xl shadow-lg mb-8 flex gap-4">

            <select
              value={mesFiltro}
              onChange={(e) => setMesFiltro(e.target.value)}
              className="p-2 border rounded-lg bg-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Todos os meses</option>
              {[
                "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
              ].map((nome, i) => (
                <option key={i} value={i + 1}>
                  {nome}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Buscar empresa..."
              className="p-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
              value={buscaEmpresa}
              onChange={(e) => setBuscaEmpresa(e.target.value)}
            />

          </div>

          <DashboardCards boletos={boletosFiltrados} />
          <BoletosTable boletos={boletosFiltrados} />

          {/* GRÁFICO */}
          <div className="bg-gray-800 p-6 rounded-2xl shadow-lg mt-8">
            <h2 className="text-xl font-semibold mb-6 text-gray-200">
              Total por Mês
            </h2>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosGrafico}>
                <XAxis dataKey="mes" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Bar dataKey="total" fill="#3b82f6" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>
    </div>
  );
}