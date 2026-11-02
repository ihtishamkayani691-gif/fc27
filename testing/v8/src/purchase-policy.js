'use strict';
// These release gates are deliberately immutable and closed in the TEST build.
// No UI, saved filter, or discovery result can open them.
module.exports=function(module,exports){
 Object.defineProperty(exports,'policy',{value:Object.freeze({validationComplete:false,purchaseEnabled:false,userAuthorized:false}),writable:false,configurable:false});
};
