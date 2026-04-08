import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'color',
  title: 'Color',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Color Name',
      type: 'string',
      description: 'e.g., Grey, Blue, Beige, White',
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
      name: 'hex',
      title: 'Hex Code',
      type: 'string',
      description: 'e.g., #808080',
      validation: (Rule) => Rule.regex(/^#[0-9A-Fa-f]{6}$/, {
        name: 'hex color',
        invert: false,
      }),
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      description: 'Sort order in filter UI (lower = first)',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      hex: 'hex',
    },
    prepare({ title, hex }) {
      return {
        title,
        subtitle: hex,
      }
    },
  },
})
