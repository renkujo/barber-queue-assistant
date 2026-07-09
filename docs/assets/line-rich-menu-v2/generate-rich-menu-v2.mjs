import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const requireFromApp = createRequire(path.join(repoRoot, "app/package.json"));
const sharp = requireFromApp("sharp");

const WIDTH = 2500;
const HEIGHT = 1686;
const TOP_HEIGHT = 843;
const B_WIDTH = 833;
const C_WIDTH = 834;
const D_X = 1667;

const fontDir = path.join(repoRoot, "app/public/fonts/line-seed-sans-th");
const fontData = {
  regular: fs.readFileSync(path.join(fontDir, "LINESeedSansTH_W_Rg.woff2")).toString("base64"),
  bold: fs.readFileSync(path.join(fontDir, "LINESeedSansTH_W_Bd.woff2")).toString("base64"),
  extraBold: fs.readFileSync(path.join(fontDir, "LINESeedSansTH_W_XBd.woff2")).toString("base64"),
};

const svgPath = path.join(__dirname, "rich-menu-v2.svg");
const pngPath = path.join(__dirname, "rich-menu-v2.png");

const esc = (text) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const bottomTile = ({
  id,
  x,
  width,
  fill,
  accent,
  iconBg,
  icon,
  title,
  subtitle,
  note,
}) => `
  <g id="${id}" transform="translate(${x} ${TOP_HEIGHT})">
    <rect class="tile" x="28" y="30" width="${width - 56}" height="785" rx="38" fill="${fill}" />
    <rect class="tileTop" x="28" y="30" width="${width - 56}" height="182" rx="38" fill="#fffdf8" opacity="0.42" />
    <rect x="76" y="88" width="150" height="150" rx="34" fill="${iconBg}" stroke="#dcc7b4" stroke-width="3" />
    ${icon}
    <text class="tile-title" x="88" y="400">${esc(title)}</text>
    <text class="tile-subtitle" x="90" y="495">${esc(subtitle)}</text>
    <rect x="90" y="585" width="292" height="11" rx="5.5" fill="${accent}" opacity="0.44" />
    <text class="tile-note" x="90" y="670">${esc(note)}</text>
    <path d="M${width - 194} 636 h70 m-26 -26 38 35 -38 35" fill="none" stroke="${accent}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity="0.82" />
  </g>`;

const calendarIcon = `
    <g transform="translate(${76 + 34} ${88 + 31})">
      <rect x="0" y="22" width="82" height="76" rx="15" fill="none" stroke="#3a2d25" stroke-width="8" />
      <path d="M0 48h82M20 0v32M62 0v32" class="icon-line" />
      <path d="M24 74h34" class="icon-line" />
    </g>`;

const clockIcon = `
    <g transform="translate(${76 + 29} ${88 + 28})">
      <circle cx="46" cy="50" r="44" fill="none" stroke="#496844" stroke-width="8" />
      <path d="M46 22v34l27 20" class="icon-line-sage" />
      <path d="M12 112h100" class="icon-line-sage" />
    </g>`;

