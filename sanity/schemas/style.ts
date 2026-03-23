import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'style',
  title: 'Style',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Style Name',
      type: 'string',
      description: 'e.g., Large Format, Mosaic, Hexagonal, Subway',
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
  ],
})
