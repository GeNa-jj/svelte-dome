<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';

	export let people: any[] = [];
	export let currentPersonId;
	export let searchContacts: (arg0: string) => void;
	export let goChat: (arg0: number) => void;

	const callSearchContacts = (event: InputEvent) => {
		const inputElement = event.target as HTMLInputElement;
		const value = inputElement.value;
		searchContacts(value);
	};
</script>

<section class="contact-box card w-full h-full">
	<div class="flex flex-col h-full">
		<header class="border-b border-surface-500/30 p-4">
			<input
				class="input search-input"
				type="search"
				placeholder="Search..."
				on:input={callSearchContacts}
			/>
		</header>

		<div class="flex-1 p-4 space-y-4 overflow-y-auto">
			<small class="opacity-50">Contacts</small>
			{#if people.length}
				<div class="contact-list flex flex-col space-y-1">
					{#each people as person, i}
						<button
							type="button"
							style="padding: 0"
							class="btn w-full flex items-center space-x-4 {person.id === currentPersonId
								? 'variant-filled-primary'
								: 'bg-surface-hover-token'}"
							on:click={() => goChat(i)}
						>
							<div class="relative inline-block">
								{#if person.unread}
									<span class="badge-icon variant-filled-warning absolute -top-1 -right-1 z-10"
										>{person.unread}</span
									>
								{/if}
								<Avatar
									class="avatar"
									initials={person.name.slice(0, 1)}
									background="bg-primary-600"
									width="w-10"
								/>
							</div>

							<div
								class="flex-1 text-start overflow-hidden border-b border-surface-500/30 min-h-[74px]"
								style="padding-bottom: 9px"
							>
								<div class="flex justify-between">
									<span>{person.name}</span>
									<span class="text-primary-800 font-size-12">{person.lastMessage.timestamp}</span>
								</div>
								<p class="text-primary-800 ellipsis-2-lines font-size-12">
									{person.lastMessage.message}
								</p>
							</div>
						</button>
					{/each}
				</div>
			{:else}
				<p class="opacity-50 text-center no-data">no data</p>
			{/if}
		</div>
	</div>
</section>
