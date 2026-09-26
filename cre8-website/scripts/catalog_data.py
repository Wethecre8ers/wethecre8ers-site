"""
Shared catalog reader for the build scripts.

js/products.js is the source of truth for product content. This module
parses its PRODUCTS array (a JavaScript object literal) into Python dicts
and validates it, and cross-checks it against api/catalog.json (the
checkout's price authority). It never writes catalog.json.
"""

import json
import os
import re

SITE = "https://www.wethecre8ers.com"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # cre8-website/
PRODUCTS_JS = os.path.join(ROOT, "js", "products.js")
LAYOUT_JS = os.path.join(ROOT, "js", "layout.js")
CATALOG_JSON = os.path.join(ROOT, "api", "catalog.json")


def _read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def _js_to_json(src):
    """Convert a JS array/object literal (single-quoted strings, bare keys,
    trailing commas, comments) into a JSON string."""
    out, i, n = [], 0, len(src)
    while i < n:
        c = src[i]
        if c == "'":
            j, buf = i + 1, []
            while src[j] != "'":
                if src[j] == "\\":
                    nxt = src[j + 1]
                    buf.append({"n": "\n", "t": "\t"}.get(nxt, nxt))
                    j += 2
                else:
                    buf.append(src[j])
                    j += 1
            out.append(json.dumps("".join(buf), ensure_ascii=False))
            i = j + 1
        elif src.startswith("//", i):
            i = src.index("\n", i)
        elif src.startswith("/*", i):
            i = src.index("*/", i) + 2
        elif c.isalpha() or c == "_":
            j = i
            while j < n and (src[j].isalnum() or src[j] in "_$"):
                j += 1
            word = src[i:j]
            k = j
            while k < n and src[k] in " \t\r\n":
                k += 1
            if k < n and src[k] == ":":
                out.append(json.dumps(word))
            elif word in ("true", "false", "null"):
                out.append(word)
            else:
                raise ValueError(f"Unsupported JS token in PRODUCTS: {word!r}")
            i = j
        elif c == ",":
            k = i + 1
            while k < n and src[k] in " \t\r\n":
                k += 1
            if k < n and src[k] not in "]}":
                out.append(c)
            i += 1
        else:
            out.append(c)
            i += 1
    return "".join(out)


def load_products():
    text = _read(PRODUCTS_JS)
    m = re.search(r"const PRODUCTS\s*=\s*(\[.*?\n\]);", text, re.S)
    if not m:
        raise SystemExit("Could not find PRODUCTS in js/products.js")
    return json.loads(_js_to_json(m.group(1)))


def load_categories():
    """[(name, '/shop-*.html'), ...] in CATEGORY_PAGES order."""
    m = re.search(r"const CATEGORY_PAGES\s*=\s*\[(.*?)\];", _read(LAYOUT_JS), re.S)
    if not m:
        raise SystemExit("Could not find CATEGORY_PAGES in js/layout.js")
    return re.findall(r"\{\s*name:\s*'([^']+)'\s*,\s*href:\s*'([^']+)'\s*\}", m.group(1))


def is_video(src):
    return bool(re.search(r"\.(mp4|mov|webm|m4v)$", src, re.I))


def photos(p):
    """Product images that are real photos (videos excluded)."""
    return [s for s in p.get("images", []) if not is_video(s)]


def product_path(p):
    return f"/products/{p['slug']}.html"


def product_url(p):
    return SITE + product_path(p)


def validate(products, categories):
    """Return a list of problem strings (empty means OK)."""
    problems = []
    seen_ids, seen_slugs, seen_titles, seen_descs = {}, {}, {}, {}
    cat_names = {n for n, _ in categories}
    for p in products:
        pid = p.get("id", "?")
        for field in ("id", "category", "name", "price", "desc", "slug"):
            if p.get(field) in (None, ""):
                problems.append(f"{pid}: missing required field '{field}'")
        if pid in seen_ids:
            problems.append(f"{pid}: duplicate id")
        seen_ids[pid] = 1
        slug = p.get("slug", "")
        if slug and not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", slug):
            problems.append(f"{pid}: slug '{slug}' must be lowercase letters/numbers/hyphens")
        if slug in seen_slugs:
            problems.append(f"{pid}: slug '{slug}' already used by {seen_slugs[slug]}")
        seen_slugs[slug] = pid
        if p.get("category") not in cat_names:
            problems.append(f"{pid}: category '{p.get('category')}' has no page in CATEGORY_PAGES")
        if not photos(p):
            problems.append(f"{pid}: needs at least one photo (non-video image)")
        for img in p.get("images", []):
            if not os.path.exists(os.path.join(ROOT, img.lstrip("/"))):
                problems.append(f"{pid}: image file missing: {img}")
        title, desc = seo_title(p), seo_desc(p)
        if title in seen_titles:
            problems.append(f"{pid}: SEO title duplicates {seen_titles[title]}")
        seen_titles[title] = pid
        if desc in seen_descs:
            problems.append(f"{pid}: SEO description duplicates {seen_descs[desc]}")
        seen_descs[desc] = pid
        if len(desc) > 160:
            problems.append(f"{pid}: SEO description is {len(desc)} chars (max 160)")
        if len(title) > 65:
            problems.append(f"{pid}: SEO title is {len(title)} chars (max 65)")
    return problems


def seo_title(p):
    return p.get("seoTitle") or f"{p['name']} | WeTheCre8ers"


def seo_desc(p):
    if p.get("seoDesc"):
        return p["seoDesc"]
    d = p["desc"]
    if len(d) <= 155:
        return d
    return d[:155].rsplit(" ", 1)[0].rstrip(",;:-") + "…"


def check_against_catalog(products):
    """Compare checkout-critical fields with api/catalog.json.
    Returns a list of mismatch strings. Never modifies catalog.json."""
    problems = []
    catalog = {c["id"]: c for c in json.loads(_read(CATALOG_JSON))}
    by_id = {p["id"]: p for p in products}
    for pid in by_id:
        if pid not in catalog:
            problems.append(f"{pid}: in products.js but missing from api/catalog.json")
    for cid in catalog:
        if cid not in by_id:
            problems.append(f"{cid}: in api/catalog.json but missing from products.js")
    for pid, p in by_id.items():
        c = catalog.get(pid)
        if not c:
            continue
        if c.get("name") != p["name"]:
            problems.append(f"{pid}: name differs (products.js '{p['name']}' vs catalog.json '{c.get('name')}')")
        if c.get("price") != p["price"]:
            problems.append(f"{pid}: price differs (products.js {p['price']} vs catalog.json {c.get('price')})")
        if (c.get("frameAddon") or 0) != (p.get("frameAddon") or 0):
            problems.append(f"{pid}: frameAddon differs (products.js {p.get('frameAddon')} vs catalog.json {c.get('frameAddon')})")
        if bool(c.get("needsPhoto")) != bool(p.get("needsPhoto")):
            problems.append(f"{pid}: needsPhoto differs (products.js {bool(p.get('needsPhoto'))} vs catalog.json {bool(c.get('needsPhoto'))})")
    return problems
