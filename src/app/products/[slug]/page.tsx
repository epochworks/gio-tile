import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getProductBySlug, urlFor } from '@/lib/sanity'

interface ProductPageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: ProductPageProps) {
  const product = await getProductBySlug(params.slug)

  if (!product) {
    return { title: 'Product Not Found' }
  }

  return {
    title: `${product.collection.title} - ${product.colorName}`,
    description: `${product.colorName} from the ${product.collection.title} collection`,
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductBySlug(params.slug)

  if (!product) {
    notFound()
  }

  return (
    <>
      {/* Breadcrumb */}
      <section className="bg-gio-grey py-4">
        <div className="container-gio">
          <nav className="flex items-center gap-2 text-small text-gio-black/60">
            <Link href="/collections" className="hover:text-gio-red transition-colors">
              Collections
            </Link>
            <span>/</span>
            <Link
              href={`/collections/${product.collection.slug.current}`}
              className="hover:text-gio-red transition-colors"
            >
              {product.collection.title}
            </Link>
            <span>/</span>
            <span className="text-gio-black">{product.colorName}</span>
          </nav>
        </div>
      </section>

      {/* Product Content */}
      <section className="section">
        <div className="container-gio">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Images */}
            <div>
              {/* Main Image */}
              <div className="aspect-square bg-gio-grey relative overflow-hidden mb-4">
                {product.images?.[0] && (
                  <Image
                    src={urlFor(product.images[0]).width(800).height(800).url()}
                    alt={product.colorName}
                    fill
                    className="object-cover"
                    priority
                  />
                )}
              </div>
              {/* Thumbnail Grid */}
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.slice(1, 5).map((image: any, index: number) => (
                    <div
                      key={index}
                      className="aspect-square bg-gio-grey relative overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <Image
                        src={urlFor(image).width(200).height(200).url()}
                        alt={`${product.colorName} view ${index + 2}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              {/* Title */}
              <h1 className="text-display text-gio-black mb-2">
                {product.collection.title}
              </h1>
              <h2 className="text-headline text-gio-black/60 mb-6">
                {product.colorName}
              </h2>

              {/* Color Family & Shade */}
              <div className="flex items-center gap-4 mb-8">
                {product.colorFamily && (
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-full border border-gio-black/10"
                      style={{ backgroundColor: product.colorFamily.hex }}
                    />
                    <span className="text-caption text-gio-black/60">
                      {product.colorFamily.title}
                    </span>
                  </div>
                )}
                {product.shadeVariation && (
                  <span className="text-caption text-gio-black/60">
                    Shade Variation: {product.shadeVariation}
                  </span>
                )}
              </div>

              {/* Finishes & SKUs */}
              {product.finishes && product.finishes.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-caption font-bold uppercase tracking-wider mb-4">
                    Available Sizes
                  </h3>
                  {product.finishes.map((finish: any, finishIndex: number) => (
                    <div key={finishIndex} className="mb-6">
                      {product.finishes.length > 1 && (
                        <h4 className="text-body font-medium mb-3">
                          {finish.type?.title || 'Standard'}
                        </h4>
                      )}
                      <div className="border border-gio-grey">
                        <table className="w-full">
                          <thead className="bg-gio-grey">
                            <tr>
                              <th className="text-left text-small font-medium text-gio-black/60 px-4 py-2">
                                SKU
                              </th>
                              <th className="text-left text-small font-medium text-gio-black/60 px-4 py-2">
                                Size
                              </th>
                              <th className="text-left text-small font-medium text-gio-black/60 px-4 py-2">
                                Type
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {finish.skus?.map((sku: any, skuIndex: number) => (
                              <tr
                                key={skuIndex}
                                className="border-t border-gio-grey"
                              >
                                <td className="text-caption text-gio-black px-4 py-3 font-mono">
                                  {sku.code}
                                </td>
                                <td className="text-caption text-gio-black px-4 py-3">
                                  {sku.size}
                                </td>
                                <td className="text-caption text-gio-black/60 px-4 py-3">
                                  {sku.sizeType?.title}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Downloads */}
              <div className="bg-gio-grey p-6 mb-8">
                <h3 className="text-title mb-4">Downloads</h3>
                <div className="flex flex-wrap gap-4">
                  {product.collection.specSheet?.asset?.url && (
                    <a
                      href={product.collection.specSheet.asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline text-small"
                    >
                      Spec Sheet (PDF)
                    </a>
                  )}
                  {product.collection.dropboxUrl && (
                    <a
                      href={product.collection.dropboxUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline text-small"
                    >
                      Product Images
                    </a>
                  )}
                </div>
              </div>

              {/* Request Sample CTA */}
              <Link href="/contact?sample=true" className="btn-primary inline-block">
                Request a Sample
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Other Colors in Collection */}
      {product.collection.products && product.collection.products.length > 1 && (
        <section className="section bg-gio-grey">
          <div className="container-gio">
            <h2 className="text-headline mb-8">
              Other Colors in {product.collection.title}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {product.collection.products
                .filter((p: any) => p._id !== product._id)
                .map((otherProduct: any) => (
                  <Link
                    key={otherProduct._id}
                    href={`/products/${otherProduct.slug.current}`}
                    className="group"
                  >
                    <div className="aspect-square bg-white relative overflow-hidden mb-2">
                      {otherProduct.images?.[0] && (
                        <Image
                          src={urlFor(otherProduct.images[0])
                            .width(200)
                            .height(200)
                            .url()}
                          alt={otherProduct.colorName}
                          fill
                          className="object-cover img-zoom"
                        />
                      )}
                    </div>
                    <span className="text-small text-gio-black group-hover:text-gio-red transition-colors">
                      {otherProduct.colorName}
                    </span>
                  </Link>
                ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
