import PaystackPop from '@paystack/inline-js';

const PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

export const isPaystackConfigured = () => Boolean(PUBLIC_KEY);

export function payWithPaystack({ email, amountGhs, metadata, onSuccess, onCancel }) {
  if (!PUBLIC_KEY) {
    throw new Error('Paystack is not configured. Add VITE_PAYSTACK_PUBLIC_KEY to your .env file.');
  }

  const popup = new PaystackPop();
  popup.newTransaction({
    key: PUBLIC_KEY,
    email,
    amount: Math.round(amountGhs * 100),
    currency: 'GHS',
    metadata,
    onSuccess,
    onCancel,
  });
}
