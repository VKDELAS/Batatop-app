# Batata Top — Guia do Projeto (CLAUDE.md)

> Documentação técnica para desenvolvedores e IAs que trabalham no projeto **Batata Top** — app mobile de delivery focado em batatas recheadas, para a cidade de **Iacanga-SP**.

---

## 1. Visão Geral

O Batata Top é um aplicativo mobile desenvolvido com **Expo (SDK 54)** e **React Native**. Utiliza **Expo Router v6** para navegação baseada em arquivos (file-based routing) e **Supabase** como Backend-as-a-Service.

O backend de pagamentos é uma API separada hospedada na **Vercel** (`https://batatatop.vercel.app`), que intermedia todas as chamadas sensíveis ao Mercado Pago (mantendo o Access Token seguro no servidor).

### Principais Funcionalidades

- **Home / Tela Inicial (`app/index.js`)**: Destaques, cupons de desconto e acesso rápido ao cardápio. Inclui componente de cópia de cupom com feedback visual/haptics.
- **Cardápio (`app/cardapio.js`)**: Listagem de produtos com filtros por categoria e busca textual.
- **Produto (`app/produto/[id].js`)**: Detalhe do produto com seleção de adicionais e observações.
- **Carrinho (`app/cart.js`)**: Visualização, edição de quantidades e remoção de itens.
- **Checkout (`app/checkout.tsx`)**: Fluxo completo de finalização de pedido — endereço, tipo de entrega (delivery ou retirada), método de pagamento (Dinheiro, PIX, Cartão de Crédito, Cartão de Débito), integração com Mercado Pago (Checkout Transparente) e cartões salvos.
- **Pedidos (`app/pedidos.js` + `app/pedidos/[id].js`)**: Histórico de pedidos do usuário com detalhe por pedido.
- **Perfil (`app/profile.js`)**: Dados do usuário, endereço padrão, método de pagamento preferido, cartões salvos e logout. Sub-telas em `app/profile-data.js` e `app/profile-security.js`.
- **Endereços (`app/addresses.js`)**: Gestão de endereços com integração ViaCEP e validação geográfica (somente Iacanga-SP).
- **Admin (`app/admin/`)**: Painel administrativo protegido com dashboard, gestão de pedidos, produtos, cupons, promoções, caixa, feedbacks e imagens.
- **Autenticação (`app/auth/`)**: Telas de login (`login.js`) e cadastro (`register.js`) via Supabase Auth.

---

## 2. Estrutura de Arquivos

```
batata-top/
├── app/                          # Rotas do Expo Router (file-based routing)
│   ├── _layout.js                # Layout raiz: Header animado, TabBar, Contexts globais
│   ├── index.js                  # Home: destaques, cupons, produtos em destaque
│   ├── cardapio.js               # Listagem de produtos com filtros e busca
│   ├── cart.js                   # Carrinho de compras
│   ├── checkout.tsx              # Fluxo de finalização do pedido (TypeScript)
│   ├── pedidos.js                # Histórico de pedidos do usuário
│   ├── addresses.js              # Gestão de endereços (ViaCEP + validação Iacanga-SP)
│   ├── profile.js                # Perfil do usuário, cartões e método de pagamento
│   ├── profile-data.js           # Edição de nome e dados pessoais
│   ├── profile-security.js       # Alteração de senha
│   ├── auth/
│   │   ├── login.js              # Tela de login
│   │   └── register.js           # Tela de cadastro
│   ├── produto/
│   │   └── [id].js               # Detalhe do produto (adicionais, observações)
│   ├── pedidos/
│   │   └── [id].js               # Detalhe de um pedido específico
│   ├── hooks/
│   │   ├── useProdutos.js        # Hooks de produtos: useProdutos, useProdutoById,
│   │   │                         #   useProdutosPorCategoria, useBuscarProdutos
│   │   └── usePedidos.js         # Hook de pedidos: criarPedido, buscarPedidos...
│   └── admin/
│       ├── _layout.js            # Layout da área admin
│       ├── index.js              # Dashboard: status da loja, pedidos do dia, receita
│       ├── pedidos.js            # Gerenciamento de pedidos (admin)
│       ├── produtos.js           # Cadastro/edição de produtos
│       ├── cupons.js             # Gerenciamento de cupons de desconto
│       ├── promocoes.js          # Gerenciamento de promoções
│       ├── caixa.js              # Controle de caixa
│       ├── feedbacks.js          # Visualização de feedbacks
│       └── imagens.js            # Upload/gestão de imagens de produtos
├── components/
│   └── PaymentMethodModal.js     # Modal de seleção de método de pagamento (perfil)
├── constants/
│   └── theme.js                  # Design System: COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS
├── utils/
│   ├── cartStore.js              # Store do carrinho (Observer pattern) + hook useCart()
│   ├── mercadoPago.js            # Integração Mercado Pago: tokenização (client) + chamadas ao backend (Vercel)
│   ├── usePaymentCards.ts        # Hook de cartões salvos: listar, salvar e remover (TypeScript)
│   ├── paymentPrefs.js           # Persistência de método/cartão preferido via expo-secure-store
│   ├── notificationSound.js      # Som de novo pedido (expo-audio) para painel admin
│   └── supabase.js               # Re-exporta o cliente Supabase (use supabaseConfig.js diretamente)
├── assets/
│   └── sounds/
│       └── new-order.mp3         # Som de alerta de novo pedido (admin)
├── supabaseConfig.js             # Cria e exporta o cliente Supabase (usa variáveis de ambiente)
├── .env                          # Variáveis de ambiente (não commitar!)
├── package.json
├── app.json
├── babel.config.js
├── metro.config.js
└── tsconfig.json
```

