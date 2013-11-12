// RequestAnimFrame: a browser API for getting smooth animations
window.requestAnimFrame = (function() {
	return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
	function(callback) {
		window.setTimeout(callback, 1000 / 60);
	};
})();

Array.prototype.clone = function() { return this.slice(0); };

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var width = 422, height = 552;
canvas.width = width;
canvas.height = height;

//Variables for game
var platforms,
	player,
    currentPlatformIndex,
    numbPlatforms = 6,
    platformHeight = height / 2 / numbPlatforms,
    startPosition = height - 100,
    platformWidth = width / numbPlatforms,
    possiblePlatformArrangement = [[1,1,1,0,1,1,1], [1,0,1,0,1,1], [1,1,0,1,0,1], [1,0,1,0,1,0,1]],
    currentPlatformArrangement = [];

//Player object
var Player = function() {
	this.isDead = false;
    // Player object size (square)
	this.width = this.height = platformWidth;

    // Player position
	this.x = 0;
	this.y = startPosition - this.height;

	//Function to draw it
	this.draw = function() {
		try {
            ctx.drawImage(document.getElementById('player'), this.x, this.y, this.width, this.height);
		} catch (e) {}
	};

    this.jumpOne = function() {
        if (currentPlatformIndex++ < 1) {
            player.x += player.width;
            player.y -= platformHeight;
        }

        // Move platforms on each jump
        platforms.forEach(function(p, i) {
            p.x -= player.width;
            p.y += platformHeight;
        });
        // Remove first platform
        platforms.shift();
        // Add next one
        platforms.push(new Platform(numbPlatforms-1, currentPlatformArrangement.pop()));
    };

    this.jumpTwo = function() {
        this.jumpOne();
        this.jumpOne();
    };
};

//Platform class
function Platform(index, type) {
    // Platform size
	this.width = platformWidth;
	this.height = platformHeight;

    // Platform position
	this.x = index * this.width;
	this.y = startPosition - index*this.height;

    // Platform type: 0->Empty, 1->Full
    this.type = type;
    switch (this.type){
        case 0: this.color = 'rgba(0,0,0,0.0)'; break;
        case 1: this.color = '#' + Math.random().toString(16).substr(-6);
    }

	//Function to draw it
	this.draw = function() {
		try {
            ctx.fillStyle=this.color;
            ctx.fillRect(this.x, this.y, this.width, height);
		} catch (e) {}
	};
}

function init() {
	//Player related calculations and functions
	function playerCalculation() {
        // If next platform types are empty, randomly select one from possiblePlatformArrangement list
        if (currentPlatformArrangement.length == 0) {
            var index = (Math.random()*(possiblePlatformArrangement.length - 1)).toFixed(0);
            currentPlatformArrangement = (possiblePlatformArrangement[index]).clone();
        }
		//Adding keyboard controls
		document.onkeydown = function(e) {
            switch (e.keyCode) {
                case 39: player.jumpOne(); console.log('Jump one'); break;
                case 37: player.jumpTwo(); console.log('Jump two');
            }
		};
        player.draw();
	}

	//Function to update everything
	function update() {
        //Function for clearing canvas in each consecutive frame
        ctx.clearRect(0, 0, width, height);

        // Draw platforms
        platforms.forEach(function(p, i) {
            p.draw();
        });

        // Draw player
        playerCalculation();

        // Is platform empty
        if (platforms[1].type == 0) {
            player.isDead = true;
            gameOver();
        }

        // Update score
        var scoreText = document.getElementById('score');
        scoreText.innerHTML = currentPlatformIndex.toString();
	}

	function animloop() {
        // If player dead don't update
        if (player.isDead) return;
		update();
		requestAnimFrame(animloop);
	}
    animloop();
	hideMenu();
}

function newGame() {
    player = new Player();
    platforms = [];
    for (var i = 0; i < numbPlatforms; i++) platforms.push(new Platform(i, 1));
    currentPlatformIndex = 0;
    currentPlatformArrangement = [];
    document.getElementById('scoreBoard').style.zIndex = 1;
    hideMenu();
    init();
}

// Hide main menu
function hideMenu() {
	document.getElementById('mainMenu').style.zIndex = -1;
}

// Show main menu
function showMenu() {
    ctx.clearRect(0, 0, width, height);
	document.getElementById('mainMenu').style.zIndex = 1;
	document.getElementById('gameOverMenu').style.zIndex = -1;
}

// Show game over menu
function gameOver() {
    document.getElementById('scoreBoard').style.zIndex = -1;
    hideMenu();
	document.getElementById('gameOverMenu').style.zIndex = 1;
	document.getElementById('gameOverScore').innerHTML = 'You scored ' + currentPlatformIndex + ' points!';
}

function menuLoop() {
	requestAnimFrame(menuLoop);
}
menuLoop();