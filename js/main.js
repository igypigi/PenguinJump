// RequestAnimFrame: a browser API for getting smooth animations
window.requestAnimFrame = (function() {
	return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
	function(callback) {
		window.setTimeout(callback, 1000 / 60);
	};
})();
// Prototype functions
Array.prototype.clone = function() { return this.slice(0); };

// Height and width of canvas
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var width = 422,
    height = 552;
canvas.width = width;
canvas.height = height;

// Settings for the game
// Number of platforms per frame
var numbPlatforms = 6,
    // Difference in height between two platforms
    platformHeightDifference = height / 2 / numbPlatforms,
    // Player start position == Padding from bottom
    startPosition = height - 100,
    // Width of each platform and of player
    platformWidth = width / numbPlatforms,
    // Possible platform arrangements
    possiblePlatformArrangement = [[1,1,1,0,1,1,1], [1,0,1,0,1,1], [1,1,0,1,0,1], [1,0,1,0,1,0,1]],
    // On which platform to stop player jumping out of frame
    jumpUntilPlatformIndex = 1;

//Variables for the game
var platforms,
	player,
    // Index number of the platform the player is currently on
    currentPlatformIndex,
    currentPlatformArrangement;

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

    this.jumpOnePlatform = function() {
        console.log('Jump one platform');
        // Stop the player on first platform to avoid jumping out of frame
        if (currentPlatformIndex++ < jumpUntilPlatformIndex) {
            player.x += player.width;
            player.y -= platformHeightDifference;
            return;
        }
        // Move platforms on each jump to the left
        platforms.forEach(function(p, i) {
            p.x -= player.width;
            p.y += platformHeightDifference;
        });
        // Remove first platform
        platforms.shift();
        // Add next one
        platforms.push(new Platform(numbPlatforms-1, currentPlatformArrangement.pop()));
    };

    this.jumpTwoPlatforms = function() {
        console.log('Jump two platforms');
        this.jumpOnePlatform();
        this.jumpOnePlatform();
    };
};

//Platform class
function Platform(index, type) {
    // Platform size
	this.width = platformWidth;
	this.height = height;

    // Platform position
	this.x = index * this.width;
	this.y = startPosition - index * platformHeightDifference;

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
            ctx.fillRect(this.x, this.y, this.width, this.height);
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
                case 39: player.jumpOnePlatform(); break;
                case 37: player.jumpTwoPlatforms();
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
        if (platforms[jumpUntilPlatformIndex].type == 0) {
            player.isDead = true;
            gameOver();
        }

        // Update score
        var scoreText = document.getElementById('score');
        scoreText.innerHTML = currentPlatformIndex.toString();
	}

	function animloop() {
        // If player dead don't animate
        if (player.isDead) return;
		update();
		requestAnimFrame(animloop);
	}
    animloop();
	hideMenu();
}

function showScoreBoard() {
    document.getElementById('scoreBoard').style.zIndex = 1;
}

function hideScoreBoard() {
    document.getElementById('scoreBoard').style.zIndex = -1;
}

function newGame() {
    // Reset or variables
    player = new Player();
    platforms = [];
    for (var i = 0; i < numbPlatforms; i++) platforms.push(new Platform(i, 1));
    currentPlatformIndex = 0;
    currentPlatformArrangement = [];
    showScoreBoard();
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
    hideScoreBoard();
    hideMenu();
	document.getElementById('gameOverMenu').style.zIndex = 1;
	document.getElementById('gameOverScore').innerHTML = 'You scored ' + currentPlatformIndex + ' points!';
}

function menuLoop() {
	requestAnimFrame(menuLoop);
}
menuLoop();