---

## 3. Variáveis de Ambiente (`.env`)

O projeto usa o prefixo `EXPO_PUBLIC_` para expor variáveis ao cliente React Native.

| Variável | Descrição |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima (pública) do Supabase |
| `EXPO_PUBLIC_MERCADO_PAGO_PUBLIC_KEY` | Public Key do Mercado Pago (Checkout Transparente) |
| `EXPO_PUBLIC_API_BASE_URL` | URL base da API Vercel (`https://batatatop.vercel.app`) |

> **Atenção:** O Access Token do Mercado Pago **nunca** é exposto no app. Ele fica exclusivamente na API Vercel.

---

## 4. Comandos

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npx expo start

# Plataformas específicas
npm run android
npm run ios
npm run web
```

---

## 5. Arquitetura e Padrões

### Navegação
- **Expo Router v6** com file-based routing.
- O arquivo `app/_layout.js` é o layout raiz e gerencia:
  - **Header global animado** que se esconde ao rolar (via `ScrollYContext`).
  - **Bottom Tab Bar** customizada.
  - **Drawer Menu Lateral** animado.
  - **`NavContext`**: controla a animação de transição entre telas.
  - **`ScrollYContext`**: compartilha o `Animated.Value` do scroll e a função `resetHeader()`.
  - **`HeaderHeightContext`**: compartilha a altura real do header para que as telas apliquem o `paddingTop` correto.

**Como usar nas telas:**
```js
import { useScrollHandler, useHeaderHeight } from './_layout';

const { onScroll, resetHeader } = useScrollHandler();
const headerHeight = useHeaderHeight();

// No ScrollView:
// onScroll={onScroll}
// scrollEventThrottle={16}
// contentContainerStyle={{ paddingTop: headerHeight }}

// Em useFocusEffect para restaurar o header ao voltar:
useFocusEffect(useCallback(() => { resetHeader(); }, [resetHeader]));
```

### Gerenciamento de Estado

**Carrinho (`utils/cartStore.js`):**
- Implementa o padrão Observer com `Set` de listeners.
- `cartStore` é o objeto singleton com métodos: `getCart`, `subscribe`, `addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`, `getCartCount`, `getCartTotal`.
- O hook `useCart()` encapsula o `subscribe` e retorna `{ items, count, total, add, remove, updateQty, clear }`.
- O `cartItemId` é gerado como `${product.id}-${adIds}-${observacoes}` para distinguir o mesmo produto com adicionais/observações diferentes.

**Dados do Backend:**
- Hooks customizados em `app/hooks/` encapsulam a lógica do Supabase.
- `useProdutos.js` exporta: `useProdutos`, `useProdutoById`, `useProdutosPorCategoria`, `useBuscarProdutos`.
- `usePedidos.js` exporta: `usePedidos` com métodos `criarPedido`, `buscarPedidosPorUsuario`, `buscarPedidoPorId`, `atualizarStatusPedido`.

**Cartões Salvos (`utils/usePaymentCards.ts`):**
- Hook TypeScript `usePaymentCards()` que gerencia cartões do Mercado Pago vinculados ao usuário Supabase.
- Garante customer único no MP (`ensureCustomerId`), tokeniza no client via Public Key, salva na tabela `payment_cards` do Supabase.

**Preferências de Pagamento (`utils/paymentPrefs.js`):**
- Persiste método preferido e `card_id` preferido usando `expo-secure-store`.
- Funções: `getPreferredPaymentMethod`, `setPreferredPaymentMethod`, `getPreferredCardId`, `setPreferredCardId`.

### Estilização
- **`StyleSheet` do React Native** para todos os componentes (sem NativeWind/Tailwind).
- **`constants/theme.js`** é a fonte única de verdade do Design System. Sempre importar daqui, nunca hardcodar valores de cor/espaçamento.
- Paleta: Amarelo `#FFB800` (primária), Vermelho `#E61E2A` (secundária), fundo branco.

---

## 6. Banco de Dados Supabase

### Tabelas principais

