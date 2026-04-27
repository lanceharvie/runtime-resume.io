const SECTIONS = [
  {
    title: "What this policy covers",
    body:
      "This policy explains how RunTime Resume, operated by RunTime Recruitment, collects, uses, stores, and protects information submitted through the site, order flow, intake form, and delivery workflow."
  },
  {
    title: "What information is collected",
    body:
      "Information may include your name, email address, LinkedIn profile, target roles, geography, resume files, intake answers, payment-related order metadata, and correspondence submitted through the contact form or delivery process. Payment card data is handled by Stripe and is not stored directly in this application."
  },
  {
    title: "How the information is used",
    body:
      "Your information is used to assess fit, process orders, deliver resume services, contact you about your order, send intake reminders or delivery emails, and maintain internal records of work completed. Contact-form enquiries are also used to decide whether a candidate is within scope before purchase."
  },
  {
    title: "Resume files and intake data",
    body:
      "Resume files, intake responses, review outputs, and delivery artifacts are stored so the work can be completed and referenced during revisions or follow-up. Access is limited to service administration and delivery functions."
  },
  {
    title: "Email and operational notifications",
    body:
      "The service may send customer emails such as order confirmations, intake reminders, and delivery notifications. Internal operational notifications may also be sent when a new order or contact enquiry is received."
  },
  {
    title: "Third-party services",
    body:
      "The service uses third-party providers including Stripe for payments and AWS email infrastructure for sending transactional emails. These providers process only the information needed to perform their part of the workflow."
  },
  {
    title: "Retention",
    body:
      "Information is retained for as long as reasonably required to deliver the service, manage revisions, maintain order records, and support normal business record-keeping. Data that is no longer required may be deleted or anonymised at discretion."
  },
  {
    title: "Security",
    body:
      "Reasonable administrative and technical steps are taken to protect stored information. No internet-based service can promise absolute security, so you should avoid submitting information that is not necessary for the resume service."
  },
  {
    title: "Your rights",
    body:
      "You may request correction of factual inaccuracies in the information you provided, and you may request deletion of submitted material where retention is no longer required for active service, legal, or operational reasons."
  }
]

export default function PrivacyPage() {
  return (
    <main className="rr-shell">
      <section className="rr-page-hero">
        <div className="rr-container">
          <div className="rr-eyebrow">Privacy</div>
          <h1 className="rr-title">Privacy policy</h1>
          <p className="rr-copy">
            This policy explains how candidate information is handled when using RunTime Resume.
          </p>
        </div>
      </section>

      <section className="rr-section">
        <div className="rr-container" style={{ display: "grid", gap: "2.5rem" }}>
          {SECTIONS.map((section) => (
            <article key={section.title} style={{ display: "grid", gap: "0.9rem" }}>
              <h2 style={{ margin: 0 }}>{section.title}</h2>
              <p style={{ margin: 0 }}>{section.body}</p>
            </article>
          ))}

          <article style={{ display: "grid", gap: "0.9rem" }}>
            <h2 style={{ margin: 0 }}>Contact</h2>
            <p style={{ margin: 0 }}>
              Questions about privacy or data handling can be sent through the contact page or by email to {" "}
              <a href="mailto:lance@runtimerec.com">lance@runtimerec.com</a>.
            </p>
          </article>
        </div>
      </section>
    </main>
  )
}
