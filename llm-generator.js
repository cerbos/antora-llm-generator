"use strict";

const { NodeHtmlMarkdown } = require("node-html-markdown");
const { minimatch } = require("minimatch");

const nhm = new NodeHtmlMarkdown();

/**
 * An Antora extension that generates a single text file containing all the
 * content of the site, suitable for consumption by an LLM.
 */
module.exports.register = function (context, { config }) {
  const logger = context.getLogger("antora-llm-generator");
  const { playbook } = context.getVariables(); // playbook is available as soon as Antora starts
  const siteTitle = playbook.site?.title || "Documentation";
  const siteUrl = playbook.site?.url;

  const skipPaths = config.skippaths || [];
  // Per-page Markdown generation is on by default; set `pagemarkdown: false` to disable.
  const pageMarkdownEnabled = config.pagemarkdown !== false;

  // Optional llms.txt content that does not come from a page: a one-line site
  // summary rendered as a blockquote under the title, and extra sections of
  // links appended after the page index.
  const summary = typeof config.summary === "string" ? config.summary.trim() : "";
  const sections = Array.isArray(config.sections) ? config.sections : [];

  logger.warn(`Skip paths: ${JSON.stringify(skipPaths)}`);

  const formatLink = (title, url, description) =>
    description ? `- [${title}](${url}): ${description}` : `- [${title}](${url})`;

  const formatSections = () => {
    let out = "";
    sections.forEach((section, i) => {
      if (!section || typeof section.title !== "string" || !Array.isArray(section.links)) {
        logger.warn(`Ignoring sections[${i}]: it needs a title and a links list`);
        return;
      }
      const links = section.links.filter((link, j) => {
        if (link && typeof link.title === "string" && typeof link.url === "string") return true;
        logger.warn(`Ignoring sections[${i}].links[${j}]: it needs a title and a url`);
        return false;
      });
      out += `\n\n## ${section.title}\n`;
      for (const link of links) {
        out += `\n${formatLink(link.title, link.url, link.description)}`;
      }
    });
    return out;
  };

  const shouldSkipPath = (path) => {
    return skipPaths.some((pattern) => minimatch(path, pattern));
  };

  context.on("navigationBuilt", ({ contentCatalog, siteCatalog }) => {
    logger.info("Assembling content for LLM text files.");

    let indexContent = `# ${siteTitle}\n\n`;
    if (summary) {
      indexContent += `> ${summary}\n\n`;
    }
    let fullContent = "";

    const pages = contentCatalog.findBy({ family: "page" });

    for (const page of pages) {
      if (!page.out) continue;

      // console.log(`Processing page: ${page.src.path} -> ${page.out.path}`);
      if (shouldSkipPath(page.out.path)) {
        logger.warn(`Skipping page matching skip pattern: ${page.out.path}`);
        continue;
      }

      if (page.asciidoc.attributes["page-llms-ignore"]) {
        logger.warn(
          `Skipping page with 'page-llms-ignore' attribute: ${page.src.path}`
        );
        continue;
      }

      const description = page.asciidoc.attributes["page-llms-description"];
      indexContent += `\n${formatLink(page.title, `${siteUrl}/${page.out.path}`, description)}`;

      if (page.asciidoc.attributes["page-llms-full-ignore"]) {
        logger.warn(
          `Skipping page with 'page-llms-full-ignore' attribute: ${page.src.path}`
        );
        continue;
      }

      const plainText = nhm.translate(page.contents.toString());

      fullContent += `\n\n${page.title}\n`;
      fullContent += "====================\n";
      fullContent += plainText;

      // Emit a per-page Markdown file alongside the HTML output so that agents
      // can fetch an LLM-friendly version of any page (e.g. foo.html -> foo.md).
      const mdPath = page.out.path.replace(/\.html$/, ".md");
      if (pageMarkdownEnabled && mdPath !== page.out.path) {
        const pageMarkdown = `# ${page.title}\n\n${plainText}\n`;
        siteCatalog.addFile({
          out: { path: mdPath },
          contents: Buffer.from(pageMarkdown),
        });
      }
    }

    indexContent += formatSections();

    siteCatalog.addFile({
      out: { path: "llms-full.txt" }, // Output file path
      contents: Buffer.from(fullContent),
    });

    siteCatalog.addFile({
      out: { path: "llm-full.txt" }, // Output file path
      contents: Buffer.from(fullContent),
    });

    siteCatalog.addFile({
      out: { path: "llm.txt" }, // Output file path
      contents: Buffer.from(indexContent),
    });

    siteCatalog.addFile({
      out: { path: "llms.txt" }, // Output file path
      contents: Buffer.from(indexContent),
    });

    logger.info("llm.txt and llm-full.txt have been generated.");
  });
};
