# cahoots brand kit

Tagline: **Agents in cahoots, on the record.**

| Path | What it is |
| --- | --- |
| [`GUIDELINES.md`](GUIDELINES.md), [`guidelines.html`](guidelines.html) | Full brand guidelines: logo rules, color and contrast, type, voice, motion |
| `logo/` | Outlined SVGs: wordmarks (default, color, reverse, mono), lockups, icons, stamp, social card |
| `png/` | Raster exports: wordmarks and lockups at 2000px, icon sizes 16-1024, avatar, OG card |
| `favicon.ico`, `logo/favicon.svg` | Favicons |
| `tokens.css`, `tokens.json` | Colors, fonts, motion, radii |
| `mascot.svg` | The three-agent huddle with the "psst..." bubble |
| `brand-board.html`, `wordmark-reveal.html`, `terminal-storyboard.html` | Visual studies, including the animated reveal |
| [`../src/banner.js`](../src/banner.js) | Terminal reveal, the single source of truth. Wired into `init` only, never `serve` |

## Palette

ink `#1F1A17` · tomato `#F0502D` · sun `#FFC83D` · teal `#1FA59A` · paper `#FFF4DD` · stamp red `#D63A18`

## Type

Wordmark: Bagel Fat One (alternatives: Chewy, Fredoka). Headings: Fredoka. Code and terminal: JetBrains Mono.

## Terminal banner rules

- Output goes to stderr only. Writing to stdout in `serve` corrupts the JSON-RPC stdio stream.
- Animates only on a TTY. Skipped in CI, with `NO_COLOR`, `TERM=dumb`, or `CAHOOTS_NO_ANIMATION`.

## License

The code is MIT. The name, wordmark and mascot are not covered by that license; see [`LICENSE.md`](LICENSE.md).
