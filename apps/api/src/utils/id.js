let counter = 0;

export function generateId(prefix) {
  counter = (counter + 1) % 10000;
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${Date.now()}_${counter}_${rand}`;
}
