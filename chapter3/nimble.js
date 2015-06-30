var flow = require("nimble");

flow.series([
  function(callback) {
    setTimeout(function (){
      console.log('aaa');
      callback();
    },1000);
  },
  function(callback) {
    setTimeout(function (){
      console.log('bbb');
      callback();
    },500);
  },
  function(callback) {
    setTimeout(function (){
      console.log('ccc');
      callback();
    },100);
  }
])