# Changelog:

## Sveltekit LLM Chat Plugin 0.7.1 (2026-01-04)

- Fixed logic error where WS instances were being spun up with hardcoded Pieces strings
- Fixed bug where WS retry logic was in the wrong method
- SSE connection has better error messages
- SSE connection handles retries
- Added getHealth() tool for any stream connection

## Svelte x Pieces is now Sveltekit LLM Chat Plugin (2025-12-20)

We jailbroke the repo out of being locked into local websocket connections only and completely nixed this codebase being a chat app. There are hundreds of good LLM-chat app examples out there so we're pushing a plugin that builds excitement towards Sveltekit Remote Functions in the future.

## Svelte x Pieces v0.6.0 (2025-03-30)

This is an all-around smaller build with less third-party code and less config files.

- Major migration from Tailwind 3 to Tailwind 4
- Shaved down the dependencies to devDependencies as much as possible

## Svelte x Pieces v0.5.1 (2025-03-13)

- A revamp of the readme
- Several updates to third-party dependencies
- Removed renovate bot config

## Svelte x Pieces v0.5.0 (2024-12-29)

- We now have properly parsed markdown and codeblocks in our chat messages.

- Fixed UI bug where the first message was disappearing on initial app-loadup state.

## Svelte x Pieces v0.4.2 (2024-12-29)

Fixed UI bug in v0.4.1 where the first query message of a new conversation was disappearing from the chat window

## Svelte x Pieces v0.4.1 (2024-12-29)

- We can start a new conversation with the New Conversation button

### Known Bugs

- Sending a message in a new conversation will lead to the first message disappearing from the chat window UI, even though conversations are still managed correctly and all messages are retrieved correctly when you re-load that conversation from the menu.

## Svelte x Pieces v0.4.0 (2024-12-29)

- The menu now shows the connection status of your local Pieces OS server
- A conversations submenu lists all chat conversations

## Svelte x Pieces v0.3.1 (2024-12-28)

We decided to remove autoprefixer() as the app is unlikely to see use with older browsers. There's also some standardised formatting and whitespace fixes.

## Svelte x Pieces v0.3.0 (2024-12-28)

This is an all-Svelte-5-powered app now as we've removed the selectedModel store and instead are now using a modelsController reactive property to track the selected LLM.

## Svelte x Pieces v0.2.0 (2024-12-28)

This is a big update for a minor version but we wanted to get the open-source app back on track with the recent changes to the Pieces OS distribution in general, especially when it comes to message handling through the web socket.

* Pieces in-app chat client now uses the correct port when opening a websocket to send message to local Pieces OS server
* More robust ModelsController module for selecting chat LLM models
* The chat window correctly sends your questions to any Gemini, Claude or ChatGPT model

## Svelte x Pieces v0.1.2 (2024-11-20)

Added some more utility functions (thanks to @bishoy-at-pieces work on the Python CLI app) for handling filenames and their extensions and for saving code snippets.

## Svelte x Pieces v0.1.1 (2024-11-7)

We migrated the client UI to Svelte 5 with v0.1.1!

* The main page is slimmed down with unused variables cleaned up.
* We moved `components` up one directory and changed the path alias
* We added renamed the `apis` folder to `getFromPieces` to make it clearer which tasks exist to post to the Pieces Open API endpoints and just for better readability.
* Safe loading of the Copilot controller into the client DOM with a browser window check.
* We removed unused dependencies after the move to Svelte 5

## Svelte x Pieces v0.1.0 (2024-11-7)

Svelte x Pieces now keeps a changelog and versioning to gradually make it easy to contribute. Over the last year, we've made the following changes:

* Added a Pieces Assets instance to GET from the endpoint (22de729)
* Tweaked the main page UI (3dd6066)

## v0.0.1

* Handling keyboard input (39e156f)
* Better handling of Copilot's streaming messages (8d3eb2c), (6b1568a)
* UI changes (1fa1d5e)
* Fixed problems with IPC threading and a recurring websocket error (f26c2a4)
* Added multi-modal LLM selection in the main page callout (357e415)
* Added the MIT license (fea7e93)
* Readme was updated by mason-at-pieces/main and others (e4e5636), (638beee)
* Removed CopilotStreamController.main() (c33cb08)
* Early setup of radio buttons in the main callout and multimodal LLM selection (1d1e746)
