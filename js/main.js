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
    numbLevels = 3;
    // Player movement speed
    speed = 16,
    // Seconds to give the player
    startSeconds = 1000 * 200;
    // Player start position == Padding from bottom
    startPosition = height - 100,
    // Difference in height between two platforms
    platformHeightDifference = (height / 2 / numbPlatforms).toFixed(0),
    // Width of each platform and of player
    platformWidth = width / numbPlatforms,
    // Possible platform arrangements
    possiblePlatformArrangement = [[1,1,1,0,1,1,1], [1,0,1,0,1,1], [1,1,0,1,0,1], [1,0,1,0,1,0,1]];
    // On which platform to stop player jumping out of frame
    jumpUntilPlatformIndex = parseInt(numbPlatforms / 4),
    minNumbOfPlatformsBeetweenClocks = 4,
    maxNumbOfPlatformsBeetweenClocks = 12,
    numberOfPlatformImages = 4;

// Player position that is left to change
var player, xChange, yChange, framesLeft = -1, platformNumbToJump = jumpUntilPlatformIndex,
    // When was the last clock added
    lastClock = minNumbOfPlatformsBeetweenClocks;
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
		} catch (e) {
            console.log(e);
        }
	};

    this.jumpPlatform = function(numberOfPlatforms) {
        // Jump only if not already jumping
        if (framesLeft == -1) {
            console.log('Jumping {0} platforms'.format(numberOfPlatforms));
            // Create new platforms
            if (platformNumbToJump == 0) {
                for (var i = 0; i < numberOfPlatforms; i++) {

                    // If next platform types are empty, randomly select one from possiblePlatformArrangement list
                    if (currentPlatformArrangement.length == 0) {
                        var index = (Math.random()*(possiblePlatformArrangement.length - 1)).toFixed(0);
                        currentPlatformArrangement = (possiblePlatformArrangement[index]).clone();
                    }

                    var newPlatform = new Platform(currentPlatformArrangement.pop());
                    platforms.push(newPlatform);

                    // Add clock only if platform type is 1
                    if (newPlatform.type == 1 && lastClock > minNumbOfPlatformsBeetweenClocks) {
                        // If max reached add clock, else random
                        if (lastClock >= maxNumbOfPlatformsBeetweenClocks || Math.random() > 0.5) {
                            continue;
                        }
                        console.log('Adding clock with value 2');
                        newPlatform.addObject(2);
                        lastClock = 0;
                    }
                    lastClock += 1;
                }
            }
            // How much will player actually move each frame
            xChange = player.moveX * numberOfPlatforms;
            yChange = player.moveY * numberOfPlatforms;
            framesLeft = speed;

            currentPlatformIndex += numberOfPlatforms;
        }
    };

    this.move = function() {
        console.log('Moving player.');
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
    console.log('New platform');
    // Platform type: 0->Empty, 1->Full
    this.type = type;

    // Platform size
	this.width = platformWidth;
	this.height = height;

    // Platform position
    var index = platforms.length;
	this.x = index * this.width;
	this.y = startPosition - index * platformHeightDifference;

    // currentLevel
    var currentLevel = (parseInt(currentPlatformIndex) / 10).toFixed(0) % numbLevels + 1;

    this.color = '{0}_platform_{1}'.format(currentLevel, currentPlatformNumber);
    currentPlatformNumber ++;
    if (currentPlatformNumber == numberOfPlatformImages) currentPlatformNumber = 0;

	//Function to draw it
	this.draw = function() {
		try {
            if (type != 0) {
                ctx.drawImage(document.getElementById(this.color), this.x, this.y, this.width, this.height);
            }
		} catch (e) {
            console.log(e);
        }
	};

    this.object = null;
    this.hasObject = false;
    // Add object to platform
    this.addObject = function(type) {
        this.object = new Object(this, type);
        this.hasObject = true;
    };

    this.move = function() {
        console.log('Moving platforms.');
        if (framesLeft < parseInt(speed / 3)) {
            this.y -= yChange;
            if (this.hasObject) this.object.y -= yChange;
        } else {
            this.y += yChange;
            if (this.hasObject) this.object.y += yChange;
        }
        this.x -= xChange;
        if (this.hasObject) this.object.x -= xChange;
    };
}

// Object class
function Object(platform, type) {
    // Types: 2->+2 seconds
    this.type = type;
    if (type == 2) this.image = 'stopwatch2';
    this.width = platformWidth - 20;
    this.height = 40;

    this.x = platform.x + 10;
    this.y = platform.y - this.height;

    this.draw = function() {
		try {
            ctx.drawImage(document.getElementById(this.image), this.x, this.y, this.width, this.height);
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
            console.log('Jump completed');

            // Remove old platforms
            while (platforms.length > numbPlatforms) { console.log('Removing platform'); platforms.shift(); }
            // Fix user and platforms positions if necessary (in case of variations)
            fixPositions();

            framesLeft = -1;
            console.log('-------------------------');
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
        console.log('Fixing position');
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
        platforms.forEach(function(p) {
            p.draw();
            if (p.hasObject) p.object.draw();
        });

        // Draw player
        playerCalculation();

        // Is platform empty
        if (platforms[jumpUntilPlatformIndex].type == 0 || millisecondsLeft <= 0) {
            player.isDead = true;
            gameOver();
        } else if (platforms[jumpUntilPlatformIndex].hasObject) {
            console.log('Picked object, adding {0} seconds.'.format(platforms[jumpUntilPlatformIndex].object.type));
            // If platforms has a clock object add time to player
            millisecondsLeft += 1000 * platforms[jumpUntilPlatformIndex].object.type;
            platforms[jumpUntilPlatformIndex].hasObject = false;
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
    currentPlatformIndex = 1;
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