import collection from './collection'
import product from './product'
import color from './color'
import finish from './finish'
import style from './style'
import look from './look'
import sizeType from './sizeType'
import sampleRequest from './sampleRequest'
import category from './category'
import tag from './tag'
import author from './author'
import post from './post'
import page from './page'

export const schemaTypes = [
  // Taxonomies (these should be created first)
  color,
  finish,
  style,
  look,
  sizeType,
  // Main content types
  collection,
  product,
  // Blog & Pages
  category,
  tag,
  author,
  post,
  page,
  // Submissions
  sampleRequest,
]
