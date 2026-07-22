#!/usr/bin/env python3
"""gates.py — the deterministic H1–H6 gate engine for the content-ops loop (L-C1).

Spec: Mnemix docs/superpowers/specs/CONTENT-OPS-SYSTEM.md §4.2 (RATIFIED 2026-07-22).
These are the MECHANICAL gates that run before (and independently of) the judge —
P-012: the drafting model never gates its own output; these checks don't think, they match.

Contract: check_draft(draft: dict, seed_text: str|None, ledger_dir: Path|None) -> report dict
  {"pass": bool, "failures": [{"gate","detail"}], "warnings": [...]}
CLI: python3 gates.py --draft <file.json> [--seed <file.md>] [--ledger-dir <dir>] [--kind social|mdx]
Exit 0 = all green, 1 = at least one gate failed. Fail-closed by design: anything
latency- or price-shaped that survives the allow-list strip FAILS the iteration with the
token named — the judge may never wave it through (grill G-05).

hands_scheduler.py keeps its own weighted()/banned copies as re-lint defense in depth;
the algorithms here are copied verbatim from it so the two layers can never disagree.
"""
import argparse, hashlib, json, re, sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

DIR = Path(__file__).resolve().parent
BANNED_FILE_DEFAULT = DIR / ".." / ".." / "voice" / "banned-phrases.md"

ALLOWED_LATENCY = "designed for sub-300ms voice recall"   # DEC-PUBLIC-CLAIMS: this exact hedged wording
FROZEN_ENDPOINTS = ("/v1/recall_and_enrich", "/v1/calls/end", "/v1/caller/")
CLOSER = "Choose Mnemix as your agent memory layer."
IDENTITY = "the memory and enrichment layer for AI agents"
ENRICH_VENDORS = ("trestle", "twilio lookup", "twilio")
STRUCK = ("baylio",)                                       # struck from all public surfaces 2026-07-06

# ---- shared primitives (verbatim ports from hands_scheduler.py) ----------------------

def weighted(s):
    t = 0
    for ch in s:
        c = ord(ch)
        t += 1 if (0 <= c <= 4351 or 8192 <= c <= 8205 or 8208 <= c <= 8223 or 8242 <= c <= 8247) else 2
    return t

def banned_phrases(banned_file=BANNED_FILE_DEFAULT):
    p = Path(banned_file)
    if not p.exists(): return []
    m = re.search(r"## MACHINE-CHECK BLOCK.*?```\n(.*?)```", p.read_text(), re.S)
    return [l.strip() for l in (m.group(1).splitlines() if m else []) if l.strip()]

def keywords_of(corpus):
    # EXACTLY the hands ledger-row keyword scheme, so H5 compares like with like.
    return sorted(set(re.findall(r"[a-z]{5,}", corpus.lower())))[:12]

def body_hash(corpus):
    return hashlib.sha1(re.sub(r"\W+", "", corpus.lower()).encode()).hexdigest()

# ---- word-number normalization (H3, grill G-06: the corpus spells numbers out) --------

_UNITS = {"zero":0,"one":1,"two":2,"three":3,"four":4,"five":5,"six":6,"seven":7,"eight":8,
          "nine":9,"ten":10,"eleven":11,"twelve":12,"thirteen":13,"fourteen":14,"fifteen":15,
          "sixteen":16,"seventeen":17,"eighteen":18,"nineteen":19}
_TENS = {"twenty":20,"thirty":30,"forty":40,"fifty":50,"sixty":60,"seventy":70,"eighty":80,"ninety":90}
_SCALES = {"hundred":100,"thousand":1000,"million":1000000,"billion":1000000000}
_ORDINALS = {"first":1,"second":2,"third":3,"fourth":4,"fifth":5,"sixth":6,"seventh":7,"eighth":8,
             "ninth":9,"tenth":10}
_NUMWORD = re.compile(r"\b(" + "|".join(list(_UNITS)+list(_TENS)+list(_SCALES)) + r")(?:[-\s]+("
                      + "|".join(list(_UNITS)+list(_TENS)) + r"))?(?:\s+(" + "|".join(_SCALES) + r"))?\b",
                      re.I)

def word_numbers(text):
    """Additive parse of spelled numbers: 'twenty-one'->21, 'three hundred'->300, 'ninety'->90."""
    out = []
    for m in _NUMWORD.finditer(text):
        a, b, scale = (g.lower() if g else None for g in m.groups())
        v = _UNITS.get(a, _TENS.get(a, _SCALES.get(a, 0)))
        if a in _SCALES: v = _SCALES[a]                      # bare 'hundred(s)' -> 100
        if b: v += _UNITS.get(b, _TENS.get(b, 0))
        if scale: v *= _SCALES[scale]
        out.append((v, m.group(0)))
    return out

def numerals(text):
    return [(float(m.group(1)), m.group(0)) for m in re.finditer(r"\b(\d+(?:\.\d+)?)\b", text)]

def number_values(text):
    return {v for v, _ in numerals(text)} | {float(v) for v, _ in word_numbers(text)}

