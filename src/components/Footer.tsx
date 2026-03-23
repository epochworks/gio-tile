import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gio-black text-white">
      <div className="max-w-container mx-auto px-container py-section">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div>
            <Image
              src="/gio-logo.svg"
              alt="GIO Architectural Tile & Stone"
              width={100}
              height={41}
              className="brightness-0 invert mb-6"
            />
            <p className="text-caption text-white/60 max-w-xs">
              Tile Collections Curated Expressly for Commercial Specifications
            </p>
          </div>

          {/* Products Column */}
          <div>
            <h4 className="text-caption uppercase tracking-wider mb-6 text-white/40">
              Products
            </h4>
            <ul className="space-y-3">
              <FooterLink href="/collections">All Collections</FooterLink>
              <FooterLink href="/collections?look=stone">Stone Look</FooterLink>
              <FooterLink href="/collections?look=wood">Wood Look</FooterLink>
              <FooterLink href="/collections?look=concrete">
                Concrete Look
              </FooterLink>
              <FooterLink href="/collections?style=mosaic">Mosaics</FooterLink>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className="text-caption uppercase tracking-wider mb-6 text-white/40">
              Resources
            </h4>
            <ul className="space-y-3">
              <FooterLink href="/resources/catalogs">Catalogs</FooterLink>
              <FooterLink href="/resources/technical">Technical Data</FooterLink>
              <FooterLink href="/resources/installation">
                Installation Guides
              </FooterLink>
              <FooterLink href="/resources/samples">Sample Ordering</FooterLink>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-caption uppercase tracking-wider mb-6 text-white/40">
              Company
            </h4>
            <ul className="space-y-3">
              <FooterLink href="/company">About Us</FooterLink>
              <FooterLink href="/blog">Blog</FooterLink>
              <FooterLink href="/contact">Contact</FooterLink>
              <FooterLink href="/reps">Find a Rep</FooterLink>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-small text-white/40">
            &copy; {new Date().getFullYear()} GIO Architectural Tile &amp; Stone.
            All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-small text-white/40 hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-small text-white/40 hover:text-white transition-colors"
            >
              Terms of Use
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <li>
      <Link
        href={href}
        className="text-caption text-white/60 hover:text-white transition-colors"
      >
        {children}
      </Link>
    </li>
  )
}
