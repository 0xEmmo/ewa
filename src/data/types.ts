export type Category = 'cleanse' | 'tone' | 'treat' | 'moisturise' | 'protect' | 'body' | 'lips' | 'tools'
export type Concern = 'dark-spots' | 'dryness' | 'breakouts' | 'oiliness' | 'sensitivity' | 'dullness' | 'texture'
export type SkinType = 'dry' | 'oily' | 'combination' | 'normal' | 'sensitive'
export type Undertone = 'warm' | 'neutral' | 'cool'

export interface Brand {
  id: string
  name: string
  city: string
  founded: number
  story: string
}

export interface Variant {
  id: string
  label: string
  price: number
  /** Units left; 0 means sold out, small numbers show a low-stock note. */
  stock: number
}

export interface Shade {
  id: string
  name: string
  hex: string
  undertone: Undertone
  /** 1 (light) to 5 (deepest), used by the shade matcher. */
  depth: 1 | 2 | 3 | 4 | 5
  description: string
}

export interface KeyIngredient {
  name: string
  what: string
}

export interface Review {
  id: string
  author: string
  city: string
  skinType: SkinType
  rating: 1 | 2 | 3 | 4 | 5
  title: string
  body: string
  date: string
  verified: boolean
}

export interface Product {
  slug: string
  name: string
  brandId: string
  category: Category
  concerns: Concern[]
  skinTypes: SkinType[]
  tagline: string
  description: string
  variants: Variant[]
  shades?: Shade[]
  photos: { name: string; alt: string }[]
  keyIngredients: KeyIngredient[]
  inci: string
  howTo: string
  /** When it belongs in a routine. */
  when: 'am' | 'pm' | 'both'
  fragranceFree: boolean
  pregnancySafe: boolean
  badge?: 'bestseller' | 'new' | 'restocked'
  reviews: Review[]
  /** Slugs of products that complete a routine with this one. */
  pairsWith: string[]
}
