export function extractJsSrcOrder(template) {
  const scriptSrcRegex = /<script\s+src="([^"]+)"><\/script>/g;
  const foundOrder = [];
  let match = null;

  while ((match = scriptSrcRegex.exec(template)) !== null) {
    const src = match[1];
    if (src.startsWith('src/js/')) {
      foundOrder.push(src);
    }
  }

  return foundOrder;
}

export function validateJsOrder(template, expectedOrder) {
  const foundOrder = extractJsSrcOrder(template);

  if (foundOrder.length !== expectedOrder.length) {
    throw new Error(
      `JS script count mismatch in index-src.html. expected=${expectedOrder.length}, found=${foundOrder.length}\n` +
      `expected: ${expectedOrder.join(', ')}\n` +
      `found: ${foundOrder.join(', ')}`
    );
  }

  for (let i = 0; i < expectedOrder.length; i++) {
    if (foundOrder[i] !== expectedOrder[i]) {
      throw new Error(
        `JS script order mismatch at index ${i}.\n` +
        `expected: ${expectedOrder.join(' -> ')}\n` +
        `found: ${foundOrder.join(' -> ')}`
      );
    }
  }
}
