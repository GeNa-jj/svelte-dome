import { describe, it, expect, test, expectTypeOf, vi, beforeEach } from 'vitest';
import ContactList from '../src/routes/sms/ContactList.svelte';
import { getContactList, type Person } from '../src/routes/sms/mock';
import { tick } from 'svelte';

const contactData = getContactList();

let handleClickSpy: () => void;
let handleInputSpy: () => void;

beforeEach(() => {
	document.body.innerHTML = '';
	handleClickSpy = vi.fn();
	handleInputSpy = vi.fn();
});

const render = (props: any = {}) => {
	return new ContactList({
		target: document.body,
		props: {
			people: contactData,
			goChat: handleClickSpy,
			searchContacts: handleInputSpy,
			currentPersonId: undefined,
			...props
		}
	});
}

test('mock types work properly', () => {
	expectTypeOf(getContactList).toBeFunction();
	expectTypeOf(contactData).toEqualTypeOf<Person[]>();
});

test('no data message', () => {
	render({
		people: []
	})

	const noData = document.querySelector(`.no-data`);
	expect(noData).toBeTruthy();
});

test('search input and contact list should render', () => {
	render();

	const searchInput = document.querySelector(`.search-input`);
	const contactList = document.querySelector(`.contact-list`);
	expect(searchInput).toBeTruthy();
	expect(contactList).toBeTruthy();
});

test('badge icon should render when unread has number', () => {
	contactData[0].unread += 2;
	render({ people: contactData });

	const badgeIcon = document.querySelector('.badge-icon') as HTMLElement;
	expect(badgeIcon.textContent).toEqual('2');
});

test(`calls the action when input is entered`, async () => {
	render();

	const input = document.querySelector('.search-input') as HTMLInputElement;

	input.value = 'Michael';
	input.dispatchEvent(new InputEvent('input'));

	await tick();
	expect(handleInputSpy).toHaveBeenCalledTimes(1);
})

test(`calls the action when input is entered`, async () => {
	render({ currentPersonId: 0 });

	const btn = document.querySelector('.btn') as HTMLButtonElement;
	expect(btn).toBeTruthy();

	btn.dispatchEvent(new Event('click'));
	await tick();

	expect(handleClickSpy).toHaveBeenCalledTimes(1);
})
