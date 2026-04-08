import type { StructureBuilder } from 'sanity/structure'

export default (S: StructureBuilder) =>
  S.list()
    .title('Content')
    .items([
      // ── Products ──────────────────────────────────────────
      S.listItem()
        .title('Products')
        .icon(() => '📦')
        .child(
          S.list()
            .title('Products')
            .items([
              S.documentTypeListItem('collection').title('Collections'),
              S.documentTypeListItem('product').title('Products'),
              S.documentTypeListItem('sampleRequest').title('Sample Requests'),
            ])
        ),

      S.divider(),

      // ── Blog ──────────────────────────────────────────────
      S.listItem()
        .title('Blog')
        .icon(() => '📝')
        .child(
          S.list()
            .title('Blog')
            .items([
              // All posts
              S.documentTypeListItem('post').title('All Posts'),

              // Recent posts (last 20 by publish date)
              S.listItem()
                .title('Recent Posts')
                .icon(() => '🕐')
                .child(
                  S.documentList()
                    .title('Recent Posts')
                    .filter('_type == "post"')
                    .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }])
                    .apiVersion('2024-01-01')
                ),

              // Featured posts
              S.listItem()
                .title('Featured Posts')
                .icon(() => '⭐')
                .child(
                  S.documentList()
                    .title('Featured Posts')
                    .filter('_type == "post" && featured == true')
                    .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }])
                    .apiVersion('2024-01-01')
                ),

              S.divider(),

              // Categories
              S.documentTypeListItem('category').title('Categories'),

              // Tags
              S.documentTypeListItem('tag').title('Tags'),
            ])
        ),

      // ── Pages ─────────────────────────────────────────────
      S.documentTypeListItem('page').title('Pages').icon(() => '📄'),

      // ── Authors ───────────────────────────────────────────
      S.documentTypeListItem('author').title('Authors').icon(() => '👤'),

      S.divider(),

      // ── Product Taxonomy ──────────────────────────────────
      S.listItem()
        .title('Product Taxonomy')
        .icon(() => '🎨')
        .child(
          S.list()
            .title('Product Taxonomy')
            .items([
              S.documentTypeListItem('color').title('Colors'),
              S.documentTypeListItem('finish').title('Finishes'),
              S.documentTypeListItem('style').title('Styles'),
              S.documentTypeListItem('look').title('Looks'),
              S.documentTypeListItem('sizeType').title('Size Types'),
            ])
        ),
    ])
