# Console Corner — Final Website Package

A responsive, single-page gaming parlour website for Console Corner. Includes console/racing rates, four GamePasses, WhatsApp booking requests, a food & beverage section, loyalty rules, phone OTP UI, redeem-code UI, and a Cloudflare D1 schema/backend implementation guide.

## Business details included
- WhatsApp: +91 88788 21377
- PS5: ₹200/hour
- PS4: ₹150/hour
- Racing Simulator: ₹250/hour
- Starter Pass: ₹570 / 3 hours
- Gamer Pass: ₹930 / 5 hours
- Ultimate Pass: ₹1,799 / 10 hours
- Legend Pass: ₹2,650 / 15 hours
- Food & beverage redemption: 1 point = ₹1 (discount capped at eligible bill)
- Gaming redemption: 200 points = 60 minutes
- Any GamePass purchase qualifies for a staff-issued code after verification.
- Three separate completed one-hour purchases, tracked cumulatively, qualify for a staff-issued code.
- Points awarded per code are admin-configurable and intentionally undecided.

## Run locally
Because this uses JavaScript modules, serve it through a local web server rather than opening `index.html` as a file. For example, from this folder:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Configure phone OTP
1. Create a Firebase project and register a Web App.
2. In Firebase Console, open Authentication → Sign-in method → enable Phone.
3. Add your production domain and `localhost` to Authorized domains as needed.
4. Copy your Firebase web config into `firebase-config.js`.
5. Test SMS verification and configure billing/quotas as required by Firebase.

The login interface is not live until Firebase is configured.

## Configure real loyalty points
Phone OTP alone does not make points secure. You must deploy a server-side API and persistent database. This package includes `worker/schema.sql` and `worker/README.md` as the data model and implementation requirements for Cloudflare Workers + D1. Set `apiBaseUrl` in `firebase-config.js` to the deployed Worker URL after implementing and testing the API.

The points UI intentionally does not fake a successful redeem or store balances in browser localStorage. The API must verify Firebase ID tokens, enforce admin permissions, and atomically redeem each code once.

## Deploy on Cloudflare Pages
1. Upload/push this folder to a GitHub repository.
2. In Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git.
3. Choose the repository and production branch.
4. Framework preset: None. Build command: leave blank. Build output directory: `/` (or `.` if requested by the UI).
5. Deploy the static site.
6. Configure Firebase authorized domains with the final Pages domain and custom domain.
7. Deploy the separate Worker + D1 rewards API before announcing loyalty rewards as active.

## Notes
- Booking is a WhatsApp request, not an automatic reservation; staff must confirm availability.
- Menu items and prices are not invented. The page asks customers to check the current menu at the venue.
- The brand mark is a clean text-based CC placeholder; replace it with the approved Console Corner logo asset if you want the exact logo displayed.
