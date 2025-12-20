<script lang="ts">
	interface Props {
		children?: import('svelte').Snippet
	}

	let { children }: Props = $props()
</script>

<div class="app">
	<div class="header-menu-container"></div>

	<main>
		{@render children?.()}
	</main>

	<footer>
		<p class="text-xs dark:text-slate-300">
			<span>This is a deprecated layout. Ignore it.</span>
		</p>
	</footer>
</div>
