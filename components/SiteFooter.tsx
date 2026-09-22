import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div className="brand">
            <img
              className="brand-mark"
              src="/utahqdro-mark.png?v=2"
              alt=""
              width={56}
              height={56}
            />
            <span>UtahQDRO</span>
          </div>
          <p>
            UtahQDRO prepares accurate, court-ready retirement division orders for
            Utah divorce cases.
          </p>
        </div>
        <div>
          <h3>Quick links</h3>
          <p>
            <Link href="/about">About</Link>
            <br />
            <Link href="/retirement-plans">Retirement Plans</Link>
            <br />
            <Link href="/faqs">FAQs</Link>
            <br />
            <Link href="/contact">Contact</Link>
          </p>
        </div>
        <div>
          <h3>Quick contact</h3>
          <p>
            801-404-4600
            <br />
            <a href="mailto:help@UtahQDRO.com">help@UtahQDRO.com</a>
            <br />
            Fibernet Building, 1145 S 800 E, Orem, UT 84097
          </p>
        </div>
      </div>
    </footer>
  );
}
