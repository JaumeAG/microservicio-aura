// Mock muy simple: detecta "baja el precio del producto <id> a <precio>"
export async function interpretInstructionMock(userInput) {
  // normaliza el texto
  const txt = String(userInput).toLowerCase();

  // expresión regular para capturar "producto <id> ... <precio>"
  const re = /producto\s+(\d+).*?([0-9]+(?:[.,][0-9]{1,2})?)/i;
  const match = txt.match(re);

  if (match) {
    const product_id = parseInt(match[1], 10);
    const new_price = parseFloat(match[2].replace(",", "."));
    return {
      name: "update_product_price",
      arguments: { product_id, new_price }
    };
  }

  // fallback: pedir aclaración si no detecta nada
  return {
    name: null,
    content:
      "No he entendido a qué producto o precio te refieres. ¿Puedes indicar 'producto <id> a <precio>'?"
  };
}
