#!/usr/bin/env python3
"""Render Late Gate pricing markdown to GitBook-like academic HTML."""

from __future__ import annotations

from pathlib import Path
import html
import re
import sys

ROOT = Path(__file__).resolve().parent
MD_PATH = ROOT / "technical-paper-flight-delay-pricing.md"
OUT_HTML = ROOT / "pricing-paper.html"
OUT_ACADEMIC = ROOT / "pricing-paper-academic.html"

EM_DASH = "\u2014"
EN_DASH = "\u2013"


def strip_dashes(s: str) -> str:
    s = s.replace(EM_DASH, ". ")
    s = s.replace(EN_DASH, "-")
    s = re.sub(r"\.\s+\.", ".", s)
    return s


def slugify(text: str) -> str:
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text)
    text = text.lower()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"\s+", "-", text.strip())
    return text[:80] or "section"


def inline(s: str) -> str:
    s = strip_dashes(s)
    s = html.escape(s)
    s = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', s)

    def linkify(m: re.Match) -> str:
        url = m.group(0)
        label = url if len(url) < 48 else url[:40] + "..."
        return f'<a href="{url}">{html.escape(label)}</a>'

    parts: list[str] = []
    last = 0
    for m in re.finditer(r"<a\s[^>]*>.*?</a>", s):
        chunk = s[last : m.start()]
        chunk = re.sub(r'(?<!["\'>])https?://[^\s<>")]+', linkify, chunk)
        parts.append(chunk)
        parts.append(m.group(0))
        last = m.end()
    chunk = s[last:]
    chunk = re.sub(r'(?<!["\'>])https?://[^\s<>")]+', linkify, chunk)
    parts.append(chunk)
    s = "".join(parts)

    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)", r"<em>\1</em>", s)
    s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
    return s


def render_callout(lines: list[str]) -> str:
    body_lines = [re.sub(r"^>\s?", "", ln) for ln in lines]
    title = "Callout"
    rest: list[str] = []
    first = body_lines[0].strip() if body_lines else ""
    m = re.match(r"^\*\*([^*]+)\*\*\s*(.*)$", first)
    if m:
        title = m.group(1).strip()
        rem = m.group(2).strip()
        if rem:
            rest.append(rem)
        rest.extend(body_lines[1:])
    else:
        rest = body_lines

    paras: list[str] = []
    items: list[str] = []
    numbered = False
    for ln in rest:
        ln = ln.strip()
        if not ln:
            continue
        if re.match(r"^\d+\.\s+", ln):
            numbered = True
            items.append(re.sub(r"^\d+\.\s+", "", ln))
        elif re.match(r"^[-*]\s+", ln):
            items.append(re.sub(r"^[-*]\s+", "", ln))
        else:
            paras.append(ln)

    inner: list[str] = []
    for p in paras:
        inner.append(f"<p>{inline(p)}</p>")
    if items:
        tag = "ol" if numbered else "ul"
        inner.append(f"<{tag}>")
        for it in items:
            inner.append(f"<li>{inline(it)}</li>")
        inner.append(f"</{tag}>")

    css = "callout"
    low = title.lower()
    if "takeaway" in low:
        css += " callout-takeaways"
    elif "variable" in low:
        css += " callout-vars"
    elif "decision" in low or "keep locked" in low:
        css += " callout-decide"
    elif "scaling" in low:
        css += " callout-scale"
    elif "risk" in low:
        css += " callout-risk"

    return (
        f'<aside class="{css}"><div class="callout-title">{html.escape(title)}</div>'
        + "".join(inner)
        + "</aside>"
    )


