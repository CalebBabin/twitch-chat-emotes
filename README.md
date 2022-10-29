# twitch-chat-emotes
Connects to twitch chat and emits emotes as they're typed in twitch chat.

Supports all twitch emotes, animated twitch emotes are still in development.

Supports Global and Channel Better Twitch TV (BTTV) emotes, static and animated.

> This is a library created specifically for projects that run in the browser and require BTTV GIF emote support for Canvas and WebGL instances.
> 
> If you're looking for a more standard library to interact with twitch chat, you should look into [tmi.js](https://github.com/tmijs/tmi.js), which this library is based off of.

&nbsp;

## Example implementation
```
yarn add twitch-chat-emotes
```

```js
import Chat from 'twitch-chat-emotes';

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

// add the word "TEST" as a custom emote
ChatInstance.addCustomEmote("TEST", "https://example.com/image.png");

// add a callback function for when a new message with emotes is sent
ChatInstance.on("emotes", (emotes) => {
	console.log(emotes)
})
```

&nbsp;

# External server dependency

An external API runs at `https://gif-emotes.opl.io/`. Emotes are passed through this server in order to offload GIF processing from the client in an attempt to improve performance in an OBS browser source to avoid frame drops. *The server source code will be released at a later date so that users of the library can run it themselves if needed.*

The API is heavily cached behind CloudFlare, and should withstand an unreasonable amount of traffic.

---

# Documentation

```js
const ChatInstance = new Chat({config...})
```
| Property | Description |
| - | - |
| `channels` | An array of twitch chat channels to connect to |
| `maximumEmoteLimit` | The limit of emotes per message |
| `maximumEmoteLimit_pleb` | `maximumEmoteLimit`, but for users who are not subscribed, mods, or VIPs |
| `duplicateEmoteLimit` | The maximum amount of times the same emote can be repeated in the same message |
| `duplicateEmoteLimit_pleb` | Similar to `maximumEmoteLimit_pleb` |
| `gifAPI` | Define the location of your own self-hosted emote API |

&nbsp;

## Events

```js
ChatInstance.on(event, callback)

...

ChatInstance.on("Emotes", (array) => {
	console.log(array);
})
```

| Event | Description |
| - | - |
| `emotes` | Returns an array of emote objects every time a message is sent in twitch chat that contains matched emotes |

## Objects

**Emote**
| Property | Description |
| - | - |
| `url` | The "unique ID" of the emote, either it's name or a URL |
| `name` | The name of the emote (Example: `Kappa`, `FeelsGoodMan`, `KomodoHype`) |
| `canvas` | The emotes canvas, there is only one unique canvas element for each emote *(adding it multiple times in the DOM will just move it between elements)* |