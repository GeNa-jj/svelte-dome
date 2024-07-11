import { WebSocketServer } from 'ws';

const server = new WebSocketServer({ port: 8080 });
let timer = null;

server.on('connection', ws => {
	// 当服务器接收到信息时
	ws.on('message', msg => {
		console.log('received: %s', msg);

		// 回复
		const { message, ...currentPersonInfo } = JSON.parse(msg);
		const newMessage = `got your message: "${message}"`
		setTimeout(() => {
			ws.send(JSON.stringify({ ...currentPersonInfo.currentPersonInfo, message: newMessage }));
		}, 2000);
	});

	// 定时发送信息
	let num = 1;
	timer = setInterval(() => {
		ws.send(JSON.stringify({ id: 3, name: 'Joey', message: 'hello' }));

		num += 1;
		if (num > 3) {
			timer && clearInterval(timer);
		}
	}, 10 * 1000);

	ws.on('close', () => {
		timer && clearInterval(timer);
		console.log('Connection closed');
	});
});

console.log('WebSocket server is running on ws://localhost:8080');
