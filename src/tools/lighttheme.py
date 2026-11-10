#!/usr/bin/env python3
"""Light theme, generated at build time from the (dark) site CSS.
Reads shell_head.html and prints it with an extra <style> block: for every CSS rule that uses a hard-coded or
variable colour, a ':root[data-theme=light] …' override with the colour flipped for a light page —
dark backgrounds become light tints of the same hue, light text becomes dark text of the same hue, faint white
overlays become faint black ones. Bright brand colours (blue, gold, team colours) are kept as they are.
fresh.js-style JS sets <html data-theme="light|dark"> (Auto follows the phone's setting).
usage: python3 tools/lighttheme.py shell_head.html > shell_built.html
"""
import re, sys, os, colorsys

HEX = re.compile(r'#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b')
RGBA = re.compile(r'rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)')
P = "html[data-theme=light]"

def parse_hex(h):
    if len(h) in (3, 4): h = "".join(c * 2 for c in h)
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    a = int(h[6:8], 16) / 255 if len(h) == 8 else 1.0
    return r, g, b, a

def fmt(r, g, b, a):
    R, G, B = (max(0, min(255, round(x * 255))) for x in (r, g, b))
    return f"#{R:02x}{G:02x}{B:02x}" if a >= 0.999 else f"rgba({R},{G},{B},{a:.2f})"

def flip(c, kind):
    r, g, b, a = c
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    if 0.8 <= a < 0.999 and kind == "bg" and l < 0.35:  # near-opaque bars (tab bar, sticky headers)
        return (*colorsys.hls_to_rgb(h, 1 - l * 0.6, s * 0.75), a)
    if a < 0.999:                                   # translucent overlays / shadows
        if l > 0.75: return (0, 0, 0, min(1, a * 0.9))        # white veil on dark -> black veil on light
        if l < 0.2 and kind != "text": return (0, 0, 0, a * 0.35)  # shadows: much softer
        if kind == "bg" and l < 0.35: return (*colorsys.hls_to_rgb(h, 1 - l * 0.6, s * 0.8), a)
        return None
    if kind == "text":
        if l > 0.55: return (*colorsys.hls_to_rgb(h, max(0.13, min(0.29, 1.05 - l)), min(1, s * 1.05)), a)
        return None
    if kind == "bg":
        if l < 0.35: return (*colorsys.hls_to_rgb(h, 1 - l * 0.6, s * 0.75), a)
        return None
    if kind == "border":
        if l < 0.35: return (*colorsys.hls_to_rgb(h, 1 - l * 0.85, s * 0.7), a)
        return None
    return None

def kind_of(prop, val):
    p = prop.strip().lower()
    if p.startswith("--"):
        return "var"
    if p in ("color", "fill", "stroke", "caret-color", "-webkit-text-fill-color", "text-decoration-color"): return "text"
    if p.startswith("background"): return "bg"
    if p.startswith("border") or p.startswith("outline") or p in ("box-shadow", "text-shadow"): return "border"
    return None

def colors_in(v):
    out = []
    for m in HEX.finditer(v): out.append((m.span(), parse_hex(m.group(1))))
    for m in RGBA.finditer(v):
        r, g, b = (int(m.group(i)) / 255 for i in (1, 2, 3)); a = float(m.group(4)) if m.group(4) else 1.0
        out.append((m.span(), (r, g, b, a)))
    return sorted(out)

def bright_bg(decls):
    """rule paints its own clearly coloured background (button / pill) -> keep its text colour"""
    for prop, val in decls:
        if kind_of(prop, val) == "bg":
            for _, c in colors_in(val):
                h, l, s = colorsys.rgb_to_hls(*c[:3])
                if c[3] > 0.6 and l >= 0.35 and (s > 0.25 or l > 0.85): return True
    return False

def convert_decls(decls):
    keep_text = bright_bg(decls); out = []
    for prop, val in decls:
        k = kind_of(prop, val)
        if not k: continue
        if k == "bg" and "var(--text)" in val: out.append("color:#fff")   # 'selected' pills: dark pill, white text
        cs = colors_in(val)
        if not cs: continue
        new, last, changed = "", 0, False
        for (a, b), c in cs:
            kk = k
            if k == "var":
                l = colorsys.rgb_to_hls(*c[:3])[1]
                kk = "bg" if l < 0.35 else "text" if l > 0.55 else None
            if kk == "text" and keep_text: kk = None
            f = flip(c, kk) if kk else None
            new += val[last:a] + (fmt(*f) if f else val[a:b]); last = b; changed |= bool(f)
        new += val[last:]
        if changed: out.append(f"{prop}:{new.replace('!important','').strip()}!important" if "!important" in val else f"{prop}:{new.strip()}")
    return out

def prefix(sel):
    out = []
    for s in sel.split(","):
        s = s.strip()
        if not s: continue
        if s in (":root", "html"): out.append(P)
        elif s.startswith("html") or s.startswith(":root"): out.append(P + s[4 if s.startswith("html") else 5:])
        else: out.append(P + " " + s)
    return ",".join(out)

def split_decls(body):
    d = []
    for part in re.split(r';(?![^(]*\))', body):
        if ":" in part:
            p, v = part.split(":", 1); d.append((p, v))
    return d

