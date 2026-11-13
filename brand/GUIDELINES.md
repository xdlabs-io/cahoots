# cahoots brand guidelines

**Name:** always lowercase, **cahoots**. Package names are `cahoots-mcp` and `@xdlabs/cahoots`. The ledger file is `CAHOOTS.md`, which stays uppercase because it is a filename.
**Tagline:** Agents in cahoots, on the record.
**Personality:** playful on the surface, strict underneath. Think board game night with a notary. The look is silly and light; the product promise (everything is on the record) is serious.

## 1. Logo

| File | Use |
| --- | --- |
| `logo/wordmark.svg` | Default. Ink letters with a sun shadow, on paper or white |
| `logo/wordmark-color.svg` | Playful contexts: README hero, stickers, events |
| `logo/wordmark-reverse.svg` | On ink or dark backgrounds |
| `logo/wordmark-mono-ink.svg`, `-mono-paper.svg` | One-color print, embossing, favicons in docs |
| `logo/lockup-horizontal.svg` | Headers, slide footers, email signatures |
| `logo/lockup-stacked.svg` | Posters, title slides, with tagline |
| `logo/icon-app.svg`, `favicon.svg` | App icon, favicon, social profile (tomato tile with a paper "c") |
| `logo/icon-mascot.svg` | Avatar, sticker, small spaces that need personality |
| `logo/stamp-on-the-record.svg` | Marks finalized decisions, release notes, merch |
| `logo/og-card.svg` | Social share card (1200x630) |

All logo SVGs are outlined. They do not need fonts installed.

**Clear space:** keep at least the height of the letter "o" free on every side.
**Minimum size:** wordmark 90px wide on screen, 25mm in print. Mascot icon 24px. App icon 16px (use `favicon.ico`).
**Shadow:** the sun shadow is part of the wordmark on light backgrounds. On one-color uses, drop it and use a mono file.

**Don't**
- Capitalize it ("Cahoots", "CAHOOTS") in the wordmark or in prose.
- Stretch, rotate, outline, or add effects to the wordmark. (The stamp is the only rotated element, at -5 degrees.)
- Put the sun-colored wordmark on paper. Sun on paper is 1.42:1.
- Swap the font. Chewy and Fredoka were explored and rejected for the wordmark.
- Redraw the mascot's faces or add accessories.

## 2. Color

| Name | Hex | On paper | On ink | Use |
| --- | --- | --- | --- | --- |
| ink | `#1F1A17` | 15.79 | n/a | Text, outlines, wordmark |
| tomato | `#F0502D` | 3.27 | 4.83 | Primary accent. Large text, graphics, buttons with ink labels (4.83) |
| stamp red | `#D63A18` | 4.30 | 3.68 | Tagline accent, stamp. Large or bold text only |
| sun | `#FFC83D` | 1.42 | 11.15 | Shadows, highlights, fills with ink text on top. Never text on paper |
| teal | `#1FA59A` | 2.79 | 5.67 | Secondary accent, success. Graphics and large text on paper |
| paper | `#FFF4DD` | n/a | 15.79 | Default background |
| card | `#FFFBF0` | n/a | n/a | Raised surfaces on paper |
| muted | `#5A4F45` | 7.29 | 2.17 | Secondary text on paper |

Ratios are WCAG contrast (computed). Body text needs 4.5:1 or better, so use ink or muted on paper. Tomato, stamp red, teal and sun are accents, not body-text colors on paper.

**Proportion:** about 60% paper, 25% ink, 15% accents. Pair at most three accents on one surface.

## 3. Typography

- **Wordmark and big display moments:** Bagel Fat One, lowercase, shadow offset 0.045em.
- **Headings, UI, taglines:** Fredoka 600 to 700.
- **Body:** Fredoka 500 for marketing; system sans for dense docs.
- **Code, terminal, ledger:** JetBrains Mono 400 and 600.

Scale (px): 160 / 96 display, 44 h1, 32 h2, 22 h3, 16 body, 14 caption. Sentence case for headings. The only uppercase text is the stamp ("ON THE RECORD", tracked +0.14em).

## 4. Voice

- Lowercase brand, sentence-case everything else.
- Plain words, short sentences, one joke at most.
- Say what was recorded, by whom, and when. Never hide dissent.
- Good: "agent 2 objects. noted." / "you're in cahoots." / "dissent is welcome here."
- Avoid: "revolutionary", "seamless", "supercharge", exclamation chains, emoji walls.

## 5. Mascot

Three round agents in tomato, sun and teal, huddled and whispering. The sun agent winks; that is the signature. Black 5px outline at the 440px artboard scale. Use the "psst..." speech bubble only on the full brand board and in empty states, not in the logo.

## 6. Motion

- **Reveal:** letters pop in left to right, 140ms stagger, small overshoot (up 14px, scale 1.12, rotate 3 degrees), settle at 11% of the cycle. Tagline fades in, stamp slams from scale 2 to 1. Loop 5.5s on marketing pages, play once in product.
- Respect `prefers-reduced-motion`: show the final frame.
- **Terminal:** `cahoots-mcp init` plays a half-block pixel-font reveal, 22ms per column, letters in tomato, sun, teal with darker shadows, centered. Source: `src/banner.js`.
- Never animate in `serve` mode, in CI, with `NO_COLOR`, or off a TTY. Write to stderr only.

## 7. Applications

- **README:** mascot centered at 280px, badges in tomato (cahoots-mcp), teal (@xdlabs/cahoots) and ink (license).
- **Social:** `png/og-card-1200x630.png`; avatar `png/avatar-mascot-512.png` or `png/icon-app-512.png`.
- **Favicon:** `favicon.svg` with `favicon.ico` fallback; `png/icon-app-180.png` for Apple touch.
- **Ledger and docs:** the stamp marks DECISION blocks in exported or rendered views.

## 8. Files

`logo/` outlined SVGs, `png/` raster exports, `favicon.ico`, `tokens.css`, `tokens.json`, `mascot.svg` (with bubble), `brand-board.html`, `wordmark-reveal.html`, `terminal-storyboard.html`, `guidelines.html`.

Fonts are not bundled. Bagel Fat One, Fredoka and JetBrains Mono are open fonts (SIL OFL) available from Google Fonts.
