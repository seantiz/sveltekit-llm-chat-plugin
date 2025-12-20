// A layer for both Websocket and SSE connections
interface StreamConnection {
	connect(): Promise<void>
	send(data: string): void
	onMessage(handler: (data: string) => void): void
	close(): void
}

type EatTheIterables<T> = (raw: string) => T

// Just renaming a TS/JS built-in for consistency
type StreamBody = AsyncIterableIterator<string>
