:start
set epsilon = 0.001
set startcoord = Vec3.ZERO
set endcoord
set starttime
set totaldistance
start updatetimer

:updatetimer
do interpolation
if startcoord withinEpisolon endcoord
    then stop updatetimer
update camera
if flycam still active
    then store endcoord in startcoord
        get new endcoord
        goto updatetimer
    else
        goto end

:end
stop all timers

----------------

var signal = require('./hifi.module.js');
var ob = {
   loaded: signal(function(arg1, arg2) {}),
};
ob.loaded.connect....
ob.loaded(1,2)

....

var ob = {
   loaded: function(arg1, arg2) {
      console.info('i get called first and stuff...', arg1, arg2);
   },
};
var ob = {
   loaded: signal(function(arg1, arg2) {
      console.info('i get called first and stuff...', arg1, arg2);
   }),
};

13f00bc52806556d2ce52deabe84119ca313d01e