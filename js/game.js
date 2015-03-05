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
    update: function(mod) {
      if (this.direction == 1){
        this.x += 5;
      }
      if (this.direction == -1){
        this.x -= 5;
      }
    },
    render: function() {
      ctx.translate(startPos.x, startPos.y);
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

  var checkLocation = function(loc) {
    if (loc === undefined) {
      return null
    }
    return true
  };

  return {
    update: function(mod) {
      var validLocation = checkLocation(this.location);
      if (validLocation === true) {
        // TODO: Don't use this for movement, use vectors
        x = util.lerp(x, this.location.x, .1);
        y = util.lerp(y, this.location.y, .1);

        if (Math.abs(this.location.x - x) <= 1
          && Math.abs(this.location.y - y) <= 1) {
          x = this.location.x;
          y = this.location.y;
          this.location = undefined;
        }
      } else if (validLocation === false) { // null is different than false
        console.error("Can't move there", this.location);
        this.location = undefined;
      }

    },
    render: function() {
      ctx.beginPath();
      ctx.rect(x-width/2,y-width/2,width,height);
      ctx.fillStyle = "#FF8867";
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
  var inputState = {};
  var init = function() {
    this.requestAnimationFrame = window.requestAnimationFrame;

    var canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 500;
    ctx = canvas.getContext('2d');
    document.body.appendChild(canvas);

    this.ship = new Ship({x: 250, y: 15}, ctx);
    this.camera = new Camera({x: 250, y: 0}, 500, 500, ctx);

    registerListeners(canvas);
  };

  var registerListeners = function(canvas) {
    canvas.addEventListener('click', function(e) {
      inputState.leftClick = true;
      inputState.mouseTarget = {x: e.clientX, y: e.clientY};
    },false);

    // just camera testing
    window.addEventListener('keydown', function(e) {
      if (e.keyCode == 37) {
        inputState.keyLeft = true;
      } else if (e.keyCode == 39) {
        inputState.keyRight = true;
      }
    }, false);
    window.addEventListener('keyup', function(e) {
      if (e.keyCode == 37) {
        inputState.keyLeft = false;
      } else if (e.keyCode == 39) {
        inputState.keyRight = false;
      }
    }, false);
  }

  // Should each game part handle it's own input?
  var handleInput = function(now) {
    if (inputState.leftClick) {
      this.ship.location = {x: inputState.mouseTarget.x, y: inputState.mouseTarget.y};
      console.log('triggering a move');
      inputState.leftClick = false;
      inputState.mouseTarget = {};
    }
    this.camera.direction = 0;
    if (inputState.keyLeft) {
      console.log('cam move left');
      this.camera.direction = -1;
    }
    if (inputState.keyRight) {
      console.log('cam move Right');
      this.camera.direction = 1;
    }
  }

  var update = function(timeDelta) {
    this.ship.update(timeDelta);
    this.camera.update(timeDelta);
  }

  var render = function() {
    ctx.save();
    ctx.translate(this.camera.x, this.camera.y);
    ctx.clearRect(0, 0, 500, 500);
    ctx.drawImage(bgStars, 0, 0, bgStars.width, bgStars.height);
    this.ship.render();
    ctx.restore();
  }

  var main = function(timeDelta) {
    // console.log("calling main");
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