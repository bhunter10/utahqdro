export default function ContactPage() {
  return (
    <main className="page contact-page">
      <section className="section contact-intro">
        <div className="contact-intro-copy">
          <div className="eyebrow">Contact UtahQDRO</div>
          <h1>Send us a question.</h1>
          <form className="contact-form contact-form-embedded">
            <div className="field-grid">
              <div className="field">
                <label htmlFor="first">First name</label>
                <input className="input" id="first" name="first" />
              </div>
              <div className="field">
                <label htmlFor="last">Last name</label>
                <input className="input" id="last" name="last" />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input className="input" id="email" name="email" type="email" />
              </div>
              <div className="field">
                <label htmlFor="phone">Phone</label>
                <input className="input" id="phone" name="phone" type="tel" />
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="message">Comments</label>
                <textarea className="textarea" id="message" name="message" />
              </div>
            </div>
            <div className="toolbar">
              <button className="button primary" type="button">
                Send message
              </button>
            </div>
          </form>
        </div>
        <aside className="contact-quick-card" aria-label="Quick contact details">
          <span className="contact-quick-label">Quick contact</span>
          <div className="contact-methods">
            <a href="tel:18014044600">
              <span>Phone</span>
              <strong>801-404-4600</strong>
            </a>
            <a href="mailto:help@UtahQDRO.com">
              <span>Email</span>
              <strong>help@UtahQDRO.com</strong>
            </a>
            <address>
              <span>Office</span>
              <strong>Fibernet Building</strong>
              <small>1145 S 800 E, Orem, UT 84097</small>
            </address>
          </div>
        </aside>
      </section>
    </main>
  );
}
