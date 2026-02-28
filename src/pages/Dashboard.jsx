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

  // 🔎 FILTRO
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

  // 📈 AGRUPAR POR MÊS
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
      mes: i,
      total,
    });
  }

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 bg-gray-100 min-h-screen">
        <Header />

        <div className="p-6">

          {/* FILTROS */}
          <div className="bg-white p-4 rounded-xl shadow mb-6 flex gap-4">

            <select
              value={mesFiltro}
              onChange={(e) => setMesFiltro(e.target.value)}
              className="p-2 border rounded-lg"
            >
              <option value="">Todos os meses</option>
              {[...Array(12)].map((_, i) => (
                <option key={i} value={i + 1}>
                  Mês {i + 1}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Buscar empresa..."
              className="p-2 border rounded-lg"
              value={buscaEmpresa}
              onChange={(e) => setBuscaEmpresa(e.target.value)}
            />

          </div>

          <DashboardCards boletos={boletosFiltrados} />
          <BoletosTable boletos={boletosFiltrados} />

          {/* GRÁFICO */}
          <div className="bg-white p-6 rounded-xl shadow mt-6">
            <h2 className="text-xl font-bold mb-4">
              Total por Mês
            </h2>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosGrafico}>
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>
    </div>
  );
}