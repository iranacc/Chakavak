import { describe, test, expect } from "vitest";
import { extractFirstUrl, parseHtmlMetadata } from "../lib/linkPreview.js";

describe("linkPreview library", () => {
  test("extracts first URL from various messages", () => {
    expect(extractFirstUrl("Check this out: https://example.com/test now!")).toBe(
      "https://example.com/test",
    );
    expect(extractFirstUrl("http://foo.bar and https://baz.com")).toBe(
      "http://foo.bar",
    );
    expect(extractFirstUrl("No link here at all")).toBeNull();
  });

  test("parses OpenGraph and HTML meta tags accurately", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fallback Title</title>
          <meta property="og:title" content="Real OG Title" />
          <meta property="og:description" content="This is the description." />
          <meta property="og:image" content="https://example.com/cover.png" />
          <meta property="og:site_name" content="ExampleSite" />
        </head>
        <body>Hello world</body>
      </html>
    `;

    const meta = parseHtmlMetadata(html, "https://example.com");
    expect(meta).not.toBeNull();
    expect(meta.title).toBe("Real OG Title");
    expect(meta.description).toBe("This is the description.");
    expect(meta.image).toBe("https://example.com/cover.png");
    expect(meta.siteName).toBe("ExampleSite");
  });

  test("falls back to standard title and meta description", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Standard Web Page</title>
          <meta name="description" content="A simple page description" />
        </head>
        <body></body>
      </html>
    `;

    const meta = parseHtmlMetadata(html, "https://simple.com");
    expect(meta).not.toBeNull();
    expect(meta.title).toBe("Standard Web Page");
    expect(meta.description).toBe("A simple page description");
    expect(meta.image).toBeNull();
  });
});
