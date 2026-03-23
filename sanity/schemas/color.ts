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
      name: 'hex',
      title: 'Hex Code',
      type: 'string',
      description: 'e.g., #808080',
      validation: (Rule) => Rule.regex(/^#[0-9A-Fa-f]{6}$/, {
        name: 'hex color',
        invert: false,
      }),
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
