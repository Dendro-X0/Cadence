import '@cadence/ui/tokens.css'
import App from './App.svelte'
import { setupPwa } from './pwa'

const target = document.getElementById('app') as HTMLDivElement
const app = new App({ target })
setupPwa()
export default app
