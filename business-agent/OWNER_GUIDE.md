# Racharla Business Agent — Seller & Customer Guide

## 1. Owner: get a public shop address

A downloaded HTML file is **not** a public URL. It is an offline snapshot and will not automatically update on customers' phones.

To publish a live hosted storefront:

1. Open **Racharla Business Agent** at `https://vibe.racharlagpt.in/business-agent/index.html`.
2. Sign in to your Racharla account. A verified active Business Agent license is required to publish; the purchase button is disabled until the platform's sales safety checks are completed.
3. Describe your business, choose the suggested design, and confirm the correct phone number including country code.
4. Add your products or services, photos, prices, availability and optional stock.
5. Select pickup, delivery or appointment enquiries. Enable only the cash, UPI or QR payment preferences you actually accept.
6. If applicable, enter your own UPI ID or upload your shop's own payment QR. Customer payments go directly to **you**, not to Racharla.
7. Optionally enter a limited-time offer under Business details and save it.
8. Open **Preview & share**, enter a short public shop URL name, select **Publish shop**, and click **Save & publish licensed shop**.
9. Open the displayed link in another browser or phone to verify your shop, prices, WhatsApp number, payment instructions and pictures.
10. Use **Copy shop link**, **Share link** or **Share shop on WhatsApp**.

The resulting link looks like:

`https://vibe.racharlagpt.in/business-agent/index.html?shop=your-shop-name`

### How to reach customers

- **WhatsApp:** send the shop link to customers, put it in your WhatsApp Business profile/description, or share it in statuses where supported.
- **Instagram:** place the link in your profile's website/bio link field or an eligible Story link sticker. Ordinary post captions often do not provide clickable links.
- **Facebook, SMS, email, and in-store posters:** share the same URL. A printed QR code pointing to the **shop URL** can help walk-in customers (this is different from the shop's **payment QR**).
- **Existing customers:** ask them to open the link and choose **Install / Add to Home Screen** if supported.

There is no automatic publishing of products into the native WhatsApp Business catalog and no automatic bulk-message marketing.

## 2. Vendor: update your online shop

1. Sign in from any device with your account.
2. If the saved shop isn't loaded, use **Restore my saved shop**.
3. Edit products, prices, availability, stock, photos, or the current offer.
4. Open **Preview & share** and click **Save & publish licensed shop** again, keeping the same shop slug.
5. Your customers' **hosted shop link stays the same**. When they return online or use Refresh, they receive the newest published catalog.
6. Changes in the editor are **not live** until you save/publish again.

This avoids constant involvement by the platform admin. Merchants themselves control shop data.

## 3. Customer: install or dismiss

1. Open the vendor's **public hosted shop link** in Chrome, Safari, Edge or another compatible mobile browser.
2. If your browser offers **Install**, you can accept, or tap **Dismiss** to hide the in-app prompt for about 30 days for that shop.
3. iPhone Safari commonly uses **Share → Add to Home Screen** instead of an automatic install prompt. The in-app help explains this.
4. The installed **Racharla Shops** shared PWA remembers the most recently opened hosted shop on that device. It is **not** a separately published native app or separately branded home-screen icon for every merchant.
5. If another shop link is opened, the shared app may switch its last-opened shop. Bookmark individual shop links for reliable access to multiple shops.

Install availability depends on the browser, HTTPS hosting and device.

## 4. Customer: check latest prices

**Important: prices, available stock, offers and products may change. Refresh this shop before ordering. The merchant confirms the final price and availability.**

- The hosted shop requests fresh shop data when opened and when returning to a tab after a short interval. It also has a **Refresh latest prices and products** button.
- Before WhatsApp checkout, the app checks the latest shop data again. If the catalog has changed, it clears the selected cart so the buyer can review the new prices before sending.
- On poor or no internet connection, a stale catalog is **not** accepted as proof of current prices. Checkout must wait for a successful refresh.
- The seller receives the order only when the customer taps **Send** inside WhatsApp.
- A local downloaded HTML file is a **fixed snapshot**; pressing browser Refresh does not sync it. Ask the owner for the hosted shop link and confirm prices before ordering.

## 5. Direct payments and privacy

- The vendor chooses cash on pickup, cash on delivery, UPI ID, merchant QR, or enquiry-only, based on their business model and country.
- A UPI deep link or QR display does **not** confirm money was sent. Check the recipient, then verify receipt with the seller.
- The platform neither debits the customer automatically nor verifies payment screenshots.
- QR codes used for payment are **not** the same as QR codes used to open a public shop URL.
- The owner should use only their own merchant payment QR and ensure it shows the correct account.
- Customers communicate name, order details and optional delivery address via their chosen WhatsApp conversation, not through a platform order ledger.
- Avoid adding sensitive personal information to shop descriptions or photographs.

## 6. Scope and operational limits

- No upfront paid AI API is required for predefined templates and category recognition, but hosting, bandwidth, messaging platforms, payment-provider fees and service quotas are not guaranteed free forever.
- Customer updates require the **hosted** shop, a live connection and the vendor's successful publish action. There is no push notification service.
- The current shared PWA has a reusable Racharla icon. Individually branded native apps, custom install manifests per merchant, and native WhatsApp product-catalog synchronization are separate future capabilities.
- The **₹999 Business Agent purchase flow is not currently enabled for real sales**. It must remain closed until provider webhook setup, successful captured payment, entitlement recovery, refund, and public live-domain tests pass.
