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
  ],
})
