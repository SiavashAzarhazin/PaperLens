const features = [
  "Upload PDFs, screenshots, and scans",
  "Extract structured fields with confidence scores",
  "Ask questions with source-linked citations",
  "Track document jobs through an async pipeline"
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Multimodal document intelligence</p>
        <h1>Turn messy documents into trustworthy answers.</h1>
        <p className="lede">
          PaperLens is being built as a full-stack document intelligence platform
          for parsing, retrieval, extraction, and grounded question answering.
        </p>
      </section>

      <section className="card-grid" aria-label="Core platform capabilities">
        {features.map((feature) => (
          <article className="feature-card" key={feature}>
            <p>{feature}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
