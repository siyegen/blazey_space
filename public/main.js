(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = Camera;
// need a better pattern here
function Camera(startPos, wView, hView, ctx) {
  this.direction = {x: 0, y: 0};
  this.x = startPos.x;
  this.y = startPos.y;
  this.width = wView;
  this.height = hView;
  this.scale = 1;

  this.toWorld = function(clientX, clientY) {
    return [
      clientX/this.scale - ((wView/this.scale/2) - this.x),
      clientY/this.scale - ((hView/this.scale/2) - this.y)
    ]
  };

  this.zoom = function() {
    if (this.scale == 1) {
      this.scale = 0.75;
    } else {
      this.scale = 1;
    }
  };

  this.update = function(mod) {
    if (this.direction.x == 1) {
      this.x += 5;
    }
    if (this.direction.x == -1) {
      this.x -= 5;
    }
    if (this.direction.y == 1) {
      this.y += 5;
    }
    if (this.direction.y == -1) {
      this.y -= 5;
    }
  };

  this.render = function() {
    // Apply the scale first
    ctx.scale(this.scale, this.scale);
    // Move the scene, in relation to the middle of the viewport ()
    ctx.translate(this.width/this.scale/2 - this.x, (this.height/this.scale/2) - this.y);
  };

  this.inside = function(x, y, width, height) {
    // target x + 1/2 width of target should be great than left bound
    // left bound = camera.x (center) - width/2
    // width should be / by scale
    if (x + width/2/this.scale > this.x - ((this.width/this.scale)/2)
      && x - width/2/this.scale < this.x + ((this.width/this.scale)/2)) {
      if (y + height/2/this.scale > this.y - ((this.height/this.scale)/2)
        && y - height/2/this.scale < this.y + ((this.height/this.scale)/2)) {
        return true
      }
    }
    return false
  };
}


},{}],2:[function(require,module,exports){
console.log("Hello!");

var bgStars = new Image();
bgStars.src = "images/star-bg-big.png";

var Ship = require('./ship.js');
var util = require('./util.js');
var Camera = require('./camera.js');

function Level(width, height, ctx) {
  var tileSize = 96;
  var hLines = Math.floor(height / ((Math.sqrt(3)/2)*tileSize)); // run left to right
  var vLines = Math.floor(width / (tileSize*0.75)); // run top to bottom
  var mSqrt = 0.866;
  var yCenter = (Math.sqrt(3)/2)*tileSize;
  var highlightedColumn = null;
  console.info("lines", hLines, vLines);
  // use to position grid, has *bounds*
  // has titled bg info as well.

  this.highlightCol = function(column) {
    highlightedColumn = column;
  };

  this.findHex = function(worldTarget) {
    console.debug(worldTarget[0], worldTarget[1]);
    var cx = worldTarget[0];
    var colMajor = Math.floor(cx/(tileSize*0.75));
    var colMinor;
    // Same as x comp of corners, also don't need all of these
    var leftLeftB = colMajor * tileSize * 0.75;
    var leftRightB = leftLeftB + tileSize/4;
    var middleLeftB = leftRightB;
    var middleRightB = middleLeftB + tileSize/2;
    var rightLeftB = middleRightB;
    var rightRightB = middleRightB + tileSize/4;

    if (cx > leftLeftB && cx <= leftRightB) {
      colMinor = -1;
    } else if (cx > middleLeftB && cx <= middleRightB) {
      colMinor = 0;
    } else if (cx > rightLeftB && cx <= rightRightB) {
      colMinor = 1;
    }

    console.debug("col pos", colMajor, colMinor);
    return colMajor;
  };

  this.render = function() {
    ctx.drawImage(bgStars, 0, 0, width, height);
    for(var i=0; i<vLines; i++) { // x pos
      var offset = (i % 2 == 0 ? 0 : yCenter/2);
      for(var j=0; j<hLines; j++) { // y pos
        ctx.beginPath();
        ctx.strokeStyle = "rgba(0, 203, 255, 0.5)";
        ctx.fillStyle = "none";
        drawHex({x:(tileSize/2)+(i*tileSize*0.75), y:(j+0.5)*(yCenter)+offset});
        if (i == highlightedColumn) {
          ctx.fillStyle = 'rgba(250, 203, 255, 0.3)';
          ctx.fill();
        }
        ctx.fillStyle="rgba(220, 120, 50, 0.7)";
        var xOffset = ctx.measureText(i+", "+j).width;
        ctx.fillText(i+", "+j, ((tileSize/2)+(i*tileSize*0.75)-xOffset/2), (j+0.5)*(yCenter)+offset);
        ctx.stroke()
      }
    }
  }
  var drawHex = function(center) {
    var currHex = hexCorner([center.x, center.y], tileSize/2, 0);
    ctx.moveTo(currHex[0], currHex[1]);
    for(var i=1; i<=6; i++) {
      currHex = hexCorner([center.x, center.y], tileSize/2, i);
      ctx.lineTo(currHex[0], currHex[1]);
    }
  };

  var hexCorner = function(center, size, i) {
    return [
      Math.round(center[0] + size * Math.cos(i * 2 * Math.PI / 6)),
      Math.round(center[1]+ size * Math.sin(i * 2 * Math.PI / 6))
    ];
  };
}

function Game() {
  // Private gamestate
  var ALL_CONTEXTS = {
    SHIP: 'ship',
    SPACE: 'space'
  };
  var mouseCodes = {
    '1': 'LEFTCLICK',
    '3': 'RIGHTCLICK'
  };
  var buttons = {
    '32': 'SPACE',
    '27': 'ESC',
    '37': 'LEFT',
    '39': 'RIGHT',
    '38': 'UP',
    '40': 'DOWN',
    '90': 'Z'
  };
  var inputState = {
    actions: {
      LEFTCLICK: false,
      RIGHTCLICK: false,
      SPACE: false,
      LEFT: false,
      RIGHT: false,
      UP: false,
      DOWN: false,
      ESC: false,
      Z: false
    }
  };
  var gameContexts;
  var currentContext = null;

  var allUnits = [];
  var selectedUnit = null;

  var init = function() {
    this.requestAnimationFrame = window.requestAnimationFrame;
    var viewPort = {w: 1000, h: 700};
    var shipImg = new Image();
    shipImg.src = "images/ship1.png";

    var canvas = document.createElement('canvas');
    canvas.width = viewPort.w;
    canvas.height = viewPort.h;
    ctx = canvas.getContext('2d');
    document.body.appendChild(canvas);

    allUnits.push(new Ship({x: 250, y: 80}, shipImg, ctx));
    allUnits.push(new Ship({x: 450, y: 80}, shipImg, ctx));
    this.camera = new Camera({x: viewPort.w/2, y: viewPort.h/2}, viewPort.w, viewPort.h, ctx);
    this.level = new Level(2000, 700, ctx);

    registerListeners(canvas);
    gameContexts = (function(camera) {
      return {
        ship: function(inputState) {
          return {
            leftClick: function(currentUnit) {
              currentContext = ALL_CONTEXTS.SPACE;
              inputState.actions.LEFTCLICK = false;
              if (currentUnit) {
                currentUnit.selected = false;
              }
              currentUnit = null;
            },
            rightClick: function(unit, target) {
              if (target == null) { // null means a bad click
                console.error("Error moving", unit);
                inputState.actions.RIGHTCLICK = false;
                return;
              } else { // normal path here
                var move = camera.toWorld(target.x, target.y);
                inputState.mouseTarget = null;
                unit.moveTo({x: move[0], y: move[1]});
                inputState.actions.RIGHTCLICK = false;
                unit.attackMove = true;
              }
            }
          }
        },
        space: function(inputState) {
          return {
            leftClick: function(target, level) {
              console.log('space left click');
              inputState.actions.LEFTCLICK = false;
              var worldTarget = camera.toWorld(target.x, target.y);
              var majorCol = level.findHex(worldTarget);
              console.log(target, worldTarget);
              for(var i=0; i<allUnits.length; i++) {
                if (allUnits[i].isVisible) {
                  if (allUnits[i].inside(worldTarget[0], worldTarget[1])) {
                    console.log("selected", allUnits[i]);
                    selectedUnit = allUnits[i];
                    selectedUnit.selected = true;
                    currentContext = ALL_CONTEXTS.SHIP;
                    break;
                  }
                }
              }
              if (selectedUnit === null) {
                console.log("major col", majorCol);
                level.highlightCol(majorCol);
              }
            }
          }
        }
      }
    })(this.camera);
    currentContext = ALL_CONTEXTS.SPACE;
  };

  var registerListeners = function(canvas) {
    canvas.addEventListener('mousedown', function(e) {
      e.preventDefault();
      var mButton = mouseCodes[e.which];
      if (mButton !== undefined) {
        inputState.actions[mButton] = true;
        inputState.mouseTarget = {x: e.clientX, y: e.clientY};
      }
    },false);

    canvas.addEventListener('contextmenu', function(e) {e.preventDefault();},false);

    // just camera testing
    window.addEventListener('keydown', function(e) {
      var button = buttons[e.keyCode];
      if (button !== undefined) {
        inputState.actions[button] = true;
      }
    }, false);

    window.addEventListener('keyup', function(e) {
      var button = buttons[e.keyCode];
      if (button !== undefined) {
        inputState.actions[button] = false;
      }
    }, false);
  }

  // Should each game part handle it's own input?
  var handleInput = function(now) {
    if (currentContext === ALL_CONTEXTS.SHIP) {
      if (inputState.actions.LEFTCLICK) {
        gameContexts[currentContext](inputState).leftClick(selectedUnit, inputState.mouseTarget);
      }
      if (inputState.actions.RIGHTCLICK) {
        gameContexts[currentContext](inputState).rightClick(selectedUnit, inputState.mouseTarget);
      }
      if (inputState.actions.ESC) {
        currentContext = ALL_CONTEXTS.SPACE;
        inputState.actions.ESC = false;
        if (selectedUnit) {
          selectedUnit.selected = false;
        }
        selectedUnit = null;
      }
    } else if(currentContext === ALL_CONTEXTS.SPACE) {
      if (inputState.actions.LEFTCLICK) {
        gameContexts[currentContext](inputState).leftClick(inputState.mouseTarget, this.level);
      }
      inputState.mouseTarget = null;
    }

    if (inputState.actions.SPACE){
      if (selectedUnit) {
        console.info("Ship location", selectedUnit.debug());
      }
      console.info("camera location", this.camera);
      console.info("camera left", this.camera.x - ((this.camera.width/this.camera.scale)/2));
      console.info("camera right", this.camera.x + ((this.camera.width/this.camera.scale)/2));
      inputState.actions.SPACE = false;
      console.info("clearing rect", 0, 0, this.camera.width/this.camera.scale, this.camera.height/this.camera.scale);
    }

    if (inputState.actions.Z){
      console.info("Zoom");
      this.camera.zoom();
      inputState.actions.Z = false;
    }

    this.camera.direction.x = 0;
    this.camera.direction.y = 0;
    if (inputState.actions.RIGHT) {
      this.camera.direction.x = 1;
    }
    if (inputState.actions.LEFT) {
      this.camera.direction.x = -1;
    }
    if (inputState.actions.UP) {
      this.camera.direction.y = -1;
    }
    if (inputState.actions.DOWN) {
      this.camera.direction.y = 1;
    }
  }

  var update = function(timeDelta) {
    this.camera.update(timeDelta);
    // update tracker
    for(var i = 0; i< allUnits.length; i++) {
      allUnits[i].update(timeDelta);
      var xy = allUnits[i].getXY();
      if (this.camera.inside(xy.x, xy.y, allUnits[i].width, allUnits[i].height)) {
        // ship(s) can be selected
        allUnits[i].isVisible = true;
      } else {
        allUnits[i].isVisible = false;
      }
    }
  };

  // Should be a "Stage" object that is the composer for rendering
  var render = function() {
    ctx.save();
    // clearing screen and redrawing BG, should move to canvas
    ctx.clearRect(0, 0, this.camera.width/this.camera.scale, this.camera.height/this.camera.scale);
    this.camera.render();
    this.level.render();
    for(var i=0; i<allUnits.length; i++) {
      if (allUnits[i].isVisible) {
        allUnits[i].render();
      }
    }
    ctx.fillStyle = "yellow";
    ctx.fillRect(this.camera.x-2, this.camera.y-2, 4, 4);
    ctx.restore();
  };

  var hexCorner = function(center, size, i) {
    return [
      Math.round(center[0] + size * Math.cos(i * 2 * Math.PI / 6)),
      Math.round(center[1]+ size * Math.sin(i * 2 * Math.PI / 6))
    ];
  };

  var main = function(timeDelta) {
    handleInput();
    var now = Date.now();
    update((now-this.then)/1000); // ts
    render();
    this.then = now;
    this.requestAnimationFrame(main);
  };

  // Public methods
  return {
    start: function() {
      init();
      this.then = Date.now();
      main(Date.now());
    }
  }
}

game = new Game();
game.start();
console.log(game);
},{"./camera.js":1,"./ship.js":3,"./util.js":4}],3:[function(require,module,exports){
var util = require('./util.js');

module.exports = Ship;

function Ship(startPos, img, ctx) {
  var x = startPos.x;
  var y = startPos.y;
  // var width = img.width;
  // var height = img.height; fix me
  var width = 64;
  var height = 64;
  var ACCELERATION = 100;
  var maxSpeed = 500;
  var currentSpeed = 0;
  var moving = false;
  var img = img;

  var tempWidth = 2000;

  var checkLocation = function(loc) {
    if (loc === undefined) {
      return null
    } else if (loc.x < 0+width/2 || loc.x > tempWidth-width/2) {
      return false
    }
    return true
  };

  return {
    debug: function() {
      return "x=> " + x + " y=> " + y
    },
    width: width, height: height,
    getXY: function() {
      return {x: x, y: y}
    },
    moveTo: function(location) {
      var validLocation = checkLocation(location);
      if (validLocation === true) {
        this.location = location;
      } else if (validLocation === false) { // null is different than false
        console.error("Can't move there", location);
        this.location = undefined;
      }
    },
    inside: function(x2, y2) {
      if (x2 > x - (width/2) && x2 < x + (width/2)) {
        if (y2 > y - (height/2) && y2 < y + (height/2)) {
          return true
        }
      }
      return false
    },
    update: function(mod) {
      if (this.location) {
        moving = true;
        // d = vt + (1/2)at^2
        // determine + or - for x and y
        var xDir = util.sign(this.location.x - x);
        var yDir = util.sign(this.location.y - y);

        // debugger
        // x = (0.5*(ACCELERATION*xDir)*(mod*mod)+(currentSpeed*mod)+x);
        // y = (0.5*(ACCELERATION*yDir)*(mod*mod)+(currentSpeed*mod)+y);

        // currentSpeed = ACCELERATION*mod+currentSpeed;
        // if (currentSpeed > maxSpeed) { // clamp speed, no more acc
        //   currentSpeed = maxSpeed;
        // }

        // TODO: Don't use this for movement, use vectors
        x = util.lerp(x, this.location.x, .1);
        y = util.lerp(y, this.location.y, .1);

        if (Math.abs(this.location.x - x) <= 1
          && Math.abs(this.location.y - y) <= 1) {
          moving = false;
          this.attackMove = false; // In the future check to see if switch to attack
          x = this.location.x;
          y = this.location.y;
          this.location = undefined;
        }
      }
    },
    render: function() {
      ctx.beginPath();
      // if (moving) {
      //   if (this.attackMove) {
      //     ctx.fillStyle = "#FF3300";
      //   } else {
      //     ctx.fillStyle = "#00CC00";
      //   }
      // } else if (!this.selected) {
      //   ctx.fillStyle = "#717999";
      // } else {
      //   ctx.fillStyle = "#3333FF";
      // }
      ctx.drawImage(img, x-width/2, y-width/2,width,height);
      ctx.rect(x-width/2,y-width/2,width,height);
      if (this.selected) {
        ctx.fillStyle = "rgba(51, 51, 255, 0.3)";
        ctx.fill();
      }
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'white';
      ctx.stroke();
      // debug, draw dot
      ctx.fillStyle = "yellow";
      ctx.fillRect(x-1, y-1, 2, 2);
    }
  }
}

},{"./util.js":4}],4:[function(require,module,exports){
var util = (function util() {
  console.log("moo util");
  return {
    lerp: function(v0, v1, t) {
      return (1-t)*v0 + t*v1;
    },
    sign: function(x) {
      return x && x / Math.abs(x);
    },
    roundToTwo: function(num) {    
      return +(Math.round(num + "e+2")  + "e-2");
    }
  }
})();

if (Math.sign) {
  util.sign = Math.sign;
}

module.exports = util;
},{}]},{},[2])