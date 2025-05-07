import { FaqItem } from '../components/faq-accordion';

export const defaultFaqItems: FaqItem[] = [
  {
    question: "What's USDT?",
    answer:
      "USDT is a \"stablecoin\" — a special crypto which price is always backed by 1 USD for each coin. This lets you use US Dollars everywhere on the internet, without restrictions or complexities of traditional financial systems.",
    emoji: "💵",
  },
  {
    question: "What's Tron?",
    answer:
      "Tron (also known as \"TRC-20\") is a blockchain that's primarily used for USDT payments. It's fast and accepted everywhere where USDT is, but very expensive and sometimes inconvenient to use. The fees can be as high as $5-10 for a single transfer.",
    emoji: "😳",
  },
  {
    question: "What's Ethereum?",
    answer:
      "Ethereum is the most secure and decentralized ecosystem of blockchains for payments in USDT and beyond. Its blockchains like Base and Arbitrum are much faster and cheaper (sometimes even free — like in Untron!) to use than Tron, but they're not as widely accepted.",
    emoji: "😍",
  },
  {
    question: "What's Untron?",
    answer:
      "Untron is a platform dedicated to making it cheap and easy to use USDT by connecting next-generation blockchains like Base and Arbitrum to Tron's vast payments ecosystem. Being in beta, Untron only supports sending USDT from Tron to Ethereum chains, but expanding to the other direction is our first priority.",
    emoji: "💪",
  },
  {
    question: "How to send USDT from Tron?",
    answer:
      "To send USDT from Tron to Ethereum chains, you simply need to enter the amount you want to send, select the receiving chain and recipient address, and click the \"Untron\" button. Untron fully supports both wallets like Trust Wallet and exchanges like Binance, and it's really fast and cheap!",
    emoji: "🤔",
  },
  {
    question: "What about into Tron?",
    answer:
      "Untron's end goal is to make it as cheap and easy as possible to send USDT between Ethereum and Tron ecosystems. Being a decentralized platform, each of your swaps bring Untron closer to opening transfers in the remaining direction — from Ethereum chains to Tron.",
    emoji: "🤨",
  },
  {
    question: "How can I help?",
    answer:
      "Untron is a completely open-source project, and its code is available on <a href='https://github.com/ultrasoundlabs' target='_blank' rel='noopener noreferrer' class='text-primary hover:underline'>GitHub</a>. If you're not a developer, you can help us by spreading the word about Untron, or providing liquidity for swaps. For the latter, reach out to us on <a href='https://t.me/alexhooketh' target='_blank' rel='noopener noreferrer' class='text-primary hover:underline'>Telegram</a> or at <a href='mailto:contact@untron.finance' class='text-primary hover:underline'>contact@untron.finance</a>.",
    emoji: "👍",
  },
]; 
