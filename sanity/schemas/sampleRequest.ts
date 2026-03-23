import { defineType, defineField, defineArrayMember } from 'sanity'

export default defineType({
  name: 'sampleRequest',
  title: 'Sample Request',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
    }),
    defineField({
      name: 'company',
      title: 'Company',
      type: 'string',
    }),
    defineField({
      name: 'shippingAddress',
      title: 'Shipping Address',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'items',
      title: 'Requested Samples',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'sampleItem',
          title: 'Sample Item',
          fields: [
            defineField({
              name: 'product',
              title: 'Product',
              type: 'reference',
              to: [{ type: 'product' }],
            }),
            defineField({
              name: 'collectionTitle',
              title: 'Collection',
              type: 'string',
            }),
            defineField({
              name: 'colorName',
              title: 'Color',
              type: 'string',
            }),
            defineField({
              name: 'size',
              title: 'Size',
              type: 'string',
            }),
            defineField({
              name: 'sku',
              title: 'SKU',
              type: 'string',
            }),
          ],
          preview: {
            select: {
              title: 'colorName',
              subtitle: 'collectionTitle',
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Pending', value: 'pending' },
          { title: 'Shipped', value: 'shipped' },
          { title: 'Completed', value: 'completed' },
        ],
      },
      initialValue: 'pending',
    }),
    defineField({
      name: 'submittedAt',
      title: 'Submitted At',
      type: 'datetime',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'email',
    },
  },
  orderings: [
    {
      title: 'Submitted (newest)',
      name: 'submittedDesc',
      by: [{ field: 'submittedAt', direction: 'desc' }],
    },
  ],
})
