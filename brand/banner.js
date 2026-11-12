// Dependency-free cahoots banner. Reveals left to right, like the brand reveal.
// Pixel-font letters drawn with half-blocks (square pixels), tomato, sun and teal letters with a darker drop shadow.
// Writes to stderr only, and only when it is safe to animate. Call from `init`, never from `serve`.

const E = '     ';
const GLYPHS = {
  c: [E, E, E, ' ███ ', '█   █', '█    ', '█   █', ' ███ '],
  a: [E, E, E, ' ███ ', '    █', ' ████', '█   █', ' ████'],
  h: ['█    ', '█    ', '█    ', '████ ', '█   █', '█   █', '█   █', '█   █'],
  o: [E, E, E, ' ███ ', '█   █', '█   █', '█   █', ' ███ '],
  t: [E, '  █  ', '  █  ', '█████', '  █  ', '  █  ', '  █  ', '   ██'],
  s: [E, E, E, ' ████', '█    ', ' ███ ', '    █', '████ '],
};

const WORD = 'cahoots';
const TAGLINE = 'Agents in cahoots, on the record.';
const COLORS = [
  [240, 80, 45], // tomato
  [255, 200, 61], // sun
  [31, 165, 154], // teal
];
const shade = ([r, g, b]) => [Math.round(r * 0.5), Math.round(g * 0.5), Math.round(b * 0.5)]; // darker drop shadow
const EDGE = [255, 244, 221]; // paper, the sweeping leading edge
const RED = [214, 58, 24];

const PX_H = 8; // pixel rows in a glyph
const TERM_ROWS = 5; // 8 pixel rows + 1 shadow row, 2 pixels per terminal row

const fg = ([r, g, b]) => `\x1b[38;2;${r};${g};${b}m`;
const bg = ([r, g, b]) => `\x1b[48;2;${r};${g};${b}m`;
const RESET = '\x1b[0m';
const pad = (stream, width) => ' '.repeat(Math.max(0, Math.floor(((stream.columns || 80) - width) / 2)));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function shouldAnimate(stream = process.stderr, env = process.env) {
  return Boolean(
    stream.isTTY &&
      !env.CI &&
      !env.NO_COLOR &&
      env.TERM !== 'dumb' &&
      !env.CAHOOTS_NO_ANIMATION
  );
}

// Letter pixels as a grid [y][x]: letter index, or -1 for empty.
function buildGrid() {
  const grid = Array.from({ length: PX_H }, () => []);
  [...WORD].forEach((ch, li) => {
    for (let y = 0; y < PX_H; y++) {
      for (const c of GLYPHS[ch][y]) grid[y].push(c !== ' ' ? li : -1);
      if (li < WORD.length - 1) grid[y].push(-1);
    }
  });
  return grid;
}

const GRID = buildGrid();
const WIDTH = GRID[0].length;

function pixel(x, y, reveal) {
  const at = (px, py) => (py >= 0 && py < PX_H && px >= 0 && px < WIDTH && px <= reveal ? GRID[py][px] : -1);
  const own = at(x, y);
  if (own >= 0) return x === reveal ? EDGE : COLORS[own % COLORS.length];
  const cast = at(x - 1, y - 1);
  if (cast >= 0) return shade(COLORS[cast % COLORS.length]); // drop shadow, down and to the right
  return null;
}

function cell(top, bottom) {
  if (!top && !bottom) return ' ';
  if (top && !bottom) return `${fg(top)}▀${RESET}`;
  if (!top && bottom) return `${fg(bottom)}▄${RESET}`;
  return `${fg(top)}${bg(bottom)}▀${RESET}`;
}

function frame(reveal, indent) {
  const lines = [];
  for (let r = 0; r < TERM_ROWS; r++) {
    let line = indent;
    for (let x = 0; x < WIDTH + 1; x++) {
      line += cell(pixel(x, r * 2, reveal), pixel(x, r * 2 + 1, reveal));
    }
    lines.push(line);
  }
  return lines.join('\n');
}

export async function playBanner({ stream = process.stderr, env = process.env, force = false } = {}) {
  if (!force && !shouldAnimate(stream, env)) {
    stream.write(`cahoots · ${TAGLINE}\n`);
    return;
  }

  const restore = () => stream.write('\x1b[?25h' + RESET);
  const onSig = () => {
    restore();
    process.exit(130);
  };
  process.once('SIGINT', onSig);

  const indent = pad(stream, WIDTH + 1);
  stream.write('\x1b[?25l\n'); // hide cursor
  stream.write(frame(-1, indent) + '\n');
  for (let x = 0; x <= WIDTH + 1; x++) {
    stream.write(`\x1b[${TERM_ROWS}A\r${frame(x, indent)}\n`);
    await sleep(22);
  }

  // tagline types out, then the stamp
  stream.write('\n' + pad(stream, TAGLINE.length));
  const accentFrom = TAGLINE.indexOf('on the record');
  for (let i = 0; i < TAGLINE.length; i++) {
    const color = i >= accentFrom ? fg(RED) : '';
    stream.write(`${color}${TAGLINE[i]}${RESET}`);
    await sleep(14);
  }
  await sleep(180);
  stream.write(`\n\n${pad(stream, 19)}${fg(RED)}┌─ ON THE RECORD ─┐${RESET}\n\n`);

  restore();
  process.removeListener('SIGINT', onSig);
}
