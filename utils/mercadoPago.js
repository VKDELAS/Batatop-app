export const MERCADO_PAGO_PUBLIC_KEY = 'APP_USR-219bf65f-e99a-441f-a907-7ef051e9ed52';

// O Access Token de produção ou de teste deve ser inserido aqui para habilitar a API do Mercado Pago.
// Se estiver vazio, o app usará um fluxo de simulação de sandbox/teste.
export let MERCADO_PAGO_ACCESS_TOKEN = '';

export function setAccessToken(token) {
  MERCADO_PAGO_ACCESS_TOKEN = token;
}

/**
 * Cria uma preferência de pagamento (Checkout Pro) no Mercado Pago.
 * Retorna o link de redirecionamento (sandbox ou produção).
 */
export async function createPaymentPreference(amount, orderNumber, itemsList = []) {
  const token = MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) {
    // Se não houver token configurado, retorna uma simulação de sucesso
    return {
      success: true,
      simulation: true,
      checkoutUrl: 'https://sandbox.mercadopago.com.br/checkout/congratulations',
    };
  }

  try {
    const items = itemsList.map(item => ({
      title: item.nome || 'Item do Pedido',
      quantity: item.quantity,
      unit_price: Number(item.precoNum) / 100,
      currency_id: 'BRL',
    }));

    if (items.length === 0) {
      items.push({
        title: `Pedido #${orderNumber}`,
        quantity: 1,
        unit_price: Number(amount),
        currency_id: 'BRL',
      });
    }

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items,
        external_reference: orderNumber,
        back_urls: {
          success: 'batatatop://pedidos',
          failure: 'batatatop://cart',
          pending: 'batatatop://pedidos',
        },
        auto_return: 'approved',
      }),
    });

    const data = await response.json();
    if (response.ok) {
      return {
        success: true,
        simulation: false,
        checkoutUrl: data.sandbox_init_point || data.init_point,
        preferenceId: data.id,
      };
    } else {
      return {
        success: false,
        error: data.message || 'Erro ao criar preferência de pagamento no Mercado Pago',
      };
    }
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Erro de conexão com o Mercado Pago',
    };
  }
}

/**
 * Cria um pagamento direto via PIX (Checkout Transparente).
 * Retorna a chave do Pix (Copia e Cola) e o QR Code em Base64.
 */
export async function createPixPayment(amount, email, name, orderNumber) {
  const token = MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) {
    // Simulação do PIX Sandbox se não houver Token
    return {
      success: true,
      simulation: true,
      qrCode: '00020101021226870014br.gov.bcb.pix2565pix-sandbox.mercadopago.com5204000053039865802BR5925BatataTopSimulation6009IacangaSP62070503***6304E5A8',
      qrCodeBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', // pixel branco simulado
      paymentId: '1234567890',
    };
  }

  try {
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': Math.random().toString(36).substring(7),
      },
      body: JSON.stringify({
        transaction_amount: Number(amount),
        description: `Pedido Batata Top #${orderNumber}`,
        payment_method_id: 'pix',
        external_reference: orderNumber,
        payer: {
          email: email || 'usuario_teste@testuser.com',
          first_name: name.split(' ')[0] || 'Cliente',
          last_name: name.split(' ').slice(1).join(' ') || 'Batatatop',
        },
      }),
    });

    const data = await response.json();
    if (response.ok) {
      return {
        success: true,
        simulation: false,
        qrCode: data.point_of_interaction.transaction_data.qr_code,
        qrCodeBase64: data.point_of_interaction.transaction_data.qr_code_base64,
        paymentId: data.id,
      };
    } else {
      return {
        success: false,
        error: data.message || 'Erro ao gerar pagamento PIX no Mercado Pago',
      };
    }
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Erro de conexão com o Mercado Pago',
    };
  }
}

/**
 * Tokeniza um cartão de crédito/débito utilizando a Public Key (Checkout Transparente).
 */
