import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";

import {
  getBoletos,
  deleteBoleto,
  updateBoleto
} from "../services/boletosService";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {

  const navigate = useNavigate();

  const [boletos, setBoletos] = useState([]);

  const [mesFiltro, setMesFiltro] = useState("");
  const [empresaFiltro, setEmpresaFiltro] = useState("");

  useEffect(() => {
    carregarBoletos();
  }, []);

  async function carregarBoletos() {
    const dados = await getBoletos();
    setBoletos(dados || []);
  }

  const hoje = new Date()

const totalPago = boletos
.filter(b=>b.pago)
.reduce((acc,b)=>acc+Number(b.valor||0),0)

const totalPendente = boletos
.filter(b=>!b.pago)
.reduce((acc,b)=>acc+Number(b.valor||0),0)

const totalVencido = boletos
.filter(b=>{
const data = converterData(b.vencimento)
return !b.pago && data && data < hoje
})
.reduce((acc,b)=>acc+Number(b.valor||0),0)

  async function sair() {
    await signOut(auth);
    navigate("/login");
  }

  function converterData(vencimento) {

    if (!vencimento) return null;

    if (typeof vencimento.toDate === "function") {
      return vencimento.toDate();
    }

    return new Date(vencimento);
  }

  // =============================
  // FILTROS
  // =============================

  const boletosFiltrados = boletos.filter((b) => {

    const data = converterData(b.vencimento);

    const filtroMes =
      mesFiltro === "" ||
      (data && data.getMonth() + 1 === Number(mesFiltro));

    const filtroEmpresa =
      empresaFiltro === "" ||
      b.empresa?.toLowerCase().includes(
        empresaFiltro.toLowerCase()
      );

    return filtroMes && filtroEmpresa;
  });

  // =============================
  // MARCAR PAGO
  // =============================

  async function marcarPago(boleto) {

    await updateBoleto(boleto.id, {
      pago: !boleto.pago,
    });

    carregarBoletos();
  }

  // =============================
  // EXCLUIR
  // =============================

  async function excluir(boleto) {

    const confirma = window.confirm(
      "Excluir boleto permanentemente?"
    );

    if (!confirma) return;

    await deleteBoleto(boleto.id);

    carregarBoletos();
  }

  // =============================
  // EDITAR
  // =============================

  function editar(boleto) {

    const novoValor = prompt(
      "Novo valor",
      boleto.valor
    );

    if (!novoValor) return;

    updateBoleto(boleto.id, {
      valor: Number(novoValor),
    });

    carregarBoletos();
  }

  // =============================
  // DADOS GRAFICO
  // =============================

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

    <div className="flex">

      <Sidebar />

      <div className="flex-1 bg-gray-900 text-white min-h-screen">

        <Header />

        <div className="p-6">

          {/* TÍTULO */}

          <div className="flex justify-between mb-6">

            <h1 className="text-2xl font-bold">
              Dashboard Financeiro
            </h1>

            <button
              onClick={sair}
              className="bg-red-600 px-4 py-2 rounded"
            >
              Sair
            </button>

          </div>

          {/* FILTROS */}

          <div className="bg-gray-800 p-4 rounded-xl mb-6 flex gap-4">

            <select
              value={mesFiltro}
              onChange={(e) =>
                setMesFiltro(e.target.value)
              }
              className="bg-gray-700 p-2 rounded"
            >

              <option value="">
                Todos os meses
              </option>

              {[
                "Janeiro",
                "Fevereiro",
                "Março",
                "Abril",
                "Maio",
                "Junho",
                "Julho",
                "Agosto",
                "Setembro",
                "Outubro",
                "Novembro",
                "Dezembro",
              ].map((nome, i) => (

                <option key={i} value={i + 1}>
                  {nome}
                </option>

              ))}

            </select>

            <input
              placeholder="Filtrar empresa"
              value={empresaFiltro}
              onChange={(e) =>
                setEmpresaFiltro(e.target.value)
              }
              className="bg-gray-700 p-2 rounded"
            />

          </div>

          {/* TABELA */}

          <div className="bg-gray-800 p-6 rounded-xl">

            <table className="w-full">

              <thead>

                <tr className="text-left border-b border-gray-600">

                  <th>Empresa</th>
                  <th>Valor</th>
                  <th>Vencimento</th>
                  <th>NF</th>
                  <th>Status</th>
                  <th>Ações</th>

                </tr>

              </thead>

              <tbody>

                {boletosFiltrados.map((b) => {

                  const data = converterData(
                    b.vencimento
                  );

                  return (

                    <tr
                      key={b.id}
                      className="border-b border-gray-700"
                    >

                      <td>{b.empresa}</td>

                      <td>
                        R$ {Number(b.valor).toFixed(2)}
                      </td>

                      <td>
                        {data
                          ? data.toLocaleDateString()
                          : ""}
                      </td>

                      <td>
                        {b.numeroNF || "-"}
                      </td>

                      <td>

                        {b.pago ? (
                          <span className="text-green-400">
                            Pago
                          </span>
                        ) : (
                          <span className="text-yellow-400">
                            Pendente
                          </span>
                        )}

                      </td>

                      <td className="flex gap-2">

                        <button
                          onClick={() =>
                            marcarPago(b)
                          }
                          className="bg-green-600 px-2 py-1 rounded"
                        >
                          ✔
                        </button>

                        <button
                          onClick={() =>
                            editar(b)
                          }
                          className="bg-blue-600 px-2 py-1 rounded"
                        >
                          ✏
                        </button>

                        <button
                          onClick={() =>
                            excluir(b)
                          }
                          className="bg-red-600 px-2 py-1 rounded"
                        >
                          🗑
                        </button>

                      </td>

                    </tr>

                  );

                })}

              </tbody>

            </table>

          </div>

          {/* GRAFICO */}

          <div className="bg-gray-800 p-6 rounded-xl mt-6">

            <h2 className="text-xl font-bold mb-4">
              Total por mês
            </h2>

            <ResponsiveContainer
              width="100%"
              height={300}
            >

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