# MIXERSHARE UK – STRIPE CONNECT INTEGRATION & TIERED RADIAL PAYOUT GUIDE

---

## 1. STRIPE CONNECT MARKETPLACE SETUP

MixerShare UK uses **Stripe Connect UK (Custom/Express Accounts)** to process payments from ready-mix plants and deposit automated 24-hour Faster Payments payouts to HGV owner-drivers.

```
[Plant Manager / Contractor]
           │
           ▼ (Authorizes Booking Payment via Card / Apple Pay / BACS)
[MixerShare UK Stripe Escrow]
           │
           ├────────► [Your Business Account: 10% - 12% Platform Fee]
           │
           └────────► [Owner-Driver UK Bank Account: 24hr Faster Payments Payout]
```

### How to Activate Live Payments on Netlify:
1. Log into [dashboard.stripe.com](https://dashboard.stripe.com/register).
2. Go to **Developers $\rightarrow$ API Keys** and copy your:
   - **Publishable Key (`pk_live_...`)**
   - **Secret Key (`sk_live_...`)**
3. In your Netlify Site Dashboard $\rightarrow$ **Site Settings $\rightarrow$ Environment Variables**, add `STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY`.

---

## 2. TIERED RADIAL PAYOUT MATRIX (4m³ COMPACT VS 8m³ RIGID)

Because an 8m³ rigid mixer carries twice the payload and uses more fuel than a 2-axle 4m³ compact mini-mixer, radial drop fees and per-mile rates are tiered to reflect vehicle size:

```
+-------------------------------------------------------------------------------------------------------------+
| VEHICLE SPECIFICATION      | BASE DROP FEE | RADIAL RATE (£/MILE) | DRIVER BASE PAYOUT | DRIVER RADIAL PAYOUT|
+----------------------------+---------------+----------------------+--------------------+---------------------+
| 2-Axle 4m³ Compact Mixer   | £45.00        | £3.00 / mile         | £40.00             | £2.70 / mile        |
| 3-Axle 6m³ Medium Mixer    | £55.00        | £3.50 / mile         | £50.00             | £3.15 / mile        |
| Standard 8m³ 4-Axle Rigid  | £65.00        | £4.25 / mile         | £58.00             | £3.80 / mile        |
| 8x4 32t Tipper Wagon (20t) | £60.00        | £4.00 / mile         | £54.00             | £3.60 / mile        |
| 8x4 32t Grab Tipper Lorry  | £75.00        | £4.75 / mile         | £67.00             | £4.25 / mile        |
+-------------------------------------------------------------------------------------------------------------+
```

### Real-World Example Calculation (6 Radial Miles):
- **4m³ Compact Mini-Mixer Run:** £45 base + (6 miles $\times$ £3.00) = **£63.00 total cost to plant** (Driver receives £56.20 payout).
- **8m³ Standard Rigid Mixer Run:** £65 base + (6 miles $\times$ £4.25) = **£90.50 total cost to plant** (Driver receives £80.80 payout).

---

## 3. LIVE DRIVER & PLANT AVAILABILITY PORTAL TABS

The web application (`www.mixershare.co.uk`) includes 2 interactive real-time dispatch boards:
- 🟢 **Driver Live Availability Board:** Allows owner-drivers to toggle their status (*"Available Now in Gateshead/Newcastle"*) with 1 click.
- 📢 **Plant Dispatch Needs Board:** Allows concrete plants & aggregate yards to post emergency relief requirements (*"Need 1x 4m³ mixer for 2 loads ASAP"*).
