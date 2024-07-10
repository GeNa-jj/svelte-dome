<script lang="ts">
	import { faker } from '@faker-js/faker';
	import { onMount, onDestroy } from 'svelte';
	import { Avatar, Drawer, getDrawerStore, Toast, getToastStore } from '@skeletonlabs/skeleton';
	import type { DrawerSettings, ToastSettings } from '@skeletonlabs/skeleton';
	import ContactList from './ContactList.svelte';
	import { getContactList, type Person, type MessageFeed } from './mock';

	// 弹窗设置
	const drawerSettings: DrawerSettings = {
		id: 'example',
		position: 'right',
		width: 'w-full'
	};
	const drawerStore = getDrawerStore();
	const toastStore = getToastStore();
	let toastId: number;

	// 滚动的dom
	let elemChat: HTMLElement;
	let elemToast: HTMLElement;
	// 聊天的内容和人
	let messageList: MessageFeed[] = [];
	let currentPerson: string = '';
	let currentPersonId: number | undefined;
	// 发送信息
	let currentMessage: string = '';
	// 搜索的人
	let filterPeople: Person[] = [];
	let people: Person[] = [];
	let searchValue: string = '';

	let ws: WebSocket;

	// 聊天内容滚动
	const scrollChatBottom = (behavior?: ScrollBehavior): void => {
		elemChat.scrollTo({ top: elemChat.scrollHeight, behavior });
	};

	// 获取当前时间
	const getCurrentTimestamp = (): string => {
		return new Date()
			.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
			.split(' ')
			.join('')
			.toLowerCase();
	};

	// 发送信息
	const addMessage = (name?: string, message?: string, host: boolean = true): void => {
		const newMsgName = name || 'Jun';
		const newMessage = {
			id: messageList.length,
			host,
			name: newMsgName,
			timestamp: `Today @ ${getCurrentTimestamp()}`,
			message: message || currentMessage
		};
		const isReading = name === currentPerson || host;
		messageList = [...messageList, newMessage];
		saveMessage(messageList, newMessage, currentPersonId, !isReading, newMsgName);

		// 清空输入
		if (!name) {
			currentMessage = '';
		}

		isReading && (
			setTimeout(() => {
				scrollChatBottom('smooth');
			}, 0)
		);

		// 模拟回复
		host && ws.send(JSON.stringify({
			currentPersonInfo: {
				id: currentPersonId,
				name: currentPerson
			},
			message: newMessage.message
		}));
	};

	// 保存短信
	const saveMessage = (
		messageList: MessageFeed[],
		newMessage: MessageFeed,
		id: number | undefined,
		isAddUnread: boolean = true,
		name: string
	): void => {
		const key = people.findIndex((item) => item.id === id);
		if (key === -1) {
			const newPeople: Person = {
				id: id || people.length,
				name,
				unread: 1,
				message: messageList,
				lastMessage: newMessage
			};
			people = [newPeople, ...people];
		} else {
			if (isAddUnread) people[key].unread += 1;
			people[key].message = messageList;
			people[key].lastMessage = newMessage;
		}

		searchContacts(searchValue);
	};

	const onPromptKeydown = (event: KeyboardEvent): void => {
		if (['Enter'].includes(event.code) && event.keyCode === 13) {
			event.preventDefault();
			addMessage();
		}
	};

	const searchContacts = (input: string): void => {
		searchValue = input.toLowerCase();
		filterPeople = searchValue
			? people.filter((item) => {
					const matchName = item.name.toLowerCase().includes(searchValue);
					let matchMsg = false;
					item.message.forEach((item) => {
						if (item.message.toLowerCase().includes(searchValue)) matchMsg = true;
					});
					return matchName || matchMsg;
				})
			: people;
	};

	const goChat = (index: number): void => {
		messageList = filterPeople[index].message;
		currentPerson = filterPeople[index].name;
		currentPersonId = filterPeople[index].id;
		people[index].unread = 0;
		filterPeople[index].unread = 0;

		toastStore.clear();
		drawerStore.open(drawerSettings);
		setTimeout(() => {
			scrollChatBottom();
		}, 0);
	};

	const back = (): void => {
		currentPersonId = undefined;
		currentPerson = '';
		drawerStore.close();
	};

	const receiveSms = (messageObj: { id: number; name: string; message?: string }): void => {
		const id = messageObj.id;
		const name = messageObj.name;
		const message = messageObj.message || faker.lorem.paragraph();
		const host = false;
		const curPeople = people.find((item) => item.id === id);

		if (currentPersonId === id) {
			addMessage(name, message, host);
		} else {
			const t: ToastSettings = {
				message: `
					<div class="text-start">
						<div class="flex justify-between">
							<span>${name}</span>
							<span class="text-primary-800 font-size-12">Today @ ${getCurrentTimestamp()}</span>
						</div>
						<p class="text-primary-800 ellipsis-2-lines font-size-12">${message}</p>
					<div/>
				`,
				hideDismiss: true,
				hoverable: true,
				background: 'variant-filled-primary'
			};

			toastId = id;
			toastStore.clear();
			toastStore.trigger(t);

			const newMessage = {
				id: curPeople?.message.length || 0,
				host,
				name,
				timestamp: `Today @ ${getCurrentTimestamp()}`,
				message
			};

			const newList = [...(curPeople?.message || []), newMessage];
			saveMessage(newList, newMessage, id, true, name);
		}
	};

	const onToast = (): void => {
		goChat(filterPeople.findIndex((item) => item.id === toastId));
	};

	const isMobile = (): void =>  {
		if (window.innerWidth > 1024) {
			window.alert('Please use mobile mode to view');
		}
	};

	const mockReceiveSms = (delay: number = 3000): void => {
		setTimeout(() => {
			receiveSms({ id: 3, name: 'Joey', message: 'hello' });
		}, delay);
	};

	const addListenerToast = (): void => {
		let startY: number;
		let endY: number;
		elemToast.addEventListener('touchstart', (event: TouchEvent): void => {
			startY = event.touches[0].pageY;
		});

		elemToast.addEventListener('touchmove', (event: TouchEvent): void => {
			endY = event.changedTouches[0].pageY;

			startY - endY > 10 && toastStore.clear();
		});
	}

	const initWebSocket = () => {
		ws = new WebSocket('ws://localhost:8080');

		ws.onopen = (event: Event): void => {
			console.log('WebSocket connected');
		};

		ws.onerror = (error: Event): void => {
			console.error('WebSocket error', error);
		};

		// receive msg
		ws.onmessage = (event: MessageEvent): void => {
			receiveSms(JSON.parse(event.data));
		};

		ws.onclose = (): void => {
			console.log('WebSocket close');
		};
	};

	onMount(() => {
		// 获取数据
		people = getContactList();
		filterPeople = people;

		// 监听上滑关闭msg;
		addListenerToast();

		// 模拟收信息
		initWebSocket();

		// 在浏览器测试 receiveSms({ id: 3, name: 'Joey', message: 'hello' })
		window.receiveSms = receiveSms;
	});

	onDestroy(() => {
		ws && ws.close();
	});

	$: contactListProps = {
		people: filterPeople,
		currentPersonId,
		searchContacts,
		goChat
	};
