
import Chat from '../index.js';

// a default array of twitch channels to join
let channels = ['moonmoon', 'antimattertape'];

// the following few lines of code will allow you to add ?channels=channel1,channel2,channel3 to the URL in order to override the default array of channels
const query_vars = {};
window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
	query_vars[key] = value;
});
if (query_vars.channels) {
	channels = query_vars.channels.split(',');
}

// create our chat instance
const ChatInstance = new Chat({
	channels,
	duplicateEmoteLimit: 0,
	maximumEmoteLimit: 10,
});

window.ChatInstance = ChatInstance;

import testImageURL from './test.png';
ChatInstance.addCustomEmote('test', testImageURL)
ChatInstance.drawEmote(testImageURL, 'test');

const emoteIDs = {};
// add a callback function for when a new message with emotes is sent
ChatInstance.on("emotes", (emotes, data) => {
	console.log(data.user.username + ': ' + data.message, emotes);
	for (let index = 0; index < emotes.length; index++) {
		const e = emotes[index];
		if (!emoteIDs[e.url]) {
			console.log('new emote', e.name, e.url, e.canvas);
			emoteIDs[e.url] = e;
			document.body.appendChild(e.canvas)
			e.canvas.setAttribute('data-id', e.url)
			document.body.appendChild(e.spriteSheet)
			e.spriteSheet.setAttribute('data-id', e.url)
		}
	}
})