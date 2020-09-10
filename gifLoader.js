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
		this.spriteSheet = document.createElement('canvas');
		this.spriteSheetContext = this.spriteSheet.getContext('2d');

		this.square = 0;
		this.current = { x: 0, y: 0 };

		if (id.match(/http/)) {
			this.url = id;
			this.imageFallback();
		} else {
			fetch(`${this.config.gifAPI}/gif/${id}`)
				.then(r => r.json())
				.then(data => {
					if (data.count === 0 || !data.count || emoteBlacklist.includes(id)) {
						this.url = `${this.config.gifAPI}/gif/${id}.gif`;
						this.imageFallback();
					} else {
						this.width = data.frames[0].width;
						this.height = data.frames[0].height;
						this.gifTiming = data.frames[0].delay;
						this.frames = data.frames;

						this.square = Math.ceil(Math.sqrt(data.frames.length));

						for (let index = 0; index < this.frames.length; index++) {
							const frame = this.frames[index];

							this.width = this.height = Math.max(
								Math.max(this.width, this.height),
								Math.max(frame.x + frame.width, frame.y + frame.height)
							);

							if (frame.delay < 1) frame.delay = 1000 / 30 / 10;

							frame.image = new Image(frame.width, frame.height);
							frame.image.crossOrigin = "";
							frame.image.addEventListener('load', () => {
								this.loadedImages++;
								if (this.loadedImages >= this.frames.length-1) {
									for (let index = 0; index < this.frames.length; index++) {
										this.frames[index].spriteSheet = false;
									}
								}
							})
							frame.image.src = `${this.config.gifAPI}/static/${id}/${index}.png`;
						}
						this.spriteSheet.height = this.height * this.square;
						this.spriteSheet.width = this.width * this.square;

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

		this.spriteSheet.width = this.canvas.width;
		this.spriteSheet.height = this.canvas.height;
		this.spriteSheetContext.drawImage(this.canvas, 0, 0);

		this.needsUpdate = true;
		this.needsSpriteSheetUpdate = true;
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

	getPosition(frameNumber) {
		return {
			x: frameNumber % this.square,
			y: Math.floor(frameNumber / this.square)
		};
		}

	updatePosition(frameNumber) {
		const pos = this.getPosition(frameNumber);
		this.current.x = pos.x;
		this.current.y = pos.y;
	}

	dispose(frameindex) {
		if (frameindex < 0) frameindex += this.frames.length;

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
					if (frame.image.complete && frame.canvas) {
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
		this.updatePosition(this.currentFrame)

		const frame = this.frames[this.currentFrame];

		if (frame.spriteSheet)
			window.setTimeout(this.update.bind(this), frame.delay * 10);
		else
			window.setTimeout(this.update.bind(this), 0);

		if (!frame.image.complete) return;

		if (this.currentFrame === 0) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
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
		if (!frame.spriteSheet) {
			this.spriteSheetContext.drawImage(this.canvas, this.current.x * this.width, this.current.y * this.height);
			frame.spriteSheet = true;
			this.needsSpriteSheetUpdate = true;
		}
	}
}

module.exports = GIF_Instance;
