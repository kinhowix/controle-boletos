export function lerXMLNFe(textoXML) {

  const parser = new DOMParser();

  const xml = parser.parseFromString(
    textoXML,
    "text/xml"
  );

  function get(tag) {
    const el = xml.getElementsByTagName(tag)[0];
    return el ? el.textContent : "";
  }

  const cnpj = get("CNPJ");

  const razao = get("xNome");

  const valor = get("vNF");

  const numero = get("nNF");

  const data = get("dhEmi") || get("dEmi");

  return {
    cnpj,
    razao,
    valor,
    numero,
    data,
  };
}