def walk(css):
    """yields generated css text for a block of rules (handles @media nesting)"""
    out, i, n = [], 0, len(css)
    while i < n:
        j = css.find("{", i)
        if j < 0: break
        head = css[i:j].strip()
        depth, k = 1, j + 1
        while k < n and depth:
            if css[k] == "{": depth += 1
            elif css[k] == "}": depth -= 1
            k += 1
        body = css[j + 1:k - 1]
        if head.startswith("@media") or head.startswith("@supports"):
            inner = walk(body)
            if inner: out.append(f"{head}{{{inner}}}")
        elif head.startswith("@"):
            pass                                       # keyframes / font-face: leave alone
        else:
            ds = convert_decls(split_decls(body))
            if ds: out.append(f"{prefix(head)}{{{';'.join(ds)}}}")
        i = k
    return "".join(out)

MANUAL = ("html[data-theme=light] .nbtabs button small.up{color:#17803d}html[data-theme=light] .nbtabs button small.dn{color:#b42318}"   # hit rates on the market tabs
          "html[data-theme=light] .nbtabs button.on small.up{color:#7fdc95}html[data-theme=light] .nbtabs button.on small.dn{color:#ff9a9d}"
          "html[data-theme=light] .scchips i.y{color:#17803d}html[data-theme=light] .scchips i.n{color:#b42318}"
          "html[data-theme=light] .pnum,html[data-theme=light] .bpn.n1{color:#fff!important}"   # team badges: inline team colour
          "html[data-theme=light] .fresh:not(.new):not(.bad){color:var(--text2)}html[data-theme=light] .card{box-shadow:0 1px 2px rgba(16,24,40,.05)}html[data-theme=light] #tabbar{box-shadow:0 -1px 0 var(--line)}")

def lum(r, g, b):
    f = lambda v: v / 12.92 if v <= .03928 else ((v + .055) / 1.055) ** 2.4
    return .2126 * f(r) + .7152 * f(g) + .0722 * f(b)

def inline_colors(src_dir):
    """Text colours written straight into the page code (style="color:#…") are picked for the dark page, so on the light
    page bright ones (yellow, pink, light blue, light green…) are hard to read, and the CSS rules above can't reach them.
    For each one that is under 4.5:1 on white, add a light-theme rule with a darker shade of the same hue."""
    import glob, os
    seen = set()
    for f in glob.glob(os.path.join(src_dir, "*.js")):
        if os.path.basename(f).endswith("_data.js") or "_p_" in os.path.basename(f): continue
        # every 6-digit colour in the code: colours also come from helpers (e.g. an injury colour function) into style="color:${…}"
        for m in re.finditer(r'#[0-9a-fA-F]{6}\b', open(f, encoding="utf8").read()): seen.add(m.group(0).lower())
    rules = []
    # dark pill backgrounds written in the code (style="background:#2a1a1b;color:…" — injury tags etc.): light tint on the light page
    pills = set()
    for f in glob.glob(os.path.join(src_dir, "*.js")):
        for m in re.finditer(r'background:(#[0-9a-fA-F]{6});color:', open(f, encoding="utf8").read()): pills.add(m.group(1).lower())
    for c in sorted(pills):
        r, g, b, _ = parse_hex(c[1:])
        if lum(r, g, b) > .08: continue
        h, l, sat = colorsys.rgb_to_hls(r, g, b)
        rules.append(f'{P} [style*="background:{c}" i]{{background:{fmt(*colorsys.hls_to_rgb(h, .93, min(.6, sat + .2)), 1)}!important}}')
    for c in sorted(seen):
        r, g, b, _ = parse_hex(c[1:])
        if (1.05) / (lum(r, g, b) + .05) >= 4.5: continue          # already fine on white
        h, l, sat = colorsys.rgb_to_hls(r, g, b)
        while l > .05 and 1.05 / (lum(*colorsys.hls_to_rgb(h, l, sat)) + .05) < 4.6: l -= .02
        d = fmt(*colorsys.hls_to_rgb(h, l, min(1, sat)), 1)
        sel = ",".join(f'{P} [style^="color:{c}" i],{P} [style*=";color:{c}" i],{P} [style*="; color:{c}" i]' for _ in [0])
        rules.append(f"{sel}{{color:{d}!important}}")
    return "".join(rules)

def main():
    src = open(sys.argv[1], encoding="utf8").read()
    css = "".join(re.findall(r"<style[^>]*>(.*?)</style>", src, re.S))
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    gen = walk(css)
    extra = (f"<style id=\"lightcss\">/* light theme — generated by tools/lighttheme.py */{gen}"
             f"{P}{{color-scheme:light;--bg:#f2f3f5;--card:#ffffff;--card2:#f1f2f4;--line:#e1e4e8;--text:#15181d;--text2:#3c424b;--muted:#5b636e}}"
             f"html[data-theme=dark]{{color-scheme:dark}}{MANUAL}{inline_colors(os.path.dirname(os.path.abspath(sys.argv[1])))}</style>\n")
    i = src.rfind("</head>")
    sys.stdout.write(src[:i] + extra + src[i:])

if __name__ == "__main__":
    main()
