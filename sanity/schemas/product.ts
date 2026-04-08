import { defineType, defineField, defineArrayMember } from 'sanity'

export default defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Product Name',
      type: 'string',
      description: 'e.g., Dark Grey, Light, Ocean Blue',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: (doc, options) => {
          // Will be set manually or via custom logic to include collection
          return doc.title as string
        },
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'collection',
      title: 'Collection',
      type: 'reference',
      to: [{ type: 'collection' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'colorName',
      title: 'Color Name',
      type: 'string',
      description: 'Specific color name for this product (e.g., Dark Grey)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'colorFamily',
      title: 'Color Family',
      type: 'reference',
      to: [{ type: 'color' }],
      description: 'General color category for filtering (e.g., Grey)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'images',
      title: 'Product Images',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          options: {
            hotspot: true,
          },
        }),
      ],
      validation: (Rule) => Rule.min(1),
    }),
    defineField({
      name: 'shadeVariation',
      title: 'Shade Variation',
      type: 'string',
      description: 'e.g., V2, V3, V4',
      options: {
        list: [
          { title: 'V1 - Uniform', value: 'V1' },
          { title: 'V2 - Slight Variation', value: 'V2' },
          { title: 'V3 - Moderate Variation', value: 'V3' },
          { title: 'V4 - Substantial Variation', value: 'V4' },
        ],
      },
    }),
    defineField({
      name: 'finishes',
      title: 'Available Finishes',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'finishVariant',
          title: 'Finish Variant',
          fields: [
            defineField({
              name: 'type',
              title: 'Finish Type',
              type: 'reference',
              to: [{ type: 'finish' }],
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'skus',
              title: 'SKUs',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'sku',
                  title: 'SKU',
                  fields: [
                    defineField({
                      name: 'code',
                      title: 'SKU Code',
                      type: 'string',
                      description: 'e.g., GISBR4848DG',
                      validation: (Rule) => Rule.required(),
                    }),
                    defineField({
                      name: 'size',
                      title: 'Size',
                      type: 'string',
                      description: 'e.g., 48x48, 24x48, 1x3 Mosaic',
                      validation: (Rule) => Rule.required(),
                    }),
                    defineField({
                      name: 'sizeType',
                      title: 'Size Type',
                      type: 'reference',
                      to: [{ type: 'sizeType' }],
                      validation: (Rule) => Rule.required(),
                    }),
                  ],
                  preview: {
                    select: {
                      code: 'code',
                      size: 'size',
                      sizeType: 'sizeType.title',
                    },
                    prepare({ code, size, sizeType }) {
                      return {
                        title: code,
                        subtitle: `${size} - ${sizeType}`,
                      }
                    },
                  },
                }),
              ],
            }),
          ],
          preview: {
            select: {
              finish: 'type.title',
              sku0: 'skus.0.code',
              sku1: 'skus.1.code',
              sku2: 'skus.2.code',
              sku3: 'skus.3.code',
              sku4: 'skus.4.code',
              sku5: 'skus.5.code',
              sku6: 'skus.6.code',
              sku7: 'skus.7.code',
              sku8: 'skus.8.code',
              sku9: 'skus.9.code',
            },
            prepare({ finish, ...skus }) {
              const count = Object.values(skus).filter(Boolean).length
              return {
                title: finish || 'Finish',
                subtitle: `${count} SKU${count !== 1 ? 's' : ''}`,
              }
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      collection: 'collection.title',
      media: 'images.0',
    },
    prepare({ title, collection, media }) {
      return {
        title,
        subtitle: collection,
        media,
      }
    },
  },
})
