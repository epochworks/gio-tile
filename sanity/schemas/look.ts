import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'look',
  title: 'Look',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Look Name',
      type: 'string',
      description: 'e.g., Stone, Wood, Metal, Concrete, Terrazzo',
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
      name: 'image',
      title: 'Representative Image',
      type: 'image',
      description: 'Image shown in "Browse by Look" section',
      options: {
        hotspot: true,
      },
    }),
  ],
})
