import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'sizeType',
  title: 'Size Type',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Type Name',
      type: 'string',
      description: 'e.g., Field Tile, Wall Tile, Bullnose, Mosaic, Paver',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      description: 'URL-friendly identifier for filtering',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      description: 'Sort order in filter UI (lower = first)',
    }),
  ],
})
