# cahoots brand kit

Tagline: **Agents in cahoots, on the record.**

| File | What it is |
| --- | --- |
| `tokens.css` | Colors and font variables |
| `mascot.svg` | The three-agent huddle with the "psst…" bubble |
| `brand-board.html` | Wordmark, font alternatives, palette |
| `wordmark-reveal.html` | Animated CAHOOTS reveal (CSS only, loops every 5.5s) |
| `terminal-storyboard.html` | Four-frame storyboard for `cahoots-mcp init` |
| [`../src/banner.js`](../src/banner.js) | Dependency-free terminal reveal, the single source of truth. Wired into `init` only, never `serve` |

## Palette

ink `#1F1A17` · tomato `#F0502D` · sun `#FFC83D` · teal `#1FA59A` · paper `#FFF4DD` · stamp red `#D63A18`

## Type

Wordmark: Bagel Fat One (alternatives: Chewy, Fredoka). Headings: Fredoka. Code and terminal: JetBrains Mono.

## Terminal banner rules

- Output goes to stderr only. Writing to stdout in `serve` corrupts the JSON-RPC stdio stream.
- Animates only on a TTY. Skipped in CI, with `NO_COLOR`, `TERM=dumb`, or `CAHOOTS_NO_ANIMATION`.
