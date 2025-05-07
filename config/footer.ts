export interface FooterLink {
  text: string;
  href: string;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}

export const footerLinks: FooterSection[] = [
  {
    title: "Project",
    links: [
    // TODO: fill this with actual links
      { text: "Blog", href: "https://x.com/untronfi" },
      { text: "About us", href: "https://x.com/untronfi" },
      { text: "Terms of service", href: "https://www.wtfpl.net/wp-content/uploads/2012/12/freedom.jpeg" },
      { text: "Brand assets", href: "https://github.com/ultrasoundlabs/brandkit" },
    ]
  },
  {
    title: "Socials",
    links: [
      { text: "X / Twitter", href: "https://x.com/untronfi" },
      { text: "Telegram", href: "https://t.me/untronchat" },
      { text: "GitHub", href: "https://github.com/ultrasoundlabs" },
    ]
  },
  {
    title: "Contacts",
    links: [
      { text: "SHPS (LLC) Ultrasound Labs", href: "mailto:contact@untron.finance" },
      { text: "contact@untron.finance", href: "mailto:contact@untron.finance" },
    ]
  }
]; 