CSS = r"""
:root {
  --ink: #1a1a1a;
  --muted: #5a5a5a;
  --line: #d8d8d8;
  --bg: #f4f2ee;
  --paper: #ffffff;
  --accent: #0b3d5c;
  --takeaway: #e8f3ea;
  --vars: #eef2f8;
  --decide: #f8f1e6;
  --scale: #f3eef8;
  --risk: #f8ecec;
}
* { box-sizing: border-box; }
html { background: var(--bg); }
body {
  margin: 0;
  font-family: "Source Serif 4", "Times New Roman", Times, "Liberation Serif", Georgia, serif;
  font-size: 11pt;
  line-height: 1.5;
  color: var(--ink);
  overflow-wrap: anywhere;
  word-break: break-word;
}
.layout {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 0;
  max-width: 1100px;
  margin: 0 auto;
  min-height: 100vh;
}
.sidebar {
  position: sticky;
  top: 0;
  align-self: start;
  height: 100vh;
  overflow: auto;
  padding: 1.25rem 1rem 2rem;
  background: #f7f5f1;
  border-right: 1px solid var(--line);
  font-family: "Inter", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 9.5pt;
}
.sidebar .brand { font-weight: 700; color: var(--accent); margin-bottom: 0.35rem; font-size: 10.5pt; }
.sidebar .brand-sub { color: var(--muted); margin-bottom: 1rem; font-size: 8.5pt; }
.sidebar a {
  display: block;
  color: #333;
  text-decoration: none;
  padding: 0.28rem 0.4rem;
  border-radius: 4px;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.sidebar a:hover { background: #ebe7df; }
.sidebar a.nav-l2 { font-weight: 600; margin-top: 0.35rem; }
.sidebar a.nav-l3 { padding-left: 0.9rem; color: #555; font-weight: 400; }
.page { background: var(--paper); padding: 1.5rem 1.75rem 2.5rem; min-width: 0; }
h1.title {
  font-size: 1.55rem;
  font-weight: 700;
  margin: 0 0 0.4em;
  line-height: 1.25;
  overflow-wrap: anywhere;
}
.meta {
  font-family: "Inter", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 9.5pt;
  color: var(--muted);
  margin-bottom: 1rem;
}
.meta div { margin: 0.1em 0; }
hr.rule { border: none; border-top: 1px solid #bbb; margin: 1.1em 0; }
.content h1 { font-size: 1.2rem; margin: 1.4em 0 0.45em; page-break-after: avoid; }
.content h2 {
  font-size: 1.1rem;
  margin: 1.35em 0 0.45em;
  padding-top: 0.2em;
  border-top: 1px solid var(--line);
  page-break-after: avoid;
  color: var(--accent);
}
.content h2:first-child { border-top: none; }
.content h3 { font-size: 1.02rem; font-style: italic; font-weight: 700; margin: 1em 0 0.35em; }
.content h4 { font-size: 1rem; margin: 0.85em 0 0.3em; }
p { margin: 0 0 0.7em; text-align: left; overflow-wrap: anywhere; word-break: break-word; }
ul, ol { margin: 0 0 0.7em; padding-left: 1.35em; }
li { margin: 0.18em 0; overflow-wrap: anywhere; }
.table-wrap { width: 100%; overflow-x: auto; margin: 0.7em 0 0.95em; }
table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
  font-size: 9.5pt;
  font-family: "Inter", "Helvetica Neue", Helvetica, Arial, sans-serif;
}
th, td {
  border: 1px solid #ccc;
  padding: 0.35em 0.45em;
  vertical-align: top;
  text-align: left;
  overflow-wrap: anywhere;
  word-break: break-word;
  white-space: normal;
}
th { background: #f0f0f0; font-weight: 700; }
code {
  font-family: "JetBrains Mono", "Courier New", Courier, monospace;
  font-size: 0.88em;
  overflow-wrap: anywhere;
  word-break: break-word;
  white-space: pre-wrap;
}
pre, pre.formula {
  font-family: "JetBrains Mono", "Courier New", Courier, monospace;
  font-size: 9.5pt;
  background: #f7f7f7;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 0.7em 0.85em;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  page-break-inside: avoid;
}
a {
  color: var(--accent);
  text-decoration: underline;
  overflow-wrap: anywhere;
  word-break: break-word;
}
blockquote {
  margin: 0.8em 0;
  padding: 0.55em 0.9em;
  border-left: 3px solid #bbb;
  color: #333;
  background: #fafafa;
}
.callout {
  margin: 0.9em 0 1.1em;
  padding: 0.75em 0.95em;
  border-radius: 8px;
  border: 1px solid #d5d5d5;
  font-family: "Inter", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 9.8pt;
}
.callout-title { font-weight: 700; margin-bottom: 0.35em; color: var(--accent); }
.callout-takeaways { background: var(--takeaway); border-color: #b7d4bc; }
.callout-vars { background: var(--vars); border-color: #c2cde0; }
.callout-decide { background: var(--decide); border-color: #e0d0b0; }
.callout-scale { background: var(--scale); border-color: #d2c4e0; }
.callout-risk { background: var(--risk); border-color: #e0c0c0; }
.callout p { margin: 0 0 0.4em; }
.callout ol, .callout ul { margin: 0.2em 0 0.2em; }
.footer-note {
  margin-top: 2em;
  padding-top: 0.6em;
  border-top: 1px solid #bbb;
  font-size: 9pt;
  color: var(--muted);
  font-family: "Inter", "Helvetica Neue", Helvetica, Arial, sans-serif;
}
@media print {
  html { background: #fff; }
  .layout { display: block; max-width: none; }
  .sidebar {
    position: static;
    height: auto;
    border: none;
    border-bottom: 1px solid #ccc;
    page-break-after: always;
  }
  .page { padding: 0; }
  .content h2 { break-after: avoid; }
  a { color: #000; }
}
@media (max-width: 860px) {
  .layout { grid-template-columns: 1fr; }
  .sidebar {
    position: static;
    height: auto;
    border-right: none;
    border-bottom: 1px solid var(--line);
  }
}
"""