export async function tokenizeCard({
  cardNumber,
  expirationMonth,
  expirationYear,
  securityCode,
  cardholderName,
  docType = 'CPF',
  docNumber,
}) {
  try {
    const cleanCardNumber = cardNumber.replace(/\D/g, '');
    const cleanDocNumber = docNumber.replace(/\D/g, '');

    const response = await fetch(`https://api.mercadopago.com/v1/card_tokens?public_key=${MERCADO_PAGO_PUBLIC_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        card_number: cleanCardNumber,
        expiration_month: Number(expirationMonth),
        expiration_year: Number(expirationYear),
        security_code: securityCode,
        cardholder: {
          name: cardholderName,
          identification: {
            type: docType,
            number: cleanDocNumber,
          },
        },
      }),
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, token: data.id };
    } else {
      return { success: false, error: data.cause?.[0]?.description || data.message || 'Erro ao tokenizar dados do cartão' };
    }
  } catch (err) {
    return { success: false, error: err.message || 'Erro de conexão com o Mercado Pago' };
  }
}

/**
 * Cria um pagamento direto via Cartão de Crédito/Débito (Checkout Transparente).
 */
export async function createCardPayment({
  amount,
  token,
  paymentMethodId,
  email,
  name,
  docNumber,
  orderNumber,
}) {
  const accessToken = MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    // Simulação do Cartão Sandbox se não houver Token
    return {
      success: true,
      simulation: true,
      paymentId: 'card-simulated-123456',
      status: 'approved',
      statusDetail: 'accredited',
    };
  }

  try {
    const cleanDocNumber = docNumber.replace(/\D/g, '');
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': Math.random().toString(36).substring(7),
      },
      body: JSON.stringify({
        transaction_amount: Number(amount),
        token,
        description: `Pedido Batata Top #${orderNumber}`,
        installments: 1,
        payment_method_id: paymentMethodId,
        external_reference: orderNumber,
        payer: {
          email: email || 'usuario_teste@testuser.com',
          first_name: name.split(' ')[0] || 'Cliente',
          last_name: name.split(' ').slice(1).join(' ') || 'Batatatop',
          identification: {
            type: 'CPF',
            number: cleanDocNumber,
          },
        },
      }),
    });

    const data = await response.json();
    if (response.ok) {
      return {
        success: true,
        simulation: false,
        paymentId: data.id,
        status: data.status, // approved, in_process, rejected
        statusDetail: data.status_detail,
      };
    } else {
      return {
        success: false,
        error: data.message || 'Erro ao processar pagamento via cartão no Mercado Pago',
      };
    }
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Erro de conexão com o Mercado Pago',
    };
  }
}

/**
 * Cria um Customer no Mercado Pago para o usuário.
 * O Customer é o que permite salvar cartões e reutilizá-los depois,
 * sem precisar tokenizar e digitar tudo de novo a cada pedido.
 */
export async function createCustomer({ email, firstName, lastName }) {
  const token = MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) {
    // Simulação: gera um customer_id fake para permitir testar o fluxo todo
    return {
      success: true,
      simulation: true,
      customerId: `SIMULATED-CUSTOMER-${Math.random().toString(36).substring(2, 10)}`,
    };
  }

  try {
    const response = await fetch('https://api.mercadopago.com/v1/customers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        first_name: firstName || 'Cliente',
        last_name: lastName || 'Batatatop',
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, simulation: false, customerId: data.id };
    }

    // Se o customer já existir (e-mail duplicado), o MP retorna erro específico.
    // Nesse caso, buscamos o customer existente em vez de falhar.
    if (data.cause?.some((c) => c.code === 101 || c.code === '101')) {
      const existing = await findCustomerByEmail(email);
      if (existing.success) {
        return { success: true, simulation: false, customerId: existing.customerId };
      }
    }

    return {
      success: false,
      error: data.message || 'Erro ao criar cliente no Mercado Pago',
    };
  } catch (err) {
    return { success: false, error: err.message || 'Erro de conexão com o Mercado Pago' };
  }
}

/**
 * Busca um Customer existente pelo e-mail (usado como fallback quando
 * createCustomer encontra um customer duplicado).
 */
