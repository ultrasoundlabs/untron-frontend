import { FaqItem } from '../components/faq-accordion';

export const defaultFaqItems: FaqItem[] = [
  {
    question: "What's USDT?",
    answer:
      "USDT is a \"stablecoin\" — a special crypto which price is always backed by 1 USD for each coin. This lets you use US Dollars everywhere on the internet, without restrictions or complexities of traditional financial systems.",
    emoji: "/emoji/Dollar Banknote.png",
  },
  {
    question: "What's Tron?",
    answer:
      "Tron (also known as \"TRC-20\") is a blockchain that's primarily used for USDT payments. It's fast and accepted everywhere where USDT is, but very expensive and sometimes inconvenient to use. The fees can be as high as $5-10 for a single transfer.",
    emoji: "/emoji/Flushed Face.png",
  },
  {
    question: "What's Ethereum?",
    answer:
      "Ethereum is the most secure and decentralized ecosystem of blockchains for payments in USDT and beyond. Its blockchains like Base and Arbitrum are much faster and cheaper (sometimes even free — like in Untron!) to use than Tron, but they're not as widely accepted.",
    emoji: "/emoji/Smiling Face With Heart Eyes.png",
  },
  {
    question: "What's Untron?",
    answer:
      "Untron is a platform dedicated to making it cheap and easy to use USDT by connecting next-generation blockchains like Base and Arbitrum to Tron's vast payments ecosystem. With Untron, you can send and receive USDT on Tron & beyond without having to buy TRX or ETH, or even having a Tron wallet — your Ethereum wallet has got you covered.",
    emoji: "/emoji/Flexed Biceps.png",
  },
  {
    question: "How to send USDT from Tron?",
    answer:
      "To send USDT from Tron to Ethereum chains, you simply need to enter the amount you want to send, select the receiving chain and recipient address, and click the \"Untron\" button. Untron fully supports both wallets like Trust Wallet and exchanges like Binance, and it's really fast and cheap!",
    emoji: "/emoji/Face With Raised Eyebrow.png",
  },
  {
    question: "What about into Tron?",
    answer:
      "That's even simpler — select \"Into Tron,\" choose your coin, and Untron instantly converts it to Tron USDT with the lowest possible gas — no ETH or TRX needed. Enjoy up to 70% lower fees than sending on Tron directly!",
    emoji: "/emoji/Star-Struck.png",
  },
  {
    question: "How can I help?",
    answer:
      "Untron is a completely open-source project, and its code is available on <a href='https://github.com/ultrasoundlabs' target='_blank' rel='noopener noreferrer' class='text-primary hover:underline'>GitHub</a>. If you're not a developer, you can help us by spreading the word about Untron. We're also looking for liquidity providers for our intent solvers. For the latter, reach out to us on <a href='https://t.me/alexhooketh' target='_blank' rel='noopener noreferrer' class='text-primary underline hover:underline'>Telegram</a> or at <a href='mailto:contact@untron.finance' class='text-primary underline hover:underline'>contact@untron.finance</a>.",
    emoji: "/emoji/Thumbs Up.png",
  },
]; 
