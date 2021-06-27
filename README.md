# twitch-chat-emotes
Connects to twitch chat and emits emotes as they're typed in twitch chat.

> This is a library created specifically for projects that run in the browser and require BTTV GIF emote support for Canvas and WebGL instances.
> 
> If you're looking for a more standard library to interact with twitch chat, you should look into [tmi.js](https://github.com/tmijs/tmi.js), which this library is based off of.

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
| `maximumEmoteLimit` | The limit of emotes per message |
| `maximumEmoteLimit_pleb` | `maximumEmoteLimit`, but for users who are not subscribed, mods, or VIPs |
| `duplicateEmoteLimit` | The maximum amount of times the same emote can be repeated in the same message |
| `duplicateEmoteLimit_pleb` | Similar to `maximumEmoteLimit_pleb` |
| `gifAPI` | Define the location of your own self-hosted emote API |

&nbsp;

## Events

```js
ChatInstance.on(event, callback)
```

| Event | Description |
| - | - |
| `emotes` | Returns an array of emote objects every time a message is sent in twitch chat that contains emotes |

## Objects

**Emote**
| Property | Description |
| - | - |
| `gif` | A `GIF` instance of the emote |
| `name` | The name of the emote (Example: `Kappa`, `FeelsGoodMan`, `KomodoHype`) |
| `id` | The unique identifier of the emote |

**GIF**
| Property | Description |
| - | - |
| `canvas` | A `canvas` instance that always contains the current frame |

&nbsp;

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