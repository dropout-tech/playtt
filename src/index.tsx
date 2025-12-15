import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
import Router from "./routes/Router";
import { HashRouter } from "react-router-dom";
import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";

function applySeo() {
  const origin = window.location.origin;
  const pathname = window.location.pathname || "/";
  const canonical = `${origin}${pathname}`;

  const canonicalEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]#canonical-url');
  if (canonicalEl) canonicalEl.href = canonical;

  const ensureMetaContent = (selector: string, value: string) => {
    const el = document.querySelector<HTMLMetaElement>(selector);
    if (el) el.setAttribute("content", value);
  };

  // Best-effort: keep share URL accurate (HashRouter adds #/ which we avoid)
  ensureMetaContent('meta[property="og:url"]', canonical);

  const ldJsonEl = document.getElementById("ld-json");
  if (ldJsonEl) {
    const basePath = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
    const logoUrl = `${origin}${basePath}/logo512.png`;

    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          name: "Let’s Play 桌球聯盟",
          url: canonical,
          logo: logoUrl,
          contactPoint: [
            {
              "@type": "ContactPoint",
              telephone: "+886-2-8286-1011",
              contactType: "customer service",
              availableLanguage: ["zh-Hant"],
            },
          ],
        },
        {
          "@type": "LocalBusiness",
          name: "Let’s Play 蘆洲店",
          url: canonical,
          telephone: "+886-2-8286-1011",
          address: {
            "@type": "PostalAddress",
            addressCountry: "TW",
            addressRegion: "新北市",
            addressLocality: "蘆洲區",
            streetAddress: "長樂路106號3樓",
          },
        },
      ],
    };

    ldJsonEl.textContent = JSON.stringify(jsonLd);
  }
}

const client = new ApolloClient({
  uri: "https://localhost:8080/query",
  cache: new InMemoryCache(),
});

applySeo();

ReactDOM.render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <HashRouter>
        <Router />
      </HashRouter>
    </ApolloProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