| Tabela | Descrição |
|---|---|
| `products` | Produtos do cardápio: `id`, `name`, `description`, `price`, `category`, `image_url`, `available` |
| `orders` | Pedidos: `id`, `order_number`, `user_id`, `customer_name`, `customer_phone`, `customer_address`, `customer_neighborhood`, `customer_complement`, `payment_method`, `delivery_type`, `total_amount`, `discount_amount`, `coupon_code`, `status`, `notes`, `metadata`, `created_at` |
| `order_items` | Itens de um pedido: `product_id`, `product_name`, `product_price`, `quantity`, `adicionais`, `pasta_type` |
| `addresses` | Endereços dos usuários: vinculados ao `user_id` |
| `payment_cards` | Cartões salvos: `user_id`, `mp_customer_id`, `mp_card_id`, `last_four`, `payment_method_id`, `card_type`, `cardholder_name`, `is_default` |
| `store_settings` | Configurações da loja (ex: `store_status`) |
| `coupons` | Cupons de desconto |

### Storage
- Bucket público **`Products`**: imagens dos produtos.
- URL pública base: `https://eucwoxjmjfqylyrqunwk.supabase.co/storage/v1/object/public/Products/`

### Status de Pedidos
`pending` → `preparing` → `ready` → `delivered` / `cancelled`

---

## 7. Integração Mercado Pago (Checkout Transparente)

A integração segue o modelo de segurança recomendado pelo Mercado Pago:

```
App (client) ──► API Vercel (server) ──► Mercado Pago API
      │                                         │
 Public Key                              Access Token
 (tokenização)                          (cobrança)
```

**Fluxos disponíveis (`utils/mercadoPago.js`):**

| Função | Descrição |
|---|---|
| `tokenizeCard(...)` | Tokeniza dados de cartão novo direto na API do MP (Public Key, client-side) |
| `tokenizeSavedCardCvv(...)` | Tokeniza CVV de cartão já salvo (Public Key, client-side) |
| `createPixPayment(...)` | Cria pagamento PIX via backend Vercel |
| `createCardPayment(...)` | Cria cobrança no cartão via backend Vercel |
| `createPaymentPreference(...)` | Cria preferência de checkout via backend Vercel |
| `createCustomer(...)` | Cria customer no MP via backend Vercel |
| `saveCardToCustomer(...)` | Associa token de cartão a um customer no MP via backend Vercel |
| `deleteCustomerCard(...)` | Remove cartão de um customer no MP via backend Vercel |
| `chargeWithSavedCard(...)` | Tokeniza CVV client-side, depois chama `createCardPayment` |
| `guessPaymentMethodId(...)` | Detecta a bandeira do cartão pelo número (Visa, Master, Elo, etc.) |

**Rotas da API Vercel** (`/api/mercadopago/`):
`preference`, `pix`, `card-payment`, `customer`, `save-card`, `delete-card`

---

## 8. Som de Notificação (Admin)

`utils/notificationSound.js` usa **expo-audio** para tocar `assets/sounds/new-order.mp3` quando um novo pedido chega no painel admin.

- `configureNotificationAudio()`: configura o áudio para tocar mesmo no modo silencioso (iOS). Chamado em `app/_layout.js` na inicialização.
- `playNewOrderSound(loopCount)`: toca o som N vezes em sequência.
- `stopNewOrderSound()`: pausa o som.
- Fallback web: sintetiza beeps via Web Audio API.

---

## 9. Regras de Negócio Importantes

- **Restrição Geográfica de Entrega**: O app só aceita endereços em **Iacanga-SP** (validado em `app/addresses.js` via ViaCEP).
- **Tipo de Entrega**: O checkout suporta `"delivery"` (com endereço) e `"retirada"` (sem endereço, sem taxa).
- **Cupons**: Aplicados no checkout com validação no Supabase (tabela `coupons`). O desconto é salvo em `orders.discount_amount` e `orders.coupon_code`.
- **Adicionais**: Selecionados na tela do produto (`app/produto/[id].js`) e persistidos no carrinho via `adicionais[]` no item. O `cartItemId` distingue combinações diferentes do mesmo produto.
- **Segurança de Pagamento**: O Access Token do Mercado Pago **nunca** vai ao app. Toda operação sensível passa pelo backend Vercel.

---

## 10. Informações para Manutenção

- **Design System**: Qualquer mudança visual global deve ser feita em `constants/theme.js`. Nunca hardcodar cores ou espaçamentos.
- **Imagens de Produtos**: Construídas dinamicamente em `app/hooks/useProdutos.js`. Se `image_url` não começa com `http`, é completada com a URL base do bucket Supabase.
- **TypeScript**: O projeto usa JS + TS mistos. `checkout.tsx` e `utils/usePaymentCards.ts` são TypeScript. Os demais arquivos são JavaScript.
- **Sem NativeWind/Tailwind**: O projeto **não usa** NativeWind. A estilização é 100% via `StyleSheet` do React Native + tokens do `theme.js`.
- **Admin**: O acesso ao painel admin (`/admin`) não tem proteção no roteamento — a proteção deve ser feita via RLS no Supabase ou verificação de `user_metadata.role` no próprio componente.
- **`utils/supabase.js`**: Apenas re-exporta de `supabaseConfig.js`. Prefira importar diretamente de `../supabaseConfig` para evitar ambiguidade.
