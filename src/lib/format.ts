/** Formata número como moeda BRL — R$ 1.234,56 */
export const formatPrice = (price: number) =>
  price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
