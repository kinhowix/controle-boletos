export function aplicarMascaraReal(valorStr) {
  if (!valorStr) return "";

  // Remove tudo que não for dígito
  let apenasDigitos = valorStr.replace(/\D/g, "");

  // Se ficou vazio, retorna vazio
  if (!apenasDigitos) return "";

  // Transforma em número considerando os 2 centavos
  const num = parseInt(apenasDigitos, 10);
  const valorFormatado = (num / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return valorFormatado;
}

export function parseReal(valorFormatado) {
  if (!valorFormatado) return 0;

  // Se já for número
  if (typeof valorFormatado === "number") return valorFormatado;

  // Remove pontos e troca vírgula por ponto para poder virar Number
  const limpo = valorFormatado
    .replace(/\./g, "")
    .replace(",", ".");

  return Number(limpo) || 0;
}

export function formatarReal(numero) {
  if (numero === null || numero === undefined || isNaN(numero)) {
    return "0,00";
  }

  return Number(numero).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
