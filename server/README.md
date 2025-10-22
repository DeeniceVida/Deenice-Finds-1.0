# Deenice GSM Proxy

A lightweight Express server that scrapes GSM Arena phone pages and returns JSON for your compare page.

## 🚀 Run

```bash
cd server
npm install
npm start
```

Server runs at:  
➡️ http://localhost:3000/api/parse?url=https://www.gsmarena.com/apple_iphone_14-11861.php

---

## 🧠 Example Response

```json
{
  "data": {
    "title": "Apple iPhone 14",
    "image": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-14.jpg",
    "specs": {
      "Display": "6.1 inches, 1170 x 2532",
      "OS": "iOS 16, upgradable to iOS 17",
      "Chipset": "Apple A15 Bionic",
      "RAM": "6GB",
      "Storage": "128GB / 256GB / 512GB",
      "Battery": "3279 mAh"
    }
  }
}
```

---

## ⚠️ Notes
- Uses in-memory caching (1h) and request rate limiting.
- Please respect GSM Arena’s `robots.txt` and terms.
- For production, deploy to a Node host (Render, Railway, Vercel, etc.) and use HTTPS.
