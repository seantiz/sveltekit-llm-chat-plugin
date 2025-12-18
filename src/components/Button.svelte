<script lang="ts">
	import type { MouseEventHandler, KeyboardEventHandler } from 'svelte/elements'

	interface ButtonProps {
		tag?: string
		href?: string
		disabled?: boolean
		onclick?: MouseEventHandler<HTMLButtonElement>
		onkeydown?: KeyboardEventHandler<HTMLButtonElement>
		onkeyup?: KeyboardEventHandler<HTMLButtonElement>
		label?: string
		class?: string
		type?: 'button' | 'reset' | 'submit'
		children?: () => any
	}

	let {
		tag = undefined,
		href = undefined,
		disabled = false,
		onclick,
		onkeydown,
		onkeyup,
		children,
		class: className = '',
		type = 'button',
		...rest
	}: ButtonProps = $props()

	const element = $derived(tag ?? (href ? 'a' : 'button'))
	const role = $derived(!['button', 'a'].includes(element) ? 'button' : undefined)

	const onClick: MouseEventHandler<HTMLButtonElement> = (e) => {
		onclick?.(e)
	}

	const onKeydownEnter: KeyboardEventHandler<HTMLButtonElement> = (e) => {
		onkeydown?.(e)
	}

	const onKeyUpEnter: KeyboardEventHandler<HTMLButtonElement> = (e) => {
		onkeyup?.(e)
	}
</script>

<button
	aria-disabled={!disabled}
	{type}
	{role}
	onkeydown={onKeydownEnter}
	onkeyup={onKeyUpEnter}
	onclick={onClick}
	{disabled}
	{...rest}
	class="rounded px-4 py-2 font-medium transition-colors {className}"
>
	<div class="piecesvelte-button">
		{@render children?.()}
	</div>
</button>
