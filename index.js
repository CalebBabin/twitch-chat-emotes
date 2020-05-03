const tmi = require('tmi.js');
const GIF = require('./gifLoader.js');

class Chat {
	constructor(input_configuration) {
		const default_conrfiguration = {
			duplicateEmoteLimit: 1,
		}

		this.config = Object.assign(default_conrfiguration, input_configuration);

		if (!this.config.channels) this.config.channels = ['moonmoon'];

		this.emotes = {};
		this.bttvEmotes = {};
		this.emoteMaterials = {};
		this.dispatch = ()=>{};

		this.client = new tmi.Client({
			options: { debug: false },
			connection: {
				reconnect: true,
				secure: true
			},
			channels: this.config.channels
		});

		for (let index = 0; index < this.config.channels.length; index++) {
			const channel = this.config.channels[index].replace('#', '');
			fetch(`https://gif-emotes.opl.io/channel/username/${channel}.js`)
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


		this.client.addListener('message', this.handleChat.bind(this));
		this.client.connect();
	}

	handleChat (channel, user, message, self) {
		this.getEmoteArrayFromMessage(message, user.emotes);
	}

	getEmoteArrayFromMessage(text, emotes) {
		const output = new Array();
		const stringArr = text.split(' ');
		let counter = 0;
		const emoteCache = {};
		for (let index = 0; index < stringArr.length; index++) {
			const string = stringArr[index];
			if (!emoteCache[string] || emoteCache[string] < this.config.duplicateEmoteLimit) {
				if (emotes !== null) {
					for (let i in emotes) {
						for (let index = 0; index < emotes[i].length; index++) {
							const arr = emotes[i][index].split('-');
							if (parseInt(arr[0]) === counter) {
								output.push({
									material: this.drawEmote('https://static-cdn.jtvnw.net/emoticons/v1/' + i + '/3.0'),
									sprite: undefined,
								});
								if (!emoteCache[string]) emoteCache[string] = 0;
								emoteCache[string]++;
								break;
							}
						}
					}
				}
				const bttvOutput = this.checkIfBTTVEmote(string);

				if (bttvOutput !== false) {
					output.push({
						material: bttvOutput,
						sprite: undefined,
					});
					emoteCache[string] = true;
				}
			}
			counter += string.length + 1;
		}

		if (output.length > 0) {
			this.dispatch({
				progress: 0,
				x: Math.random(),
				y: Math.random(),
				emotes: output,
			});
		}
	}

	checkIfBTTVEmote (string) {
		if (this.bttvEmotes[string] && !this.emotes[string]) {
			return this.drawEmote(this.bttvEmotes[string]);
		}
		return false;
	}
	
	drawEmote (url) {
		if (!this.emoteMaterials[url]) {
			const gif = new GIF(url);
			this.emoteMaterials[url] = gif;
		}
		return this.emoteMaterials[url];
	}
}


/*if (window.devEnvironment || false) {
	const randomEmoteSelection = [
		'peepoT',
		'NOMMERS',
		'pepeJAM',
		'HACKERMANS',
	];
	setInterval(() => {
		getEmoteArrayFromMessage(randomEmoteSelection[Math.floor(Math.random() * randomEmoteSelection.length)], []);
	}, 100);

	setInterval(() => {
		getEmoteArrayFromMessage('moon2EE moon2LL moon2LL moon2LL moon2LL Clap', { "301948071": ["0-6"], "301948074": ["8-14", "16-22", "24-30", "32-38"] });
	}, 1000)
}*/

export default Chat;