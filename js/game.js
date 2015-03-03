console.log("Hello!");

var bgStars = new Image();
bgStars.src = "images/star-bg.png";

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
  };

  var main = function(timeDelta) {
    // console.log("calling main");
    // inline render for now
    ctx.clearRect(0, 0, 500, 500);
    ctx.drawImage(bgStars, 0, 0, bgStars.width, bgStars.height);
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