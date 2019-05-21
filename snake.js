/*  CONSTANCES   */

var ROWS_NUM = 20;
var COL_NUM = 30;
var PIX_SIZE = 16;
var LEFT = 37, UP = 38, RIGHT = 39, DOWN = 40;
var APPLE_AMOUNT = 3, APPLE_LIMIT = 10;
var BG_COLOR = [78, 96, 0]


function componentToHex(c) {
	var hex = c.toString(16);
	return hex.length === 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
	return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function Vector(x, y){
	this.x = x;
	this.y = y;
}

Vector.prototype = Object.create(null);
Vector.prototype = {
	copy: function () {
		return new Vector(this.x, this.y);
	},

	isSame: function (vector) {
		return this.x === vector.x && this.y === vector.y;
	},

	isInsideArray: function (arr) {
		for(var i = 0, l = arr.length; i < l; i++) {
			if(this.isSame(arr[i])) return true;
		}
		return false;
	},

	indexOfArray: function (arr) {
		for(var i = 0, l = arr.length; i < l; i++) {
			if(this.isSame(arr[i])) return i;
		}
		return null;
	}
};

function Snake(){
	var centerX = Math.floor((COL_NUM-1)/2);
	var centerY = Math.floor((ROWS_NUM-1)/2);
	this.alive = false;
	this.tail = [
		new Vector(centerX    , centerY),
		new Vector(centerX - 1, centerY),
		new Vector(centerX - 2, centerY)];
	this.direction = RIGHT;
	this.throughWalls = true;
	this.needless = new Vector(-1, -1); //Vector of last part which is not needed after turn
							// (useful in CanvasDisplay.prototype.draw to clear only one "pixel")
	this.apples = [];
	this.eated = [];
	for(var i  = 0; i < APPLE_AMOUNT; ++i)
		this.randomApple();
}

Snake.prototype = Object.create(null);
Snake.prototype = {
	randomApple: function () {
		var apple = new Vector(Math.floor(Math.random() * COL_NUM), Math.floor(Math.random() * ROWS_NUM));
		var length = this.apples.length;
		if (length < COL_NUM * ROWS_NUM - this.tail.length - this.eated.length	&& length < APPLE_LIMIT) {
				if (!apple.isInsideArray(this.tail) && !apple.isInsideArray(this.apples))
					this.apples.push(apple);
				else this.randomApple();
			}
	},

	update: function(){
		var newHead 	= this.tail[0].copy(),
				direction = this.direction,
				tail 			= this.tail;
		if(direction === RIGHT) newHead.x += 1;
		else if(direction === LEFT) newHead.x -= 1;
		else if(direction === UP) newHead.y -= 1;
		else if(direction === DOWN) newHead.y += 1;
		this.needless = this.tail.pop();
		this.tail.unshift(newHead);

		//Winning
		if(newHead.isSame(this.needless)) {
			//TODO auto going and disabling keys
			var shown = true;
			if(shown)console.log("you won");
		}

		//Collisions
		var head = tail[0];
		if(this.throughWalls === true){
			if(head.x >= COL_NUM) head.x = 0;
			else if(head.x < 0) head.x = COL_NUM - 1;
			if(head.y >= ROWS_NUM) head.y = 0;
			else if(head.y < 0) head.y = ROWS_NUM - 1;
		}
		if(!this.throughWalls &&(head.x >= COL_NUM || head.x < 0 || head.y >= ROWS_NUM || head.y < 0)) {
			this.alive = false;
		}
		for (var i = 1, l = tail.length; i < l; ++i) {
			if (tail[0].x === tail[i].x && tail[0].y === tail[i].y)
				this.alive = false;
			}

		//Eating event
		var index = head.indexOfArray(this.apples);
		if(index !== null){
			var apple = this.apples.splice(index, 1)[0];
			this.eated.push(apple);
			this.randomApple();
		}
		for (i = 0, l = this.eated.length; i < l; ++i){
			var elem = this.eated[i];
			if (!elem.isInsideArray(this.tail)) {
				tail.push(this.eated.splice(i, 1)[0]);
			}
		}
	}
};

function CanvasDisplay(canvas) {
	this.cx = canvas.getContext("2d");
	this.width = COL_NUM * PIX_SIZE;
	this.height = ROWS_NUM * PIX_SIZE;

	this.grid = null; //Of course we don't have to make a grid and we can just transform
															//the elements, but I find that way not consuming so much countings
	this.bgColor = "green";
	this.loaded = false;

	//Setup
	this.vect = {								// VECTORS to cut the proper element from grid image
		head_up: new Vector(0, 0),
		head_right: new Vector(0, PIX_SIZE),
		head_down: new Vector(0, 2 * PIX_SIZE),
		head_left: new Vector(0, 3 * PIX_SIZE),
		ul: new Vector(PIX_SIZE, 0), 				//shortcuts stands for up-left, up-right, down-left & down-right
		ur: new Vector(PIX_SIZE, PIX_SIZE),
		dl: new Vector(PIX_SIZE, 2 * PIX_SIZE),
		dr: new Vector(PIX_SIZE, 3 * PIX_SIZE),
		norm_v: new Vector(2 * PIX_SIZE, 0),		//normal body horizontal & vertical
		norm_h: new Vector(2 * PIX_SIZE, PIX_SIZE),
		tail_up: new Vector(3 * PIX_SIZE, 0),
		tail_right: new Vector(3 * PIX_SIZE, PIX_SIZE),
		tail_down: new Vector(3 * PIX_SIZE, 2 * PIX_SIZE),
		tail_left: new Vector(3 * PIX_SIZE, 3 * PIX_SIZE),
		apple: new Vector(2 * PIX_SIZE, 3 * PIX_SIZE),
		eated: new Vector(2 * PIX_SIZE, 2 * PIX_SIZE)
	};

	canvas.width = this.width;
	canvas.height = this.height;
}

CanvasDisplay.prototype = Object.create(null);
CanvasDisplay.prototype = {
	drawElement: function (displayVector, tailVector) {
		this.cx.drawImage(this.grid, displayVector.x, displayVector.y, PIX_SIZE, PIX_SIZE,
			tailVector.x * PIX_SIZE, tailVector.y * PIX_SIZE, PIX_SIZE, PIX_SIZE);
	},

	firstDraw: function (snake) {
		this.cx.fillStyle = this.bgColor;
		this.cx.fillRect(0, 0, this.width, this.height);
		this.drawElement(this.vect.head_right, snake.tail[0]);
		for(var i = 1, l = snake.tail.length; i < l; ++i)
			this.drawElementIndex(snake.tail, i);

		this.drawApples(snake);
	},

	draw: function (snake) {
		// this.cx.translate(element.x * PIX_SIZE + PIX_SIZE / 2, element.y * PIX_SIZE + PIX_SIZE / 2);
		// this.cx.rotate(angle);
		this.clearEnd(snake.needless);	//CLEAR LAST ELEMENT
		this.drawElementIndex(snake.tail, 1);	//REDRAW 2nd ELEMENT
		snake.eated.forEach(function (elem) {
			this.drawElement(this.vect.eated, elem);
		}, this);

		this.drawElementIndex(snake.tail, snake.tail.length - 1);	//DRAW LAST ELEMENT
		this.drawApples(snake);

		var head = snake.tail[0];
		var head_vect = null;
		if(snake.direction === RIGHT) head_vect = this.vect.head_right;
		else if(snake.direction === LEFT) head_vect = this.vect.head_left;
		else if(snake.direction === DOWN) head_vect = this.vect.head_down;
		else head_vect = this.vect.head_up;
		this.drawElement(head_vect, head);	//DRAW NEW HEAD
	},

	clearEnd: function (lastElement) {
		this.cx.fillStyle = this.bgColor;
		this.cx.fillRect(lastElement.x * PIX_SIZE, lastElement.y * PIX_SIZE, PIX_SIZE, PIX_SIZE);
	},

	drawApples: function (snake) {
		var apples = snake.apples;
		for (var i = 0, l = apples.length; i < l; i++) {
			this.drawElement(this.vect.apple, apples[i]);
		}
	},

	drawElementIndex: function (tailArray, index) {
			var relation = "";																	//That works ONLY on grid at least 3x3 pixel sizes;
			var prev = tailArray[index - 1], mid = tailArray[index], next = tailArray[index + 1];
			if(next) {
				if (prev.x === next.x) relation = "norm_v";
				else if (prev.y === next.y) relation = "norm_h";
				else if (prev.x === mid.x) {
					if (prev.y > mid.y && Math.abs(prev.y - mid.y) <= 1 ||
						prev.y < mid.y && Math.abs(prev.y - mid.y) > 1) relation += "d";
					else relation += "u";
					if (mid.x > next.x && Math.abs(mid.x - next.x) <= 1 ||
						mid.x < next.x && Math.abs(mid.x - next.x) > 1) relation += 'l';
					else relation += 'r';
				}
				else {
					if (mid.y > next.y && Math.abs(mid.y - next.y) <= 1 ||
						mid.y < next.y && Math.abs(mid.y - next.y) > 1) relation += "u";
					else relation += "d";
					if (prev.x > mid.x && Math.abs(mid.x - prev.x) <= 1 ||
						prev.x < mid.x && Math.abs(mid.x - prev.x) > 1) relation += 'r';
					else relation += 'l';
				}
			}
			else {
				if(mid.x === prev.x) {
					if(mid.y > prev.y && Math.abs(mid.y - prev.y) <= 1 ||
						mid.y < prev.y && Math.abs(mid.y - prev.y) > 1) relation = "tail_up";
					else relation = "tail_down";
				}
				else {
					if(mid.x > prev.x && Math.abs(mid.x - prev.x) <= 1 ||
						mid.x < prev.x && Math.abs(mid.x - prev.x) > 1) relation = "tail_left";
					else relation = "tail_right";
				}
			}
			var vector = this.vect[relation];
			if(vector) this.drawElement(vector, mid);
			else return null;
	}
};

var Menu = function (id) {
	var name = id ? id : "menu";
	this.node = document.getElementById(name);
	this.hidden = false;
	this.buttons = [];
	var buttons = document.getElementById('buttons').childNodes;
	for(var i = 0, l = buttons.length; i < l; ++i) {
		if(buttons[i].nodeType === Node.ELEMENT_NODE) {
			this.buttons.push(buttons[i]);
		}
	}
	if(name === "menu") this.continue = document.getElementById("continue-btn");
	this.saveButton = document.getElementById("save-settings");
	this.settings = false; //if settings showed or not
	this.switchButtons(true);
};

Menu.prototype = Object.create(null);
Menu.prototype = {
	switchButtons: function (value) {
	var display = value ? "block" : "none";
	for(var i = 0, l = this.buttons.length; i < l; ++i) {
		this.buttons[i].disabled = !value;
		this.buttons[i].style.display = display;
		}
	},

	enableContinue: function (value) {
		this.continue.disabled = !value;
	},

	show: function () {
		this.node.className = "show";
		this.hidden = false;
		this.switchButtons(true);
	},

	hide: function () {
		this.node.className = "hidden";
		this.hidden = true;
		this.switchButtons(false);
	},

	toggleView: function () {
		this.node.className = this.hidden ? "show" : "hidden";
		this.hidden = !this.hidden;
		return !this.hidden; //Information for game if pause or not
	},

	toggleSettings: function () {
		if (this.settings) {
			this.saveButton.disabled = true;
			this.node.className = "show settings_off";
			this.settings = false;
		}
		else {
			this.saveButton.disabled = false;
			this.node.className = "settings_on";
			this.settings = true;
		}
	}
};

function Game(snake, display) {
	this.snake = snake;
	this.display = display;

	this.paused = false;
	this.stepTime = 100;
	this.wasStep = false;   //Prevents making quick change to opposite direction (used in Game.prototype.run())
	 						// (e.g. direction now is RIGHT and we press right after another UP and LEFT

	var pic	 = new Image(),
			self = this, //document.getElementById("snake-grid-norm");
			snakeDiv = document.getElementById("snake-div");
	snakeDiv.style.height = display.height + "px";
	snakeDiv.style.width = display.width + "px";

	pic.src = "img/snake_grid_bg.png";
	pic.addEventListener("load", function () {
		console.log("load");
		self.display.grid = pic;
		self.display.cx.drawImage(self.display.grid, 2 * PIX_SIZE, 2 * PIX_SIZE, 1, 1, 0, 0, 1, 1); //Setting background from grid image
		self.display.bgColor = rgbToHex(BG_COLOR[0], BG_COLOR[1], BG_COLOR[2]);
		self.display.firstDraw(self.snake);
	}, false); //Synchronic

	this.menu = new Menu();
	this.menu.enableContinue(false);
	this.menu.node.style.width = display.width + "px";
	this.menu.node.style.height = display.height * 2 + "px";

	this.menu.saveButton.parentNode.addEventListener("submit", function (event) {
		for(var i = 0, l = event.target.length; i < l; ++i){
			var field = event.target[i];
			if(field.name === "difficulty" && field.checked){
				self.stepTime = Number(field.value);
				if(self.timer) clearInterval(self.timer);
				if(self.snake.alive) self.timer = setInterval(function () {
					self.step();
				}, self.stepTime);
			}
			else if(field.name === "walls") {
				self.snake.throughWalls = field.checked;
			}
		}
		self.menu.toggleSettings();
		event.preventDefault();
	});

	this.timer = null;
	this.enableKeys();
}

Game.prototype = Object.create(null);
Game.prototype = {
	enableKeys: function () {
		var self = this; // lastTime = null;
		document.addEventListener("keydown", function (event) {
			if(event.keyCode === RIGHT && self.snake.direction != LEFT && self.wasStep){
				self.snake.direction = RIGHT;
				self.wasStep = false;
				event.preventDefault();
			}
			else if(event.keyCode === LEFT && self.snake.direction != RIGHT && self.wasStep){
				self.snake.direction = LEFT;
				self.wasStep = false;
				event.preventDefault();
			}
			else if(event.keyCode === UP && self.snake.direction != DOWN && self.wasStep){
				self.snake.direction = UP;
				self.wasStep = false;
				event.preventDefault();
			}
			else if(event.keyCode === DOWN && self.snake.direction != UP && self.wasStep){
				self.snake.direction = DOWN;
				self.wasStep = false;
				event.preventDefault();
			}
			else if(event.keyCode === 27) { //Escape button
				if(self.menu.settings) {
					self.menu.node.className = "settings_off";
					self.menu.settings = false;
				}
				else if(self.snake.alive) {
					// if (!self.lastTime) self.lastTime = Date.now();
					if (Date.now() - self.lastTime >= 600 ) {
						if (self.paused) {
							var paused = self.menu.toggleView();
							setTimeout(function () {
								self.paused = paused;
								self.menu.switchButtons(false);
							}, 600);
						}
						else {
							self.paused = self.menu.toggleView();
							self.menu.switchButtons(true);
						}
						self.lastTime = Date.now();
					}
				}
				event.preventDefault();
			}
		});
	},

	run: function () {
		var self = this;
		if(this.snake.alive) {
			this.timer = setInterval(function () {
				self.step();
			}, this.stepTime);
		}
		// else clearInterval(this.timer);
	},

	step: function () {
		if(this.snake.alive) {
			if(!this.paused) {
				this.snake.update();
				this.display.draw(this.snake);
				this.wasStep = true;
			}
		}
		else {
			//todo show dialog game over and name for highscores

			clearInterval(this.timer);
			this.menu.show();
			this.menu.enableContinue(false);
		}
	},

	newGame: function () {

		if(!game.snake.alive || window.confirm("Do you really want to leave? All progress will be lost.")) {
			this.snake = new Snake();
			this.display.firstDraw(this.snake);
			this.snake.alive = true;
			this.menu.hide();
			this.paused = true;
			clearInterval(this.timer);
			var self = this;
			this.timer = setInterval(function () {
				self.step();
			}, this.stepTime);
			this.lastTime = Date.now();

			setTimeout(function () {
				self.paused = false;
			}, 800);
		}
	},

	continue: function () {
		this.paused = false;
		this.menu.hide();
	}
};


///		APP
function run() {
	snake.alive = true;
	clearInterval(game.timer);
	game.run();
	game.menu.hide();
}

var snake = new Snake();
var canvas = document.getElementById("snake-canvas");
var canvasDisplay = new CanvasDisplay(canvas);
var game = new Game(snake, canvasDisplay);

function slideDown() {
	game.menu.toggleSettings();
}
function exit() {
	console.log("foo, foo, bastards");
}
