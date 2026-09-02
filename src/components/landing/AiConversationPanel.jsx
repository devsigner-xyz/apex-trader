import { useState } from 'react'
import { trackEvent } from '../../services/analytics.js'

const prompt =
  'Consulta la información pública disponible en https://apex.devsigner.xyz/. Explica qué es Apex Trader como workstation para analizar una sesión de mercado y resume sus funcionalidades: Candles, Footprint, Step Profile, Volume Profile con POC, VAH y VAL, liquidity heatmap, DOM, Time & Sales y replay histórico. Distingue lo que muestra esta demo de portfolio de una plataforma de trading en vivo y propone preguntas útiles para profundizar en cada vista.'

const providers = [
  { name: 'ChatGPT', href: `https://chatgpt.com/?q=${encodeURIComponent(prompt)}` },
  { name: 'Claude', href: `https://claude.ai/new?q=${encodeURIComponent(prompt)}` },
  { name: 'Perplexity', href: `https://www.perplexity.ai/search?q=${encodeURIComponent(prompt)}` }
]

const copyProviders = [
  { name: 'Grok', url: 'https://grok.com' },
  { name: 'Copilot', url: 'https://copilot.microsoft.com' }
]

export default function AiConversationPanel() {
  const [status, setStatus] = useState('')

  async function openCopyProvider(provider) {
    trackEvent('ask_ai', { context: 'landing', provider: provider.name.toLowerCase() })

    try {
      await navigator.clipboard.writeText(prompt)
      setStatus(`Prompt copied. Paste it in ${provider.name} to continue the conversation.`)
    } catch {
      setStatus('The prompt could not be copied. Try the provider action again.')
    }

    window.open(provider.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <section className="landing-ai-conversation" aria-labelledby="ai-conversation-title">
      <div className="landing-ai-conversation__copy landing-copy">
        <p className="landing-kicker">CONTINUE WITH AI</p>
        <h2 id="ai-conversation-title">Ask an AI about Apex Trader.</h2>
        <p className="landing-lede">
          Open a conversation with the public context needed to understand this workstation and
          choose the market view that answers your question.
        </p>
        <p className="landing-ai-conversation__features">
          Candles, Footprint, Step Profile, Volume Profile, liquidity heatmap, DOM, Time & Sales and
          historical replay.
        </p>
      </div>
      <nav className="landing-ai-conversation__providers" aria-label="Ask an AI about Apex Trader">
        {providers.map((provider) => (
          <a
            className="landing-button landing-button--secondary"
            href={provider.href}
            key={provider.name}
            onClick={() =>
              trackEvent('ask_ai', { context: 'landing', provider: provider.name.toLowerCase() })
            }
            rel="noreferrer nofollow"
            target="_blank"
          >
            {provider.name} <span aria-hidden="true">↗</span>
          </a>
        ))}
        {copyProviders.map((provider) => (
          <button
            className="landing-button landing-button--secondary"
            key={provider.name}
            onClick={() => openCopyProvider(provider)}
            type="button"
          >
            {provider.name} <span aria-hidden="true">↗</span>
          </button>
        ))}
      </nav>
      <p aria-live="polite" className="landing-ai-conversation__status">
        {status}
      </p>
    </section>
  )
}
