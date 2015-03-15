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

