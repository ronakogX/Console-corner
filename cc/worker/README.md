# Console Corner Rewards API (Cloudflare Worker + D1)

This API is intentionally separate from the public frontend. The browser must never be allowed to edit points or create/validate codes directly. Verify Firebase ID tokens in the Worker using Firebase's public-key verification/JWKS flow or a trusted Firebase Admin verification service. Never accept a UID sent only in the request body.

## Required endpoints

- `GET /api/me` — verify Firebase ID token, return that authenticated customer's points and recent transactions.
- `POST /api/redeem-code` — verify token; normalize the code; atomically update an active code to redeemed only if it is still active; credit the signed-in UID with exactly the code's stored points; insert a transaction. Use a D1 batch/transaction pattern so a code cannot be double-redeemed under concurrent requests.
- `POST /api/admin/codes` — admin-only endpoint to create a random high-entropy code and choose its points. Require an allowlisted admin UID/claim, not a frontend password.
- `POST /api/admin/purchases` — admin-only, record a verified, completed qualifying purchase.
- `GET /api/admin/customers`, `GET /api/admin/codes`, `POST /api/admin/adjust-points` — admin-only reporting and audited adjustments.

## Loyalty rules to implement

1. Any of the four GamePasses qualifies for a staff-issued redeem code after the purchase is verified.
2. For hourly gaming, count three separate, completed one-hour purchases cumulatively per customer. Do not count reservations that were not completed. Once the threshold is reached, mark the qualifying group as consumed so it cannot issue duplicate codes.
3. The points awarded per code are an admin setting and remain undecided until configured.
4. Food and beverage redemption: 1 point = ₹1 discount on eligible items, capped at the eligible bill total.
5. Gaming redemption: 200 points = 60 minutes. Calculate whole 60-minute blocks unless staff explicitly supports partial blocks.

## Environment bindings/secrets

Bind D1 as `DB`. Store the Firebase project ID and the admin UID allowlist as Worker environment variables/secrets. Do not expose service-account credentials or admin secrets in frontend JavaScript.

## Deployment checklist

- Create a Cloudflare D1 database and run `schema.sql`.
- Implement and test token verification, transactional redeem-code logic, rate limits, and admin endpoints before exposing the API.
- Set CORS to the exact production website origin.
- Configure Firebase Phone Authentication, SMS/quotas, and authorized domains.
- Add a small test plan: invalid OTP, invalid code, expired/disabled code, double redeem, concurrent redemption, non-admin admin call, customer balance privacy, and negative-balance prevention.

This scaffold is not a deployed backend. Do not advertise rewards as fully active until these endpoints are implemented, configured, and tested.
