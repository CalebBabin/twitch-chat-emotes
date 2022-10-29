import tmi from 'tmi.js';
import Emote from './emote.js';

const is_pleb = badges => {
	return badges ? (
		badges.subscriber !== undefined ||
		badges['sub-gifter'] !== undefined ||
		badges.moderator !== undefined ||
		badges.vip !== undefined ||
		Number(badges.bits) > 500
	) : false;
}

class Chat {
	/**
	 * @param {Object} config The configuration object.
	 * @param {Array} config[].channels An array of twitch channels to connect to, example: ["moonmoon"]
	 * @param {Number} config[].maximumEmoteLimit The maximum number of emotes permitted for a single message.
	 * @param {Number} config[].maximumEmoteLimit_pleb The maximum number of emotes permitted for a single message from an unsubscribed user, defaults to maximumEmoteLimit.
	 * @param {Number} config[].duplicateEmoteLimit The number of duplicate emotes permitted for a single message.
	 * @param {Number} config[].duplicateEmoteLimit_pleb The number of duplicate emotes permitted for a single message from an unsubscribed user, defaults to duplicateEmoteLimit.
	 * @param {String} config[].gifAPI Define the URL of your own GIF parsing server.
	 */
	constructor(config = {}) {
		const default_configuration = {
			duplicateEmoteLimit: 0,
			duplicateEmoteLimit_pleb: null,
			maximumEmoteLimit: 5,
			maximumEmoteLimit_pleb: null,
			gifAPI: "https://gif-emotes.opl.io",
		}

		this.config = Object.assign(default_configuration, config);

		if (!this.config.channels) this.config.channels = ['moonmoon'];

		if (this.config.duplicateEmoteLimit_pleb === null) {
			this.config.duplicateEmoteLimit_pleb = this.config.duplicateEmoteLimit;
		}
		if (this.config.maximumEmoteLimit_pleb === null) {
			this.config.maximumEmoteLimit_pleb = this.config.maximumEmoteLimit;
		}

		this.customEmotes = {};
		this.emoteInstances = {};
		this.listeners = {};

		this.client = new tmi.Client({
			options: { debug: false },
			connection: {
				reconnect: true,
				secure: true
			},
			channels: this.config.channels
		});

		this.fetchCustomEmotes();

		this.client.addListener('message', this.handleChat.bind(this));
		this.client.connect();
	}

	dispose() {
		this.client.disconnect();
		for (const key in this.emoteInstances) {
			if (Object.hasOwnProperty.call(this.emoteInstances, key)) {
				const element = this.emoteInstances[key];
				element.dispose();
			}
		}
	}


	/**
	 * @param {String} keyWord The word that will trigger the emote
	 * @param {String} image The URL of the emote, must start with "/" or "http" (case insensitive)
	 */
	addCustomEmote(keyWord, image) {
		this.customEmotes[keyWord] = image;
	}

	on(event = "emotes", callback) {
		/**
		 * @param {String} event The name of the event to listen for. Default = "emotes"
		 * @param {Function} callback Callback function
		 */
		if (!this.listeners[event]) this.listeners[event] = [];
		this.listeners[event].push(callback);
	}

	dispatch(event, data) {
		if (!this.listeners[event]) return;
		for (let index = 0; index < this.listeners[event].length; index++) {
			this.listeners[event][index](data);
		}
	}

	fetchCustomEmotes() {
		for (let index = 0; index < this.config.channels.length; index++) {
			const channel = this.config.channels[index].replace('#', '');
			fetch(`${this.config.gifAPI}/channel/username/${channel}.js`)
				.then(json => json.json())
				.then(data => {
					if (!data.error && data !== 404) {
						for (let index = 0; index < data.length; index++) {
							const emote = data[index];
							this.customEmotes[emote.code] = emote.id;
						}
					}
				})
		}
	}

	handleChat(channel, user, message, self) {
		this.getEmoteArrayFromMessage(message, user.emotes, is_pleb(user.badges));
	}

	getEmoteArrayFromMessage(text, emotes, subscriber) {
		const output = new Array();
		const stringArr = text.split(' ');
		let counter = 0;
		const maxDuplicates = subscriber ?
			this.config.duplicateEmoteLimit :
			this.config.duplicateEmoteLimit_pleb;
		const maxEmotes = subscriber ?
			this.config.maximumEmoteLimit :
			this.config.maximumEmoteLimit_pleb;

		const emoteCache = {};
		const push = (emote, array) => {
			if (!emoteCache[emote.url]) emoteCache[emote.url] = 0;
			if (emoteCache[emote.url] <= maxDuplicates) {
				array.push(emote);
				emoteCache[emote.url]++;
			}
		}

		for (let index = 0; index < stringArr.length; index++) {
			const word = stringArr[index];

			if (emotes !== null) {
				for (let i in emotes) {
					for (let index = 0; index < emotes[i].length; index++) {
						const arr = emotes[i][index].split('-');
						if (parseInt(arr[0]) === counter) {
							push(this.drawEmote(
								'https://static-cdn.jtvnw.net/emoticons/v2/' + i + '/default/dark/3.0',
							), output);
							if (!emoteCache[word]) emoteCache[word] = 0;
							break;
						}
					}
				}
			}

			if (this.customEmotes.hasOwnProperty(word)) {
				push(this.drawEmote(this.customEmotes[word]), output);
			}
			counter += word.length + 1;
		}

		if (output.length > 0) {
			this.dispatch("emotes",
				maxEmotes ? output.splice(0, maxEmotes) : output);
		}
	}

	drawEmote(url) {
		if (!this.emoteInstances[url]) {
			this.emoteInstances[url] = new Emote(url, { gifAPI: this.config.gifAPI });
		}
		return this.emoteInstances[url];
	}
}

export default Chat;
