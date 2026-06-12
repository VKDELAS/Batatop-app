Batata Top — Guia do Projeto (CLAUDE.md)

Este documento fornece uma visão técnica estruturada para desenvolvedores e IAs que trabalham no projeto Batata Top, um aplicativo de delivery mobile focado em batatas recheadas.

1. Visão Geral

O Batata Top é um aplicativo mobile desenvolvido com Expo (SDK 54) e React Native. Ele serve como plataforma de delivery para a cidade de Iacanga-SP, permitindo aos usuários navegar por um cardápio dinâmico, gerenciar endereços de entrega e realizar pedidos. Atualmente, o foco do desenvolvimento está no aprimoramento visual (UI/UX), com planos futuros para integração de pagamentos via Mercado Pago.

Principais Funcionalidades

•
Cardápio Dinâmico: Listagem de produtos com filtros por categoria e busca textual.

•
Gestão de Endereços: Integração com ViaCEP para preenchimento automático e validação de entrega restrita a Iacanga-SP.

•
Carrinho de Compras: Gerenciamento de itens, quantidades e observações.

•
Autenticação: Sistema de login e cadastro integrado ao Supabase Auth.

•
Pedidos: Histórico de pedidos e fluxo de finalização (preparando terreno para gateway de pagamento).




2. Estrutura de Arquivos Explicada

Plain Text


Batatop-app/
├── app/                    # Rotas do Expo Router (File-based routing)
│   ├── auth/               # Telas de login e registro
│   ├── hooks/              # Hooks customizados para consumo de dados (Supabase)
│   ├── produto/            # Rota dinâmica [id].js para detalhes do produto
│   ├── _layout.js          # Layout raiz (Header global, TabBar e Context Providers)
│   ├── cardapio.js         # Tela principal de listagem e filtros
│   ├── cart.js             # Tela de visualização e edição do carrinho
│   ├── pedidos.js          # Tela de histórico de pedidos do usuário
│   └── addresses.js        # Gestão de endereços com regras de negócio geográficas
├── assets/                 # Recursos estáticos (imagens, logos, ícones)
├── constants/              # Configurações globais e Design System
│   └── theme.js            # Tokens de cores, tipografia, espaçamento e sombras
├── data/                   # Dados mockados (legado) para testes rápidos
├── utils/                  # Utilitários e Stores globais
│   ├── cartStore.js        # Store do carrinho (Observer pattern fora do React Context)
│   └── supabase.js         # Cliente e utilitários do Supabase
├── supabaseConfig.js       # Configuração das chaves de API do Supabase
├── package.json            # Dependências e scripts do projeto
└── tailwind.config.js      # Configuração do NativeWind (Tailwind CSS para RN)






3. Comandos Importantes

Instalação e Execução

Bash


# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento (Expo Go)
npx expo start

# Iniciar em plataformas específicas
npm run android
npm run ios
npm run web



Configuração de Ambiente

O projeto depende de um projeto Supabase ativo. As credenciais estão localizadas em supabaseConfig.js. Certifique-se de que as tabelas products, addresses e orders estejam configuradas no banco de dados.




4. Padrões e Convenções de Código

•
Estilização: Utiliza NativeWind (Tailwind CSS) para a maioria dos componentes, complementado por StyleSheet do React Native para animações complexas ou estilos dinâmicos.

•
Gerenciamento de Estado:

•
Carrinho: Usa um padrão de Subscription em utils/cartStore.js para manter o estado fora da árvore de componentes, evitando re-renders desnecessários.

•
Dados do Backend: Consumidos via Hooks customizados (app/hooks/) que encapsulam a lógica do Supabase.



•
Navegação: Baseada em arquivos através do Expo Router.

•
Layout Global: O arquivo app/_layout.js gerencia o Header animado (que esconde ao scrollar) e a Bottom Tab Bar.




5. Módulos e Sistemas Principais

Integração com Supabase

O app utiliza o Supabase como Backend-as-a-Service (BaaS).

•
Tabela products: Contém id, name, description, price, category, image_url, available.

•
Tabela addresses: Armazena endereços vinculados ao user_id.

•
Storage: Imagens de produtos são servidas pelo bucket público Products.

Regras de Negócio de Endereço (addresses.js)

•
Restrição Geográfica: O app valida se o endereço pertence a Iacanga-SP.

•
ViaCEP: Integração externa para buscar logradouros automaticamente a partir do CEP.

Fluxo de Carrinho e Pagamentos (Roadmap)

O carrinho aceita produtos e formata os preços para precoNum (inteiro/float para cálculos) e precoFormatado (string para UI).

•
Estado Atual: O fluxo de finalização está sendo estruturado visualmente.

•
Próximos Passos: Integração com a API do Mercado Pago para processamento de pagamentos diretamente no app, substituindo qualquer fluxo manual anterior.




6. Informações Relevantes para Manutenção

•
Foco Atual (UI/UX): O desenvolvimento está concentrado no refinamento visual. Qualquer alteração visual global deve ser feita em constants/theme.js para manter a consistência do Design System.

•
Imagens: O app possui fallbacks de imagem baseados na categoria do produto (definidos em app/cardapio.js).

•
Dívida Técnica: Existem duas implementações de carrinho e pedidos (uma via Context e outra via Store externa). A versão ativa recomendada utiliza utils/cartStore.js e as rotas dentro da pasta app/.

•
Integração Futura: Ao implementar o Mercado Pago, será necessário criar um backend/função serverless (ex: Supabase Edge Functions) para gerar as preferências de pagamento de forma segura, não expondo chaves privadas no frontend.

