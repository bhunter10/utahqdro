export default function ContactPage() {
  return (
    <main className="page">
      <section className="section">
        <div className="eyebrow">Contact</div>
        <h1>Send us a question.</h1>
        <p className="lead">
          Use this form for general questions. If you are ready to begin a QDRO,
          use the guided request flow so your information is saved securely.
        </p>
        <div className="grid two" style={{ marginTop: 28 }}>
          <form className="panel">
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
          <aside className="panel">
            <h2>Quick contact</h2>
            <p>
              <strong>Phone:</strong> 801-404-4600
              <br />
              <strong>Email:</strong> help@UtahQDRO.com
              <br />
              <strong>Address:</strong> Fibernet Building, 1145 S 800 E, Orem,
              UT 84097
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}
