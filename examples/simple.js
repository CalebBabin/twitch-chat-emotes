
import Chat from '../index.js';

// a default array of twitch channels to join
let channels = ['moonmoon'];

// the following few lines of code will allow you to add ?channels=channel1,channel2,channel3 to the URL in order to override the default array of channels
const query_vars = {};
const query_parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
	query_vars[key] = value;
});
if (query_vars.channels) {
	channels = query_vars.channels.split(',');
}

// create our chat instance
const ChatInstance = new Chat({
	channels,
	duplicateEmoteLimit: 5,
});

window.ChatInstance = ChatInstance;

import testImageURL from './test.png';
ChatInstance.addCustomEmote('test', testImageURL)

const emoteIDs = {};
// add a callback function for when a new message with emotes is sent
ChatInstance.on("emotes", (emotes) => {
	console.log(emotes);
	for (let index = 0; index < emotes.length; index++) {
		const e = emotes[index];
		console.log(e.name, e.url, e.canvas);
		if (!emoteIDs[e.url]) {
			emoteIDs[e.url] = e;
			document.body.appendChild(e.canvas)
			e.canvas.setAttribute('data-id', e.url)
			document.body.appendChild(e.spriteSheet)
			e.spriteSheet.setAttribute('data-id', e.url)
		}
	}
})