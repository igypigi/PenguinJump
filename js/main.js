// RequestAnimFrame: a browser API for getting smooth animations
window.requestAnimFrame = (function() {
	return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
	function(callback) {
		window.setTimeout(callback, 1000 / 60);
	};
})();
// Prototype functions
Array.prototype.clone = function() { return this.slice(0); };

// Frames per seconds
var fps = {
    current: 0,
    last: 0,
    lastUpdated: Date.now(),
    draw: function() {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, 100, 25);
        ctx.font = '12pt Arial';
        ctx.fillStyle = '#000';
        ctx.textBaseline = 'top';
        ctx.fillText(fps.last + 'fps', 5, 5);
    },
    update: function() {
        fps.current ++;
        if (Date.now() - fps.lastUpdated >= 1000) {
            fps.last = fps.current;
            fps.current = 0;
            fps.lastUpdated = Date.now();
        }
    }
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
    // Difference in height between two platforms
    platformHeightDifference = (height / 2 / numbPlatforms).toFixed(0),
    // Player start position == Padding from bottom
    startPosition = height - 100,
    // Width of each platform and of player
    platformWidth = width / numbPlatforms,
    // Possible platform arrangements
    possiblePlatformArrangement = [[1,1,1,1]],//[[1,1,1,0,1,1,1], [1,0,1,0,1,1], [1,1,0,1,0,1], [1,0,1,0,1,0,1]];
    // On which platform to stop player jumping out of frame
    jumpUntilPlatformIndex = parseInt(numbPlatforms / 4),
    // Player movement speed
    speed = 20,
    platformsInCache = 10;

//Variables for the game
var platforms,
	player,
    // Index number of the platform the player is currently on
    currentPlatformIndex,
    currentPlatformArrangement;

// Player position that is left to change
var xChange, yChange, framesLeft, platformNumbToJump = jumpUntilPlatformIndex;
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
        // Create new platforms
        if (platformNumbToJump == 0) {
            for (var i = 0; i < numberOfPlatforms; i++){
                platforms.push(
                    new Platform(numbPlatforms + i, currentPlatformArrangement.pop())
                );
            }
        }

        console.log('Jump one platform');
        // How much will player actually move each frame
        xChange = player.moveX * numberOfPlatforms;
        yChange = player.moveY * numberOfPlatforms;
        framesLeft = speed;
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
}

function init() {
	//Player related calculations and functions
	function playerCalculation() {
        if (framesLeft > 0) {
            if (platformNumbToJump == 0) {
                // Move platforms on each jump to the left and down
                platforms.forEach(function(p, i) {
                    if (framesLeft < parseInt(speed / 3)) { p.y -= yChange; }
                    else { p.y += yChange; }
                    p.x -= xChange;
                });
            } else {
                // Fall down
                if (framesLeft < parseInt(speed / 3)) { player.y += yChange; }
                // Jump up
                else { player.y -= yChange; }
                player.x += xChange;
            }
            framesLeft --;
        } else if (framesLeft == 0) {
            // Fix user and platforms positions if necessary (in case of variations)
            fixPositions();
            // Remove old platforms
            while (platforms.length > platformsInCache) { platforms.shift(); }
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
        if (platforms[jumpUntilPlatformIndex].type == 0) {
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
        fps.update();
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
        fps.draw();
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