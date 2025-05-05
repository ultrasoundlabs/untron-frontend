import Image from "next/image"
import Link from "next/link"

export default function Footer() {
  return (
    <footer className="py-12">
      <div className="w-full max-w-[1200px] mx-auto px-4">
        <div className="flex flex-col lg:flex-row">
          <div className="mb-8 lg:mb-0 lg:mr-16">
            <Image src="/logos/fullLogo.svg" alt="Untron" width={242} height={58} className="mb-4 w-[242px] h-[58px]" />
          </div>

          <div className="flex-1 flex flex-wrap">
            <div className="w-1/2 sm:w-1/3 mb-8 pr-4">
              <h3 className="font-medium mb-1">Company</h3>
              <ul className="space-y-0.5 text-base font-normal text-[#8d8d8d]">
                <li>
                  <Link href="#">Blog</Link>
                </li>
                <li>
                  <Link href="#">About us</Link>
                </li>
                <li>
                  <Link href="#">Terms of service</Link>
                </li>
                <li>
                  <Link href="#">Privacy police</Link>
                </li>
                <li>
                  <Link href="#">Brand assets</Link>
                </li>
              </ul>
            </div>

            <div className="w-1/2 sm:w-1/3 mb-8 pr-4 pl-4 sm:pl-0">
              <h3 className="font-medium mb-1">Socials</h3>
              <ul className="space-y-0.5 text-base font-normal text-[#8d8d8d]">
                <li>
                  <Link href="#">X / Twitter</Link>
                </li>
                <li>
                  <Link href="#">Telegram</Link>
                </li>
                <li>
                  <Link href="#">LinkedIn</Link>
                </li>
              </ul>
            </div>

            <div className="w-full sm:w-1/3">
              <h3 className="font-medium mb-1">Contacts</h3>
              <ul className="space-y-0.5 text-base font-normal text-[#8d8d8d]">
                <li>SHPS (LLC) Ultrasound Labs</li>
                <li>contact@ultrasoundlabs.org</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 