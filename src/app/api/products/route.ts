import { brandById } from '@/data/brands'
import { products } from '@/data/products'
import { filterProducts, fromPrice, parseFilters } from '@/lib/catalog'

/** Catalogue search, used by the header search as you type. Accepts the same params as /shop. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const limit = Math.min(24, Number(params.get('limit')) || 24)
  const results = filterProducts(products, parseFilters(params)).slice(0, limit)
  return Response.json(
    results.map((p) => ({
      slug: p.slug,
      name: p.name,
      brand: brandById(p.brandId).name,
      tagline: p.tagline,
      fromPrice: fromPrice(p),
      photo: p.photos[0]!.name,
    })),
    { headers: { 'Cache-Control': 'public, max-age=60' } },
  )
}
