<script lang="ts">
	import { cn } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		placeholder = "Select an option...",
		value,
		children,
		class: className,
		...restProps
	}: HTMLAttributes<HTMLSpanElement> & {
		placeholder?: string;
		value?: string;
		children?: any;
	} = $props();
</script>

<span
	class={cn("block truncate", className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{:else}
		{placeholder}
	{/if}
</span>
