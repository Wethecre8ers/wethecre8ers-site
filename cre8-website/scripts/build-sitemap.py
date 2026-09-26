#!/usr/bin/env python3
"""
Regenerate sitemap.xml from the live product data.

Reads (via scripts/catalog_data.py):
  - js/products.js   -> the PRODUCTS array (id / category / name / slug / images)
  - js/layout.js     -> CATEGORY_PAGES (category name -> /shop-*.html)

Writes:
  - sitemap.xml  (home, shop, every category page, and every product page)

Normally you don't run this directly: `python3 scripts/build-products.py`
regenerates the product pages and calls this. Run it on its own with
--check to verify sitemap.xml is current without writing anything.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import catalog_data as cd  # noqa: E402

SITE = cd.SITE
OUT = os.path.join(cd.ROOT, "sitemap.xml")
IMG_EXT = (".jpg", ".jpeg", ".png", ".webp", ".gif")


def xml_escape(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;")
             .replace(">", "&gt;").replace('"', "&quot;"))


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


def imgs_for(prods):
    out = []
    for p in prods:
        for src in p.get("images", []):
            if src.lower().endswith(IMG_EXT):   # skip videos (.mp4/.mov/...)
                out.append((src, p["name"]))
    return out


def build_xml(products=None, categories=None):
    products = products if products is not None else cd.load_products()
    categories = categories if categories is not None else cd.load_categories()

    blocks = [
        # Home page — no product grid, so no image entries.
        url_block(f"{SITE}/", "monthly", "1.0", []),
        # Full catalog.
        url_block(f"{SITE}/shop.html", "weekly", "0.8", imgs_for(products)),
    ]
    # One entry per category page, with that category's product photos.
    for cat_name, href in categories:
        in_cat = [p for p in products if p["category"] == cat_name]
        blocks.append(url_block(f"{SITE}{href}", "weekly", "0.8", imgs_for(in_cat)))
    # One entry per product page, with that product's photos.
    for p in products:
        blocks.append(url_block(cd.product_url(p), "monthly", "0.7", imgs_for([p])))

    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
        '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'
        + "\n".join(blocks)
        + "\n</urlset>\n"
    )


def main():
    xml = build_xml()
    products = cd.load_products()
    categories = cd.load_categories()
    if "--check" in sys.argv:
        current = open(OUT, encoding="utf-8").read() if os.path.exists(OUT) else ""
        if current != xml:
            print("STALE: sitemap.xml is out of date — run scripts/build-products.py")
            sys.exit(1)
        print("sitemap.xml is current")
        return
    open(OUT, "w", encoding="utf-8").write(xml)
    total_imgs = sum(len(p["images"]) for p in products)
    print(f"Wrote {OUT}")
    print(f"  {2 + len(categories)} site pages + {len(products)} product pages, {total_imgs} product photos")


if __name__ == "__main__":
    main()
