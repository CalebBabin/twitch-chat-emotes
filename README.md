# twitch-chat-emotes
Connects to twitch chat and emits emotes as they're typed in twitch chat.

If you're looking for a library to interact with twitch chat, you should look into [tmi.js](https://github.com/tmijs/tmi.js), which this library is based off of.

This is specifically a library created for projects that run in the browser and require BTTV GIF emote support for Canvas and WebGL instances.

## Example implementation
```
yarn add twitch-chat-emotes
```

```js
import Chat from 'twitch-chat';

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

// add a callback function for when a new message with emotes is sent
ChatInstance.on("emotes", (emotes) => {
	console.log(emotes)
})
```