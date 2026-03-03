import {
  deleteBoleto,
} from "../../services/boletosService";

export default function BoletosTable({
  boletos,
}) {

  async function excluir(id) {

    if (!confirm("Excluir?")) return;

    await deleteBoleto(id);

    location.reload();
  }

  function converter(v) {

    if (!v) return "";

    if (typeof v.toDate === "function") {
      return v.toDate();
    }

    return new Date(v);
  }

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow">

      <table className="w-full">

        <thead>
          <tr className="border-b text-left">
            <th>Empresa</th>
            <th>Valor</th>
            <th>Vencimento</th>
            <th>NF</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>

          {boletos.map((b) => {

            const data = converter(
              b.vencimento
            );

            return (
              <tr
                key={b.id}
                className="border-b"
              >

                <td>{b.empresa}</td>

                <td>
                  R$ {b.valor}
                </td>

                <td>
                  {data?.toLocaleDateString()}
                </td>

                <td>
                  {b.numeroNF}
                </td>

                <td>

                  <button
                    onClick={() =>
                      excluir(b.id)
                    }
                    className="text-white bg-blue-600 px-3 py-1 rounded"
                  >
                    Excluir
                  </button>

                </td>

              </tr>
            );
          })}

        </tbody>

      </table>

    </div>
  );
}