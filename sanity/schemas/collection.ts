import { defineType, defineField, defineArrayMember } from 'sanity'

export default defineType({
  name: 'collection',
  title: 'Collection',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Collection Name',
      type: 'string',
      description: 'e.g., Cemento, Arabesque, Salento',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'featured',
      title: 'Featured Collection',
      type: 'boolean',
      description: 'Show in featured sections on homepage',
      initialValue: false,
    }),
    defineField({
      name: 'technicalSummary',
      title: 'Technical Summary',
      type: 'string',
      description: 'e.g., "Inkjet Colored Body Rectified Floor & Wall Glazed Porcelain Stoneware"',
    }),
    defineField({
      name: 'material',
      title: 'Material',
      type: 'string',
      description: 'e.g., Porcelain, Ceramic, Glass, Natural Stone',
      options: {
        list: [
          { title: 'Porcelain', value: 'Porcelain' },
          { title: 'Ceramic', value: 'Ceramic' },
          { title: 'Glass', value: 'Glass' },
          { title: 'Natural Stone', value: 'Natural Stone' },
          { title: 'Marble', value: 'Marble' },
          { title: 'Travertine', value: 'Travertine' },
          { title: 'Metal', value: 'Metal' },
        ],
      },
    }),
    defineField({
      name: 'thickness',
      title: 'Thickness',
      type: 'string',
      description: 'e.g., 9mm, 10mm, 20mm',
    }),
    defineField({
      name: 'rectified',
      title: 'Rectified',
      type: 'boolean',
      description: 'Whether tiles have precision-cut edges',
      initialValue: false,
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Marketing description for the collection',
      rows: 4,
    }),
    defineField({
      name: 'heroImages',
      title: 'Hero Images',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          options: {
            hotspot: true,
          },
        }),
      ],
      description: 'Lifestyle/room shots for the collection',
      validation: (Rule) => Rule.min(1),
    }),
    defineField({
      name: 'specSheet',
      title: 'Spec Sheet PDF',
      type: 'file',
      options: {
        accept: '.pdf',
      },
      description: 'Technical specification PDF for download',
    }),
    defineField({
      name: 'specImage',
      title: 'Spec/Swatch Reference Image',
      type: 'image',
      description: 'The color and specifications reference image showing all variants',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'dropboxUrl',
      title: 'Dropbox Assets URL',
      type: 'url',
      description: 'Link to Dropbox folder with downloadable images for designers',
    }),
    defineField({
      name: 'applications',
      title: 'Applications',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Residential', value: 'Residential' },
          { title: 'Commercial', value: 'Commercial' },
          { title: 'Industrial', value: 'Industrial' },
        ],
      },
    }),
    defineField({
      name: 'surfaces',
      title: 'Surfaces',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Floor', value: 'Floor' },
          { title: 'Wall', value: 'Wall' },
          { title: 'Countertop', value: 'Countertop' },
          { title: 'Outdoor', value: 'Outdoor' },
        ],
      },
    }),
    defineField({
      name: 'style',
      title: 'Style',
      type: 'reference',
      to: [{ type: 'style' }],
      description: 'e.g., Large Format, Mosaic, Hexagonal',
    }),
    defineField({
      name: 'look',
      title: 'Look',
      type: 'reference',
      to: [{ type: 'look' }],
      description: 'e.g., Stone, Wood, Concrete, Metal',
    }),
    defineField({
      name: 'products',
      title: 'Products',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'product' }],
        }),
      ],
      description: 'Products/colors in this collection',
    }),
    defineField({
      name: 'technicalSpecs',
      title: 'Technical Specifications',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'specRow',
          fields: [
            defineField({
              name: 'description',
              title: 'Description',
              type: 'string',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'result',
              title: 'Result',
              type: 'string',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'testMethod',
              title: 'Test Method',
              type: 'string',
              description: 'e.g. ASTM C373 — shown as tooltip on hover',
            }),
          ],
          preview: {
            select: { title: 'description', subtitle: 'result' },
          },
        }),
      ],
    }),
    defineField({
      name: 'packagingData',
      title: 'Packaging Data',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'packagingRow',
          fields: [
            defineField({
              name: 'nominalSize',
              title: 'Nominal Size',
              type: 'string',
            }),
            defineField({
              name: 'piecesPerBox',
              title: 'Pcs/Box',
              type: 'number',
            }),
            defineField({
              name: 'sqftPerBox',
              title: 'Sq.Ft./Box',
              type: 'number',
            }),
            defineField({
              name: 'lbsPerBox',
              title: 'Lbs./Box',
              type: 'number',
            }),
            defineField({
              name: 'boxesPerPallet',
              title: 'Boxes/Pallet',
              type: 'number',
            }),
            defineField({
              name: 'sqftPerPallet',
              title: 'Sq.Ft./Pallet',
              type: 'number',
            }),
            defineField({
              name: 'weightPerPallet',
              title: 'Lbs./Pallet',
              type: 'number',
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'sizeIconOverrides',
      title: 'Size Icon Overrides',
      type: 'array',
      description: 'Upload custom icons for specific sizes (e.g., mosaic patterns). Leave empty to use auto-generated icons.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'sizeIconOverride',
          fields: [
            defineField({
              name: 'size',
              title: 'Size String',
              type: 'string',
              description: 'Must exactly match the size on the SKU (e.g., "2x2 Mosaic")',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'icon',
              title: 'Custom Icon',
              type: 'image',
              description: 'SVG or PNG. Transparent background recommended.',
              options: { accept: 'image/svg+xml,image/png' },
              validation: (r) => r.required(),
            }),
          ],
          preview: {
            select: { title: 'size', media: 'icon' },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'technicalSummary',
      media: 'heroImages.0',
    },
  },
})
