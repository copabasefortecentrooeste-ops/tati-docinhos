/**
 * Dados de seed — usados pelos stores como valor inicial e como fallback offline.
 * NÃO importar diretamente nas páginas; use os stores (useProductsStore, etc.)
 */
import type { Category, Product, DeliveryNeighborhood, Coupon, BusinessHours, StoreConfig } from '@/types';

import heroBrigadeiros from '@/assets/hero-brigadeiros.jpg';
import productBentoCake from '@/assets/product-bento-cake.jpg';
import productCombo from '@/assets/product-combo.jpg';
import productTrufa from '@/assets/product-trufa.jpg';
import productTortaLimao from '@/assets/product-torta-limao.jpg';
import productRedVelvet from '@/assets/product-red-velvet.jpg';
import productBemCasado from '@/assets/product-bem-casado.jpg';
import productKitFesta from '@/assets/product-kit-festa.jpg';

export const storeConfig: StoreConfig = {
  name: 'Taty Docinhos',
  phone: '(11) 99999-8888',
  instagram: '@tatydocinhos',
  address: 'Rua das Flores, 123 - Centro',
  pixKey: 'pix@tatydocinhos.com.br',
  deliveryPolicy: 'Entregamos em até 60 minutos para o centro. Pedidos acima de R$ 100 têm frete grátis!',
  deliveryMode: 'city_only',
  defaultCity: 'Pitangui',
  defaultState: 'MG',
  defaultCep: '35650-000',
  manualStatus: null,
  blockOrdersOutsideHours: false,
  closedMessage: 'Estamos fechados no momento. Volte em breve! 🍬',
  operationalMessage: '',
};

export const categories: Category[] = [
  { id: '1', name: 'Brigadeiros Gourmet', slug: 'brigadeiros', image: heroBrigadeiros, description: 'Feitos com chocolate belga' },
  { id: '2', name: 'Bolos & Bento Cakes', slug: 'bolos', image: productBentoCake, description: 'Perfeitos para presentear' },
  { id: '3', name: 'Doces Finos', slug: 'doces-finos', image: productTrufa, description: 'Para eventos especiais' },
  { id: '4', name: 'Combos & Kits', slug: 'combos', image: productCombo, description: 'Monte sua caixa' },
  { id: '5', name: 'Tortas', slug: 'tortas', image: productTortaLimao, description: 'Fatias ou inteiras' },
];

