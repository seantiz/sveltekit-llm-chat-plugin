// A layer for Websocket and SSE connections - only two-way WS needs a send() method
interface StreamConnection {
	connect(payload?: string): Promise<void>
	send?(data: string): void
	onMessage(handler: (data: string) => void): void
	close(): void
}

type EatTheIterables<T> = (raw: string) => T

// Global entry point to composing a new stream session
export function newConnection(type: 'websocket' | 'sse', url: string): StreamConnection {
	return type === 'websocket' ? new WebSocketConnection(url) : new SSEConnection(url)
}

export class WebSocketConnection implements StreamConnection {
	private ws: WebSocket | null = null
	private retriesDone = 0
	private messageHandler: (data: string) => void = () => {}

	constructor(
		private url: string = '',
		private config = { maxRetries: 3, backoffInMs: 1000 }
	) {}

	async connect() {
		if (this.ws?.readyState === WebSocket.OPEN) {
			return
		}

		const backoffDelay = this.retriesDone * this.config.backoffInMs

		this.ws = new WebSocket('ws://localhost:39300/qgpt/stream')

		this.ws.onopen = () => {
			console.log('WebSocket state -> OPEN')
			this.retriesDone = 0
		}

		this.ws.onmessage = (event) => {
			this.messageHandler(event.data)
		}

		this.ws.onerror = (error) => {
			console.log('Websocket error:', error)
		}

		if (this.retriesDone < this.config.maxRetries) {
			setTimeout(() => {
				this.retriesDone++
				this.connect()
			}, backoffDelay)
		} else {
			console.log('Websocket closed. Max re-connect limit reached.')
		}

		this.ws.onclose = () => {
			console.log('WebSocket state -> CLOSED')
			this.ws = null
		}
	}

	send(data: string): void {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(data)
		} else {
			throw new Error('Websocket not connected')
		}
	}

	onMessage(handler: (data: string) => void): void {
		this.messageHandler = handler
	}

	close(): void {
		this.ws?.close()
		this.ws = null
	}
}

/* New SSE connection calls send before connect to set payload
and does its own fetch
 */
class SSEConnection implements StreamConnection {
	private abortController: AbortController | null = null
	private messageHandler: (data: string) => void = () => {}

	constructor(
		private url: string = '',
		private config = { reconnectDelay: 3000 }
	) {}

	async connect(payload: string): Promise<void> {
		this.abortController = new AbortController()

		const response = await fetch(this.url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: payload,
			signal: this.abortController.signal
		})

		const reader = response.body!.getReader()
		const decoder = new TextDecoder()

		while (true) {
			const { done, value } = await reader.read()
			if (done) break

			const chunk = decoder.decode(value)
			this.messageHandler(chunk)
		}
	}

	onMessage(handler: (data: string) => void): void {
		this.messageHandler = handler
	}

	close(): void {
		this.abortController?.abort()
		this.abortController = null
	}
}

// Transformer chain will jailbreak our backend into handling the major LLM-provider responses
export function eatWith<T>(getter: (data: any) => T): EatTheIterables<T> {
	return (raw: string) => {
		const response = JSON.parse(raw)
		return getter(response)
	}
}

// OpenAI SSE connection config
export const openaiConnection = {
	url: 'https://api.openai.com/v1/chat/completions',
	headers: (apiKey: string) => ({
		'Content-Type': 'application/json',
		Authorization: `Bearer ${apiKey}`
	}),
	transformer: eatWith((data) => data.choices?.[0]?.delta?.content || ''),
	buildPayload: (messages: Array<{ role: string; content: string }>, model = 'gpt-4o') => ({
		model,
		messages,
		stream: true
	})
}

// Anthropic SSE connection config
export const anthropicConnection = {
	url: 'https://api.anthropic.com/v1/messages',
	headers: (apiKey: string) => ({
		'Content-Type': 'application/json',
		'x-api-key': apiKey,
		'anthropic-version': '2023-06-01'
	}),
	transformer: eatWith((data) => data.delta?.text || ''),
	buildPayload: (
		messages: Array<{ role: string; content: string }>,
		model = 'claude-sonnet-4-5'
	) => ({
		model,
		messages,
		max_tokens: 1024,
		stream: true
	})
}
