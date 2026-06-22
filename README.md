# `@cerbos/antora-llm-generator`

`@cerbos/antora-llm-generator` is an [Antora](https://antora.org) extension that makes your documentation site agent-friendly. After each build it creates:

- **`llms.txt`** — an index of every page, following the [llmstxt.org](https://llmstxt.org/) spec.
- **`llms-full.txt`** — the full text of every page concatenated into one Markdown document.
- **A `.md` file for every page** — each rendered page is also written as Markdown alongside its HTML (e.g. `/docs/foo.html` → `/docs/foo.md`), so agents and crawlers can fetch a clean, LLM-friendly version of any individual page.

---

## Installation

```bash
yarn global add @cerbos/antora-llm-generator
# or
npm install --global @cerbos/antora-llm-generator
```

---

## Playbook configuration

Add the extension to your `antora-playbook.yaml`:

```yaml
antora:
  extensions:
    - require: "@cerbos/antora-llm-generator"
      skippaths:
        - "someGlob/**/path"
      pagemarkdown: true
```

- `skippaths` accepts one or more glob patterns. Any file that matches a pattern is omitted from **both** `llm.txt` and `llm-full.txt`, and no per-page `.md` file is generated for it.
- `pagemarkdown` (default `true`) toggles generation of the per-page `.md` files. Set it to `false` to emit only the aggregate `llms.txt` / `llms-full.txt` files.

---

## Page-level exclusions

You can exclude individual pages without touching the playbook by setting AsciiDoc page attributes:

```adoc
:page-llms-ignore: true     # omit from llms.txt
:page-llms-full-ignore: true # omit from llms-full.txt
:page-llms-description: Brief description of this page # add description to page link in llms.txt
```

Apply any or all attributes at the top of the source file.

### Page descriptions

The `:page-llms-description:` attribute allows you to add optional descriptions to page links in `llms.txt`, following the [llmstxt.org specification](https://llmstxt.org/). 

**Without description:**
```markdown
- [Getting Started](https://example.com/getting-started)
```

**With description:**
```markdown  
- [Getting Started](https://example.com/getting-started): Quick start guide for new users
```

---

## Building the site

Run your Antora build as usual:

```bash
antora antora-playbook.yaml
```

On completion, `/llms.txt` and `/llms-full.txt` appear in the build output directory, and a `.md` companion is written next to every page's HTML output. Distribute or host them wherever LLMs need access.

---

### At a glance

- **Purpose**: supply LLM-ready summaries of your documentation site.
- **Zero friction**: install, update the playbook, rebuild.
- **Granular control**: exclude by path globs or per-page attributes.

For more details, visit [https://llmstxt.org/](https://llmstxt.org/).