def main() -> None:
    md_path = Path(sys.argv[1]) if len(sys.argv) > 1 else MD_PATH
    md = strip_dashes(md_path.read_text())
    lines = md.splitlines()
    title = "Late Gate: Parametric Flight-Delay Stubs"
    if lines and lines[0].startswith("# "):
        title = strip_dashes(lines[0][2:].strip())
        lines = lines[1:]

    out: list[str] = []
    toc: list[tuple[int, str, str]] = []
    buf: list[str] = []
    i = 0
    in_code = False
    code_buf: list[str] = []
    table_rows: list[str] = []

    def flush_para() -> None:
        text = " ".join(buf).strip()
        if text:
            out.append("<p>" + inline(text) + "</p>")
        buf.clear()

    def flush_table() -> None:
        if not table_rows:
            return
        rows = []
        for row in table_rows:
            cells = [c.strip() for c in row.strip("|").split("|")]
            if all(re.match(r"^:?-+:?$", c or "") for c in cells):
                continue
            rows.append(cells)
        table_rows.clear()
        if not rows:
            return
        out.append('<div class="table-wrap"><table>')
        for ri, cells in enumerate(rows):
            tag = "th" if ri == 0 else "td"
            out.append(
                "<tr>" + "".join(f"<{tag}>{inline(c)}</{tag}>" for c in cells) + "</tr>"
            )
        out.append("</table></div>")

    while i < len(lines):
        line = lines[i]
        if line.startswith("```"):
            flush_para()
            flush_table()
            if not in_code:
                in_code = True
                code_buf = []
            else:
                code = html.escape("\n".join(code_buf))
                out.append(f'<pre class="formula"><code>{code}</code></pre>')
                in_code = False
            i += 1
            continue
        if in_code:
            code_buf.append(line)
            i += 1
            continue
        if line.strip() == "---":
            flush_para()
            flush_table()
            out.append('<hr class="rule"/>')
            i += 1
            continue
        if line.startswith(">"):
            flush_para()
            flush_table()
            q: list[str] = []
            while i < len(lines) and (
                lines[i].startswith(">") or (q and lines[i].strip() == "")
            ):
                if lines[i].strip() == "" and i + 1 < len(lines) and not lines[i + 1].startswith(">"):
                    break
                if lines[i].startswith(">"):
                    q.append(lines[i])
                i += 1
            body = "\n".join(re.sub(r"^>\s?", "", x) for x in q)
            if re.search(
                r"Key takeaways|Variables callout|Scaling callout|Risk callout|Keep locked",
                body,
                re.I,
            ):
                out.append(render_callout(q))
            else:
                out.append("<blockquote>" + inline(body.replace("\n", " ")) + "</blockquote>")
            continue
        if line.startswith("|"):
            flush_para()
            while i < len(lines) and lines[i].startswith("|"):
                table_rows.append(lines[i])
                i += 1
            flush_table()
            continue
        m = re.match(r"^(#{1,4})\s+(.*)$", line)
        if m:
            flush_para()
            flush_table()
            level = len(m.group(1))
            raw = strip_dashes(m.group(2))
            if level == 2 and re.match(r"^contents$", raw.strip(), re.I):
                i += 1
                while i < len(lines):
                    if re.match(r"^##\s+", lines[i]):
                        break
                    i += 1
                continue
            sid = slugify(raw)
            toc.append((level, raw, sid))
            out.append(f'<h{level} id="{html.escape(sid)}">{inline(raw)}</h{level}>')
            i += 1
            continue
        if re.match(r"^[-*]\s+", line):
            flush_para()
            flush_table()
            out.append("<ul>")
            while i < len(lines) and re.match(r"^[-*]\s+", lines[i]):
                item = re.sub(r"^[-*]\s+", "", lines[i])
                out.append("<li>" + inline(item) + "</li>")
                i += 1
            out.append("</ul>")
            continue
        if re.match(r"^\d+\.\s+", line):
            flush_para()
            flush_table()
            out.append("<ol>")
            while i < len(lines) and re.match(r"^\d+\.\s+", lines[i]):
                item = re.sub(r"^\d+\.\s+", "", lines[i])
                out.append("<li>" + inline(item) + "</li>")
                i += 1
            out.append("</ol>")
            continue
        if not line.strip():
            flush_para()
            i += 1
            continue
        buf.append(line.strip())
        i += 1

    flush_para()
    flush_table()
    body = "\n".join(out)

    nav_items = []
    for level, raw, sid in toc:
        plain = re.sub(r"[*_`]", "", raw)
        if level == 2:
            nav_items.append(
                f'<a class="nav-l2" href="#{html.escape(sid)}">{html.escape(plain)}</a>'
            )
        elif level == 3:
            nav_items.append(
                f'<a class="nav-l3" href="#{html.escape(sid)}">{html.escape(plain)}</a>'
            )
    nav_html = "\n".join(nav_items)

    katex_onload = (
        "renderMathInElement(document.body,{delimiters:["
        "{left:'$$',right:'$$',display:true},"
        "{left:'$',right:'$',display:false},"
        "{left:'\\\\(',right:'\\\\)',display:false},"
        "{left:'\\\\[',right:'\\\\]',display:true}"
        "],throwOnError:false});"
    )

    doc = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>{html.escape(title)}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"/>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js" onload="{katex_onload}"></script>
<style>
{CSS}
</style>
</head>
<body>
<div class="layout">
  <nav class="sidebar" aria-label="Table of contents">
    <div class="brand">Late Gate</div>
    <div class="brand-sub">Pricing technical paper · eng-lock.v1</div>
    {nav_html}
  </nav>
  <article class="page">
    <h1 class="title">{html.escape(title)}</h1>
    <div class="meta">
      <div>Late Gate Engineering · Internal technical paper</div>
      <div>Version eng-lock.v1 · Selective underwriting required</div>
    </div>
    <hr class="rule"/>
    <div class="content">
{body}
    </div>
    <div class="footer-note">
      Late Gate · Parametric flight-delay stubs · Eng / Product distribution
    </div>
  </article>
</div>
</body>
</html>
"""
    doc = strip_dashes(doc)
    OUT_HTML.write_text(doc)
    OUT_ACADEMIC.write_text(doc)
    print(f"wrote {OUT_HTML} ({OUT_HTML.stat().st_size} bytes)")
    print(f"wrote {OUT_ACADEMIC} ({OUT_ACADEMIC.stat().st_size} bytes)")
    print(f"toc entries: {len(toc)} nav links: {len(nav_items)}")


if __name__ == "__main__":
    main()