export const products: Product[] = [
  {
    id: '1', name: 'Brigadeiro Belga Tradicional', description: 'Brigadeiro gourmet feito com chocolate belga 54% cacau, finalizado com granulado fino importado. Derrete na boca.', basePrice: 5.00, image: heroBrigadeiros, categoryId: '1', minQuantity: 6, featured: true, bestSeller: true,
    options: [
      { id: 'sab1', name: 'Sabor', type: 'flavor', choices: [
        { id: 'trad', name: 'Tradicional', priceAdd: 0 },
        { id: 'nbr', name: 'Ninho com Nutella', priceAdd: 1.5 },
        { id: 'pst', name: 'Pistache', priceAdd: 2 },
        { id: 'mrj', name: 'Maracujá', priceAdd: 1 },
        { id: 'cfe', name: 'Café', priceAdd: 1 },
      ]},
    ],
  },
  {
    id: '2', name: 'Bento Cake Personalizado', description: 'Mini bolo estilo coreano, decorado à mão com mensagem personalizada. Ideal para surpreender alguém especial. Serve 2 pessoas.', basePrice: 65.00, image: productBentoCake, categoryId: '2', minQuantity: 1, featured: true, bestSeller: true,
    options: [
      { id: 'massa', name: 'Massa', type: 'flavor', choices: [
        { id: 'choc', name: 'Chocolate', priceAdd: 0 },
        { id: 'baun', name: 'Baunilha', priceAdd: 0 },
        { id: 'rvel', name: 'Red Velvet', priceAdd: 10 },
      ]},
      { id: 'rech', name: 'Recheio', type: 'flavor', choices: [
        { id: 'nbrig', name: 'Brigadeiro', priceAdd: 0 },
        { id: 'nnut', name: 'Nutella', priceAdd: 8 },
        { id: 'nnin', name: 'Ninho', priceAdd: 5 },
      ]},
    ],
  },
  {
    id: '3', name: 'Combo Felicidade', description: '12 brigadeiros gourmet sortidos em caixa premium. Perfeito para presentear ou adoçar a semana. Inclui 4 sabores.', basePrice: 55.00, image: productCombo, categoryId: '4', minQuantity: 1, featured: true, bestSeller: false,
    options: [],
  },
  {
    id: '4', name: 'Trufa de Chocolate Amargo', description: 'Trufa artesanal com ganache de chocolate 70% cacau, finalizada com cacau em pó holandês.', basePrice: 8.00, image: productTrufa, categoryId: '3', minQuantity: 4, featured: false, bestSeller: true,
    options: [
      { id: 'cob4', name: 'Cobertura', type: 'topping', choices: [
        { id: 'cacau', name: 'Cacau em pó', priceAdd: 0 },
        { id: 'amar', name: 'Amêndoas', priceAdd: 2 },
        { id: 'coco', name: 'Coco ralado', priceAdd: 1 },
      ]},
    ],
  },
  {
    id: '5', name: 'Torta de Limão Siciliano', description: 'Base crocante de biscoito, creme de limão siciliano e merengue italiano maçaricado. Fatia generosa.', basePrice: 18.00, image: productTortaLimao, categoryId: '5', minQuantity: 1, featured: false, bestSeller: false,
    options: [],
  },
  {
    id: '6', name: 'Kit Festa 50 Docinhos', description: 'Seleção de 50 docinhos finos sortidos: beijinho, cajuzinho, brigadeiro, bicho de pé e olho de sogra.', basePrice: 120.00, image: productKitFesta, categoryId: '4', minQuantity: 1, featured: true, bestSeller: false,
    options: [],
  },
  {
    id: '7', name: 'Bolo Red Velvet 1kg', description: 'Bolo Red Velvet com cream cheese artesanal. Decoração clássica. Serve até 10 pessoas.', basePrice: 95.00, image: productRedVelvet, categoryId: '2', minQuantity: 1, featured: false, bestSeller: false,
    options: [
      { id: 'tam7', name: 'Tamanho', type: 'size', choices: [
        { id: '1kg', name: '1kg', priceAdd: 0 },
        { id: '2kg', name: '2kg', priceAdd: 75 },
      ]},
    ],
  },
  {
    id: '8', name: 'Bem-Casado Artesanal', description: 'Doce fino clássico, com massa amanteigada e recheio de doce de leite. Embalado individualmente.', basePrice: 6.00, image: productBemCasado, categoryId: '3', minQuantity: 10, featured: false, bestSeller: false,
    options: [],
  },
];

export const neighborhoods: DeliveryNeighborhood[] = [
  { id: '1', name: 'Centro', fee: 5.00, active: true },
  { id: '2', name: 'Jardim América', fee: 8.00, active: true },
  { id: '3', name: 'Vila Nova', fee: 10.00, active: true },
  { id: '4', name: 'Parque das Flores', fee: 12.00, active: true },
  { id: '5', name: 'Industrial', fee: 15.00, active: false },
];

export const coupons: Coupon[] = [
  { id: '1', code: 'DOCE10', type: 'percentage', value: 10, active: true, minOrder: 50 },
  { id: '2', code: 'FRETE0', type: 'fixed', value: 8, active: true },
  { id: '3', code: 'PRIMEIRA', type: 'percentage', value: 15, active: true, minOrder: 30 },
];

export const businessHours: BusinessHours[] = [
  { id: '1', dayOfWeek: 1, openTime: '09:00', closeTime: '18:00', active: true },
  { id: '2', dayOfWeek: 2, openTime: '09:00', closeTime: '18:00', active: true },
  { id: '3', dayOfWeek: 3, openTime: '09:00', closeTime: '18:00', active: true },
  { id: '4', dayOfWeek: 4, openTime: '09:00', closeTime: '18:00', active: true },
  { id: '5', dayOfWeek: 5, openTime: '09:00', closeTime: '20:00', active: true },
  { id: '6', dayOfWeek: 6, openTime: '10:00', closeTime: '16:00', active: true },
  { id: '7', dayOfWeek: 0, openTime: '00:00', closeTime: '00:00', active: false },
];
