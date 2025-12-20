# Svelte Plugin for Streaming LLM Chats

## The Goal
One newConnection() function that composes any streaming connection: WebSocket for local services, SSE for external APIs. Universal interface, provider-agnostic.

## Current State

`newConnection('websocket' | 'sse', url)` handles both types of streams through the `StreamConnection` type.

WebSocket: Connect first, then send data over open socket.
SSE: makes POST request with payload, consumes response stream through the web Response API.

# What if I Want to Use Sveltekit Remote Functions?
Remote functions were launched with response-request patterns in mind. They cannot currently maintain persistent streaming connections. The Svelte Discord has hinted at adding a stream remote function type for SSE in the future, but use traditional server endpoints (+server.js/ts) for now.

IMPORTANT: Please do use +server.ts endpoints for your api key security!
