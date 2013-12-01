// RequestAnimFrame: a browser API for getting smooth animations
window.requestAnimFrame = (function() {
	return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
	function(callback) {
		window.setTimeout(callback, 1000 / 60);
	};
})();

// Prototype functions
Array.prototype.clone = function() { return this.slice(0); };
String.prototype.format = function() {
    var f = this;
    for (var i = 0; i < arguments.length; i++) {
        f = f.replace(new RegExp('\\{'+i+'\\}', 'gi'), arguments[i]);
    }
    return f;
};

// Height and width of canvas
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var width = 420.0,
    height = 560.0;
canvas.width = width;
canvas.height = height;

// Settings for the game
// Number of platforms per frame
var numbPlatforms = 5,
    // Player movement speed
    speed = 20,
    // Seconds to give the player
    startSeconds = 1000 * 200;
    // Player start position == Padding from bottom
    startPosition = height - 100,
    // Difference in height between two platforms
    platformHeightDifference = (height / 2 / numbPlatforms).toFixed(0),
    // Width of each platform and of player
    platformWidth = width / numbPlatforms,
    // Possible platform arrangements
    possiblePlatformArrangement = [[1,1,1,1]],//[[1,1,1,0,1,1,1], [1,0,1,0,1,1], [1,1,0,1,0,1], [1,0,1,0,1,0,1]];
    // On which platform to stop player jumping out of frame
    jumpUntilPlatformIndex = parseInt(numbPlatforms / 4);

// Player position that is left to change
var player, xChange, yChange, framesLeft, platformNumbToJump = jumpUntilPlatformIndex;
var Player = function() {
	this.isDead = false;
    // Player object size (square)
	this.width = this.height = platformWidth;

    // Player position
	this.x = 0;
	this.y = startPosition - this.height;

    // Player changes per one jump
    this.moveX = platformWidth / speed;
    this.moveY = platformHeightDifference * 2 / speed;

	//Function to draw it
	this.draw = function() {
		try {
            ctx.drawImage(document.getElementById('player'), this.x, this.y, this.width, this.height);
		} catch (e) {}
	};

    this.jumpPlatform = function(numberOfPlatforms) {
        console.log('Jumping {0} platforms'.format(numberOfPlatforms));
        // Create new platforms
        if (platformNumbToJump == 0) {
            for (var i = 0; i < numberOfPlatforms; i++){
                platforms.push(
                    new Platform(currentPlatformArrangement.pop())
                );
            }
        }

        // How much will player actually move each frame
        xChange = player.moveX * numberOfPlatforms;
        yChange = player.moveY * numberOfPlatforms;
        framesLeft = speed;

        currentPlatformIndex += numberOfPlatforms;
    };

    this.move = function() {
        // Fall down
        if (framesLeft < parseInt(speed / 3)) { this.y += yChange; }
        // Jump up
        else { this.y -= yChange; }
        this.x += xChange;
    }
};

//Platform class
var platforms,
    // Index number of the platform the player is currently on
    currentPlatformIndex, currentPlatformArrangement;
function Platform(type) {
    // Platform size
	this.width = platformWidth;
	this.height = height;

    // Platform position
    var index = platforms.length;
	this.x = index * this.width;
	this.y = startPosition - index * platformHeightDifference;

    // Platform type: 0->Empty, 1->Full
    this.type = type;
    switch (this.type) {
        case 0: this.color = 'rgba(0,0,0,0.0)'; break;
        case 1: this.color = '#' + Math.random().toString(16).substr(-6);
    }

	//Function to draw it
	this.draw = function() {
		try {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
		} catch (e) {}
	};

    this.move = function() {
        if (framesLeft < parseInt(speed / 3)) { this.y -= yChange; }
        else { this.y += yChange; }
        this.x -= xChange;
    }
}

function init() {
	//Player related calculations and functions
	function playerCalculation() {
        if (framesLeft > 0) {
            if (platformNumbToJump == 0) {
                // Move platforms on each jump to the left and down
                platforms.forEach(function(p) { p.move(); });
            } else {
                player.move();
            }
            framesLeft --;
        } else if (framesLeft == 0) {
            // Fix user and platforms positions if necessary (in case of variations)
            fixPositions();
            // Remove old platforms
            while (platforms.length > numbPlatforms) { platforms.shift(); }
            framesLeft = -1;
        }

		//Adding keyboard controls
		document.onkeydown = function(e) {
            switch (e.keyCode) {
                case 39: player.jumpPlatform(1); break;
                case 37: player.jumpPlatform(2);
            }
		};
        player.draw();
	}

    function fixPositions () {
        // Fix player position else platforms
        if (platformNumbToJump > 0) {
            player.x = platformWidth * jumpUntilPlatformIndex;
            player.y = startPosition - jumpUntilPlatformIndex * (platformHeightDifference) - player.height;
            platformNumbToJump --;
        } else {
            var index = 0;
            platforms.forEach(function(p, i) {
                // Skip platforms that are out of the frame
                if (i < platforms.length - numbPlatforms) return;
                p.x = platformWidth * index;
                p.y = startPosition - parseInt(platformHeightDifference) * index;
                index ++;
            });
        }
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
        if (platforms[jumpUntilPlatformIndex].type == 0 || millisecondsLeft <= 0) {
            player.isDead = true;
            gameOver();
        }

        // If next platform types are empty, randomly select one from possiblePlatformArrangement list
        if (currentPlatformArrangement.length == 0) {
            var index = (Math.random()*(possiblePlatformArrangement.length - 1)).toFixed(0);
            currentPlatformArrangement = (possiblePlatformArrangement[index]).clone();
        }

        // Update score
        var scoreText = document.getElementById('score');
        scoreText.innerHTML = currentPlatformIndex.toString();
	}

	function animloop() {
        // If player dead don't animate
        if (player.isDead) {
            platforms.forEach(function(p, i) {
                p.height = height + i * platformHeightDifference;
                p.y -= 3;
            });
        }
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

// --------------------------- Stopwatch ---------------------------
var millisecondsLeft, seconds, countDownInterval;
function CountDown () {
	millisecondsLeft -= 100;
    seconds = parseInt(millisecondsLeft / 1000);
	document.getElementById('stopwatch').innerHTML = (seconds < 10 ? '0' : '') + seconds + ':' + millisecondsLeft % 1000 / 100;
}

function newGame() {
    // Reset all variables
    player = new Player();
    platforms = [];
    for (var i = 0; i < numbPlatforms; i++) platforms.push(new Platform(1));
    currentPlatformIndex = 0;
    currentPlatformArrangement = [];
    millisecondsLeft = startSeconds;
    countDownInterval = setInterval(CountDown, 100);
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
	document.getElementById('gameOverScore').innerHTML = 'You scored {0} points!'.format(currentPlatformIndex);
}

function menuLoop() {
	requestAnimFrame(menuLoop);
}
menuLoop();