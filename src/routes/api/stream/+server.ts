import { openaiConnection, anthropicConnection } from "$lib/utils"

export async function POST({ request} : { request: Request } }) {
	const { provider, messages, model } = await request.json()

	const apiKey = provider === 'openai' ? process.env.OPENAI_API_KEY : process.env.ANTHROPIC_API_KEY

	const config = provider === 'openai' ? openaiConnection : anthropicConnection

	if(apiKey){
	const response = await fetch(config.url, {
		method: 'POST',
		headers: config.headers(apiKey),
		body: JSON.stringify(config.buildPayload(messages, model))
	})

	return new Response(response.body, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	})
	} else {
	throw Error('Please make sure you have set up your API key.')
	}
}
