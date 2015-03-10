console.log("Hello!");

var bgStars = new Image();
bgStars.src = "images/star-bg-big.png";
var tempWidth = 2000;

var util = (function util() {
  return {
    lerp: function(v0, v1, t) {
      return (1-t)*v0 + t*v1;
    }
  }
})();

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

function Ship(startPos, ctx) {
  var x = startPos.x;
  var y = startPos.y;
  var width = 30;
  var height = 30;
  var acc = 10;
  var moving = false;

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
      ctx.rect(x-width/2,y-width/2,width,height);
      if (moving) {
        if (this.attackMove) {
          ctx.fillStyle = "#FF3300";
        } else {
          ctx.fillStyle = "#00CC00";
        }
      } else if (!this.selected) {
        ctx.fillStyle = "#717999";
      } else {
        ctx.fillStyle = "#3333FF";
      }
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'black';
      ctx.stroke();
      // debug, draw dot
      ctx.fillStyle = "#4466FF";
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

    this.ship = new Ship({x: 250, y: 15}, ctx);
    this.camera = new Camera({x: viewPort.w/2, y: viewPort.h/2}, viewPort.w, viewPort.h, ctx);
    allUnits.push(this.ship);

    registerListeners(canvas);
    gameContexts = (function(camera) {
      return {
        ship: function(inputState) {
          return {
            leftClick: function(unit, target) {
              if (target == null) { // null means a bad click
                console.error("Error moving", unit);
                inputState.actions.LEFTCLICK = false;
                return
              } else { // normal path here
                var move = camera.toWorld(target.x, target.y);
                inputState.mouseTarget = null;
                unit.moveTo({x: move[0], y: move[1]});
                inputState.actions.LEFTCLICK = false;
                unit.attackMove = false;
              }
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
      } else if (inputState.actions.RIGHTCLICK) {
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
      if (this.camera.scale == 1) {
        this.camera.scale = 2;
      } else {
        this.camera.scale = 1;
      }
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
    this.ship.update(timeDelta);
    this.camera.update(timeDelta);
    // update tracker
    for(var i = 0; i< allUnits.length; i++) {
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
    ctx.clearRect(0, 0, this.camera.width, this.camera.height);
    ctx.drawImage(bgStars, 0, 0, bgStars.width, bgStars.height);
    // this.ship.render();
    for(var i=0; i<allUnits.length; i++) {
      if (allUnits[i].isVisible) {
        allUnits[i].render();
      }
    }
    ctx.restore();
  }

  var main = function(timeDelta) {
    handleInput();
    update(timeDelta);
    render();
    this.requestAnimationFrame(main);
  };

  // Public methods
  return {
    start: function() {
      init();
      main(Date.now());
    }
  }
}

game = new Game();
game.start();
console.log(game);