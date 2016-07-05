global.storeMap = {};
global.storeMap['KEY_ENTER'] = protractor.Key.ENTER
global.EC = protractor.ExpectedConditions;
//var testFilePath = './testCases/Auto_Use_Tier_Override.json';
var testFilePath = './testCases/tci.html';
if(testFilePath.split('.').pop() == 'html'){
	var htmlFilePath = testFilePath;
	if(htmlFilePath.charAt(0) === '.'){
		htmlFilePath = htmlFilePath.substr(1);
	}
	var htmlFilePath = __dirname + htmlFilePath;

	var cheerio = require('cheerio');

	var htmlString = require('fs').readFileSync(htmlFilePath,'utf-8',function(err,data){
		if(err){
			return console.error(err);
		}
	});

	var htmlDom = cheerio.load(htmlString);
	var html2json = {};
	html2json.testInfo = {};
	html2json.testInfo.discribe = htmlDom('thead').text().trim();
	html2json.testInfo.it = htmlDom('thead').text().trim();
	html2json.testInfo.type = "GI";
	html2json.steps = [];
	var tmpStep = {};
	var tokens = htmlString.match(/<td>(.|[\n\r])*?<\/td>/g)
		.map(function(val){return val.replace('</td>', '')})
		.map(function(val){return val.replace('<td>', '')});
	var tokenNum = tokens.length;
	var j = 0;
	for(var tokenId in tokens){
			if(j == 0){
				tmpStep.action = tokens[tokenId];
				j++;
			}else	if(j == 1){
				tmpStep.data1 = tokens[tokenId];
				j++;
			}else if(j == 2){
				tmpStep.data2 = tokens[tokenId];
				if(tmpStep.action != 'runScript'){
					tmpStep.data2 = tmpStep.data2.split("\r\n").join(" ")
					tmpStep.data2 = tmpStep.data2.split("'").join('\"')
				}
				html2json.steps.push(tmpStep);
				tmpStep = {};
				j = 0;
			}else{
				throw Error('error in parsing html to json');
			}
	}

	var j = 0;
	var tmpSteps = [];
	for(var i in html2json.steps){
		if(html2json.steps[i].action == 'store'){
			global.storeMap[html2json.steps[i].data2] = html2json.steps[i].data1;
		}else{
			tmpSteps.push(html2json.steps[i]);
		}
	}
	html2json.steps = tmpSteps;

	for(var i in html2json.steps){
		html2json.steps[i].data3 = parseInt(i)+1;
		for(var key in global.storeMap){
			var keyPattern = '${' + key;
			keyPattern += '}';
			if(html2json.steps[i].data1.indexOf(keyPattern) > -1){
				html2json.steps[i].data1 = html2json.steps[i].data1.replace(keyPattern, global.storeMap[key]);
			}
			if(html2json.steps[i].data2.indexOf(keyPattern) > -1){
				html2json.steps[i].data2 = html2json.steps[i].data2.replace(keyPattern, global.storeMap[key]);
			}
		}
	}

	// var htmlDom = cheerio.load(htmlString);
	// var stepNum = htmlDom('tr').length;
	// var html2json = {};
	// html2json.testInfo = {};
	// html2json.testInfo.discribe = htmlDom('thead').text().trim();
	// html2json.testInfo.it = htmlDom('thead').text().trim();
	// html2json.testInfo.type = "GI";
	// html2json.steps = [];
	// var tmpStep = {};
	// htmlDom('table tbody tr').each(
	// 	function(i){
	// 		htmlDom(this).children('td').each(function(j){
	// 			if(j == 0){
	// 				tmpStep.action = htmlDom(this).text();
	// 			}else	if(j == 1){
	// 				tmpStep.data1 = htmlDom(this).text();
	// 			}else if(j == 2){
	// 				tmpStep.data2 = htmlDom(this).text();
	// 				html2json.steps.push(tmpStep);
	// 				tmpStep = {};
	// 			}else{
	// 				throw Error('error in parsing html to json');
	// 			}
	// 		})
	// 	}
	// );
	testFilePath = testFilePath.split('.');
	testFilePath.pop();
	testFilePath.push('json');
	testFilePath = testFilePath.join('.');
	require('fs').writeFileSync(testFilePath, JSON.stringify(html2json, null, 2) , 'utf-8');
}

