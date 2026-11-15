# MIXERSHARE UK – MASTER EXECUTIVE OPERATING REPORT

**Official Web Domain:** www.mixershare.co.uk  
**Dispatch Email:** mixershareuk@gmail.com  
**Phone / SMS Line:** 07494 867646  
**Founder & Operations Director:** Ian Henry (30 Years Ready-Mix Delivery Experience)  

---

## 1. ENTERPRISE OVERVIEW & VALUE PROPOSITION

MixerShare UK is an **open, managed B2B capacity exchange platform** connecting ready-mix concrete suppliers, aggregate yards, and construction sites across the UK with verified franchised HGV owner-drivers and idle fleet assets.

### The Core Problem Solved:
- **For Batch Plants & Suppliers:** Plants frequently turn down **£5,000–£10,000 in daily orders** when an HGV driver calls in sick or a morning pour surges, while traditional truck hire companies cost £750+ per shift with 2-day lead times.
- **For HGV Owner-Drivers:** Franchised and independent owner-drivers have quiet morning hours or slow days where their trucks sit idle earning **£0.00/hour**.

MixerShare UK monetizes these quiet hours, providing plants with 60-minute emergency relief while delivering guaranteed 24-hour bank payouts to owner-drivers.

---

## 2. COMMERCIAL PRICING & REVENUE MODEL (PURE PAY-PER-DISPATCH)

### A. How You Earn Money (Monetization)
1. **10% Platform Transaction Commission:** Applied automatically to every booked load or shift dispatch. Zero monthly subscription fees or upfront plant fees. Plants pay ONLY when they actually book a relief truck!
   - *Example:* On an 8m³ full shift rental (£520), the plant pays £520 (all-inclusive, zero transfer fees). Driver receives £468. MixerShare UK retains **£52 profit**.
   - *Example:* On an 8m³ 6-mile single odd load (£115.00), driver receives £103.50 (covering travel fuel & time). MixerShare UK retains **£11.50 profit**.

### B. Final Production Rate Tiers (£ GBP)

```
+---------------------------------------------------------------------------------------------------------+
| VEHICLE SPECIFICATION      | RENTAL TYPE       | PLANT COST (OPEN)  | DRIVER PAYOUT    | PLATFORM FEE   |
+----------------------------+-------------------+--------------------+------------------+----------------+
| 2-Axle 4m³ Compact Mixer   | Odd Load Radial   | £60 base + £3.75/mi| £54 base + £3.38 | £6 base + £0.37|
|                            | Half-Day (4 hrs)  | £250.00 (All-Inc)  | £225.00          | £25.00         |
|                            | Full Shift (8 hrs)| £420.00 (All-Inc)  | £378.00          | £42.00         |
+----------------------------+-------------------+--------------------+------------------+----------------+
| 3-Axle 6m³ Medium Mixer    | Odd Load Radial   | £75 base + £4.25/mi| £67.50 + £3.82/mi| £7.50 + £0.43  |
|                            | Half-Day (4 hrs)  | £295.00 (All-Inc)  | £265.50          | £29.50         |
|                            | Full Shift (8 hrs)| £480.00 (All-Inc)  | £432.00          | £48.00         |
+----------------------------+-------------------+--------------------+------------------+----------------+
| Standard 8m³ 4-Axle Rigid  | Odd Load Radial   | £85 base + £5.00/mi| £76.50 + £4.50/mi| £8.50 + £0.50  |
|                            | Half-Day (4 hrs)  | £320.00 (All-Inc)  | £288.00          | £32.00         |
|                            | Full Shift (8 hrs)| £520.00 (All-Inc)  | £468.00          | £52.00         |
+----------------------------+-------------------+--------------------+------------------+----------------+
| 8x4 32t Tipper Wagon (20t) | Odd Load Radial   | £80 base + £4.50/mi| £72 base + £4.05 | £8 base + £0.45|
|                            | Half-Day (4 hrs)  | £290.00 (All-Inc)  | £261.00          | £29.00         |
|                            | Full Shift (8 hrs)| £480.00 (All-Inc)  | £432.00          | £48.00         |
+----------------------------+-------------------+--------------------+------------------+----------------+
| 8x4 32t Grab Tipper Lorry  | Odd Load Radial   | £95 base + £5.50/mi| £85.50 + £4.95/mi| £9.50 + £0.55  |
|                            | Half-Day (4 hrs)  | £350.00 (All-Inc)  | £315.00          | £35.00         |
|                            | Full Shift (8 hrs)| £550.00 (All-Inc)  | £495.00          | £55.00         |
+----------------------------+-------------------+--------------------+------------------+----------------+
| Dynamic Extensions         | Extra Loads       | +Odd Base + Rate/mi| +Driver Base/mi  | +10% Fee       |
|                            | Extra Shift Hours | +£65.00 / hour     | +£58.50 / hour   | +£6.50 / hour  |
+---------------------------------------------------------------------------------------------------------+
```

