const emoteBlacklist = [];

class GIF_Instance {
	constructor(id, input_configuration = {}) {
		const default_configuration = {
			gifAPI: "https://gif-emotes.opl.io",
		}

		this.config = Object.assign(default_configuration, input_configuration);

		this.id = id;
		this.gifTiming = 10;
		this.currentFrame = 0;
		this.loadedImages = 0;
		this.frames = [];
		this.needsUpdate = false;

		if (id.match(/http/)) {
			this.url = id;
			this.imageFallback();
		} else {
			fetch(`${this.config.gifAPI}/gif/${id}`)
				.then(r => r.json())
				.then(data => {
					if (data.count === 0 || !data.count || emoteBlacklist.includes(id)) {
						this.url = `${this.config.gifAPI}/gif/${id}.gif`
						this.imageFallback();
					} else {
						this.gifTiming = data.frames[0].delay;
						this.frames = data.frames;

						for (let index = 0; index < this.frames.length; index++) {
							const frame = this.frames[index];

							if (frame.delay < 1) frame.delay = 1000 / 60 / 10;

							frame.image = new Image(frame.width, frame.height);
							frame.image.crossOrigin = "";
							frame.image.addEventListener('load', () => {
								this.loadedImages++;
							})
							frame.image.src = `${this.config.gifAPI}/static/${id}/${index}.png`;
						}
						this.loadListener();
					}
				})
		}

		this.canvas = document.createElement('canvas');
		this.canvas.width = 128;
		this.canvas.height = 128;
		this.ctx = this.canvas.getContext('2d');
	}

	imageFallback() {
		this.image = new Image();
		this.image.crossOrigin = "anonymous";
		this.image.addEventListener('load', this.imageFallbackListener.bind(this));

		this.image.src = this.url;
	}
	imageFallbackListener() {
		let pow = 2;
		while (Math.pow(2, pow) < Math.max(this.image.width, this.image.height)) {
			pow++;
		}
		this.canvas.width = Math.pow(2, pow);
		this.canvas.height = Math.pow(2, pow);

		const ratio = Math.min(this.canvas.height / this.image.height, this.canvas.width / this.image.width);

		this.ctx.drawImage(this.image, 0, 0, this.image.width * ratio, this.image.height * ratio);
		this.needsUpdate = true;
	}

	loadListener() {
		let pow = 2;
		while (Math.pow(2, pow) < Math.max(this.frames[0].width, this.frames[0].height)) {
			pow++;
		}
		this.canvas.width = Math.pow(2, pow);
		this.canvas.height = Math.pow(2, pow);

		this.update();
	}

	dispose(frameindex) {
		if (this.frames[frameindex].disposal == 2) {
			this.ctx.clearRect(
				this.frames[frameindex].x,
				this.frames[frameindex].y,
				this.frames[frameindex].width,
				this.frames[frameindex].height);
		}

		if (this.frames[frameindex].disposal == 3) {
			for (let index = frameindex - 1; index >= 0; index--) {
				const frame = this.frames[index];
				if (frame.disposal !== 1 || index === 0) {
					if (frame.image.complete) {
						try {
							this.ctx.drawImage(frame.canvas, 0, 0);
						} catch (e) {
							console.error("There was an error re-rendering the previous frame.", frame, this.id);
						}
					}
					break;
				}
			}
		}
	}

	update() {
		this.currentFrame++;
		if (this.currentFrame >= this.frames.length) this.currentFrame = 0;

		const frame = this.frames[this.currentFrame];

		window.setTimeout(this.update.bind(this), frame.delay * 10);

		if (!frame.image.complete) return;

		if (this.currentFrame === 0) this.dispose(this.frames.length - 1)
		else this.dispose(this.currentFrame - 1);

		this.ctx.drawImage(
			frame.image,
			0,
			0);
		this.needsUpdate = true;

		if (!frame.canvas) {
			frame.canvas = document.createElement('canvas');
			frame.canvas.width = this.canvas.width;
			frame.canvas.height = this.canvas.height;
			frame.ctx = frame.canvas.getContext('2d');
			frame.ctx.drawImage(this.canvas, 0, 0);
		}
	}
}

module.exports = GIF_Instance;
