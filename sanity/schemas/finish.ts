import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'finish',
  title: 'Finish',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Finish Name',
      type: 'string',
      description: 'e.g., Matte, Polished, Textured',
      validation: (Rule) => Rule.required(),
    }),
  ],
})
