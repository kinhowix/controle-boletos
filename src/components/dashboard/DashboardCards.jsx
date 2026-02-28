export default function DashboardCards({ boletos }) {

  const hoje = new Date();

  // 🔹 Função inteligente para converter qualquer formato de data
  function converterData(vencimento) {
    if (!vencimento) return null;

    // Se for Timestamp do Firestore
    if (typeof vencimento.toDate === "function") {
      return vencimento.toDate();
    }

    // Se for string ou outro formato
    return new Date(vencimento);
  }

  // 🔴 Vencem hoje
  const vencemHoje = boletos.filter((b) => {
    const data = converterData(b.vencimento);
    if (!data) return false;

    return (
      data.getDate() === hoje.getDate() &&
      data.getMonth() === hoje.getMonth() &&
      data.getFullYear() === hoje.getFullYear()
    );
  });

  // 🟠 Vencidos
  const vencidos = boletos.filter((b) => {
    const data = converterData(b.vencimento);
    if (!data) return false;

    return data < hoje;
  });

  // 🔵 Total do mês
  const totalMes = boletos
    .filter((b) => {
      const data = converterData(b.vencimento);
      if (!data) return false;

      return (
        data.getMonth() === hoje.getMonth() &&
        data.getFullYear() === hoje.getFullYear()
      );
    })
    .reduce((acc, b) => acc + Number(b.valor || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">

      <div className="bg-white p-6 rounded-2xl shadow">
        <p className="text-gray-500">Total do Mês</p>
        <h3 className="text-2xl font-bold text-blue-600">
          R$ {totalMes.toFixed(2)}
        </h3>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow">
        <p className="text-gray-500">Vencem Hoje</p>
        <h3 className="text-2xl font-bold text-red-600">
          {vencemHoje.length}
        </h3>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow">
        <p className="text-gray-500">Vencidos</p>
        <h3 className="text-2xl font-bold text-orange-600">
          {vencidos.length}
        </h3>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow">
        <p className="text-gray-500">Total de Boletos</p>
        <h3 className="text-2xl font-bold text-green-600">
          {boletos.length}
        </h3>
      </div>

    </div>
  );
}