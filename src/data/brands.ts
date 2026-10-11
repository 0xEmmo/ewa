import type { Brand } from './types'

export const brands: Brand[] = [
  {
    id: 'oro',
    name: 'Ọ̀rọ̀ Botanicals',
    city: 'Lagos',
    founded: 2019,
    story:
      'Started by a pharmacist in Yaba who was tired of brightening products that bleached rather than evened. Small batches, clear percentages, nothing that promises to make you lighter.',
  },
  {
    id: 'zuri',
    name: 'Zuri Skin',
    city: 'Nairobi',
    founded: 2017,
    story:
      'Barrier-first formulas and sunscreens tested on deep skin tones from day one, so “invisible” actually means invisible.',
  },
  {
    id: 'tamale',
    name: 'Tamale Shea Co.',
    city: 'Tamale',
    founded: 2015,
    story:
      'A women-run cooperative in northern Ghana that buys shea nuts directly from pickers and processes them by hand. Ẹwà buys from them at the price they set.',
  },
  {
    id: 'ife',
    name: 'Ìfẹ́ Colour',
    city: 'Lagos',
    founded: 2021,
    story:
      'Lip colour built around brown and deep skin: browns that don’t go grey, reds that don’t go pink, nudes that are actually nude on you.',
  },
  {
    id: 'kan',
    name: 'Kàn Studio',
    city: 'Abuja',
    founded: 2022,
    story: 'Tools and accessories for slower routines. Stones are cut and polished by a workshop in Jos.',
  },
]

export const brandById = (id: string) => {
  const b = brands.find((x) => x.id === id)
  if (!b) throw new Error(`Unknown brand ${id}`)
  return b
}
