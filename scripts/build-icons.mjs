// Renders public/icon.svg into the PNG sizes browsers and iOS ask for.
import sharp from 'sharp'

const svg = 'public/icon.svg'
const out = [
  ['icons/icon-192.png', 192, 0],
  ['icons/icon-512.png', 512, 0],
  ['icons/apple-touch-icon.png', 180, 0],
  // maskable: keep the glyph inside the safe zone
  ['icons/maskable-512.png', 512, 64],
]

for (const [file, size, pad] of out) {
  const inner = size - pad * 2
  const glyph = await sharp(svg).resize(inner, inner).png().toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background: pad ? '#6e2639' : { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: glyph, top: pad, left: pad }])
    .png()
    .toFile(`public/${file}`)
  console.log(file)
}
