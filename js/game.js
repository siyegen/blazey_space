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

function Ship(startPos, ctx) {
  var x = startPos.x;
  var y = startPos.y;
  var width = 30;
  var height = 30;
  var ctx = ctx;
  var speed = 10;

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
        console.log("before", x, y);
        // TODO: Don't use this for movement, use vectors
        x = util.lerp(x, this.location.x, .1);
        y = util.lerp(y, this.location.y, .1);
        console.log("after", x, y);

        if (Math.abs(this.location.x - x) <= 2
          && Math.abs(this.location.y - y) <= 2) {
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
      ctx.rect(x,y,width,height);
      ctx.fillStyle = "#FF8867";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'black';
      ctx.stroke();
    }
  }
}

function Game() {
  // Private gamestate
  var inputState = {};
  var init = function() {
    var w = window;
    this.requestAnimationFrame = w.requestAnimationFrame ||
      w.webkitRequestAnimationFrame ||
      w.msRequestAnimationFrame ||
      w.mozRequestAnimationFrame;


    var canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 500;
    ctx = canvas.getContext('2d');
    document.body.appendChild(canvas);

    this.ship = new Ship({x: 250, y: 250}, ctx);

    registerListeners(canvas);
  };

  var registerListeners = function(canvas) {
    canvas.addEventListener('click', function(e) {
      inputState.leftClick = true;
      inputState.mouseTarget = {x: e.clientX, y: e.clientY};
    },false);
  }

  var handleInput = function(now) {
    if (inputState.leftClick) {
      this.ship.location = {x: inputState.mouseTarget.x, y: inputState.mouseTarget.y};
      console.log('triggering a move');
      inputState.leftClick = false;
      inputState.mouseTarget = {};
    }
  }

  var update = function(timeDelta) {
    this.ship.update(timeDelta);
  }

  var render = function() {
    ctx.clearRect(0, 0, 500, 500);
    ctx.drawImage(bgStars, 0, 0, bgStars.width, bgStars.height);
    this.ship.render();
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