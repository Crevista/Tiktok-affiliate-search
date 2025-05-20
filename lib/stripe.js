// lib/stripe.js
import { loadStripe } from '@stripe/stripe-js';
import Stripe from 'stripe';

// For client-side
export const getStripe = () => {
  console.log("Initializing Stripe client with publishable key");
  return loadStripe(process.env.STRIPE_PUBLISHABLE_KEY);
};

// For server-side
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Use the latest API version
});
