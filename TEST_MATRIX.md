# Commercial test matrix

| Flow | Expected |
|---|---|
| Browse | Works without login |
| Purchase | Login/signup required before Razorpay |
| Email | Order email stored and Resend receipt attempted after capture |
| Book | Paid → Gemini 3.8 Flash → ready → ready email |
| Image | Paid → browser delivery → complete-order → ready email |
| Business | Paid → browser delivery → complete-order → ready email |
| Vibe | Paid → publish-site → ready → live URL + email |
| Retry | Paid/pending order can be retried without another payment |
| My Orders | Authenticated user sees only own orders |
| Refund request | Customer can request; admin executes actual Razorpay refund |
| Admin refund | `refund-order` remains protected by ADMIN_TOKEN |
| Website media | 1 logo + 3 showcase images appear on public site |
| Renewal | Paid renewal updates expiry; no second charge on retry |
