<script lang="ts">
	import { newConnection, openaiConnection, anthropicConnection } from '$lib/utils'

	// Client-side callback to newConnection plugin
	async function sendChat(userInput: string, provider: 'openai' | 'anthropic' | 'pieces') {
		const messages = [{ role: 'user', content: userInput }]

		const providerConfig = {
			pieces: {
				type: 'websocket' as const,
				transformer: (raw: string) => JSON.parse(raw).question.answers.iterable[0].text,
				payload: {
					question: { relevant: { iterable: [] }, query: userInput, model: 'gpt-4' },
					conversation: 'demo-conversation-id'
				}
			},
			openai: {
				type: 'sse' as const,
				transformer: openaiConnection.transformer,
				payload: { provider: 'openai', messages, model: 'gpt-4o' }
			},
			anthropic: {
				type: 'sse' as const,
				transformer: anthropicConnection.transformer,
				payload: { provider: 'anthropic', messages, model: 'claude-sonnet-4-5' }
			}
		}

		const config = providerConfig[provider]
		const url = provider === 'pieces' ? 'ws://localhost:39300/qgpt/stream' : '/api/stream'
		const connection = newConnection(config.type, url)

		let accumulated = ''
		connection.onMessage((raw) => {
			accumulated += config.transformer(raw)
			console.log(accumulated)
		})

		if (config.type === 'websocket') {
			await connection.connect()
			connection.send!(JSON.stringify(config.payload))
		} else {
			await connection.connect(JSON.stringify(config.payload))
		}
	}

	/* Example ui state-machine object if you have just one page.svelte route in your chat app
	 * But if you have any kind of ui state that goes beyond one route then you won't want this
	 */
	let chat = $state({
		loading: false,
		userInput: '',
		newConversation: false,
		openingMessage: {} as { role: 'user' | 'assistant'; content: string },
		history: [] as { role: 'user' | 'assistant'; content: string }[],
		inputHistory: [] as string[],
		index: -1
	})
</script>
