import preprocess from 'svelte-preprocess'

/** @type {import('svelte').Config} */
const config = {
  preprocess: preprocess({ typescript: true })
}

export default config
