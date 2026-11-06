# Racharla Business Agent — shop owner's ₹99/month guide

This guide is for the **current monthly hosted Business Agent** at [vibe.racharlagpt.in/business-agent/monthly.html](https://vibe.racharlagpt.in/business-agent/monthly.html). It replaces the earlier ₹999 one-time downloadable prototype.

## What you buy

For **₹99 paid in advance**, you receive one calendar month of online shop hosting, catalog updates, shareable customer link and access to your owner order dashboard. Payments for another month are **not automatic**. Renew manually whenever you want to keep your website taking orders. If you stop paying, online ordering is paused when the paid period expires; your saved shop details remain in your account to restart later.

**Shop customers pay you directly** using your own UPI, QR, cash on pickup or cash on delivery. You are responsible for confirming payment and arranging fulfillment.

## Create your shop — 5 steps

1. **Business:** sign up or sign in, enter your idea, shop name, WhatsApp number **with country code**, full street address, category, tagline and optional shop banner. Without a photo, customers see a branded name banner.
2. **Catalog:** add real products or services, categories, prices, units, optional stock and photographs. You can edit, hide and remove products later. The initial plan permits up to 200 catalog items.
3. **Customer options:** enable pickup, delivery or appointment enquiries. If delivery is enabled, enter a reasonable delivery charge and confirm your service area with each customer. Select cash, your own UPI ID or merchant QR.
4. **Monthly access:** view the free preview first. When checkout is live and has passed gateway verification, pay ₹99 through Razorpay. The app automatically verifies payment and activates the paid period. If you were charged but activation is delayed, choose **Recover Payment** before paying again. No administrator approval is required.
5. **Publish:** choose a unique shop URL slug and select **Publish**. Open the customer link on another phone, verify all details, then share it through WhatsApp or put the URL in Instagram bio/story, Facebook or SMS.

Your public link looks like:
`https://vibe.racharlagpt.in/business-agent/monthly.html?shop=my-shop`

## Daily shop management

- Open your owner dashboard on your phone; sign in with the same account.
- To add a new product, change a price, update stock or remove a sold-out item, go to **Catalog**, save the changes, then select **Publish → Save & publish latest catalog**.
- Customers using the hosted shop refresh to see the newest published catalog. Checkout checks current prices again and refuses a changed total.
- The owner can sign out after publishing. There is no need to keep the browser open.
- If you stopped for a month, pay ₹99 again from the same account; the existing business details and catalog are retained for reactivation.
- The installable PWA is a shared Racharla Shops experience, not a separate native Android APK or iPhone app for every owner.

## Customer ordering

1. The customer opens your published link and browses/searches available products.
2. They add products to a cart, choose pickup/delivery/service enquiry and payment preference, provide a name and phone number, and consent to sharing details.
3. The server checks the shop is active, checks current item prices and stock, includes the delivery fee where applicable, and creates an order reference such as `BA-0001042`.
4. The app opens a WhatsApp message with the order number, items, price estimate, and contact/delivery details. **Customer must manually tap Send.** An order number by itself does not confirm the merchant has received the WhatsApp message.
5. The seller checks the order, agrees the final total, accepts the request and verifies payment directly in their own bank/UPI app or when collecting cash.
6. The owner uses **Orders** to mark Accepted → Packed → Ready / Out for delivery → Completed, or Cancelled, and can record manual payment verification. No automatic courier service is included.

If a customer selects your UPI or payment QR, opening the UPI app is **not proof of payment**. Do not mark an order paid until you see the money in your own bank/UPI account.

## Install / dismiss on customer phones

Compatible mobile browsers may show **Install app** or **Add to Home Screen**. The customer can dismiss the install prompt. On iPhone, open the link in Safari and use Share → Add to Home Screen. The app remembers the last shop visited on that device. Its catalog needs an online connection to remain current.

## Cost and safety

The ₹99/month offer does not guarantee sales or unlimited hosting capacity. We compress customer-visible product photos and limit catalog size to manage resource costs. Order processing is a communication and tracking service, not an integrated payment or delivery provider.

**Current development safety gate:** the ₹99 paid checkout is disabled until full Razorpay captured-payment, payment-recovery and refund tests are completed. The shop preview and interface can be tested without paying. No real money should be accepted before release checks pass.

## Older Vibe customers

Earlier Vibe products, their existing orders and renewals remain accessible via [the legacy Vibe area](https://vibe.racharlagpt.in/legacy.html#orders). Previous customers' rights are not silently cancelled by this new monthly offer.
