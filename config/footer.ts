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
      { text: "Blog", href: "#" },
      { text: "About us", href: "#" },
      { text: "Terms of service", href: "#" },
      { text: "Privacy policy", href: "#" },
      { text: "Brand assets", href: "#" },
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
      { text: "SHPS (LLC) Ultrasound Labs", href: "mailto:contact@ultrasoundlabs.org" },
      { text: "contact@ultrasoundlabs.org", href: "mailto:contact@ultrasoundlabs.org" },
    ]
  }
]; 