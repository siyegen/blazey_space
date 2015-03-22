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
  console.info("lines", hLines, vLines);
  // use to position grid, has *bounds*
  // has titled bg info as well.

  function cube_round(h) {
    console.log("x,y,z", h);
    var rx = Math.round(h.x)
    var ry = Math.round(h.y)
    var rz = Math.round(h.z)

    var x_diff = Math.abs(rx - h.x)
    var y_diff = Math.abs(ry - h.y)
    var z_diff = Math.abs(rz - h.z)

    if (x_diff > y_diff && x_diff > z_diff) {
        rx = -ry-rz;
    } else if (y_diff > z_diff) {
        ry = -rx-rz;
    } else {
        rz = -rx-ry;
    } 

    return {x:rx, y:ry, z:rz};
  }

  this.findHex = function(worldTarget) {
    var hex = pixelToHex(worldTarget[0], worldTarget[1]);
    var narrowW = tileSize * 0.75;
    var hh = Math.sqrt(3)/2 * tileSize;
    var u = narrowW / worldTarget[0];
    var v = worldTarget[1]/hh - 0.5*u;
  };

  var pixelToHex = function(x, y) {
    q = x * 2/3 / (tileSize/2);
    r = (-x / 3 + Math.sqrt(3)/3 * y) / (tileSize/2);
    // console.log("q and r", q, r);
    var cube = cube_round({x:q, y:-q-r, z:r})
    // console.log("maybe hex", hex);
    // return [hex.x, (hex.z + (hex.x - (hex.x&1)) / 2)];
    return [
      cube.x,
      cube.z + (cube.x - (cube.x&1)) /2
    ];
  };

  this.render = function() {
    ctx.drawImage(bgStars, 0, 0, width, height);
    ctx.beginPath();
    ctx.strokeStyle = "rgba(0, 203, 255, 0.5)";
    for(var i=0; i<vLines; i++) { // x pos
      var offset = (i % 2 == 0 ? 0 : yCenter/2);
      for(var j=0; j<hLines; j++) { // y pos
        drawHex({x:(tileSize/2)+(i*tileSize*0.75), y:(j+0.5)*(yCenter)+offset});
        ctx.fillStyle="rgba(200, 10, 255, 1)";
        var xOffset = ctx.measureText(i+", "+j).width;
        ctx.fillText(i+", "+j, ((tileSize/2)+(i*tileSize*0.75)-xOffset/2), (j+0.5)*(yCenter)+offset);
      }
    }
    ctx.stroke()
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
              level.findHex(worldTarget);
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
      console.log('cam move Right');
      this.camera.direction.x = 1;
    }
    if (inputState.actions.LEFT) {
      console.log('cam move left');
      this.camera.direction.x = -1;
    }
    if (inputState.actions.UP) {
      console.log('cam move left');
      this.camera.direction.y = -1;
    }
    if (inputState.actions.DOWN) {
      console.log('cam move Right');
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