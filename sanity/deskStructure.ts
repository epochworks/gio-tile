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
              S.documentTypeListItem('post').title('Posts'),
              S.documentTypeListItem('category').title('Categories'),
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
