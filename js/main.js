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
var width = window.innerWidth,
    height = window.innerHeight;

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
canvas.width = width;
canvas.height = height;

// Settings for the game
// Number of platforms per frame
var numbPlatforms = 5,
    // Player movement speed
    speed = 16,
    // Seconds to give the player
    startSeconds = 1000 * 20;

// Player start position == Padding from bottom
var startPosition = height - 200,
    // Difference in height between two platforms
    platformHeightDifference = (height / 2 / numbPlatforms).toFixed(0),
    // Width of each platform and of player
    platformWidth = width / numbPlatforms,
    // Possible platform arrangements
    possiblePlatformArrangement = [[1,1,1,0,1,1,1], [1,0,1,0,1,1], [1,1,0,1,0,1], [1,0,1,0,1,0,1]],
    // On which platform to stop player jumping out of frame
    jumpUntilPlatformIndex = 1,
    // Generate clocks between this two values
    minNumbOfPlatformsBetweenClocks = 4,
    maxNumbOfPlatformsBetweenClocks = 12;

var ocean;
function Ocean () {
    this.width = width;
    this.height = height * 2;
    this.x = 0;
    this.y = height - 50;

    this.draw = function() {
		try {
            ctx.drawImage(document.getElementById('waves'), this.x, this.y, this.width, this.height);
		} catch (e) {
            console.log(e);
        }
	};
}

// Player position that is left to change
var player, xChange, yChange, framesLeft, platformNumbToJump, buttonTwoDisabled, fallingSpeed;
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
		} catch (e) {
            console.log(e);
        }
	};

    this.jumpPlatform = function(numberOfPlatforms) {
        // Jump only if not already jumping
        if (framesLeft == -1) {
            // Create new platforms
            if (platformNumbToJump == 0) {
                for (var i = 0; i < numberOfPlatforms; i++) {
                    // If next platform types are empty, randomly select one from possiblePlatformArrangement list
                    if (currentPlatformArrangement.length == 0) {
                        var index = (Math.random()*(possiblePlatformArrangement.length - 1)).toFixed(0);
                        currentPlatformArrangement = (possiblePlatformArrangement[index]).clone();
                    }

                    var newPlatform = new Platform(currentPlatformArrangement.pop());
                    // Add clock only if platform type is 1 and last clock was added between max and min
                    if (newPlatform.type == 1 && lastClock > minNumbOfPlatformsBetweenClocks &&
                        (lastClock >= maxNumbOfPlatformsBetweenClocks || Math.random() < 0.5)) {
                        newPlatform.addObject(2);
                        lastClock = 0;
                    }
                    platforms.push(newPlatform);
                    lastClock += 1;
                }
            }
            // How much will player actually move each frame
            xChange = platformWidth / speed * numberOfPlatforms;
            yChange = platformHeightDifference * 2 / speed * numberOfPlatforms;
            framesLeft = speed;

            currentPlatformIndex += numberOfPlatforms;
        }
    };

    this.move = function() {
        // Fall down
        if (framesLeft < parseInt(speed / 3)) { this.y += yChange; }
        // Jump up
        else { this.y -= yChange; }
        this.x += xChange;
    };
};

//Platform class
var platforms,
    // Index number of the platform the player is currently on
    currentPlatformIndex = 1, currentPlatformArrangement, currentPlatformNumber = 0;
function Platform(type) {
    // Platform type: 0->Empty, 1->Full
    this.type = type;

    // Platform size
	this.width = platformWidth;
	this.height = height;

    // Platform position
	this.x = platforms.length * this.width;
	this.y = startPosition - platforms.length * platformHeightDifference;

    // Current level, number of images is 3, new level per 10 platforms
    var currentLevel = (parseInt(currentPlatformIndex) / 10).toFixed(0) % 3 + 1;

    this.backgroundImg = document.getElementById('{0}_platform_{1}'.format(currentLevel, currentPlatformNumber));
    currentPlatformNumber ++;
    // Number of platform images
    if (currentPlatformNumber == 4) currentPlatformNumber = 0;

	//Function to draw it
	this.draw = function() {
		try {
            if (type != 0) ctx.drawImage(this.backgroundImg, this.x, this.y, this.width, this.height);
            if (this.object !== null) this.object.draw();
		} catch (e) {
            console.log(e);
        }
	};

    this.object = null;
    // Add object to platform
    this.addObject = function(type) {
        this.object = new Object(this, type);
    };

    this.move = function() {
        if (framesLeft < parseInt(speed / 3)) {
            this.y -= yChange;
            if (this.object !== null) this.object.y -= yChange;
        } else {
            this.y += yChange;
            if (this.object !== null) this.object.y += yChange;
        }
        this.x -= xChange;
        if (this.object !== null) this.object.x -= xChange;
    };
}

