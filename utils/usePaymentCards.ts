import { useState, useCallback } from 'react';
import { supabase } from '../supabaseConfig';
import {
  createCustomer,
  tokenizeCard,
  saveCardToCustomer,
  deleteCustomerCard,
  guessPaymentMethodId,
} from './mercadoPago';

export type SavedCard = {
  id: string;
  user_id: string;
  mp_customer_id: string;
  mp_card_id: string;
  last_four: string;
  payment_method_id: string;
  card_type: "cartão de crédito" | "cartão de débito";
  cardholder_name: string;
  is_default: boolean;
  created_at?: string;
};

/**
 * Garante que o usuário tem um mp_customer_id.
 * Se ele já cadastrou algum cartão antes, reaproveita o customer_id
 * existente (evita criar customer duplicado no Mercado Pago a cada cartão).
 */
type CustomerResult = { success: boolean; customerId?: any; error?: string };

async function ensureCustomerId(user: any): Promise<CustomerResult> {
  const { data: existing } = await supabase
    .from('payment_cards')
    .select('mp_customer_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (existing?.mp_customer_id) {
    return { success: true, customerId: existing.mp_customer_id };
  }

  const fullName = user.user_metadata?.full_name || '';
  const [firstName, ...rest] = fullName.split(' ');

  return createCustomer({
    email: user.email,
    firstName: firstName || 'Cliente',
    lastName: rest.join(' ') || 'Batatatop',
  });
}

/**
 * Hook que centraliza toda a lógica de cartões salvos do usuário:
 * listar, salvar (tokeniza + associa ao customer + grava no Supabase)
 * e remover. Usado pelo perfil (cadastro) e pelo checkout (cobrança).
 */
export function usePaymentCards() {
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [savingCard, setSavingCard] = useState(false);

  const loadCards = useCallback(async (): Promise<SavedCard[]> => {
    setLoadingCards(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        setCards([]);
        return [];
      }

      const { data, error } = await supabase
        .from('payment_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar cartões salvos:', error);
        setCards([]);
        return [];
      }

      setCards((data as SavedCard[]) || []);
      return (data as SavedCard[]) || [];
    } finally {
      setLoadingCards(false);
    }
  }, []);

  /**
   * Cadastra um novo cartão:
   * 1. Tokeniza os dados digitados
   * 2. Garante que existe um Customer no Mercado Pago
   * 3. Associa o cartão tokenizado ao Customer (gera card_id permanente)
   * 4. Salva no Supabase só os dados de exibição (últimos 4 dígitos, bandeira)
   */
  const addCard = useCallback(async ({
    cardNumber,
    expirationMonth,
    expirationYear,
    securityCode,
    cardholderName,
    docNumber,
    cardType,
    setAsDefault,
  }: {
    cardNumber: string;
    expirationMonth: string;
    expirationYear: string;
    securityCode: string;
    cardholderName: string;
    docNumber: string;
    cardType: "cartão de crédito" | "cartão de débito";
    setAsDefault?: boolean;
  }) => {
    setSavingCard(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        return { success: false, error: 'Você precisa estar logado para salvar um cartão.' };
      }

      // 1. Tokeniza o cartão
      const tokenResult = await tokenizeCard({
        cardNumber,
        expirationMonth,
        expirationYear,
        securityCode,
        cardholderName,
        docNumber,
      });
      if (!tokenResult.success) {
        return { success: false, error: tokenResult.error };
      }

      // 2. Garante o customer
      const customerResult = await ensureCustomerId(user);
      if (!customerResult.success) {
        return { success: false, error: customerResult.error };
      }

      // 3. Associa o cartão ao customer
      const saveResult = await saveCardToCustomer({
        customerId: customerResult.customerId,
        cardToken: tokenResult.token,
      });
      if (!saveResult.success) {
        return { success: false, error: saveResult.error };
      }

      const lastFour = saveResult.simulation
        ? cardNumber.replace(/\D/g, '').slice(-4)
        : (saveResult.lastFour || cardNumber.replace(/\D/g, '').slice(-4));

      const paymentMethodId = saveResult.simulation
        ? guessPaymentMethodId(cardNumber)
        : (saveResult.paymentMethodId || guessPaymentMethodId(cardNumber));

      // Se for o primeiro cartão ou o usuário marcou como padrão,
      // remove o "padrão" dos outros antes de inserir
      if (setAsDefault) {
        await supabase
          .from('payment_cards')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      // 4. Grava no Supabase (nunca o número completo nem o CVV)
      const { data: inserted, error: insertError } = await supabase
        .from('payment_cards')
        .insert({
          user_id: user.id,
          mp_customer_id: customerResult.customerId,
          mp_card_id: saveResult.cardId,
          last_four: lastFour,
          payment_method_id: paymentMethodId,
          card_type: cardType,
          cardholder_name: cardholderName,
          is_default: !!setAsDefault,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Erro ao salvar cartão no Supabase:', insertError);
        return { success: false, error: 'Cartão validado, mas não foi possível salvá-lo. Tente novamente.' };
      }

      await loadCards();
      return { success: true, card: inserted as SavedCard };
    } catch (err) {
      console.error('Erro ao adicionar cartão:', err);
      return { success: false, error: 'Erro inesperado ao salvar o cartão.' };
    } finally {
      setSavingCard(false);
    }
  }, [loadCards]);

  const removeCard = useCallback(async (card: SavedCard) => {
    try {
      await deleteCustomerCard({ customerId: card.mp_customer_id, cardId: card.mp_card_id });
      await supabase.from('payment_cards').delete().eq('id', card.id);
      await loadCards();
      return { success: true };
    } catch (err) {
      console.error('Erro ao remover cartão:', err);
      return { success: false, error: 'Não foi possível remover o cartão.' };
    }
  }, [loadCards]);

  const setDefaultCard = useCallback(async (card: SavedCard) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return { success: false };

      await supabase.from('payment_cards').update({ is_default: false }).eq('user_id', user.id);
      await supabase.from('payment_cards').update({ is_default: true }).eq('id', card.id);
      await loadCards();
      return { success: true };
    } catch (err) {
      console.error('Erro ao definir cartão padrão:', err);
      return { success: false };
    }
  }, [loadCards]);

  return {
    cards,
    loadingCards,
    savingCard,
    loadCards,
    addCard,
    removeCard,
    setDefaultCard,
  };
}

/**
 * Formata um cartão salvo para exibição segura, ex: "Visa •••• 1049"
 */
export function formatCardDisplay(card: SavedCard): string {
  const brandNames: Record<string, string> = {
    visa: 'Visa',
    master: 'Mastercard',
    amex: 'Amex',
    elo: 'Elo',
    hipercard: 'Hipercard',
  };
  const brand = brandNames[card.payment_method_id] || 'Cartão';
  return `${brand} •••• ${card.last_four}`;
}