---

## 3. TECHNICAL CONNECTIONS & INFRASTRUCTURE USED

```
[Namecheap Domain]          [Netlify Edge Server]       [Netlify Forms]             [Stripe Connect UK]
www.mixershare.co.uk  --->  Static HTML/CSS/JS  --->  Captures Plant & Driver ---> Splits payment & sends
(DNS Mapped)                HTTPS SSL Security          Registrations to Email      24hr Faster Payments
```

1. **Domain & DNS Routing:**
   - Purchased via **Namecheap** (`mixershare.co.uk`). Custom DNS points to Netlify Name Servers (`dns1.p0X.nsone.net`).
2. **Hosting Platform & Deployment:**
   - Hosted on **Netlify** with automatic SSL HTTPS encryption, static asset caching, clean URL redirects (`netlify.toml`), and Git version control via GitHub.
3. **Form Processing Engine:**
   - Powered by **Netlify Forms** (`data-netlify="true"`). Submissions from plant inquiry and driver onboarding forms flow directly into your central dispatch dashboard and email.
4. **Email Routing Architecture:**
   - Primary address: **`mixershareuk@gmail.com`** (forwarded directly to your mobile/desktop inbox via Namecheap Private Email or Google Workspace).
5. **Payment Processing & Escrow Engine:**
   - Powered by **Stripe Connect UK** + **UK Faster Payments**. Charges the plant's corporate card/BACS, retains your 10% fee, and auto-deposits driver payouts within 24 hours.

---

## 4. OPERATIONAL FORMS & LEGAL AGREEMENTS USED

All operational documents are production-ready in `C:\Users\Ian Henry\.gemini\antigravity\scratch\Mixershare\`:

1. **Plant Master Commercial Agreement (`2_Plant_Master_Commercial_Agreement.md`):**
   - Open agreement for ready-mix suppliers & aggregate yards. Defines radial rates, dynamic shift/load extensions, 24-hr payouts, white-label ticket policy, and a strict **£5,000 Liquidated Damage Anti-Circumvention Clause**.
2. **Owner-Driver Network Agreement (`3_Owner_Driver_Network_Agreement.md`):**
   - Sub-contractor agreement for HGV mixer & tipper owner-drivers. Defines radial mile payouts, Quiet Period contract clause compliance, neutral magnetic blanking covers, and £10m public liability insurance.
3. **Owner-Driver Onboarding Form (`4_Owner_Driver_Onboarding_Form.md`):**
   - Simple 1-page driver sign-up sheet collecting HGV Class 2 license, Driver CPC card, FORS/CLOCS status, truck specification (4m³, 6m³, 8m³, 32t tipper), and bank details.
4. **Printable Recruitment Flyer (`flyer.html` & `6_Printable_Owner_Driver_Flyer.md`):**
   - Printable A4 flyer featuring the **"Quiet Period Contract Clause"** callout box, single/double/shift earnings tiers, and a print/save to PDF button.
5. **Plant Manager Sales Flyer (`plant_flyer.html` & `12_Plant_Manager_Printable_Sales_Sheet.md`):**
   - Printable A4 sales flyer for plant managers highlighting single-load spot relief, £0 signup fee, and 60-min trial guarantee.

---

## 5. THE 3 "TRUST SHIELDS" (WHY PLANTS & DRIVERS JOIN)

1. **🛡️ Blind Delivery & Customer Protection:**
   - Digital delivery tickets display exclusively the ordering plant's branding. Drivers sign strict non-solicitation contracts.
2. **⚡ Guaranteed 24-Hour Faster Payments:**
   - Eliminates 60-day debt chasing for owner-drivers. Funds are deposited into their UK bank account within 24 hours of job completion.
3. **🧲 Neutral Magnetic Blanking Covers:**
   - Franchise owner-drivers apply neutral magnetic covers over door logos in 10 seconds before scale-in to guarantee zero brand conflict.

---

## 6. READY TO LAUNCH CHECKLIST

- [x] Web Domain Secured: **www.mixershare.co.uk**
- [x] Official Email Live: **mixershareuk@gmail.com**
- [x] Live Site Deployed: **https://mixershare.netlify.app** (connected to www.mixershare.co.uk)
- [x] 100% Pay-Per-Dispatch Model (Zero Monthly Plant Fees)
- [x] Commercial & Driver Contracts Complete
- [x] Printable A4 Sales Flyers Complete