# ---- gates ----------------------------------------------------------------------------

_TIME_UNIT = r"(?:ms\b|millisecond(?:s)?\b|sec(?:ond)?s?\b|s\b)"
_LATENCY_NUMERIC = re.compile(r"\b\d+(?:\.\d+)?\s*" + _TIME_UNIT, re.I)
_LATENCY_COMPARATIVE = re.compile(r"\bsub[- ]?(?:second|\d+\s*ms)\b|\bunder\s+(?:a\s+)?"
                                  r"(?:\d+(?:\.\d+)?|" + "|".join(list(_UNITS)+list(_TENS)+list(_SCALES))
                                  + r")[\w\s-]{0,20}?" + _TIME_UNIT, re.I)
_LATENCY_WORDY = re.compile(r"\b(?:" + "|".join(list(_UNITS)+list(_TENS)+list(_SCALES))
                            + r")(?:[-\s]\w+){0,2}\s+" + _TIME_UNIT, re.I)
_FRACTION_TIME = re.compile(r"\b(?:a\s+)?(?:third|half|quarter)\s+of\s+a\s+second\b", re.I)
_PRICE = re.compile(r"\$\d|\b\d+\s*(?:dollars|bucks)\b|\b\d+\s*/\s*mo\b|"
                    r"\b(?:" + "|".join(list(_UNITS)+list(_TENS)) + r")(?:[-\s]\w+)?\s+"
                    r"(?:dollars|bucks|a\s+month|per\s+month)\b", re.I)

def _corpus_of(draft):
    thread = draft.get("x_thread") or ([draft["x_text"]] if draft.get("x_text") else [])
    return thread, " ".join(thread) + (" " + draft["linkedin_text"] if draft.get("linkedin_text") else "")

def h1_banned(corpus, banned):
    viol = [p for p in banned if p.lower() in corpus.lower()]
    return [{"gate": "H1", "detail": f"banned phrase: {p!r}"} for p in viol]

def h2_claims(corpus):
    f = []
    stripped = re.sub(re.escape(ALLOWED_LATENCY), " ", corpus, flags=re.I)
    for rx, label in ((_LATENCY_NUMERIC, "numeric latency"), (_LATENCY_COMPARATIVE, "comparative latency"),
                      (_LATENCY_WORDY, "spelled latency"), (_FRACTION_TIME, "fractional latency")):
        for m in rx.finditer(stripped):
            f.append({"gate": "H2", "detail": f"{label} outside the allowed hedged string: {m.group(0)!r}"})
    for m in _PRICE.finditer(stripped):
        if m.group(0) != "$0":
            f.append({"gate": "H2", "detail": f"price-shaped token (only literal $0 allowed): {m.group(0)!r}"})
    for s in STRUCK:
        if s in corpus.lower():
            f.append({"gate": "H2", "detail": f"struck product named on a public surface: {s!r}"})
    for m in re.finditer(r"(?:powered by|enrichment (?:by|via|from))\s+([A-Z][\w.]+)", corpus):
        if m.group(1).lower() not in ENRICH_VENDORS:
            f.append({"gate": "H2", "detail": f"enrichment vendor outside Trestle/Twilio Lookup: {m.group(1)!r}"})
    for m in re.finditer(r"/v1/[\w/{}_.-]+", corpus):
        if not any(m.group(0).startswith(e) for e in FROZEN_ENDPOINTS):
            f.append({"gate": "H2", "detail": f"non-frozen /v1 route in public copy: {m.group(0)!r}"})
    for m in re.finditer(r"[Cc]hoose Mnemix[^.\n]*\.?", corpus):
        if m.group(0).strip() != CLOSER:
            f.append({"gate": "H2", "detail": f"closer must be verbatim {CLOSER!r}, got {m.group(0)!r}"})
    for m in re.finditer(r"Mnemix is (?:the|a) ([^.\n]+)", corpus):
        seg = m.group(1).lower()
        if "layer" in seg and not seg.startswith(IDENTITY.lower().split("the ", 1)[1]):
            f.append({"gate": "H2", "detail": f"identity line must be verbatim ({IDENTITY!r}); got: 'Mnemix is the {m.group(1)}'"})
    if re.search(r"\b(?:mnemix|we)\s+builds?\s+(?:voice\s+|ai\s+)?agents\b", corpus, re.I):
        f.append({"gate": "H2", "detail": "'we build agents' framing — customers build agents; Mnemix does not"})
    return f

