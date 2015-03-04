console.log("Hello!");

var bgStars = new Image();
bgStars.src = "images/star-bg.png";

function Ship(startPos, ctx) {
  var x = startPos.x;
  var y = startPos.y;
  var width = 30;
  var height = 30;
  var ctx = ctx;

  return {
    update: function() {

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
  };

  var handleInput = function(now) {

  }

  var update = function(timeDelta) {
    this.ship.update();
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