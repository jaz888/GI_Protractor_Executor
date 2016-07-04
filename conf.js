exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',
  specs: ['entry.js'],
  jasmineNodeOpts : {
		defaultTimeoutInterval : 300000
	},
  getPageTimeout : 60000,
	allScriptsTimeout : 360000,
  onPrepare : function() {
    global.driver = browser.driver;
		global.variables = 'data/account_global_variables.json';
		Object.defineProperty(global, '__stack', {
		  get: function(){
		    var orig = Error.prepareStackTrace;
		    Error.prepareStackTrace = function(_, stack){ return stack; };
		    var err = new Error;
		    Error.captureStackTrace(err, arguments.callee);
		    var stack = err.stack;
		    Error.prepareStackTrace = orig;
		    return stack;
		  }
		});

		Object.defineProperty(global, '__line', {
		  get: function(){
		    return __stack[1].getLineNumber();
		  }
		});
		global.sucFunc = ()=>{};
		global.errFunc = function(filename, line){
			return (err)=>{
				err.message += 'JS file : error in ' + filename + ' line ' + line + '\n';
				throw(err);
			};
		}


  }
};