// Object class
// When was the last clock added
var lastClock;
function Object(platform, type) {
    // Types: 2->+2 seconds
    this.type = type;
    this.image = document.getElementById('stopwatch{0}'.format(type));
    this.width = platformWidth - 20;
    this.height = this.width;

    this.x = platform.x + 10;
    this.y = platform.y - this.height;

    this.draw = function() {
		try {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
		} catch (e) {
            console.log(e);
        }
	};
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
            // Remove old platforms
            while (platforms.length > numbPlatforms) platforms.shift();
            // Fix user and platforms positions if necessary (in case of variations)
            fixPositions();
            framesLeft = -1;
        }
	}

    function fixPositions () {
        // Fix player position else platforms
        if (platformNumbToJump > 0) {
            player.x = platformWidth * jumpUntilPlatformIndex;
            player.y = startPosition - jumpUntilPlatformIndex * (platformHeightDifference) - player.height;
            platformNumbToJump --;
            // Start timer
            countDownInterval = setInterval(CountDown, 100);
            // Enable two jump button
            buttonTwoDisabled = false;
            document.getElementById('twoJump').style.background = 'rgba(0, 230, 0, 1.0)';
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

        // Draw player
        playerCalculation();
        player.draw();

        // Is platform empty
        if (platforms[jumpUntilPlatformIndex].type == 0 || millisecondsLeft <= 0) {
            player.isDead = true;
            gameOver();
        } else if (platforms[jumpUntilPlatformIndex].object !== null) {
            // If platforms has a clock object add time to player
            millisecondsLeft += 1000 * platforms[jumpUntilPlatformIndex].object.type;
            platforms[jumpUntilPlatformIndex].object = null;
        }
        ocean.draw();

        // Draw platforms
        platforms.forEach(function(p) { p.draw(); });

        // Update score
        document.getElementById('score').innerHTML = currentPlatformIndex.toString();
	}

	function animloop() {
        // Is the player in the sea?
        if (platforms[0].y <= -height) return;

        // If player dead don't animate
        if (player.isDead) {
            // If player is falling and is on the sea level lower sea
            if (platforms[0].y <= 0) ocean.y -= fallingSpeed;
            platforms.forEach(function(p, i) {
                p.object = null;
                p.height = height + i * platformHeightDifference;

                // Simulate falling
                if (fallingSpeed < 16) fallingSpeed += 2;
                p.y -= fallingSpeed;
            });
        }
        update();
		requestAnimFrame(animloop);
	}
    animloop();
	hideMenu();
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
    fallingSpeed = 2;
    framesLeft = -1;
    lastClock = minNumbOfPlatformsBetweenClocks;
    document.getElementById('twoJump').style.background = 'rgba(0, 230, 0, 0.2)';
    buttonTwoDisabled = true;
    currentPlatformIndex = 1;
    currentPlatformArrangement = [];
    millisecondsLeft = startSeconds;
    platformNumbToJump = jumpUntilPlatformIndex;
    currentPlatformNumber = 0;

    // Reset all objects
    player = new Player();
    ocean = new Ocean();
    platforms = [];
    for (var i = 0; i < numbPlatforms; i++) platforms.push(new Platform(1));

    // Show score board
    document.getElementById('scoreBoard').style.zIndex = 1;
    document.getElementById('buttons').style.zIndex = 1;
    // Hide main menu
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
    // Hide score board
    document.getElementById('scoreBoard').style.zIndex = -1;
    document.getElementById('buttons').style.zIndex = -1;
    hideMenu();
	document.getElementById('gameOverMenu').style.zIndex = 1;
	document.getElementById('gameOverScore').innerHTML = 'You scored {0} points!'.format(currentPlatformIndex);
}

function menuLoop() {
	requestAnimFrame(menuLoop);
}
menuLoop();

function playerJump (steps) {
    if (!player.isDead) {
        // If button 2 is disabled skip
        if (parseInt(steps) === 2 && buttonTwoDisabled) {
            return;
        }
        player.jumpPlatform(steps);
    }
}