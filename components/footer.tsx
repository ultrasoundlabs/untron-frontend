import Image from "next/image"
import Link from "next/link"
import { footerLinks } from "@/config/footer"

export default function Footer() {
  return (
    <footer className="py-12">
      <div className="w-full max-w-[1200px] mx-auto px-4">
        <div className="flex flex-col lg:flex-row">
          <div className="mb-8 lg:mb-0 lg:mr-16">
            <Image src="/logos/fullLogo.svg" alt="Untron" width={242} height={58} className="mb-4 w-[242px] h-[58px]" />
          </div>

          <div className="flex-1 flex flex-wrap">
            {footerLinks.map((section, index) => (
              <div 
                key={section.title} 
                className={`w-1/2 sm:w-1/3 mb-8 pr-4 ${index > 0 ? 'pl-4 sm:pl-0' : ''}`}
              >
                <h3 className="font-medium mb-1">{section.title}</h3>
                <ul className="space-y-0.5 text-base font-normal text-muted-foreground">
                  {section.links.map((link) => (
                    <li key={link.text}>
                      <Link href={link.href}>{link.text}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
} 