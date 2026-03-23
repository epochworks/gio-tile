# GIO Tile - Architectural Tile & Stone Catalog

A modern product catalog for GIO Architectural Tile & Stone, built with Next.js 14 and Sanity CMS.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **CMS:** Sanity v3
- **Styling:** Tailwind CSS with custom design tokens
- **Font:** BDO Grotesk (add your TTF files to `/public/fonts/`)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Sanity

1. Create a new Sanity project at [sanity.io/manage](https://www.sanity.io/manage)
2. Copy your project ID
3. Create a `.env.local` file:

```bash
cp .env.example .env.local
```

4. Add your Sanity project ID to `.env.local`

### 3. Add Fonts

Place your BDO Grotesk TTF files in `/public/fonts/`:
- `BDOGrotesk-Regular.ttf`
- `BDOGrotesk-Medium.ttf`
- `BDOGrotesk-Bold.ttf`

For better performance, convert to WOFF2 format.

### 4. Run Development Servers

**Next.js frontend:**
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

**Sanity Studio:**
```bash
npm run sanity
```
Open [http://localhost:3333](http://localhost:3333)

## Project Structure

```
giotile/
├── sanity/
│   ├── schemas/           # Sanity document schemas
│   │   ├── collection.ts  # Main collection type
│   │   ├── product.ts     # Product/color variant
│   │   ├── color.ts       # Color taxonomy
│   │   ├── finish.ts      # Finish taxonomy
│   │   ├── style.ts       # Style taxonomy (Large Format, Mosaic, etc.)
│   │   ├── look.ts        # Look taxonomy (Stone, Wood, etc.)
│   │   └── sizeType.ts    # Size type taxonomy (Field Tile, Bullnose, etc.)
│   └── sanity.config.ts
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Homepage
│   │   ├── collections/
│   │   │   ├── page.tsx                # Collections archive with filters
│   │   │   └── [slug]/page.tsx         # Collection detail
│   │   └── products/
│   │       └── [slug]/page.tsx         # Product detail
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── ProductCard.tsx
│   │   ├── BrowseByTabs.tsx            # Homepage tabbed filtering
│   │   ├── FeaturedCollectionsStrip.tsx # Interactive hover panels
│   │   ├── HeroGrid.tsx
│   │   ├── TrendingProducts.tsx
│   │   └── ValueProps.tsx
│   ├── lib/
│   │   └── sanity.ts                   # Sanity client & GROQ queries
│   └── styles/
│       └── globals.css
├── tailwind.config.ts                   # Design tokens
└── public/
    └── fonts/                           # Add your font files here
```

## Data Model

```
Collection
├── title, slug, technicalSummary, description
├── heroImages[], specSheet (PDF), dropboxUrl
├── applications[], surfaces[]
├── style (ref), look (ref)
├── technicalSpecs {}, packagingData[]
└── products[] (refs)

Product
├── title, slug, colorName
├── colorFamily (ref to Color)
├── images[], shadeVariation
└── finishes[]
    └── type (ref to Finish)
        └── skus[]
            ├── code, size
            └── sizeType (ref)

Taxonomies: Color, Finish, Style, Look, SizeType
```

## Seeding Initial Data

After setting up Sanity, seed your taxonomies first:

1. Open Sanity Studio (`npm run sanity`)
2. Create Size Types: Field Tile, Wall Tile, Bullnose, Mosaic, Paver
3. Create Finishes: Matte, Polished
4. Create Looks: Stone, Wood, Concrete, Metal, Marble, Terrazzo
5. Create Styles: Large Format, Mosaic, Hexagonal, Subway, Plank
6. Create Colors with hex values: Grey (#808080), Beige (#F5F5DC), etc.

Then create Collections and Products.

## Design Tokens

Defined in `tailwind.config.ts`:

**Colors:**
- `gio-black`: #111111
- `gio-red`: #EC1C24
- `gio-grey`: #F5F5F5
- `gio-white`: #FFFFFF

**Typography (fluid):**
- `display`: Hero headlines
- `headline`: Section titles
- `title`: Card titles
- `body`: Body text
- `caption`: UI labels
- `small`: Fine print

## Deployment

### Next.js (Digital Ocean App Platform)

1. Push to GitHub
2. Connect repo to DO App Platform
3. Set environment variables
4. Deploy

### Sanity Studio

```bash
npm run sanity:deploy
```

Or host alongside Next.js by adding the studio to `/app/studio`.

## Development Notes

- The homepage shows placeholder UI when Sanity has no data
- Images use Next.js Image optimization via Sanity CDN
- Pages use ISR with 1-hour revalidation
- Filters use URL search params for shareable links

## Next Steps

1. Add your fonts
2. Set up Sanity project
3. Seed taxonomy data
4. Import/create collections and products
5. Customize components to match final Figma designs
6. Add remaining pages (Blog, Contact, Resources)
