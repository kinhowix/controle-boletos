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

  const [mesFiltro, setMesFiltro] = useState(
    new Date().getMonth() + 1
  );

  const [empresaFiltro, setEmpresaFiltro] = useState("");

  const [modalEditar, setModalEditar] = useState(false);
  const [boletoEditando, setBoletoEditando] = useState(null);

  const [modalBoleto, setModalBoleto] = useState(false);
  const [boletoVisualizando, setBoletoVisualizando] = useState(null);

  useEffect(() => {
    carregarBoletos();
  }, []);

  async function carregarBoletos() {
    const dados = await getBoletos();
    setBoletos(dados || []);
  }

  const hoje = new Date();

  function converterData(vencimento) {

    if (!vencimento) return null;

    if (typeof vencimento.toDate === "function") {
      return vencimento.toDate();
    }

    return new Date(vencimento);

  }

  

  async function sair() {
    await signOut(auth);
    navigate("/login");
  }

  // ================================
  // FILTROS
  // ================================

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

  const totalPago = boletosFiltrados
  .filter(b => b.pago)
  .reduce((acc, b) => acc + Number(b.valor || 0), 0);

const totalPendente = boletosFiltrados
  .filter(b => !b.pago)
  .reduce((acc, b) => acc + Number(b.valor || 0), 0);

const totalVencido = boletosFiltrados
  .filter(b => {
    const data = converterData(b.vencimento);
    return !b.pago && data && data < hoje;
  })
  .reduce((acc, b) => acc + Number(b.valor || 0), 0);

  // ================================
  // MARCAR PAGO
  // ================================

  async function marcarPago(boleto) {

    await updateBoleto(boleto.id, {
      pago: !boleto.pago,
    });

    carregarBoletos();

  }

  // ================================
  // EXCLUIR
  // ================================

  async function excluir(boleto) {

    const confirma = window.confirm(
      "Excluir boleto permanentemente?"
    );

    if (!confirma) return;

    await deleteBoleto(boleto.id);

    carregarBoletos();

  }

  // ================================
  // EDITAR BOLETO
  // ================================

  function abrirEditar(boleto) {

    setBoletoEditando({
      ...boleto,
      vencimento: converterData(boleto.vencimento)
        ?.toISOString()
        .substring(0, 10)
    });

    setModalEditar(true);

  }

  async function salvarEdicao() {

    await updateBoleto(
      boletoEditando.id,
      boletoEditando
    );

    setModalEditar(false);

    carregarBoletos();

  }

  // ================================
  // VISUALIZAR BOLETO
  // ================================

  function abrirBoleto(boleto) {

    setBoletoVisualizando(boleto);

    setModalBoleto(true);

  }

  // ================================
  // GRAFICO
  // ================================

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

    <div className="flex">

      <Sidebar />

      <div className="flex-1 bg-gray-900 text-white min-h-screen">

        <Header />

        <div className="p-6">

          {/* TOPO */}

          <div className="flex justify-between mb-6">

            <h1 className="text-2xl font-bold">
              Painel Financeiro
            </h1>

            <button
              onClick={sair}
              className="bg-red-600 px-4 py-2 rounded"
            >
              Sair
            </button>

          </div>

          {/* RESUMO */}

          <div className="grid grid-cols-3 gap-4 mb-6">

            <div className="bg-gray-800 p-4 rounded">
              Pago
              <div className="text-green-400 text-xl">
                R$ {totalPago.toFixed(2)}
              </div>
            </div>

            <div className="bg-gray-800 p-4 rounded">
              Pendente
              <div className="text-yellow-400 text-xl">
                R$ {totalPendente.toFixed(2)}
              </div>
            </div>

            <div className="bg-gray-800 p-4 rounded">
              Vencido
              <div className="text-red-400 text-xl">
                R$ {totalVencido.toFixed(2)}
              </div>
            </div>

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
                "Janeiro","Fevereiro","Março","Abril",
                "Maio","Junho","Julho","Agosto",
                "Setembro","Outubro","Novembro","Dezembro"
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
                            abrirEditar(b)
                          }
                          className="bg-blue-600 px-2 py-1 rounded"
                        >
                          ✏
                        </button>

                        <button
                          onClick={() =>
                            abrirBoleto(b)
                          }
                          className="bg-purple-600 px-2 py-1 rounded"
                        >
                          📄
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

      {/* MODAL EDITAR */}

      {modalEditar && (

        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">

          <div className="bg-gray-800 p-6 rounded-xl w-96">

            <h2 className="text-xl mb-4">
              Editar boleto
            </h2>

            <input
              className="bg-gray-700 p-2 rounded w-full mb-3"
              value={boletoEditando.empresa}
              onChange={(e)=>
                setBoletoEditando({
                  ...boletoEditando,
                  empresa:e.target.value
                })
              }
            />

            <input
              className="bg-gray-700 p-2 rounded w-full mb-3"
              value={boletoEditando.valor}
              onChange={(e)=>
                setBoletoEditando({
                  ...boletoEditando,
                  valor:e.target.value
                })
              }
            />

            <input
              type="date"
              className="bg-gray-700 p-2 rounded w-full mb-3"
              value={boletoEditando.vencimento}
              onChange={(e)=>
                setBoletoEditando({
                  ...boletoEditando,
                  vencimento:e.target.value
                })
              }
            />

            <input
              placeholder="NF"
              className="bg-gray-700 p-2 rounded w-full mb-3"
              value={boletoEditando.numeroNF || ""}
              onChange={(e)=>
                setBoletoEditando({
                  ...boletoEditando,
                  numeroNF:e.target.value
                })
              }
            />

            <input
              placeholder="Linha digitável"
              className="bg-gray-700 p-2 rounded w-full mb-3"
              value={boletoEditando.linhaDigitavel || ""}
              onChange={(e)=>
                setBoletoEditando({
                  ...boletoEditando,
                  linhaDigitavel:e.target.value
                })
              }
            />

            <div className="flex gap-3">

              <button
                onClick={salvarEdicao}
                className="bg-green-600 px-4 py-2 rounded"
              >
                Salvar
              </button>

              <button
                onClick={()=>setModalEditar(false)}
                className="bg-gray-600 px-4 py-2 rounded"
              >
                Cancelar
              </button>

            </div>

          </div>

        </div>

      )}

      {/* MODAL BOLETO */}

      {modalBoleto && (

        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">

          <div className="bg-gray-800 p-6 rounded-xl w-96">

            <h2 className="text-xl mb-4">
              Boleto
            </h2>

            {boletoVisualizando?.linhaDigitavel && (

              <div className="mb-4">

                <div className="text-sm text-gray-400">
                  Linha digitável
                </div>

                <div className="bg-gray-700 p-2 rounded break-all">
                  {boletoVisualizando.linhaDigitavel}
                </div>

                <button
                  onClick={()=>{
                    navigator.clipboard.writeText(
                      boletoVisualizando.linhaDigitavel
                    )
                  }}
                  className="mt-2 bg-blue-600 px-3 py-1 rounded"
                >
                  Copiar
                </button>

              </div>

            )}

            {boletoVisualizando?.pdf && (

              <a
                href={boletoVisualizando.pdf}
                target="_blank"
                className="bg-green-600 px-4 py-2 rounded block text-center"
              >
                Abrir PDF
              </a>

            )}

            <button
              onClick={()=>setModalBoleto(false)}
              className="mt-4 bg-gray-600 px-4 py-2 rounded w-full"
            >
              Fechar
            </button>

          </div>

        </div>

      )}

    </div>

  );

}