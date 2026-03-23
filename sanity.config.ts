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
  },
})
