/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 806:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 450:
/***/ ((module) => {

module.exports = eval("require")("cli-color");


/***/ }),

/***/ 228:
/***/ ((module) => {

module.exports = eval("require")("js-yaml");


/***/ }),

/***/ 3:
/***/ ((module) => {

module.exports = eval("require")("moment");


/***/ }),

/***/ 147:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const fs = __nccwpck_require__(147);
const moment = __nccwpck_require__(3);
const clc = __nccwpck_require__(450);
const yaml = __nccwpck_require__(228);
const core = __nccwpck_require__(806);

const main = async() => {
  try {
    const repository = core.getInput('repository', { required: true });
    const chartTag = core.getInput('chart-tag', { required: true });
    const valuesYaml = yaml.safeLoad(fs.readFileSync("infra-helm/Chart.yaml", 'utf8'));
    const indentedJson = JSON.stringify(config, null, 4);
    console.log(clc.green(indentedJson));
  } catch(error) {
    console.log(clc.red(error));
  }
}

main();

})();

module.exports = __webpack_exports__;
/******/ })()
;