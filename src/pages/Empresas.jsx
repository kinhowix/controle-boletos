import { useEffect, useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import {
  getEmpresas,
  addEmpresa,
  updateEmpresa,
  deleteEmpresa,
} from "../services/empresasService";

export default function Empresas() {

  const [empresas, setEmpresas] = useState([]);
  const [cnpj, setCnpj] = useState("");
  const [razao, setRazao] = useState("");
  const [fantasia, setFantasia] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [editCnpj, setEditCnpj] = useState("");
  const [editRazao, setEditRazao] = useState("");
  const [editFantasia, setEditFantasia] = useState("");
  const [editCidade, setEditCidade] = useState("");
  const [editUf, setEditUf] = useState("");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const dados = await getEmpresas();
    setEmpresas(dados);
  }

  // =========================
  // MÁSCARA CNPJ
  // =========================

  function formatarCNPJ(valor) {

    // Permite alfanumérico e converte para maiúsculo
    let chars = valor.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

    if (chars.length > 14) {
      chars = chars.slice(0, 14);
    }

    // Garante que os 2 últimos caracteres (DV) sejam apenas números
    if (chars.length > 12) {
      let base = chars.slice(0, 12);
      let dv = chars.slice(12).replace(/\D/g, ""); // Remove qualquer letra do DV
      chars = base + dv;
    }

    // Aplica a máscara XX.XXX.XXX/XXXX-XX
    if (chars.length > 12) chars = chars.replace(/^(.{2})(.{3})(.{3})(.{4})(.+)/, "$1.$2.$3/$4-$5");
    else if (chars.length > 8) chars = chars.replace(/^(.{2})(.{3})(.{3})(.+)/, "$1.$2.$3/$4");
    else if (chars.length > 5) chars = chars.replace(/^(.{2})(.{3})(.+)/, "$1.$2.$3");
    else if (chars.length > 2) chars = chars.replace(/^(.{2})(.+)/, "$1.$2");

    return chars;

  }

  function handleCNPJ(e) {
    const valor = e.target.value;
    setCnpj(formatarCNPJ(valor));
  }

  function limparCNPJ(valor) {
    return valor.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  }

  // =========================
  // BUSCAR CNPJ
  // =========================

  async function buscarCNPJ() {

    const cnpjLimpo = limparCNPJ(cnpj);

    // 🔒 VERIFICA SE CNPJ JÁ EXISTE
    const jaExiste = empresas.some(
      (e) => limparCNPJ(e.cnpj) === cnpjLimpo
    );

    if (jaExiste) {
      alert("Este CNPJ já está cadastrado.");
      return;
    }

    if (cnpjLimpo.length < 14) {
      alert("CNPJ inválido");
      return;
    }

    try {

      const res = await fetch(
        `https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`
      );

      const data = await res.json();

      setRazao(data.razao_social || "");
      setFantasia(data.nome_fantasia || "");
      setCidade(data.municipio || "");
      setUf(data.uf || "");

    } catch {
      alert("Erro ao buscar CNPJ");
    }
  }


  // =========================
  // SALVAR
  // =========================

  async function salvar() {

    if (!razao) {
      alert("Informe a empresa");
      return;
    }

    const cnpjLimpo = limparCNPJ(cnpj);

    await addEmpresa({
      cnpj: cnpjLimpo,
      razao,
      fantasia,
      cidade,
      uf,
    });

    setCnpj("");
    setRazao("");
    setFantasia("");
    setCidade("");
    setUf("");

    carregar();
  }

  // =========================
  // EDIÇÃO
  // =========================

  function abrirEdicao(empresa) {
    setEditId(empresa.id);
    setEditCnpj(empresa.cnpj || "");
    setEditRazao(empresa.razao || "");
    setEditFantasia(empresa.fantasia || "");
    setEditCidade(empresa.cidade || "");
    setEditUf(empresa.uf || "");
    setIsEditModalOpen(true);
  }

  function fecharEdicao() {
    setIsEditModalOpen(false);
    setEditId("");
  }

  function handleEditCNPJ(e) {
    const valor = e.target.value;
    setEditCnpj(formatarCNPJ(valor));
  }

  async function salvarEdicao() {
    if (!editRazao) {
      alert("Informe a empresa");
      return;
    }

    const cnpjLimpo = limparCNPJ(editCnpj);

    await updateEmpresa(editId, {
      cnpj: cnpjLimpo,
      razao: editRazao,
      fantasia: editFantasia,
      cidade: editCidade,
      uf: editUf,
    });

    fecharEdicao();
    carregar();
  }

  async function handleExcluir(id) {
    if (window.confirm("Tem certeza que quer cancelar?")) {
      await deleteEmpresa(id);
      carregar();
    }
  }

  // =========================
  // FILTRO DE BUSCA
  // =========================

  const empresasFiltradas = empresas.filter((e) => {

    const termo = busca.toLowerCase();

    return (
      (e.razao && e.razao.toLowerCase().includes(termo)) ||
      (e.fantasia && e.fantasia.toLowerCase().includes(termo)) ||
      (e.cnpj && limparCNPJ(e.cnpj).includes(limparCNPJ(termo)))
    );

  });

  return (
    <MainLayout>

      <h1 className="text-2xl font-semibold mb-2">
        Empresas
      </h1>

      {/* FORM */}
      <div className="bg-gray-800 p-6 rounded-2xl shadow-lg mb-8">

        <div className="grid grid-cols-2 gap-4">

          <input
            placeholder="CNPJ"
            className="bg-gray-700 border border-gray-600 p-2 rounded text-white"
            value={cnpj}
            onChange={handleCNPJ}
          />

          <button
            onClick={buscarCNPJ}
            className="bg-blue-600 hover:bg-blue-700 rounded text-white"
          >
            Buscar CNPJ
          </button>

          <input
            placeholder="Razão Social"
            className="bg-gray-700 border border-gray-600 p-2 rounded text-white"
            value={razao}
            onChange={(e) => setRazao(e.target.value)}
          />

          <input
            placeholder="Fantasia"
            className="bg-gray-700 border border-gray-600 p-2 rounded text-white"
            value={fantasia}
            onChange={(e) => setFantasia(e.target.value)}
          />

          <input
            placeholder="Cidade"
            className="bg-gray-700 border border-gray-600 p-2 rounded text-white"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
          />

          <input
            placeholder="UF"
            maxLength={2}
            className="bg-gray-700 border border-gray-600 p-2 rounded text-white"
            value={uf}
            onChange={(e) => setUf(e.target.value)}
          />

        </div>

        <button
          onClick={salvar}
          className="mt-6 bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white"
        >
          Salvar Empresa
        </button>

      </div>

      {/* LISTA */}
      <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">

        <div className="max-h-[240px] overflow-y-auto pr-2">
          <input
            placeholder="Buscar por empresa ou CNPJ..."
            className="bg-gray-700 border border-gray-600 p-2 rounded text-white mb-4 w-full"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <table className="w-full text-sm">

            <thead className="sticky top-0 bg-gray-800 z-10">
              <tr className="text-left border-b border-gray-600">
                <th className="pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">CNPJ</th>
                <th className="pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Empresa</th>
                <th className="pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Cidade</th>
                <th className="pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">UF</th>
                <th className="pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400 w-px whitespace-nowrap">Ações</th>
              </tr>
            </thead>

            <tbody>
              {empresasFiltradas.map((e) => (
                <tr key={e.id} className="border-b border-gray-700 hover:bg-gray-700 uppercase">
                  <td className="py-3">{e.cnpj}</td>
                  <td className="py-3">{e.razao}</td>
                  <td className="py-3">{e.cidade}</td>
                  <td className="py-3">{e.uf}</td>
                  <td className="py-3 flex gap-2 whitespace-nowrap">
                    <button
                      onClick={() => abrirEdicao(e)}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-white text-xs font-medium"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleExcluir(e.id)}
                      className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded text-white text-xs font-medium"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>

      </div>

      {/* MODAL EDITAR */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-2xl shadow-lg w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4">Editar Empresa</h2>

            <div className="grid grid-cols-2 gap-4">
              <input
                placeholder="CNPJ"
                className="bg-gray-700 border border-gray-600 p-2 rounded text-white"
                value={editCnpj}
                onChange={handleEditCNPJ}
              />
              <div /> {/* Espaçador */}

              <input
                placeholder="Razão Social"
                className="bg-gray-700 border border-gray-600 p-2 rounded text-white col-span-2"
                value={editRazao}
                onChange={(e) => setEditRazao(e.target.value)}
              />

              <input
                placeholder="Fantasia"
                className="bg-gray-700 border border-gray-600 p-2 rounded text-white col-span-2"
                value={editFantasia}
                onChange={(e) => setEditFantasia(e.target.value)}
              />

              <input
                placeholder="Cidade"
                className="bg-gray-700 border border-gray-600 p-2 rounded text-white"
                value={editCidade}
                onChange={(e) => setEditCidade(e.target.value)}
              />

              <input
                placeholder="UF"
                maxLength={2}
                className="bg-gray-700 border border-gray-600 p-2 rounded text-white"
                value={editUf}
                onChange={(e) => setEditUf(e.target.value)}
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={fecharEdicao}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white"
              >
                Cancelar
              </button>
              <button
                onClick={salvarEdicao}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

    </MainLayout>
  );
}