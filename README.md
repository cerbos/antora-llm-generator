# `@cerbos/antora-llm-generator`

`@cerbos/antora-llm-generator` is an [Antora](https://antora.org) extension that creates two auxiliary text files after each site build:

- **`llms.txt`**
- **`llms-full.txt`**

Both files combine selected site content into a single Markdown document so that large-language models can ingest concise background material, usage guidance, and deep-link references. See the specification at [https://llmstxt.org/](https://llmstxt.org/).

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
```

- `skippaths` accepts one or more glob patterns. Any file that matches a pattern is omitted from **both** `llm.txt` and `llm-full.txt`.

---

## Page-level exclusions

You can exclude individual pages without touching the playbook by setting AsciiDoc page attributes:

```adoc
:page-llms-ignore: true     # omit from llms.txt
:page-llms-full-ignore: true # omit from llms-full.txt
```

Apply either or both attributes at the top of the source file.

---

## Building the site

Run your Antora build as usual:

```bash
antora antora-playbook.yaml
```

On completion, two extra files - `/llms.txt` and `/llms-full.txt` - appear in the build output directory alongside your generated site. Distribute or host them wherever LLMs need access.

---

### At a glance

- **Purpose**: supply LLM-ready summaries of your documentation site.
- **Zero friction**: install, update the playbook, rebuild.
- **Granular control**: exclude by path globs or per-page attributes.

For more details, visit [https://llmstxt.org/](https://llmstxt.org/).
