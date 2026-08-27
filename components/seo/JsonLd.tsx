import { projects } from "@/content/projects";
import { PROJECTS_ARE_REAL, site, SITE_URL } from "@/content/site";

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const FOUNDER_ID = `${SITE_URL}/#founder`;
const WEBSITE_ID = `${SITE_URL}/#website`;

/**
 * schema.org graph for the studio.
 *
 * This is the highest-leverage markup on the page for generative search: Google
 * rich results, Bing, and most LLM extraction pipelines parse JSON-LD directly
 * rather than inferring entities from prose. The `@id` references wire the
 * nodes into one connected statement — Lattice is an organisation, it publishes
 * the site at this URL, it offers these three services, it operates from these
 * two cities, and it was founded by this person — instead of several unrelated
 * ones.
 *
 * `Organization` rather than `LocalBusiness`/`ProfessionalService` on purpose:
 * the local-business types expect a street address and a public phone number,
 * and emitting one with those fields blank buys validation warnings without
 * buying local rich results. Add a street address and contact details to
 * content/site.ts and this is the node to upgrade.
 */
function buildGraph() {
  const founder = {
    "@type": "Person",
    "@id": FOUNDER_ID,
    name: site.founder.name,
    url: site.founder.url,
    // Reciprocal to the organisation's `founder` edge below, so a crawler can
    // traverse the relationship from either node.
    founderOf: { "@id": ORGANIZATION_ID },
  };

  const organization = {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: site.name,
    url: SITE_URL,
    slogan: site.tagline,
    description: site.summary,
    founder: { "@id": FOUNDER_ID },
    knowsAbout: site.services.map((service) => service.name),
    location: site.locations.map((location) => ({
      "@type": "Place",
      name: location.city,
      address: {
        "@type": "PostalAddress",
        addressLocality: location.city,
        addressRegion: location.region,
        addressCountry: location.country,
      },
    })),
    areaServed: site.locations.map((location) => ({
      "@type": "Country",
      name: location.country,
    })),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${site.name} services`,
      itemListElement: site.services.map((service) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service.name,
          description: service.description,
          provider: { "@id": ORGANIZATION_ID },
        },
      })),
    },
  };

  const website = {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: site.name,
    description: site.description,
    inLanguage: "en",
    publisher: { "@id": ORGANIZATION_ID },
    copyrightHolder: { "@id": ORGANIZATION_ID },
  };

  // Held back until content/projects.ts stops being placeholder fiction —
  // see PROJECTS_ARE_REAL in content/site.ts.
  const work = PROJECTS_ARE_REAL
    ? projects.map((project) => ({
        "@type": "CreativeWork",
        "@id": `${SITE_URL}/#project-${project.id}`,
        name: project.title,
        abstract: project.tagline,
        description: project.paragraphs.join(" "),
        ...(project.year ? { dateCreated: project.year } : {}),
        creator: { "@id": ORGANIZATION_ID },
        isPartOf: { "@id": WEBSITE_ID },
      }))
    : [];

  return {
    "@context": "https://schema.org",
    "@graph": [organization, founder, website, ...work],
  };
}

export function JsonLd() {
  return (
    <script
      type="application/ld+json"
      // Static, self-authored content — but `<` is still escaped so a stray
      // "</script>" in future copy cannot break out of the tag.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(buildGraph()).replace(/</g, "\\u003c"),
      }}
    />
  );
}
