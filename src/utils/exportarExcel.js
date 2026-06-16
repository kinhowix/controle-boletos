import * as XLSX from "xlsx";

// ============================================================
// Helpers
// ============================================================

function converterData(vencimento) {
  if (!vencimento) return null;
  if (typeof vencimento.toDate === "function") return vencimento.toDate();
  if (typeof vencimento === "string" && /^\d{4}-\d{2}-\d{2}$/.test(vencimento)) {
    const [y, m, d] = vencimento.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date(vencimento);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatarDataBR(data) {
  if (!data) return "-";
  return data.toLocaleDateString("pt-BR");
}

function formatarValor(valor) {
  if (valor === null || valor === undefined || valor === "") return "-";
  return Number(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function statusBoleto(b, hoje) {
  if (b.arquivado) return "Arquivado";
  if (b.pago) return "Pago";
  const data = converterData(b.vencimento);
  if (data && data < hoje) return "Vencido";
  return "Pendente";
}

// ============================================================
// Estilo de cabeçalho (aplicado via worksheet['!cols'] e células)
// ============================================================

function aplicarEstilosCabecalho(ws, colunas, linha) {
  const estiloHeader = {
    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
    fill: { fgColor: { rgb: "1E3A5F" }, type: "pattern", patternType: "solid" },
    alignment: { horizontal: "center", vertical: "center", wrapText: false },
    border: {
      bottom: { style: "medium", color: { rgb: "2563EB" } },
    },
  };

  colunas.forEach((_, idx) => {
    const celula = XLSX.utils.encode_cell({ r: linha, c: idx });
    if (!ws[celula]) return;
    ws[celula].s = estiloHeader;
  });
}

function aplicarEstiloLinha(ws, numColunas, linhaIdx, isAlternate) {
  const cor = isAlternate ? "1F2937" : "111827";
  for (let c = 0; c < numColunas; c++) {
    const ref = XLSX.utils.encode_cell({ r: linhaIdx, c });
    if (!ws[ref]) continue;
    ws[ref].s = {
      font: { color: { rgb: "E5E7EB" }, sz: 10 },
      fill: { fgColor: { rgb: cor }, type: "pattern", patternType: "solid" },
      alignment: { vertical: "center" },
    };
  }
}

function aplicarEstiloTotal(ws, numColunas, linhaIdx) {
  for (let c = 0; c < numColunas; c++) {
    const ref = XLSX.utils.encode_cell({ r: linhaIdx, c });
    if (!ws[ref]) continue;
    ws[ref].s = {
      font: { bold: true, color: { rgb: "FBBF24" }, sz: 11 },
      fill: { fgColor: { rgb: "374151" }, type: "pattern", patternType: "solid" },
      alignment: { horizontal: c === numColunas - 1 ? "right" : c === 0 ? "left" : "center", vertical: "center" },
      border: {
        top: { style: "medium", color: { rgb: "FBBF24" } },
      },
    };
  }
}

// ============================================================
// Aba 1 — Boletos A Vencer (pendentes + vencidos, não arquivados)
// ============================================================

function criarAbaAVencer(boletos, periodoInicio, periodoFim) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  let lista = boletos.filter((b) => !b.pago && !b.arquivado);

  if (periodoInicio) {
    lista = lista.filter((b) => {
      const d = converterData(b.vencimento);
      return d && d >= periodoInicio;
    });
  }
  if (periodoFim) {
    const fim = new Date(periodoFim);
    fim.setHours(23, 59, 59, 999);
    lista = lista.filter((b) => {
      const d = converterData(b.vencimento);
      return d && d <= fim;
    });
  }

  lista.sort((a, b) => {
    const da = converterData(a.vencimento);
    const db = converterData(b.vencimento);
    if (!da) return 1;
    if (!db) return -1;
    return da - db;
  });

  const cabecalho = [
    "Empresa",
    "CNPJ",
    "Descrição",
    "Nota Fiscal (NF)",
    "Valor (R$)",
    "Vencimento",
    "Status",
  ];

  const linhas = lista.map((b) => {
    const data = converterData(b.vencimento);
    return [
      b.empresa || "-",
      b.cnpj || "-",
      b.descricao && !b.descricao.startsWith("Fatura NF") ? b.descricao : "-",
      b.numeroNF || "-",
      formatarValor(b.valor),
      formatarDataBR(data),
      statusBoleto(b, hoje),
    ];
  });

  const totalValor = lista.reduce((acc, b) => acc + Number(b.valor || 0), 0);
  const linhaTotais = ["TOTAL", "", "", "", formatarValor(totalValor), "", `${lista.length} boleto(s)`];

  const dados = [cabecalho, ...linhas, linhaTotais];
  const ws = XLSX.utils.aoa_to_sheet(dados);

  // Largura das colunas
  ws["!cols"] = [
    { wch: 35 }, // Empresa
    { wch: 20 }, // CNPJ
    { wch: 28 }, // Descrição
    { wch: 18 }, // NF
    { wch: 16 }, // Valor
    { wch: 14 }, // Vencimento
    { wch: 12 }, // Status
  ];

  // Altura das linhas
  ws["!rows"] = [{ hpt: 22 }]; // cabeçalho mais alto

  aplicarEstilosCabecalho(ws, cabecalho, 0);
  linhas.forEach((_, i) => aplicarEstiloLinha(ws, cabecalho.length, i + 1, i % 2 === 1));
  aplicarEstiloTotal(ws, cabecalho.length, dados.length - 1);

  return { ws, total: lista.length };
}

// ============================================================
// Aba 2 — Boletos Arquivados
// ============================================================

function criarAbaArquivados(boletos) {
  const lista = boletos
    .filter((b) => b.arquivado)
    .sort((a, b) => {
      const da = a.dataPagamento ? new Date(a.dataPagamento + "T12:00:00") : new Date(0);
      const db = b.dataPagamento ? new Date(b.dataPagamento + "T12:00:00") : new Date(0);
      return db - da;
    });

  const cabecalho = [
    "Empresa",
    "CNPJ",
    "Descrição",
    "Nota Fiscal (NF)",
    "Valor Original (R$)",
    "Valor Pago (R$)",
    "Vencimento",
    "Data Pagamento",
    "Banco",
  ];

  const linhas = lista.map((b) => {
    const dataVenc = converterData(b.vencimento);
    const dataPago = b.dataPagamento
      ? formatarDataBR(new Date(b.dataPagamento + "T12:00:00"))
      : "-";

    return [
      b.empresa || "-",
      b.cnpj || "-",
      b.descricao && !b.descricao.startsWith("Fatura NF") ? b.descricao : "-",
      b.numeroNF || "-",
      formatarValor(b.valor),
      formatarValor(b.valorPago || b.valor),
      formatarDataBR(dataVenc),
      dataPago,
      b.banco || "-",
    ];
  });

  const totalOriginal = lista.reduce((acc, b) => acc + Number(b.valor || 0), 0);
  const totalPago = lista.reduce((acc, b) => acc + Number(b.valorPago || b.valor || 0), 0);
  const linhaTotais = [
    "TOTAL",
    "",
    "",
    "",
    formatarValor(totalOriginal),
    formatarValor(totalPago),
    "",
    "",
    `${lista.length} boleto(s)`,
  ];

  const dados = [cabecalho, ...linhas, linhaTotais];
  const ws = XLSX.utils.aoa_to_sheet(dados);

  ws["!cols"] = [
    { wch: 35 }, // Empresa
    { wch: 20 }, // CNPJ
    { wch: 28 }, // Descrição
    { wch: 18 }, // NF
    { wch: 20 }, // Valor Original
    { wch: 18 }, // Valor Pago
    { wch: 14 }, // Vencimento
    { wch: 16 }, // Data Pagamento
    { wch: 18 }, // Banco
  ];

  ws["!rows"] = [{ hpt: 22 }];

  aplicarEstilosCabecalho(ws, cabecalho, 0);
  linhas.forEach((_, i) => aplicarEstiloLinha(ws, cabecalho.length, i + 1, i % 2 === 1));
  aplicarEstiloTotal(ws, cabecalho.length, dados.length - 1);

  return { ws, total: lista.length };
}

// ============================================================
// Função principal exportada
// ============================================================

/**
 * Gera e baixa o arquivo Excel de backup.
 * @param {Array} boletos - Lista completa de boletos do Firestore
 * @param {Date|null} periodoInicio - Data de início do filtro (para aba A Vencer)
 * @param {Date|null} periodoFim - Data de fim do filtro (para aba A Vencer)
 */
export function exportarExcel(boletos, periodoInicio = null, periodoFim = null) {
  const wb = XLSX.utils.book_new();

  const { ws: wsAVencer } = criarAbaAVencer(boletos, periodoInicio, periodoFim);
  const { ws: wsArquivados } = criarAbaArquivados(boletos);

  XLSX.utils.book_append_sheet(wb, wsAVencer, "A Vencer");
  XLSX.utils.book_append_sheet(wb, wsArquivados, "Arquivados");

  const dataHoje = new Date().toISOString().substring(0, 10);
  const nomeArquivo = `backup_boletos_${dataHoje}.xlsx`;

  XLSX.writeFile(wb, nomeArquivo);
}

/**
 * Retorna estatísticas para preview antes de exportar.
 */
export function obterEstatisticas(boletos, periodoInicio = null, periodoFim = null) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  let aVencer = boletos.filter((b) => !b.pago && !b.arquivado);

  if (periodoInicio) {
    aVencer = aVencer.filter((b) => {
      const d = converterData(b.vencimento);
      return d && d >= periodoInicio;
    });
  }
  if (periodoFim) {
    const fim = new Date(periodoFim);
    fim.setHours(23, 59, 59, 999);
    aVencer = aVencer.filter((b) => {
      const d = converterData(b.vencimento);
      return d && d <= fim;
    });
  }

  const arquivados = boletos.filter((b) => b.arquivado);
  const vencidos = aVencer.filter((b) => {
    const d = converterData(b.vencimento);
    return d && d < hoje;
  });

  return {
    totalAVencer: aVencer.length,
    totalArquivados: arquivados.length,
    totalVencidos: vencidos.length,
    valorAVencer: aVencer.reduce((acc, b) => acc + Number(b.valor || 0), 0),
    valorArquivados: arquivados.reduce((acc, b) => acc + Number(b.valorPago || b.valor || 0), 0),
  };
}
