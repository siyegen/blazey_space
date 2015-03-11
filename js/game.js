console.log("Hello!");

var bgStars = new Image();
bgStars.src = "images/star-bg-big.png";
var tempWidth = 2000;

var shipImg = new Image();
shipImg.src = "images/ship1.png";

var util = (function util() {
  return {
    lerp: function(v0, v1, t) {
      return (1-t)*v0 + t*v1;
    },
    sign: function(x) {
      return x && x / Math.abs(x);
    }
  }
})();

if (Math.sign) {
  util.sign = Math.sign;
}

// need a better pattern here
function Camera(startPos, wView, hView, ctx) {
  this.direction = 0;
  this.x = startPos.x;
  this.y = startPos.y;
  this.width = wView;
  this.height = wView;
  this.scale = 1;

  this.toWorld = function(clientX, clientY) {
    return [
      clientX/this.scale - ((wView/2) - this.x),
      clientY/this.scale - ((hView/2) - this.y)
    ]
  };

  this.zoom = function() {
    if (this.scale == 1) {
      this.scale = 0.5;
    } else {
      this.scale = 1;
    }
  };

  this.update = function(mod) {
    if (this.direction == 1) {
      this.x += 5;
    }
    if (this.direction == -1) {
      this.x -= 5;
    }
  };

  this.render = function() {
    ctx.scale(this.scale, this.scale);
    ctx.translate((wView/2) - this.x, (hView/2) - this.y);
  };

  this.inside = function(x, y, width, height) {
    if (x + width/2 > this.x - (wView/2) && x - width/2 < this.x + (wView/2)) {
      if (y + height/2 > this.y - (hView/2) && y - height/2 < this.y + (hView/2)) {
        return true
      }
    }
    return false
  };
}

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

  console.log(img);

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
      ctx.drawImage(shipImg, x-width/2, y-width/2,width,height);
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
    '90': 'Z'
  };
  var inputState = {
    actions: {
      LEFTCLICK: false,
      RIGHTCLICK: false,
      SPACE: false,
      LEFT: false,
      RIGHT: false,
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

    var canvas = document.createElement('canvas');
    canvas.width = viewPort.w;
    canvas.height = viewPort.h;
    ctx = canvas.getContext('2d');
    document.body.appendChild(canvas);

    allUnits.push(new Ship({x: 250, y: 80}, shipImg, ctx));
    allUnits.push(new Ship({x: 450, y: 80}, shipImg, ctx));
    this.camera = new Camera({x: viewPort.w/2, y: viewPort.h/2}, viewPort.w, viewPort.h, ctx);

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
                return
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
            leftClick: function(target) {
              console.log('space left click');
              inputState.actions.LEFTCLICK = false;
              var worldTarget = camera.toWorld(target.x, target.y);
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
        gameContexts[currentContext](inputState).leftClick(inputState.mouseTarget);
      }
      inputState.mouseTarget = null;
    }

    if (inputState.actions.SPACE){
      if (selectedUnit) {
        console.info("Ship location", selectedUnit.debug());
      }
      console.info("camera location", this.camera);
    }

    if (inputState.actions.Z){
      console.info("Zoom");
      this.camera.zoom();
      inputState.actions.Z = false;
    }

    this.camera.direction = 0;
    if (inputState.actions.RIGHT) {
      console.log('cam move Right');
      this.camera.direction = 1;
    }
    if (inputState.actions.LEFT) {
      console.log('cam move left');
      this.camera.direction = -1;
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

  var render = function() {
    ctx.save();
    this.camera.render();
    // clearing screen and redrawing BG, should move to canvas
    ctx.clearRect(0, 0, this.camera.width/this.camera.scale, this.camera.height/this.camera.scale);
    ctx.drawImage(bgStars, 0, 0, bgStars.width, bgStars.height);
    for(var i=0; i<allUnits.length; i++) {
      if (allUnits[i].isVisible) {
        allUnits[i].render();
      }
    }
    ctx.restore();
  }

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