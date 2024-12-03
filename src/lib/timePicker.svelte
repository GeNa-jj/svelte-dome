<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
	const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

	export let selectedHour: string = '00';
	export let selectedMinute: string = '00';

	const dispatch = createEventDispatcher();

	function handleHourChange(event: Event) {
		selectedHour = (event.target as HTMLSelectElement).value;
		dispatch('timeChange', { hour: selectedHour, minute: selectedMinute });
	}

	function handleMinuteChange(event: Event) {
		selectedMinute = (event.target as HTMLSelectElement).value;
		dispatch('timeChange', { hour: selectedHour, minute: selectedMinute });
	}
</script>

<div class="timepicker">
	<select bind:value={selectedHour} on:change={handleHourChange}>
		{#each hours as hour}
			<option value={hour}>{hour}</option>
		{/each}
	</select>
	:
	<select bind:value={selectedMinute} on:change={handleMinuteChange}>
		{#each minutes as minute}
			<option value={minute}>{minute}</option>
		{/each}
	</select>
</div>

<style>
	.timepicker {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	select {
		padding: 0.5rem;
		font-size: 1rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		outline: none;
	}

	select:focus {
		border-color: #0070f3;
	}
</style>
