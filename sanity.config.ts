import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './sanity/schemas'
import deskStructure from './sanity/deskStructure'

export default defineConfig({
  name: 'giotile',
  title: 'GIO Tile',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || '6kv11yeo',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  plugins: [
    structureTool({
      structure: deskStructure,
    }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
    // Hide the siteSettings singleton from the global "New document" menu
    // so editors can only access it via the Site Settings sidebar item
    templates: (templates) =>
      templates.filter(({ schemaType }) => schemaType !== 'siteSettings'),
  },
  document: {
    // Disable delete & duplicate actions on the siteSettings singleton
    actions: (input, context) =>
      context.schemaType === 'siteSettings'
        ? input.filter(
            ({ action }) =>
              action !== 'delete' && action !== 'duplicate' && action !== 'unpublish'
          )
        : input,
  },
})
