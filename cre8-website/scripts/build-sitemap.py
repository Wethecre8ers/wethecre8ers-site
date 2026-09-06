#!/usr/bin/env python3
"""
Regenerate sitemap.xml from the live product data.

Reads:
  - js/products.js   -> the PRODUCTS array (id / category / name / images)
  - js/layout.js     -> CATEGORY_PAGES (category name -> /shop-*.html)

Writes:
  - sitemap.xml

Run from anywhere:  python3 cre8-website/scripts/build-sitemap.py
Re-run it whenever products, photos, or category pages change so the
sitemap (and its product-image entries) never drift out of sync.
"""

import os
import re
import sys

SITE = "https://www.wethecre8ers.com"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # cre8-website/

PRODUCTS_JS = os.path.join(ROOT, "js", "products.js")
LAYOUT_JS = os.path.join(ROOT, "js", "layout.js")
OUT = os.path.join(ROOT, "sitemap.xml")


def xml_escape(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;")
             .replace(">", "&gt;").replace('"', "&quot;"))


def parse_category_pages(text):
    """[(category_name, '/shop-*.html'), ...] in file order."""
    m = re.search(r"const CATEGORY_PAGES\s*=\s*\[(.*?)\];", text, re.S)
    if not m:
        sys.exit("Could not find CATEGORY_PAGES in layout.js")
    pages = []
    for entry in re.finditer(r"\{\s*name:\s*'([^']+)'\s*,\s*href:\s*'([^']+)'\s*\}", m.group(1)):
        pages.append((entry.group(1), entry.group(2)))
    return pages


def parse_products(text):
    """[{'id','category','name','images':[...]}, ...] in file order."""
    m = re.search(r"const PRODUCTS\s*=\s*\[(.*?)\n\];", text, re.S)
    if not m:
        sys.exit("Could not find PRODUCTS in products.js")
    block = m.group(1)

    products = []
    id_iter = list(re.finditer(r"id:\s*'([^']+)'", block))
    for i, im in enumerate(id_iter):
        start = im.start()
        end = id_iter[i + 1].start() if i + 1 < len(id_iter) else len(block)
        chunk = block[start:end]

        cat = re.search(r"category:\s*'([^']+)'", chunk)
        name = re.search(r"name:\s*'((?:\\.|[^'\\])*)'", chunk)
        imgs_m = re.search(r"images:\s*\[([^\]]*)\]", chunk)
        images = re.findall(r"'([^']+)'", imgs_m.group(1)) if imgs_m else []

        products.append({
            "id": im.group(1),
            "category": cat.group(1) if cat else "",
            "name": (name.group(1).replace("\\'", "'") if name else im.group(1)),
            "images": images,
        })
    return products


def url_block(loc, changefreq, priority, images):
    lines = [
        "  <url>",
        f"    <loc>{loc}</loc>",
        f"    <changefreq>{changefreq}</changefreq>",
        f"    <priority>{priority}</priority>",
    ]
    for src, title in images:
        lines += [
            "    <image:image>",
            f"      <image:loc>{SITE}{src}</image:loc>",
            f"      <image:title>{xml_escape(title)}</image:title>",
            "    </image:image>",
        ]
    lines.append("  </url>")
    return "\n".join(lines)


def main():
    products = parse_products(open(PRODUCTS_JS, encoding="utf-8").read())
    category_pages = parse_category_pages(open(LAYOUT_JS, encoding="utf-8").read())

    def imgs_for(prods):
        out = []
        for p in prods:
            for src in p["images"]:
                out.append((src, p["name"]))
        return out

    blocks = [
        # Home page — no product grid, so no image entries.
        url_block(f"{SITE}/", "monthly", "1.0", []),
        # Full catalog.
        url_block(f"{SITE}/shop.html", "weekly", "0.8", imgs_for(products)),
    ]
    # One entry per category page, with that category's product photos.
    for cat_name, href in category_pages:
        in_cat = [p for p in products if p["category"] == cat_name]
        blocks.append(url_block(f"{SITE}{href}", "weekly", "0.8", imgs_for(in_cat)))

    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
        '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'
        + "\n".join(blocks)
        + "\n</urlset>\n"
    )

    open(OUT, "w", encoding="utf-8").write(xml)
    total_imgs = sum(len(p["images"]) for p in products)
    print(f"Wrote {OUT}")
    print(f"  {2 + len(category_pages)} pages, {len(products)} products, {total_imgs} product photos")


if __name__ == "__main__":
    main()
