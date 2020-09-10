
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
})


const emoteIDs = {};
// add a callback function for when a new message with emotes is sent
ChatInstance.on("emotes", (emotes) => {
	console.log(emotes)
	for (let index = 0; index < emotes.emotes.length; index++) {
		const e = emotes.emotes[index];
		if (!emoteIDs[e.id]) {
			emoteIDs[e.id] = e;
			document.body.appendChild(e.material.canvas)
			e.material.canvas.setAttribute('data-id', e.id)
			document.body.appendChild(e.material.spriteSheet)
			e.material.spriteSheet.setAttribute('data-id', e.id)
		}
	}
})