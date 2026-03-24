/**
 * Remove any character that is not a digit from the given string.
 * This is used to clean the bank slip's "linha digitável".
 */
export function cleanLinhaDigitavel(texto) {
  if (!texto) return "";
  return String(texto).replace(/\D+/g, "");
}