</script>

<ContactList {...contactListProps} />

<Drawer>
	<div class="flex flex-col h-full">
		<!-- Header -->
		<header class="border-b border-surface-500/30 p-4 flex justify-between items-center">
			<button class="iconfont icon-fanhui" on:click={back}></button>
			<span>{currentPerson}</span>
			<span style="width: 24px"></span>
		</header>
		<!-- List -->
		<section bind:this={elemChat} class="flex-1 p-4 overflow-y-auto space-y-4">
			{#each messageList as bubble}
				{#if bubble.host !== true}
					<div class="grid grid-cols-[auto_1fr] gap-2">
						<Avatar initials={bubble.name.slice(0, 1)} background="bg-primary-600" width="w-10" />
						<div class="card p-4 rounded-tl-none space-y-2 input-group-shim">
							<header class="flex justify-between items-center">
								<p class="font-bold">{bubble.name}</p>
								<small class="opacity-50">{bubble.timestamp}</small>
							</header>
							<p>{bubble.message}</p>
						</div>
					</div>
				{:else}
					<div class="grid grid-cols-[1fr_auto] gap-2">
						<div class="card p-4 rounded-tr-none space-y-2 variant-soft">
							<header class="flex justify-between items-center">
								<p class="font-bold">{bubble.name}</p>
								<small class="opacity-50">{bubble.timestamp}</small>
							</header>
							<p>{bubble.message}</p>
						</div>
						<Avatar initials={bubble.name.slice(0, 1)} background="bg-primary-600" width="w-10" />
					</div>
				{/if}
			{/each}
		</section>
		<!-- Footer -->
		<footer class="border-t border-surface-500/30 p-4">
			<section>
				<div
					class="input-group input-group-divider grid-cols-[auto_1fr_auto] rounded-container-token"
				>
					<button class="input-group-shim">+</button>
					<textarea
						bind:value={currentMessage}
						class="bg-transparent border-0 ring-0 min-h-10"
						name="prompt"
						id="prompt"
						placeholder="Write a message..."
						rows="1"
						on:keydown={onPromptKeydown}
					></textarea>
					<button
						disabled={!currentMessage}
						class={`iconfont icon-fasong ${currentMessage ? 'variant-filled-primary' : 'input-group-shim'}`}
						on:click={() => addMessage()}
					>
					</button>
				</div>
			</section>
		</footer>
	</div>
</Drawer>

<div on:click={onToast} bind:this={elemToast}>
	<Toast width="w-full opacity-95" position="t" />
</div>
