console.log("Hello!");

var bgStars = new Image();
bgStars.src = "images/star-bg-big.png";

var util = (function util() {
  return {
    lerp: function(v0, v1, t) {
      return (1-t)*v0 + t*v1;
    }
  }
})();

function Camera(startPos, wView, hView, ctx) {
  this.direction = 0;
  this.x = startPos.x;
  this.y = startPos.y;
  return {
    toWorld: function(clientX, clientY) {
      return [clientX - this.x, clientY - this.y];
    },
    update: function(mod) {
      if (this.direction == 1){
        this.x += 5;
      }
      if (this.direction == -1){
        this.x -= 5;
      }
    },
    render: function() {
      ctx.translate(this.x, this.y);
    },
    x: this.x, y: this.y
  }
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
    } else if (loc.x < 0+width/2 || loc.x > 2000-width/2) {
      return false
    }
    return true
  };

  return {
    debug: function() {
      return "x=> " + x + " y=> " + y
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
    '39': 'RIGHT'
  };
  var inputState = {
    actions: {
      LEFTCLICK: false,
      RIGHTCLICK: false,
      SPACE: false,
      LEFT: false,
      RIGHT: false,
      ESC: false
    }
  };
  var gameContexts;
  var currentContext = null;

  var init = function() {
    this.requestAnimationFrame = window.requestAnimationFrame;

    var canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 500;
    ctx = canvas.getContext('2d');
    document.body.appendChild(canvas);

    this.ship = new Ship({x: 250, y: 15}, ctx);
    this.camera = new Camera({x: 0, y: 0}, 500, 500, ctx);

    registerListeners(canvas);
    gameContexts = (function(camera) {
      return {
        ship: function(inputState) {
          return {
            leftClick: function(unit) {
              if (inputState.mouseTarget == null) { // null means a bad click
                console.error("Error moving", unit);
                inputState.actions.LEFTCLICK = false;
                return
              } else { // normal path here
                var move = camera.toWorld(inputState.mouseTarget.x, inputState.mouseTarget.y);
                inputState.mouseTarget = null;
                unit.moveTo({x: move[0], y: move[1]});
                inputState.actions.LEFTCLICK = false;
                unit.attackMove = false;
              }
            },
            rightClick: function(unit) {
              if (inputState.mouseTarget == null) { // null means a bad click
                console.error("Error moving", unit);
                inputState.actions.RIGHTCLICK = false;
                return
              } else { // normal path here
                var move = camera.toWorld(inputState.mouseTarget.x, inputState.mouseTarget.y);
                inputState.mouseTarget = null;
                unit.moveTo({x: move[0], y: move[1]});
                inputState.actions.RIGHTCLICK = false;
                unit.attackMove = true;
              }
            }
          }
        },
        space: function(inputState) {

        }
      }
    })(this.camera);
    currentContext = gameContexts[ALL_CONTEXTS.SHIP](inputState); 
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
    if (inputState.actions.LEFTCLICK) {
      currentContext.leftClick(this.ship);
    } else if (inputState.actions.RIGHTCLICK) {
      currentContext.rightClick(this.ship);
    }

    if (inputState.actions.SPACE){
      console.info("Ship location", this.ship.debug());
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
  }

  var render = function() {
    ctx.save();
    this.camera.render();
    ctx.clearRect(0, 0, 500, 500);
    ctx.drawImage(bgStars, 0, 0, bgStars.width, bgStars.height);
    this.ship.render();
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