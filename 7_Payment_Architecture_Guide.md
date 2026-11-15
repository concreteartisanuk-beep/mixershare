# MIXERSHARE UK – PAYMENT ARCHITECTURE & GATEWAY GUIDE

---

## 1. FINANCIAL WORKFLOW OVERVIEW

MixerShare UK operates a secure 3-stage payment processing engine designed specifically for UK Ready-Mix concrete suppliers, aggregate yards, and HGV owner-drivers.

```
[Borrowing Plant / Contractor]
           │
           ▼ (Authorizes Booking Payment via Card, BACS, or Corporate PO)
[MixerShare UK Payment Escrow (Stripe Connect / UK Bank)]
           │
           ├────────► [Your Business Account: 10% - 12% Platform Fee]
           │
           └────────► [Owner-Driver UK Account: 24hr Faster Payments Payout]
```

---

## 2. RECOMMENDED UK PAYMENT GATEWAYS

### A. Stripe Connect UK (Marketplace Engine) — *Recommended for On-Demand Booking*
- **Purpose:** Automatically splits payments between your commission and driver payouts.
- **Plant Payment Options:** Corporate Credit Card, Visa, Mastercard, Apple Pay, UK BACS Direct Debit.
- **Driver Payout:** Transferred directly to the driver's UK bank account via **UK Faster Payments within 24 hours** (or instant payout).
- **Setup Time:** 15 minutes. Free to register at [Stripe.com/gb](https://stripe.com/en-gb).

### B. GoCardless (UK BACS Direct Debit) — *Recommended for Monthly Subscriptions*
- **Purpose:** Collects the **£199 – £249/month recurring membership fee** from ready-mix plants.
- **Benefits:** Low transaction fees (1%), automatic monthly BACS pulling from plant bank accounts.

### C. Corporate Credit Accounts (For Majors like CEMEX UK)
- **Purpose:** Corporate majors frequently require Purchase Orders (PO) or 7-to-14 day invoicing.
- **Workflow:** CEMEX issues a weekly PO $\rightarrow$ MixerShare UK pays owner-drivers within 24 hours from working capital reserve $\rightarrow$ CEMEX settles the weekly PO invoice via UK BACS transfer.

---

## 3. STEP-BY-STEP PAYMENT IMPLEMENTATION CHECKLIST

- [  ] **Step 1: Open UK Business Bank Account** (e.g. Starling Bank, Tide, Barclays, HSBC under *MixerShare UK Ltd*).
- [  ] **Step 2: Create Stripe Connect Account** (Select Express/Custom Connect for UK marketplace payouts).
- [  ] **Step 3: Setup GoCardless Account** (For recurring plant membership subscriptions).
- [  ] **Step 4: Driver Onboarding Bank Capture** (Collect Sort Code & Account Number on onboarding form for instant Faster Payments mapping).