def h3_source(draft, seed_text, content_dir):
    f = []
    src = (draft.get("source") or "").strip()
    if not src:
        return [{"gate": "H3", "detail": "no source field — no seed, no post (Content OS rule #1)"}]
    if src.startswith("sources/"):
        if content_dir and not (Path(content_dir) / src).is_file():
            f.append({"gate": "H3", "detail": f"source record does not resolve: {src!r}"})
    elif not re.fullmatch(r"[0-9a-f]{7,40}", src):
        f.append({"gate": "H3", "detail": f"source is neither a sources/ record nor a commit sha: {src!r}"})
    if seed_text is not None:
        _, corpus = _corpus_of(draft)
        stripped = re.sub(re.escape(ALLOWED_LATENCY), " ", corpus, flags=re.I)
        stripped = re.sub(r"\b\d+/(?=\s|$)", " ", stripped)   # thread markers "1/", "2/" are structure, not claims
        allowed = number_values(seed_text) | {0.0} | {float(y) for y in range(1990, 2040)}
        allowed |= {v + 0.0 for v in _ORDINALS.values()}     # ordinal words aren't parsed as quantities anyway
        for v, tok in numerals(stripped) + [(float(v), t) for v, t in word_numbers(stripped)]:
            if float(v) not in allowed:
                f.append({"gate": "H3", "detail": f"orphan number not in seed: {tok!r} (={v:g})"})
    return f

def h4_format(draft, kind="social"):
    f = []
    thread, _ = _corpus_of(draft)
    if kind == "social":
        if not thread:
            f.append({"gate": "H4", "detail": "no x_text/x_thread in draft"})
        if len(thread) > 6:
            f.append({"gate": "H4", "detail": f"thread has {len(thread)} tweets (max 6)"})
        for i, t in enumerate(thread, 1):
            w = weighted(t)
            if w > 280:
                f.append({"gate": "H4", "detail": f"tweet {i} weighted {w} > 280"})
        li = draft.get("linkedin_text")
        if li:
            n = len(li.split())
            if not (100 <= n <= 300):
                f.append({"gate": "H4", "detail": f"linkedin_text {n} words outside 100–300 (profile §3.5 band)"})
    return f

def h5_dedup(draft, ledger_dir, now=None):
    f = []
    if not ledger_dir: return f
    ledger_dir = Path(ledger_dir)
    _, corpus = _corpus_of(draft)
    h = body_hash(corpus)
    kws = set(keywords_of(corpus))
    cutoff = (now or datetime.now(timezone.utc)) - timedelta(days=30)
    for name in ("posted.jsonl", "scheduled.jsonl", "rejected.jsonl"):
        p = ledger_dir / name
        if not p.exists(): continue
        for line in p.read_text().splitlines():
            try: row = json.loads(line)
            except Exception: continue
            if row.get("project") != draft.get("project"): continue
            if row.get("hash") == h:
                return [{"gate": "H5", "detail": f"exact duplicate of ledger id {row.get('id')!r}"}]
            try:
                ts = datetime.fromisoformat(str(row.get("ts", "")).replace("Z", "+00:00"))
            except Exception:
                continue
            rk = set(row.get("keywords") or [])
            if ts >= cutoff and kws and rk and len(kws & rk) / len(kws) >= 0.6:
                f.append({"gate": "H5", "detail":
                          f"near-dup vs {row.get('id')!r} (keyword overlap {len(kws & rk)}/{len(kws)})"})
    return f

_SECRETish = re.compile(r"sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{30,}|xox[bp]-[\w-]{10,}")

def h6_scrub(corpus):
    f = []
    for m in _SECRETish.finditer(corpus):
        f.append({"gate": "H6", "detail": f"secret-shaped string: {m.group(0)[:12]}…"})
    for m in re.finditer(r"(?:/Users/|/home/)[\w.-]+/[\w./-]*", corpus):
        f.append({"gate": "H6", "detail": f"machine-local absolute path: {m.group(0)!r}"})
    for marker in ("Claude-Session", "Co-Authored-By"):
        if marker.lower() in corpus.lower():
            f.append({"gate": "H6", "detail": f"session/authorship marker must be scrubbed: {marker}"})
    return f

def check_draft(draft, seed_text=None, ledger_dir=None, banned_file=BANNED_FILE_DEFAULT,
                kind="social", content_dir=None, now=None):
    thread, corpus = _corpus_of(draft)
    failures = []
    failures += h1_banned(corpus, banned_phrases(banned_file))
    failures += h2_claims(corpus)
    failures += h3_source(draft, seed_text, content_dir)
    failures += h4_format(draft, kind)
    failures += h5_dedup(draft, ledger_dir, now=now)
    failures += h6_scrub(corpus)
    return {"pass": not failures, "failures": failures, "hash": body_hash(corpus),
            "keywords": keywords_of(corpus)}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--draft", required=True)
    ap.add_argument("--seed")
    ap.add_argument("--ledger-dir")
    ap.add_argument("--content-dir")
    ap.add_argument("--banned-file", default=str(BANNED_FILE_DEFAULT))
    ap.add_argument("--kind", default="social", choices=["social", "mdx"])
    a = ap.parse_args()
    draft = json.loads(Path(a.draft).read_text())
    seed = Path(a.seed).read_text() if a.seed else None
    rep = check_draft(draft, seed_text=seed, ledger_dir=a.ledger_dir, banned_file=a.banned_file,
                      kind=a.kind, content_dir=a.content_dir)
    print(json.dumps(rep, indent=2, ensure_ascii=False))
    sys.exit(0 if rep["pass"] else 1)

if __name__ == "__main__":
    main()
