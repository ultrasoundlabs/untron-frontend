# Public frontend for Untron V2 & beyond

Next.js frontend for Untron protocols. Uses Ultrasound Labs' public indexer and order creator gateway (since [Untron V2](https://github.com/ultrasoundlabs/untron-v2) is a B2B protocol).

Deployed on [app.untron.finance](https://app.untron.finance), [untron.eth](https://untron.eth.limo) (no CI/CD for ENS, don't rely on it for fetching the latest version), and [untron-frontend.vercel.app](https://untron-frontend.vercel.app).

## Running locally

```
echo "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<your walletconnect project id>" > .env
npm i --legacy-peer-deps
npm run dev
```

## Building
```
echo "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<your walletconnect project id>" > .env
npm i --legacy-peer-deps
npm run build
npm run start
```
