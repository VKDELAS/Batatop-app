import { supabase } from '../utils/supabase';

// Local official fallback products if Supabase fails or is offline
export const produtosLocais = [
  {
    id: '1',
    categoria: 'Batatas Recheadas',
    nome: 'Batata de Hot Dog',
    descricao: 'Batata recheada, molho especial de salsicha, requeijão cremoso, mussarela, bacon, batata palha',
    preco: 'R$ 25,99',
    precoNum: 25.99,
    ranking: 1,
    destaque: true,
    imagem: 'https://batatop.vercel.app/products/batata-hotdog.jpg',
  },
  {
    id: '2',
    categoria: 'Batatas Recheadas',
    nome: 'Brócolis com Bacon',
    descricao: 'Batata recheada, molho especial com brócolis, bacon, requeijão, mussarela e batata palha',
    preco: 'R$ 26,99',
    precoNum: 26.99,
    ranking: 2,
    destaque: true,
    imagem: 'https://batatop.vercel.app/products/brocolis-com-bacon.jpg',
  },
  {
    id: '3',
    categoria: 'Batatas Recheadas',
    nome: 'Calabresa Especial',
    descricao: 'Batata com molho cremoso de calabresa, requeijão cremoso, bacon e batata palha',
    preco: 'R$ 25,99',
    precoNum: 25.99,
    ranking: 3,
    destaque: true,
    imagem: 'https://batatop.vercel.app/products/calabresa-especial.jpg',
  },
  {
    id: '4',
    categoria: 'Massas',
    nome: 'Bolonhesa',
    descricao: 'Macarrão, molho vermelho com carne moída e queijo ralado',
    preco: 'R$ 27,99',
    precoNum: 27.99,
    ranking: null,
    destaque: false,
    imagem: 'https://batatop.vercel.app/products/macarrao-bolonhesa.jpg',
  },
  {
    id: '5',
    categoria: 'Massas',
    nome: 'Brócolis com Bacon',
    descricao: 'Macarrão e molho com brócolis, bacon e queijo ralado',
    preco: 'R$ 27,99',
    precoNum: 27.99,
    ranking: null,
    destaque: false,
    imagem: 'https://batatop.vercel.app/products/macarrao-brocolis-bacon.jpg',
  },
  {
    id: '6',
    categoria: 'Massas',
    nome: 'Filé ao Alho',
    descricao: 'Macarrão, molho especial de filé mignon, queijo ralado e alho frito',
    preco: 'R$ 29,99',
    precoNum: 29.99,
    ranking: null,
    destaque: false,
    imagem: 'https://batatop.vercel.app/products/macarrao-file-ao-alho.jpg',
  },
];

// Helper to map DB categories to client display labels
const mappingCategorias = {
  batata: 'Batatas Recheadas',
  macarrao: 'Massas',
  bebida: 'Bebidas',
};

// Global in-memory cache to share fetched Supabase products across screens
let productsCache = [];

export function setProductsCache(list) {
  productsCache = list;
}

export function getProductsCache() {
  return productsCache.length > 0 ? productsCache : null;
}

export function getProdutoById(id) {
  // Search in memory cache first, then in fallback list
  const cached = productsCache.find((p) => p.id === id);
  if (cached) return cached;
  return produtosLocais.find((p) => p.id === id);
}

export async function fetchSupabaseProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('available', true);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    const mapped = data.map((item) => {
      let ranking = null;
      let destaque = false;

      // Match site rankings dynamically by name
      if (item.name === 'Batata de Hot Dog') {
        ranking = 1;
        destaque = true;
      } else if (item.name === 'Brócolis com Bacon' && item.category === 'batata') {
        ranking = 2;
        destaque = true;
      } else if (item.name === 'Calabresa Especial') {
        ranking = 3;
        destaque = true;
      }

      // Ensure the image URL is absolute (points to your web host)
      const image = item.image_url.startsWith('/')
        ? `https://batatop.vercel.app${item.image_url}`
        : item.image_url;

      // Format price to local BRL currency format
      const priceVal = parseFloat(item.price) || 0;
      const precoStr = `R$ ${priceVal.toFixed(2).replace('.', ',')}`;

      return {
        id: item.id.toString(),
        categoria: mappingCategorias[item.category] || item.category,
        nome: item.name,
        descricao: item.description,
        preco: precoStr,
        precoNum: priceVal,
        ranking,
        destaque,
        imagem: image,
      };
    });

    // Save in cache
    productsCache = mapped;
    return mapped;
  } catch (err) {
    console.warn('Erro ao consultar Supabase. Usando fallback local:', err);
    // If the call fails, we populate the cache with local data so the app continues working offline
    productsCache = produtosLocais;
    return produtosLocais;
  }
}
