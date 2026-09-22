import Link from "next/link";
import { navigation } from "@/lib/content";

export function SiteHeader() {
  return (
    <header className="topbar">
      <nav className="nav" aria-label="Main navigation">
        <Link className="brand" href="/">
          <img
            className="brand-mark"
            src="/utahqdro-mark.png?v=2"
            alt=""
            width={56}
            height={56}
          />
          <span>UtahQDRO</span>
        </Link>
        <div className="nav-links">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="nav-actions">
          <Link className="button secondary" href="/portal">
            Client Portal
          </Link>
          <Link className="button primary" href="/qdro-request">
            Start QDRO
          </Link>
        </div>
      </nav>
    </header>
  );
}
