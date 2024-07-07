import { faker } from '@faker-js/faker';

// type
export interface Person {
  id: number;
  name: string;
  unread: number;
  message: MessageFeed[];
  lastMessage: Object;
}
export interface MessageFeed {
  id: number;
  host: boolean;
  name: string;
  timestamp: string;
  message: string;
}

export const getContactList = (): Person[] => {
  let people: Person[] = [
    { id: 0, name: 'Michael', unread: 0, message: [], lastMessage: {} },
    { id: 1, name: 'Payton', unread: 0, message: [], lastMessage: {} },
    { id: 2, name: 'Shan', unread: 0, message: [], lastMessage: {} },
    { id: 3, name: 'Joey', unread: 0, message: [], lastMessage: {} },
    { id: 4, name: 'Lara', unread: 0, message: [], lastMessage: {} },
    { id: 5, name: 'Melissa', unread: 0, message: [], lastMessage: {} },
    { id: 6, name: 'Melissa2', unread: 0, message: [], lastMessage: {} },
    { id: 7, name: 'Melissa3', unread: 0, message: [], lastMessage: {} },
    { id: 8, name: 'Melissa4', unread: 0, message: [], lastMessage: {} },
    { id: 9, name: 'Melissa5', unread: 0, message: [], lastMessage: {} },
  ];

  people.forEach(item => {
    const arr = new Array(6).keys();
    item.message = Array.from(arr).map((key, index) => {
      const lorem = faker.lorem.paragraph();
      const host = index % 2 === 0;
      return ({
        id: index,
        host,
        name: host ? 'Jun' : item.name,
        timestamp: `Yesterday @ 2:3${index}pm`,
        message: lorem
      });
    });
    item.lastMessage = item.message[item.message.length - 1];
  });

  return people;
}
