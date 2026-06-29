import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePaymentCards, formatCardDisplay } from '../utils/usePaymentCards';
import { guessPaymentMethodId } from '../utils/mercadoPago';

function formatCardNumber(raw) {
  const d = raw.replace(/\D/g, '').slice(0, 16);
  return d.match(/.{1,4}/g)?.join(' ') || d;
}

function formatCardExpiry(raw) {
  const d = raw.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

function formatCpf(raw) {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

const BRAND_ICONS = {
  visa: 'card',
  master: 'card',
  amex: 'card',
  elo: 'card',
  hipercard: 'card',
};

/**
 * Modal de seleção de forma de pagamento preferida.
 *
 * Telas internas:
 * - "list": PIX / Dinheiro / lista de cartões salvos / botão "Adicionar cartão"
 * - "form": formulário de cadastro de cartão novo (não fecha o modal ao escolher cartão)
 */
export default function PaymentMethodModal({
  visible,
  onClose,
  paymentMethod,
  onSelectSimpleMethod, // (method: 'pix' | 'dinheiro') => void
  onSelectCard, // (card) => void, marca um cartão salvo como preferido
  selectedCardId,
}) {
  const [screen, setScreen] = useState('list'); // 'list' | 'form'
  const { cards, loadingCards, savingCard, loadCards, addCard, removeCard } = usePaymentCards();

  const [cardType, setCardType] = useState('cartão de crédito');
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardCpf, setCardCpf] = useState('');
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (visible) {
      setScreen('list');
      loadCards();
    }
  }, [visible]);

  function resetForm() {
    setCardholderName('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardCpf('');
    setFormError(null);
  }

  function openCardForm(type) {
    setCardType(type);
    resetForm();
    setScreen('form');
  }

  async function handleSubmitCard() {
    setFormError(null);

    const cleanNumber = cardNumber.replace(/\D/g, '');
    if (cleanNumber.length < 13) {
      setFormError('Número do cartão inválido.');
      return;
    }
    if (!cardholderName.trim()) {
      setFormError('Informe o nome impresso no cartão.');
      return;
    }
    const [month, year] = cardExpiry.split('/');
    if (!month || !year || month.length !== 2 || year.length !== 2) {
      setFormError('Validade inválida. Use o formato MM/AA.');
      return;
    }
    if (cardCvv.length < 3) {
      setFormError('CVV inválido.');
      return;
    }
    if (cardCpf.replace(/\D/g, '').length !== 11) {
      setFormError('CPF inválido.');
      return;
    }

    const result = await addCard({
      cardNumber: cleanNumber,
      expirationMonth: month,
      expirationYear: `20${year}`,
      securityCode: cardCvv,
      cardholderName: cardholderName.trim(),
      docNumber: cardCpf,
      cardType,
      setAsDefault: true,
    });

    if (!result.success) {
      setFormError(result.error || 'Não foi possível salvar o cartão.');
      return;
    }

    onSelectCard(result.card);
    resetForm();
    setScreen('list');
  }

  function handleRemoveCard(card) {
    Alert.alert(
      'Remover cartão',
      `Deseja remover o cartão final ${card.last_four}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            await removeCard(card);
          },
        },
      ]
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.modalOverlay}
      >
        <Pressable style={s.modalBackdrop} onPress={onClose} />
        <View style={s.modalContent}>
          <View style={s.modalPill} />

          {screen === 'list' ? (
            <ListScreen
              paymentMethod={paymentMethod}
              selectedCardId={selectedCardId}
              cards={cards}
              loadingCards={loadingCards}
              onSelectSimpleMethod={onSelectSimpleMethod}
              onSelectCard={onSelectCard}
              onAddCard={openCardForm}
              onRemoveCard={handleRemoveCard}
              onClose={onClose}
            />
          ) : (
            <FormScreen
              cardType={cardType}
              cardholderName={cardholderName}
              setCardholderName={setCardholderName}
              cardNumber={cardNumber}
              setCardNumber={setCardNumber}
              cardExpiry={cardExpiry}
              setCardExpiry={setCardExpiry}
              cardCvv={cardCvv}
              setCardCvv={setCardCvv}
              cardCpf={cardCpf}
              setCardCpf={setCardCpf}
              formError={formError}
              savingCard={savingCard}
              onSubmit={handleSubmitCard}
              onBack={() => { resetForm(); setScreen('list'); }}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ListScreen({
  paymentMethod,
  selectedCardId,
  cards,
  loadingCards,
  onSelectSimpleMethod,
  onSelectCard,
  onAddCard,
  onRemoveCard,
  onClose,
}) {
  const simpleMethods = [
    { key: 'pix', label: 'PIX', icon: 'qr-code' },
    { key: 'dinheiro', label: 'Dinheiro', icon: 'cash' },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }}>
      <Text style={s.modalTitle}>Forma de Pagamento Preferida</Text>
      <Text style={s.modalSub}>Escolha qual opção deve vir selecionada por padrão no seu checkout.</Text>

      {simpleMethods.map((method) => {
        const active = paymentMethod === method.key;
        return (
          <Pressable
            key={method.key}
            style={[s.methodItem, active && s.methodItemActive]}
            onPress={() => onSelectSimpleMethod(method.key)}
          >
            <Ionicons name={method.icon} size={20} color={active ? '#FFB800' : '#666'} />
            <Text style={[s.methodLabel, active && s.methodLabelActive]}>{method.label}</Text>
            {active && <Ionicons name="checkmark-circle" size={20} color="#FFB800" />}
          </Pressable>
        );
      })}

      {(loadingCards || cards.length > 0) && (
        <Text style={s.sectionDivider}>Cartões salvos</Text>
      )}

      {loadingCards ? (
        <ActivityIndicator color="#FFB800" style={{ marginVertical: 12 }} />
      ) : cards.length === 0 ? null : (
        cards.map((card) => {
          const active = paymentMethod === card.card_type && selectedCardId === card.id;
          return (
            <Pressable
              key={card.id}
              style={[s.methodItem, active && s.methodItemActive]}
              onPress={() => onSelectCard(card)}
              onLongPress={() => onRemoveCard(card)}
            >
              <Ionicons name="card" size={20} color={active ? '#FFB800' : '#666'} />
              <View style={{ flex: 1 }}>
                <Text style={[s.methodLabel, active && s.methodLabelActive]}>
                  {formatCardDisplay(card)}
                </Text>
                <Text style={s.cardSubLabel}>
                  {card.card_type === 'cartão de crédito' ? 'Crédito' : 'Débito'}
                </Text>
              </View>
              {active && <Ionicons name="checkmark-circle" size={20} color="#FFB800" />}
              <Pressable onPress={() => onRemoveCard(card)} style={s.trashIconBtn}>
                <Ionicons name="trash-outline" size={16} color="#CCC" />
              </Pressable>
            </Pressable>
          );
        })
      )}

      <Pressable style={s.addCardBtn} onPress={() => onAddCard('cartão de crédito')}>
        <Ionicons name="card" size={20} color="#666" />
        <Text style={s.addCardBtnText}>Adicionar cartão de crédito</Text>
        <Ionicons name="chevron-forward" size={16} color="#CCC" />
      </Pressable>

      <Pressable style={s.addCardBtn} onPress={() => onAddCard('cartão de débito')}>
        <Ionicons name="card-outline" size={20} color="#666" />
        <Text style={s.addCardBtnText}>Adicionar cartão de débito</Text>
        <Ionicons name="chevron-forward" size={16} color="#CCC" />
      </Pressable>

      <Pressable style={s.modalCloseBtn} onPress={onClose}>
        <Text style={s.modalCloseBtnText}>Fechar</Text>
      </Pressable>
    </ScrollView>
  );
}

function FormScreen({
  cardType,
  cardholderName,
  setCardholderName,
  cardNumber,
  setCardNumber,
  cardExpiry,
  setCardExpiry,
  cardCvv,
  setCardCvv,
  cardCpf,
  setCardCpf,
  formError,
  savingCard,
  onSubmit,
  onBack,
}) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }}>
      <View style={s.formHeaderRow}>
        <Pressable onPress={onBack} style={s.formBackBtn}>
          <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
        </Pressable>
        <Text style={s.modalTitle}>
          {cardType === 'cartão de crédito' ? 'Novo Cartão de Crédito' : 'Novo Cartão de Débito'}
        </Text>
      </View>
      <Text style={s.modalSub}>
        Seus dados são enviados direto ao Mercado Pago. Guardamos só os últimos 4 dígitos.
      </Text>

      <Text style={s.formLabel}>Nome no cartão</Text>
      <TextInput
        value={cardholderName}
        onChangeText={setCardholderName}
        placeholder="Como está impresso no cartão"
        placeholderTextColor="#AAA"
        autoCapitalize="words"
        style={s.formInput}
      />

      <Text style={s.formLabel}>Número do cartão</Text>
      <TextInput
        value={cardNumber}
        onChangeText={(t) => setCardNumber(formatCardNumber(t))}
        placeholder="0000 0000 0000 0000"
        placeholderTextColor="#AAA"
        keyboardType="numeric"
        style={s.formInput}
      />

      <View style={s.formRow2}>
        <View style={{ flex: 1 }}>
          <Text style={s.formLabel}>Validade</Text>
          <TextInput
            value={cardExpiry}
            onChangeText={(t) => setCardExpiry(formatCardExpiry(t))}
            placeholder="MM/AA"
            placeholderTextColor="#AAA"
            keyboardType="numeric"
            style={s.formInput}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.formLabel}>CVV</Text>
          <TextInput
            value={cardCvv}
            onChangeText={(t) => setCardCvv(t.replace(/\D/g, '').slice(0, 4))}
            placeholder="000"
            placeholderTextColor="#AAA"
            keyboardType="numeric"
            secureTextEntry
            style={s.formInput}
          />
        </View>
      </View>

      <Text style={s.formLabel}>CPF do titular</Text>
      <TextInput
        value={cardCpf}
        onChangeText={(t) => setCardCpf(formatCpf(t))}
        placeholder="000.000.000-00"
        placeholderTextColor="#AAA"
        keyboardType="numeric"
        style={s.formInput}
      />

      {formError && <Text style={s.formError}>{formError}</Text>}

      <Pressable
        style={[s.saveCardBtn, savingCard && s.saveCardBtnDisabled]}
        onPress={onSubmit}
        disabled={savingCard}
      >
        {savingCard ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={s.saveCardBtnText}>Salvar cartão</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    alignItems: 'center',
    maxHeight: '85%',
  },
  modalPill: {
    width: 38,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 20,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    marginBottom: 10,
    gap: 12,
  },
  methodItemActive: {
    borderColor: '#FFB800',
    backgroundColor: '#FFFDF0',
  },
  methodLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  methodLabelActive: {
    color: '#FFB800',
    fontWeight: '700',
  },
  cardSubLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  trashIconBtn: {
    padding: 4,
    marginLeft: 4,
  },
  sectionDivider: {
    fontSize: 12,
    fontWeight: '800',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 12,
  },
  noCardsText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  addCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    marginBottom: 10,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  addCardBtnText: {
    flex: 1,
    color: '#1A1A1A',
    fontWeight: '600',
    fontSize: 14,
  },
  modalCloseBtn: {
    marginTop: 4,
    marginBottom: 4,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#FFB800',
  },
  modalCloseBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },

  // Form screen
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  formBackBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
    marginTop: 12,
  },
  formInput: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1A1A1A',
  },
  formRow2: {
    flexDirection: 'row',
    gap: 10,
  },
  formError: {
    color: '#E61E2A',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 12,
  },
  saveCardBtn: {
    backgroundColor: '#FFB800',
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  saveCardBtnDisabled: {
    opacity: 0.6,
  },
  saveCardBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
