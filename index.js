const tmi = require('tmi.js');
const GIF = require('./gifLoader.js');

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
	 * @param {Number} config[].maximumEmoteLimit The maximum number of emotes permitted for a single message.
	 * @param {Number} config[].maximumEmoteLimit_pleb The maximum number of emotes permitted for a single message from an unsubscribed user, defaults to maximumEmoteLimit.
	 * @param {Number} config[].duplicateEmoteLimit The number of duplicate emotes permitted for a single message.
	 * @param {Number} config[].duplicateEmoteLimit_pleb The number of duplicate emotes permitted for a single message from an unsubscribed user, defaults to duplicateEmoteLimit.
	 * @param {Number} config[].gifAPI Define the URL of your own GIF parsing server.
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

		this.emotes = {};
		this.bttvEmotes = {};
		this.emoteGifs = {};
		this.listeners = {};

		this.client = new tmi.Client({
			options: { debug: false },
			connection: {
				reconnect: true,
				secure: true
			},
			channels: this.config.channels
		});

		this.fetchBTTVEmotes();

		this.client.addListener('message', this.handleChat.bind(this));
		this.client.connect();
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

	fetchBTTVEmotes() {
		for (let index = 0; index < this.config.channels.length; index++) {
			const channel = this.config.channels[index].replace('#', '');
			fetch(`${this.config.gifAPI}/channel/username/${channel}.js`)
				.then(json => json.json())
				.then(data => {
					if (!data.error && data !== 404) {
						for (let index = 0; index < data.length; index++) {
							const emote = data[index];
							this.bttvEmotes[emote.code] = emote.id;
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

		const emoteCache = {};
		const push = (emote, array) => {
			if (!emoteCache[emote.id]) emoteCache[emote.id] = 0;
			if (emoteCache[emote.id] <= maxDuplicates) {
				array.push(emote);
				emoteCache[emote.id]++;
			}
		}

		for (let index = 0; index < stringArr.length; index++) {
			const string = stringArr[index];

			if (emotes !== null) {
				for (let i in emotes) {
					for (let index = 0; index < emotes[i].length; index++) {
						const arr = emotes[i][index].split('-');
						if (parseInt(arr[0]) === counter) {
							push({
								gif: this.drawEmote('https://static-cdn.jtvnw.net/emoticons/v2/' + i + '/default/dark/3.0'),
								id: i,
								name: string,
							}, output);
							if (!emoteCache[string]) emoteCache[string] = 0;
							break;
						}
					}
				}
			}
			const bttvOutput = this.checkIfBTTVEmote(string);

			if (bttvOutput !== false) {
				push({
					gif: bttvOutput,
					id: string,
					name: string,
				}, output);
			}
			counter += string.length + 1;
		}

		if (output.length > 0) {
			this.dispatch("emotes",
				this.config.maximumEmoteLimit ? output.splice(0, this.config.maximumEmoteLimit) : output);
		}
	}

	checkIfBTTVEmote(string) {
		if (this.bttvEmotes[string] && !this.emotes[string]) {
			return this.drawEmote(this.bttvEmotes[string]);
		}
		return false;
	}

	drawEmote(url) {
		if (!this.emoteGifs[url]) {
			const gif = new GIF(url, { gifAPI: this.config.gifAPI });
			this.emoteGifs[url] = gif;
		}
		return this.emoteGifs[url];
	}
}

export default Chat;