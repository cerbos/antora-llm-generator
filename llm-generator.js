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

  logger.warn(`Skip paths: ${JSON.stringify(skipPaths)}`);

  const shouldSkipPath = (path) => {
    return skipPaths.some((pattern) => minimatch(path, pattern));
  };

  context.on("navigationBuilt", ({ contentCatalog, siteCatalog }) => {
    logger.info("Assembling content for LLM text files.");

    let indexContent = `# ${siteTitle}\n\n`;
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

      indexContent += `\n- [${page.title}](${siteUrl}/${page.out.path})`;

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
    }

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
