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
