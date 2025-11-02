<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte'

  export let visible: boolean = false
  const dispatch = createEventDispatcher<{ close: void }>()

  let appUrl: string = ''
  let qrSrc: string = ''
  let deferred: BeforeInstallPromptEvent | null = null

  type Platform = 'ios'|'android'|'desktop'|'other'
  let platform: Platform = 'other'

  const close = (): void => { dispatch('close') }
  const computeAppUrl = (): string => {
    const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env
    const base = env?.VITE_PUBLIC_BASE_URL
    if (base) return new URL('/?install=1', base).toString()
    const origin = window.location.origin
    return new URL('/?install=1', origin).toString()
  }
  const buildQr = async (url: string): Promise<string> => {
    try {
      const mod = await import('qrcode') as unknown as { default: { toDataURL: (text: string) => Promise<string> } }
      const q = mod?.default
      if (q && typeof q.toDataURL === 'function') return await q.toDataURL(url)
    } catch {}
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`
  }
  const openExternal = async (): Promise<void> => {
    try { window.open(appUrl, '_blank', 'noopener,noreferrer') } catch {}
  }
  const detectPlatform = (ua: string): Platform => {
    const low = ua.toLowerCase()
    if (/iphone|ipad|ipod/.test(low)) return 'ios'
    if (/android/.test(low)) return 'android'
    if (/windows|mac os|macos|linux/.test(low)) return 'desktop'
    return 'other'
  }
  const platformTips = (p: Platform): readonly string[] => {
    if (p === 'ios') return ['Open in Safari', 'Share', 'Add to Home Screen'] as const
    if (p === 'android') return ['Open in Chrome', 'Menu', 'Install app'] as const
    if (p === 'desktop') return ['Click the Install button in the address bar', 'Or use the browser App menu'] as const
    return ['Use your browser’s Install/Add to Home Screen'] as const
  }
  const copyUrl = async (): Promise<void> => { try { await navigator.clipboard.writeText(appUrl) } catch {} }
  const shareApp = async (): Promise<void> => {
    try {
      if (navigator.share) await navigator.share({ title: 'Cadence', text: 'Try Cadence – a fast, installable PWA timer.', url: appUrl })
      else await navigator.clipboard.writeText(appUrl)
    } catch {}
  }
  const installApp = async (): Promise<void> => {
    if (deferred) {
      try { await deferred.prompt(); await deferred.userChoice } catch {}
      deferred = null
      return
    }
    await openExternal()
  }

  onMount(() => {
    appUrl = computeAppUrl()
    ;(async () => { qrSrc = await buildQr(appUrl) })()
    platform = detectPlatform(navigator.userAgent || '')
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault?.()
      deferred = e as BeforeInstallPromptEvent
    })
  })

  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted'|'dismissed' }>
  }
</script>

{#if visible}
  <div class="overlay" role="dialog" aria-modal="true" aria-labelledby="getapp-title">
    <button type="button" class="backdrop" aria-label="Close" on:click={close} />
    <div class="card" role="document">
      <div id="getapp-title" class="title">Get the App</div>
      <div class="tips">
        <div class="left">
          <div class="hint">Quick install tips</div>
          {#each platformTips(platform) as tip}
            <div class="tip">• {tip}</div>
          {/each}
          <div class="actions">
            <button class="btn" on:click={installApp}>Install</button>
            <button class="btn secondary" on:click={openExternal} aria-label="Open in browser">Open</button>
            <button class="btn secondary" on:click={copyUrl} aria-label="Copy app URL">Copy URL</button>
            <button class="btn secondary" on:click={shareApp} aria-label="Share app">Share</button>
          </div>
        </div>
        <div class="qr">
          <img src={qrSrc} alt="QR code to open Cadence" width="160" height="160" />
          <div class="url" title={appUrl}>{appUrl}</div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:1000}
  .backdrop{position:absolute;inset:0;background:rgba(0,0,0,.45);border:0;padding:0;margin:0;cursor:default}
  .card{background:#111827;border:1px solid #1f2937;border-radius:16px;padding:16px;min-width:320px;color:#e2e8f0;position:relative;z-index:1;max-width:720px}
  .title{font-weight:800;margin-bottom:8px}
  .tips{display:flex;gap:16px;align-items:center;justify-content:space-between}
  .left{display:flex;flex-direction:column;gap:6px}
  .hint{color:#94a3b8;font-size:12px}
  .tip{color:#e2e8f0}
  .actions{display:flex;gap:8px;margin-top:6px}
  .qr{display:flex;flex-direction:column;align-items:center;gap:6px}
  .btn{background:#1f2937;color:#e2e8f0;border:1px solid #1f2937;padding:8px 12px;border-radius:8px;cursor:pointer;font-weight:700}
  .btn.secondary{background:#1f2937}
  .url{max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#94a3b8;font-size:12px}
</style>