const homeIcon = `
    <g transform="translate(${76 + 27} ${88 + 33})">
      <path d="M8 50 74 0l66 50" class="icon-line" />
      <path d="M28 49v77h92V49" class="icon-line" />
      <path d="M61 126V87h27v39" class="icon-line" />
      <path d="M51 65h46" class="icon-line" />
    </g>`;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="Barber Queue Assistant LINE rich menu">
  <defs>
    <style>
      @font-face {
        font-family: "LINE Seed Sans TH";
        font-weight: 400;
        src: url(data:font/woff2;base64,${fontData.regular}) format("woff2");
      }
      @font-face {
        font-family: "LINE Seed Sans TH";
        font-weight: 700;
        src: url(data:font/woff2;base64,${fontData.bold}) format("woff2");
      }
      @font-face {
        font-family: "LINE Seed Sans TH";
        font-weight: 800;
        src: url(data:font/woff2;base64,${fontData.extraBold}) format("woff2");
      }
      .font {
        font-family: "LINE Seed Sans TH", "Noto Sans Thai", system-ui, sans-serif;
        letter-spacing: 0;
        text-rendering: geometricPrecision;
      }
      .brand {
        fill: #3a2d25;
        font-size: 36px;
        font-weight: 700;
      }
      .brand-hint {
        fill: #7a6a5d;
        font-size: 31px;
        font-weight: 400;
      }
      .top-kicker {
        fill: #7a6a5d;
        font-size: 62px;
        font-weight: 700;
      }
      .top-title {
        fill: #3a2d25;
        font-size: 136px;
        font-weight: 700;
      }
      .top-copy {
        fill: #634f42;
        font-size: 50px;
        font-weight: 400;
      }
      .tile-title {
        fill: #3a2d25;
        font-family: "LINE Seed Sans TH", "Noto Sans Thai", system-ui, sans-serif;
        font-size: 88px;
        font-weight: 700;
        letter-spacing: 0;
      }
      .tile-subtitle {
        fill: #5f4b3f;
        font-family: "LINE Seed Sans TH", "Noto Sans Thai", system-ui, sans-serif;
        font-size: 57px;
        font-weight: 700;
        letter-spacing: 0;
      }
      .tile-note {
        fill: #7a6a5d;
        font-family: "LINE Seed Sans TH", "Noto Sans Thai", system-ui, sans-serif;
        font-size: 32px;
        font-weight: 400;
        letter-spacing: 0;
      }
      .tile {
        stroke: #dcc7b4;
        stroke-width: 4;
      }
      .divider {
        stroke: #dcc7b4;
        stroke-width: 3;
        opacity: 0.64;
      }
      .icon-line,
      .icon-line-sage {
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-width: 8;
      }
      .icon-line {
        stroke: #3a2d25;
      }
      .icon-line-sage {
        stroke: #496844;
      }
    </style>
    <linearGradient id="pageWash" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff8ee" />
      <stop offset="0.58" stop-color="#fff4e7" />
      <stop offset="1" stop-color="#f7eadc" />
    </linearGradient>
    <linearGradient id="topPanel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fffdf8" />
      <stop offset="0.63" stop-color="#fff4e7" />
      <stop offset="1" stop-color="#fce2cd" />
    </linearGradient>
    <pattern id="subtleGrid" width="86" height="86" patternUnits="userSpaceOnUse">
      <path d="M86 0H0v86" fill="none" stroke="#eadccb" stroke-width="1.5" opacity="0.35" />
    </pattern>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#pageWash)" />
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#subtleGrid)" opacity="0.34" />

  <g id="area-a">
    <rect x="28" y="28" width="2444" height="787" rx="42" fill="url(#topPanel)" stroke="#dcc7b4" stroke-width="4" />
    <path d="M28 670 C320 612 615 720 910 660 C1230 594 1492 602 1770 656 C2040 709 2260 706 2472 624 V815 H28 Z" fill="#fce2cd" opacity="0.52" />
    <path d="M1516 28 H2472 V815 H2112 C2172 731 2203 637 2198 531 C2188 320 1990 122 1516 28 Z" fill="#ddeedb" opacity="0.72" />
    <path d="M102 675 h555 m-200 -42 52 42 -52 42" fill="none" stroke="#d88d62" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" opacity="0.76" />

    <text class="font brand" x="114" y="114">${esc("Barber Queue Assistant")}</text>
    <text class="font brand-hint" x="114" y="166">${esc("กดเมนูเพื่อเริ่มใช้งาน")}</text>
    <text class="font top-title" x="112" y="366">${esc("เข้าคิวหน้าร้าน")}</text>
    <text class="font top-kicker" x="118" y="475">${esc("รับคิววันนี้")}</text>
    <text class="font top-copy" x="118" y="574">${esc("กดเพื่อรับคิวและติดตามเวลารอ")}</text>

    <g transform="translate(1692 184)">
      <rect x="0" y="0" width="576" height="430" rx="36" fill="#fffdf8" stroke="#dcc7b4" stroke-width="4" />
      <rect x="38" y="38" width="500" height="84" rx="24" fill="#fff4e7" stroke="#eadccb" stroke-width="3" />
      <rect x="38" y="154" width="218" height="182" rx="26" fill="#fff8ee" stroke="#eadccb" stroke-width="3" />
      <rect x="288" y="154" width="250" height="182" rx="26" fill="#ddeedb" stroke="#a8c7a1" stroke-width="3" />
      <rect x="38" y="362" width="500" height="40" rx="20" fill="#d88d62" opacity="0.86" />
      <circle cx="82" cy="80" r="20" fill="#e7a77c" />
      <path d="M126 72h212M126 91h160" stroke="#7a6a5d" stroke-width="8" stroke-linecap="round" opacity="0.45" />
      <path d="M80 222h132M80 264h92" stroke="#7a6a5d" stroke-width="10" stroke-linecap="round" opacity="0.38" />
      <path d="M358 228l42 42 88-104" fill="none" stroke="#496844" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  </g>

  <line class="divider" x1="0" y1="${TOP_HEIGHT}" x2="${WIDTH}" y2="${TOP_HEIGHT}" />
  <line class="divider" x1="${B_WIDTH}" y1="${TOP_HEIGHT}" x2="${B_WIDTH}" y2="${HEIGHT}" />
  <line class="divider" x1="${B_WIDTH + C_WIDTH}" y1="${TOP_HEIGHT}" x2="${B_WIDTH + C_WIDTH}" y2="${HEIGHT}" />

  ${bottomTile({
    id: "area-b",
    x: 0,
    width: B_WIDTH,
    fill: "#fff4e7",
    accent: "#d88d62",
    iconBg: "#fce2cd",
    icon: calendarIcon,
    title: "จองคิว",
    subtitle: "ล่วงหน้า",
    note: "นัดหมายก่อนมาถึงร้าน",
  })}

  ${bottomTile({
    id: "area-c",
    x: B_WIDTH,
    width: C_WIDTH,
    fill: "#edf4e8",
    accent: "#8ca986",
    iconBg: "#fffdf8",
    icon: clockIcon,
    title: "เช็คคิว",
    subtitle: "ของร้าน",
    note: "ดูสถานะก่อนออกเดินทาง",
  })}

  ${bottomTile({
    id: "area-d",
    x: D_X,
    width: 833,
    fill: "#faeadf",
    accent: "#d88d62",
    iconBg: "#ddeedb",
    icon: homeIcon,
    title: "หน้าหลัก",
    subtitle: "และสถานะร้าน",
    note: "เริ่มใช้งานจากหน้าร้าน",
  })}

</svg>
`;

fs.writeFileSync(svgPath, svg);

await sharp(Buffer.from(svg), { density: 72 })
  .resize(WIDTH, HEIGHT, { fit: "fill" })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(pngPath);

const metadata = await sharp(pngPath).metadata();
if (metadata.width !== WIDTH || metadata.height !== HEIGHT) {
  throw new Error(`Unexpected output size: ${metadata.width}x${metadata.height}`);
}

console.log(`wrote ${path.relative(repoRoot, svgPath)}`);
console.log(`wrote ${path.relative(repoRoot, pngPath)} ${metadata.width}x${metadata.height}`);