async function findCustomerByEmail(email) {
  const token = MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) {
    return { success: false, error: 'Sem access token configurado' };
  }

  try {
    const response = await fetch(
      `https://api.mercadopago.com/v1/customers/search?email=${encodeURIComponent(email)}`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );
    const data = await response.json();
    const customer = data.results?.[0];
    if (response.ok && customer) {
      return { success: true, customerId: customer.id };
    }
    return { success: false, error: 'Cliente não encontrado' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Associa um cartão tokenizado a um Customer do Mercado Pago.
 * O card_id retornado é permanente e pode ser reutilizado em
 * cobranças futuras, sem precisar tokenizar o cartão de novo.
 *
 * Importante: o token passado aqui deve ter sido gerado com
 * tokenizeCard() e, para salvar (e não apenas pagar uma vez),
 * é necessário tokenizar com a flag de cartão "para salvar" —
 * por isso reaproveitamos tokenizeCard normalmente.
 */
export async function saveCardToCustomer({ customerId, cardToken }) {
  const token = MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) {
    // Simulação: gera um card_id fake
    return {
      success: true,
      simulation: true,
      cardId: `SIMULATED-CARD-${Math.random().toString(36).substring(2, 10)}`,
    };
  }

  try {
    const response = await fetch(
      `https://api.mercadopago.com/v1/customers/${customerId}/cards`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: cardToken }),
      }
    );

    const data = await response.json();
    if (response.ok) {
      return {
        success: true,
        simulation: false,
        cardId: data.id,
        lastFour: data.last_four_digits,
        paymentMethodId: data.payment_method?.id,
      };
    }

    return {
      success: false,
      error: data.message || 'Erro ao salvar cartão no Mercado Pago',
    };
  } catch (err) {
    return { success: false, error: err.message || 'Erro de conexão com o Mercado Pago' };
  }
}

/**
 * Remove um cartão salvo de um Customer no Mercado Pago.
 */
export async function deleteCustomerCard({ customerId, cardId }) {
  const token = MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) {
    return { success: true, simulation: true };
  }

  try {
    const response = await fetch(
      `https://api.mercadopago.com/v1/customers/${customerId}/cards/${cardId}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );

    if (response.ok) {
      return { success: true, simulation: false };
    }
    const data = await response.json();
    return { success: false, error: data.message || 'Erro ao remover cartão' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Cobra usando um cartão já salvo no Customer (sem precisar tokenizar
 * de novo). A maioria dos emissores brasileiros exige o CVV mesmo
 * em cartão salvo, por segurança — por isso ainda pedimos o securityCode.
 *
 * O fluxo correto aqui é: tokenizar o CVV junto com o card_id salvo
 * (token "CVV-only"), e então criar o pagamento com esse token.
 */
export async function tokenizeSavedCardCvv({ cardId, securityCode }) {
  try {
    const response = await fetch(
      `https://api.mercadopago.com/v1/card_tokens?public_key=${MERCADO_PAGO_PUBLIC_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: cardId,
          security_code: securityCode,
        }),
      }
    );

    const data = await response.json();
    if (response.ok) {
      return { success: true, token: data.id };
    }
    return {
      success: false,
      error: data.cause?.[0]?.description || data.message || 'Erro ao validar CVV do cartão salvo',
    };
  } catch (err) {
    return { success: false, error: err.message || 'Erro de conexão com o Mercado Pago' };
  }
}

/**
 * Cobra com um cartão salvo: primeiro gera o token combinando
 * card_id + CVV, depois cria o pagamento normalmente.
 */
export async function chargeWithSavedCard({
  amount,
  cardId,
  securityCode,
  paymentMethodId,
  email,
  name,
  docNumber,
  orderNumber,
}) {
  const accessToken = MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    // Simulação completa, mesmo padrão do createCardPayment
    return {
      success: true,
      simulation: true,
      paymentId: 'saved-card-simulated-123456',
      status: 'approved',
      statusDetail: 'accredited',
    };
  }

  const tokenResult = await tokenizeSavedCardCvv({ cardId, securityCode });
  if (!tokenResult.success) {
    return { success: false, error: tokenResult.error };
  }

  return createCardPayment({
    amount,
    token: tokenResult.token,
    paymentMethodId,
    email,
    name,
    docNumber,
    orderNumber,
  });
}


export function guessPaymentMethodId(cardNumber) {
  const clean = cardNumber.replace(/\D/g, '');
  if (clean.startsWith('4')) return 'visa';
  if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)/.test(clean)) return 'master';
  if (/^(34|37)/.test(clean)) return 'amex';
  if (/^(4011|4312|4389|4514|4576|4573|5041|5067|5090|6277|6362|6363)/.test(clean)) return 'elo';
  if (/^(606282|3841)/.test(clean)) return 'hipercard';
  return 'visa'; // default fallback
}
