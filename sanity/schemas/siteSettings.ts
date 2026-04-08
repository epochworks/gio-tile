import { defineType, defineField, defineArrayMember } from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  // Singleton — enforced via sanity.config.ts (hidden from New menu, no delete action)
  groups: [
    { name: 'homepage', title: 'Homepage' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Document Title',
      type: 'string',
      initialValue: 'Site Settings',
      readOnly: true,
      hidden: true,
    }),

    /* ── Homepage: Hero (2 side-by-side collections) ── */
    defineField({
      name: 'heroLeftCollection',
      title: 'Hero — Left Collection',
      type: 'reference',
      to: [{ type: 'collection' }],
      group: 'homepage',
      description:
        'The smaller collection tile in the top-left of the homepage hero. Its first hero image will be used.',
    }),
    defineField({
      name: 'heroRightCollection',
      title: 'Hero — Right Collection',
      type: 'reference',
      to: [{ type: 'collection' }],
      group: 'homepage',
      description:
        'The large feature tile on the right of the homepage hero. Its first hero image will be used.',
    }),

    /* ── Homepage: Trending Best Sellers ── */
    defineField({
      name: 'trendingCollections',
      title: 'Trending Best Sellers (max 4)',
      type: 'array',
      group: 'homepage',
      description:
        'The 4 collections shown in the "Trending Best Sellers" strip on the homepage. Order here = order on the page. Leave empty to auto-populate by product count.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'collection' }],
        }),
      ],
      validation: (Rule) => Rule.max(4),
    }),

    /* ── Homepage: Featured Strip (3 expandable panels) ── */
    defineField({
      name: 'featuredStripCollections',
      title: 'Featured Collections Strip (max 3)',
      type: 'array',
      group: 'homepage',
      description:
        'The 3 collections shown in the expandable "Featured Collections" strip. Order here = display order. Leave empty to auto-populate.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'collection' }],
        }),
      ],
      validation: (Rule) => Rule.max(3),
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Site Settings',
        subtitle: 'Homepage layout, hero, and featured collections',
      }
    },
  },
})
