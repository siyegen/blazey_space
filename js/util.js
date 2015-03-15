var util = (function util() {
  console.log("moo util");
  return {
    lerp: function(v0, v1, t) {
      return (1-t)*v0 + t*v1;
    },
    sign: function(x) {
      return x && x / Math.abs(x);
    },
    roundToTwo: function(num) {    
      return +(Math.round(num + "e+2")  + "e-2");
    }
  }
})();

if (Math.sign) {
  util.sign = Math.sign;
}

module.exports = util;