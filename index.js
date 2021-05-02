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
			shouldTrackSubs: false
		}

		this.config = Object.assign(default_configuration, config);

		if (!this.config.channels) this.config.channels = ['moonmoon'];

		if (this.config.duplicateEmoteLimit_pleb === null) {
			this.config.duplicateEmoteLimit_pleb = this.config.duplicateEmoteLimit;
		}

		this.emotes = {};
		this.bttvEmotes = {};
		this.emoteMaterials = {};
		this.listeners = [];

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
		
		if(config.shouldTrackSubs)
		{
			this.client.addListener('anongiftpaidupgrade', this.handleAnongiftpaidupgrade.bind(this));
			this.client.addListener('giftpaidupgrade', this.handleGiftpaidupgrade.bind(this));
			this.client.addListener('resub', this.handleResub.bind(this));
			this.client.addListener('subgift', this.handleSubgift.bind(this));
			this.client.addListener('submysterygift', this.handleSubmysterygift.bind(this));
			this.client.addListener('subscription', this.handleSub.bind(this));
		}
		
		this.client.connect();
	}

	on(eventName, callback) {
		if(this.listeners[eventName]) {	
			this.listeners[eventName].push(callback);
		}
		else {
			this.listeners[eventName] = [callback];
		}
	}

	dispatch(eventName, e) {
		for (let index = 0; index < this.listeners[eventName].length; index++) {
			this.listeners[eventName][index](e);
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
	
	handleAnongiftpaidupgrade(channel, username, userstate, self) {		
		let subDisplayText = username + " is continuing an anonymous giftsub!";
		this.dispatch('subtext', subDisplayText);
	}
	
	handleGiftpaidupgrade(channel, username, sender, userstate, self) {		
		let subDisplayText = username + " is continuing a giftsub from " + sender + "!";
		this.dispatch('subtext', subDisplayText);
	}
	
	handleResub(channel, username, streakMonths, message, userstate, methods, self) {
		let subDisplayText = username + " resubbed!";
		if(userstate['badge-info'] && userstate['badge-info'].subscriber)
		{
			subDisplayText = username + " resubbed for " + userstate['badge-info'].subscriber + " months!";
		}
		this.dispatch('subtext', subDisplayText);
	}
	
	handleSubgift(channel, username, streakMonths, recipient, methods, userstate, self) {		
		let subDisplayText = username + " gifted a sub to " + recipient + "!";
		this.dispatch('subtext', subDisplayText);
	}
	
	handleSubmysterygift(channel, username, numberOfSubs, methods, userstate, self) {		
		let subDisplayText = username + " gifted a sub to " + numberOfSubs + " pleb(s)!";
		this.dispatch('subtext', subDisplayText);
	}
	
	handleSub(channel, username, methods, message, userstate, self)
	{		
		let subDisplayText = username + " subscribed!";
		this.dispatch('subtext', subDisplayText);
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
								material: this.drawEmote('https://static-cdn.jtvnw.net/emoticons/v1/' + i + '/3.0'),
								id: i,
								sprite: undefined,
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
					material: bttvOutput,
					id: string,
					sprite: undefined,
					name: string,
				}, output);
			}
			counter += string.length + 1;
		}

		if (output.length > 0) {
			this.dispatch('emotes', {
				progress: 0,
				x: Math.random(),
				y: Math.random(),
				emotes: this.config.maximumEmoteLimit ? output.splice(0, this.config.maximumEmoteLimit) : output,
			});
		}
	}

	checkIfBTTVEmote(string) {
		if (this.bttvEmotes[string] && !this.emotes[string]) {
			return this.drawEmote(this.bttvEmotes[string]);
		}
		return false;
	}

	drawEmote(url) {
		if (!this.emoteMaterials[url]) {
			const gif = new GIF(url, { gifAPI: this.config.gifAPI });
			this.emoteMaterials[url] = gif;
		}
		return this.emoteMaterials[url];
	}
}

export default Chat;