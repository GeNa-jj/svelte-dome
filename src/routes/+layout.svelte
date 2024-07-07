<script lang="ts">
	import '../app.postcss';
	import { AppShell, AppBar, LightSwitch, initializeStores } from '@skeletonlabs/skeleton';
  import { page } from '$app/stores';

  initializeStores();

	// Floating UI for Popups
	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import { storePopup } from '@skeletonlabs/skeleton';
	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });

  $: title = $page.route.id;

</script>

<!-- App Shell -->
<AppShell>
	<svelte:fragment slot="header">
		<!-- App Bar -->
		<AppBar>
			<svelte:fragment slot="lead">
				<strong class="text-xl uppercase">{ title.slice(1) }</strong>
			</svelte:fragment>

			<svelte:fragment slot="trail">
				<a
						class="btn btn-sm variant-ghost-surface"
						href="/geoMap"
						rel="noreferrer"
				>
					GeoMap
				</a>
				<a
						class="btn btn-sm variant-ghost-surface"
						href="/sms"
						rel="noreferrer"
				>
					SMS
				</a>
				<LightSwitch />
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>
	<!-- Page Route Content -->
	<slot />
</AppShell>

<style lang="postcss">
	strong {
		color: purple;
		font-family: 'Comic Sans MS', cursive;
	}
</style>