var testFile = require(testFilePath);
describe('test cases', function() {
		it('should run all steps in JSON', function() {
			protractor.ignoreSynchronization = true;


			// need to install clarinet first
			// load filesystem, utl, JSON parser and debuglog
			var fs = require('fs');
			var path = require('path');
			var clarinet = require("clarinet");
			var parser = clarinet.parser();
			var lineNumberLog = [];
			if(testFilePath.charAt(0) === '.'){
				testFilePath = testFilePath.substr(1);
			}
			var jsonFilePath = __dirname + testFilePath;
			var currentElement = null;


			parser.onerror = function (e) {
		    // an error happened. e is the error.
		  };
		  parser.onvalue = function (v) {
		    // got some value.  v is the value. can be string, double, bool, or null.
		  };
		  parser.onopenobject = function (key) {
		    // opened an object. key is the first key.
		    if(key == 'action'){
					lineNumberLog.push(parser.line);
				}
		  };
		  parser.onkey = function (key) {
		    // got a key in an object.
				if(key == 'action'){
					lineNumberLog.push(parser.line);
				}
		  };
		  parser.oncloseobject = function () {
		    // closed an object.
		  };
		  parser.onopenarray = function () {
		    // opened an array.
		  };
		  parser.onclosearray = function () {
		    // closed an array.
		  };
		  parser.onend = function () {
		    // parser stream is done, and ready to have more stuff written to it.
		  };



      // for (var x = 0; x < testFile.steps.length; x++) {
			// function executeStepGI(x){
			// 	if(x >= testFile.steps.length){
			// 		return;
			// 	}
			// 	var nextFunc = (function(){
			// 		var next_x = x+1;
			// 		return function(){
			// 			executeStepGI(next_x);
			// 		};
			// 	})();
			// 	var errFunc = (function(){
			// 		var jsonLine = lineNumberLog[x]
			// 		return function(){
			// 			console.log('json Line Number: '+ jsonLine);
			// 		};
			// 	})();
			//
			// 	var step = testFile.steps[x];
      //   var action = step.action;
			// 	var data1 = step.data1;
			// 	var data2 = step.data2;
			//
			// 	browser.controlFlow().execute(
			// 		function(){
			// 			console.log('action: ' + action + '\n');
			// 			console.log('data1: ' + data1 + '\n');
			// 			console.log('data3: ' + step.data3 + '\n');
			// 		}
			// 	);
      //   switch (action) {
      //     case 'open':
      //       browser.get(step.data1).then(nextFunc);
      //       break;
			// 		case 'store':
			// 			global.storeMap[data2] = data1;
			// 			executeStepGI(x+1);
      //       break;
			// 		case 'waitForPageToLoad':
			// 			browser.waitForAngular().then(nextFunc);
			// 			break;
			// 		case 'waitForElementPresent':
			// 			var selectorType = data1.split('=')[0];
			// 			var selectorText = data1.split('=');
			// 			selectorText.shift();
			// 			selectorText = selectorText.join('=');
			// 			var ele;
			// 			if(selectorType == 'css'){
			// 				var fooString = "return $('selectorText')"
			// 				selectorText = selectorText.replace('"', '\"');
			// 				fooString = fooString.replace('selectorText', selectorText);
			// 				var foo = new Function(fooString);
			// 				ele = element(by.js(foo));
			// 			}else{
			// 				ele = element(by[selectorType](selectorText));
			// 			}
			// 			browser.wait(global.EC.presenceOf(ele, 20000)).then(
			// 				nextFunc, errFunc
			// 				// ,function(err){
			// 				// 	browser.controlFlow().execute(function(){console.log(selectorType + '::' + selectorText +' is not a valid selector or not present')})
			// 				// 	err.message += '\n' + selectorType + ':' + selectorText +' is not a valid selector or not present';
			// 				// 	browser.pause();
			// 				// 	throw err;
			// 				// }
			// 			);
			// 			break;
			// 		case 'type':
			// 			var selectorType = data1.split('=')[0];
			// 			var selectorText = data1.split('=');
			// 			selectorText.shift();
			// 			selectorText = selectorText.join('=');
			// 			var ele;
			// 			if(selectorType == 'css'){
			// 				var fooString = "return $('selectorText')"
			// 				selectorText = selectorText.replace('"', '\"');
			// 				fooString = fooString.replace('selectorText', selectorText);
			// 				var foo = new Function(fooString);
			// 				ele = element(by.js(foo));
			// 			}else{
			// 				ele = element(by[selectorType](selectorText));
			// 			}
			//
			// 			ele.sendKeys(data2).then(
			// 				nextFunc,
			// 				function(err){
			// 					if(data1.includes('ace')){
			// 						browser.actions().doubleClick($('div.ace_content')).perform();
			// 						$('textarea.ace_text-input').sendKeys(data2).then(
			// 							function(){
			// 								executeStepGI(x+1);
			// 							},function(err1){
			// 								throw err1;
			// 							}
			// 						)
			// 					}
			// 				}
			// 			);
			// 			break;
			// 		case 'click':
			// 			var selectorType = data1.split('=')[0];
			// 			var selectorText = data1.split('=');
			// 			selectorText.shift();
			// 			selectorText = selectorText.join('=');
			// 			var ele;
			// 			if(selectorType == 'css'){
			// 				var fooString = "return $('selectorText')"
			// 				selectorText = selectorText.replace('"', '\"');
			// 				fooString = fooString.replace('selectorText', selectorText);
			// 				var foo = new Function(fooString);
			// 				ele = element(by.js(foo));
			//
			// 			}else{
			// 				ele = element(by[selectorType](selectorText));
			// 			}
			// 			ele.click().then(
			// 				nextFunc,function(err){
			// 					if(selectorType == 'css'){
			// 						var fooString = "return $('selectorText').click()"
			// 						selectorText = selectorText.replace('"', '\"');
			// 						fooString = fooString.replace('selectorText', selectorText);
			// 						var foo = new Function(fooString);
			// 						browser.executeScript(fooString).then(
			// 							function(res){
			// 								if(res == null){
			// 									browser.controlFlow().execute(function(){console.log('ERROR: selectorType:'+selectorType+',selectorText:'+selectorText+'\n')}).then(
			// 										function(){
			// 											browser.pause();
			// 											throw err;
			// 										}
			// 									);
			// 								}else{
			// 									nextFunc();
			// 								}
			// 							}
			// 						)
			// 					}else{
			//
			// 						browser.controlFlow().execute(function(){console.log('ERROR: selectorType:'+selectorType+',selectorText:'+selectorText+'\n')}).then(
			// 						function(){
			// 							browser.pause();
			// 						}
			// 					);
			// 				}
			//
			// 				}
			// 			);
			// 			break;
			// 		case 'doubleClick':
			// 			var selectorType = data1.split('=')[0];
			// 			var selectorText = data1.split('=');
			// 			selectorText.shift();
			// 			selectorText = selectorText.join('=');
			// 			var ele;
			// 			if(selectorType == 'css'){
			// 				var fooString = "return $('selectorText')"
			// 				selectorText = selectorText.replace('"', '\"');
			// 				fooString = fooString.replace('selectorText', selectorText);
			// 				var foo = new Function(fooString);
			// 				ele = element(by.js(foo));
			// 			}else{
			// 				ele = element(by[selectorType](selectorText));
			// 			}
			// 			browser.actions().doubleClick(ele).perform().then(
			// 				nextFunc
			// 			);
			// 			break;
			// 		case 'pause':
			// 			browser.sleep(data1).then(
			// 				nextFunc
			// 			);
			// 		case 'runScript':
			// 			browser.executeScript(data1).then(
			// 				nextFunc
			// 			);
			// 			break;
			// 		default:
			// 			browser.controlFlow().execute(
			// 				function(){
			// 					console.log('unsupported action:' + action);
			// 				}
			// 			).then(
			// 				nextFunc
			// 			)
			//
			// 	}
			// }

			var jsonString = fs.readFileSync(jsonFilePath,'utf-8',function(err,data){
		    if(err){
		      return console.error(err);
		    }
		  });
			parser.write(jsonString).close();
			testFile.lineNumbers = lineNumberLog.slice();
			testFile.jsonFilePath = jsonFilePath.slice();


			testFile.steps.forEach(function(step){


				var action = step.action;
				var data1 = step.data1;
				var data2 = step.data2;
				var stepId = step.data3;

				var errFunc = (function(){
					var stepId_inner = stepId;
					return function(extraMsg){
						var ex = extraMsg;
						return function(){
							var errorMsg = 'Error in Step ID: '+ stepId_inner + '\n'
							errorMsg += ex
							throw Error(errorMsg)
						};
					};
				})();



				browser.controlFlow().execute(
					function(){
						console.log('action: ' + action + '\n');
						console.log('data1: ' + data1 + '\n');
						console.log('stepId: ' + stepId + '\n');
					}
				);
				switch (action) {
          case 'open':
            browser.get(step.data1);
            break;
					case 'store':
						global.storeMap[data2] = data1;
            break;
					case 'waitForPageToLoad':
						var errFunc_inner = errFunc(__filename + ' line: ' + __line + '\nwait for page to load timeout');
						browser.waitForAngular().then(function(){},errFunc_inner);
						break;
					case 'waitForElementPresent':
						var selectorType = data1.split('=')[0];
						var selectorText = data1.split('=');
						selectorText.shift();
						selectorText = selectorText.join('=');
						var ele;
						if(selectorType == 'css'){
							var fooString = "return $('selectorText')"
							selectorText = selectorText.replace('"', '\"');
							fooString = fooString.replace('selectorText', selectorText);
							var foo = new Function(fooString);
							ele = element(by.js(foo));
						}else{
							ele = element(by[selectorType](selectorText));
						}
						var errFunc_inner = errFunc(__filename + ' line: ' + __line + '\nwait for presence of element timeout, \nselectorType: css, selector: '+ selectorText);
						browser.wait(global.EC.presenceOf(ele), 10000).then(function(){},errFunc_inner);
						break;
					case 'assertElementPresent':
						var selectorType = data1.split('=')[0];
						var selectorText = data1.split('=');
						selectorText.shift();
						selectorText = selectorText.join('=');
						var ele;
						if(selectorType == 'css'){
							var fooString = "return $('selectorText')"
							selectorText = selectorText.replace('"', '\"');
							fooString = fooString.replace('selectorText', selectorText);
							var foo = new Function(fooString);
							ele = element(by.js(foo));
						}else{
							ele = element(by[selectorType](selectorText));
						}
						expect(ele.isPresent()).toBe(true, __filename + ' line: ' + __line + '\nassert presence of element failed, \nselectorType: css, selector: '+ selectorText);
						break;
					case 'type':
						var selectorType = data1.split('=')[0];
						var selectorText = data1.split('=');
						selectorText.shift();
						selectorText = selectorText.join('=');
						var ele;
						if(selectorType == 'css'){
							var fooString = "return $('selectorText')"
							selectorText = selectorText.replace('"', '\"');
							fooString = fooString.replace('selectorText', selectorText);
							var foo = new Function(fooString);
							ele = element(by.js(foo));
						}else{
							ele = element(by[selectorType](selectorText));
						}
						var errFunc_inner = errFunc(__filename + ' line: ' + __line + '\nsend key failed \nselectorType: css, selector: '+ selectorText);
						ele.sendKeys(data2).then(function(){}, errFunc_inner)
						break;
					case 'sendKeys':
						var selectorType = data1.split('=')[0];
						var selectorText = data1.split('=');
						selectorText.shift();
						selectorText = selectorText.join('=');
						var ele;
						if(selectorType == 'css'){
							var fooString = "return $('selectorText')"
							selectorText = selectorText.replace('"', '\"');
							fooString = fooString.replace('selectorText', selectorText);
							var foo = new Function(fooString);
							ele = element(by.js(foo));
						}else{
							ele = element(by[selectorType](selectorText));
						}
						var errFunc_inner = errFunc(__filename + ' line: ' + __line + '\nsend key failed \nselectorType: css, selector: '+ selectorText);
						ele.sendKeys(data2).then(function(){}, errFunc_inner)
						break;
					case 'click':
						var selectorType = data1.split('=')[0];
						var selectorText = data1.split('=');
						selectorText.shift();
						selectorText = selectorText.join('=');
						var ele;
						var fooString;

						if(selectorType == 'css'){
							fooString = "return $('selectorText')";
							selectorText = selectorText.replace('"', '\"');
							fooString = fooString.replace('selectorText', selectorText);
							var foo = new Function(fooString);
							ele = element(by.js(foo));
							var errFunc_inner = errFunc(__filename + ' line: ' + __line + '\nelement cannot be found, \nselectorType: css, selector: '+ selectorText);

							// rollback function
							var rollbackFunc = (function(){
								var fooString_1 = "$('selectorText').click();";
								var errFunc_1 = errFunc_inner
								var errFunc_inner_1 = errFunc(__filename + ' line: ' + __line + '\nelement cannot be found, \nselectorType: css, selector: '+ selectorText);
								fooString_1 = fooString_1.replace(/selectorText/g, selectorText);
								return function(){
									browser.executeScript(fooString_1);
								}
							})();
							expect(ele.isPresent()).toBe(true);
							var isClickable = global.EC.elementToBeClickable(ele);
							browser.wait(isClickable, 10000, 'timeout' ).then(
								function(){
									ele.click().then(
										function(){},
										rollbackFunc
									)
								},rollbackFunc
							)

						}else if(selectorType == 'xpath'){
							ele = element(by[selectorType](selectorText));
							expect(ele.isPresent()).toBe(true);
							var isClickable = global.EC.elementToBeClickable(ele);
							var errFunc_inner = errFunc(__filename + ' line: ' + __line + '\nelement cannot be found, \nselectorType: xpath, selector: '+ selectorText);
							browser.wait(isClickable, 10000, 'timeout').then(
								function(){
									ele.click().then(
										function(){},
										errFunc_inner
									)
								},errFunc_inner
							)
						}else{
							throw Error('unsupported selector type');
						}
						break;
					case 'doubleClick':
						var selectorType = data1.split('=')[0];
						var selectorText = data1.split('=');
						selectorText.shift();
						selectorText = selectorText.join('=');
						var ele;
						if(selectorType == 'css'){
							var fooString = "return $('selectorText')"
							selectorText = selectorText.replace('"', '\"');
							fooString = fooString.replace('selectorText', selectorText);
							var foo = new Function(fooString);
							ele = element(by.js(foo));
						}else{
							ele = element(by[selectorType](selectorText));
						}
						browser.actions().doubleClick(ele).perform();
						break;
					case 'pause':
						browser.sleep(data1);
					case 'runScript':
						browser.executeScript(data1);
						break;
					case 'assertEval':
						var errFunc_inner = errFunc(__filename + ' line: ' + __line + '\nassert value failed, expect: ' + data2);
						browser.executeScript(data1).then(
							function(res){
								if(res != data2){
									browser.controlFlow().execute(
										errFunc_inner
									)
								}
							}
						);
						break;
					case 'assertText':
						var selectorType = data1.split('=')[0];
						var selectorText = data1.split('=');
						selectorText.shift();
						selectorText = selectorText.join('=');
						var ele;
						if(selectorType == 'css'){
							var fooString = "return $('selectorText')"
							selectorText = selectorText.replace('"', '\"');
							fooString = fooString.replace('selectorText', selectorText);
							var foo = new Function(fooString);
							ele = element(by.js(foo));
						}else{
							ele = element(by[selectorType](selectorText));
						}
						expect(ele.getText()).toEqual(data2, __filename + ' line: ' + __line + '\nassert text of element failed, \nselectorType: css, selector: '+ selectorText);
						break;
					default:
						throw Error('unsupported action: ' + action);

			}
    }
	)
})});
