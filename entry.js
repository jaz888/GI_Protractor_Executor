global.storeMap = {};
global.storeMap['KEY_ENTER'] = protractor.Key.ENTER
global.EC = protractor.ExpectedConditions;
var helper = require('./scrollElemToBottomOfView');
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
					// tmpStep.data2 = tmpStep.data2.split("'").join('\"')
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

	testFilePath = testFilePath.split('.');
	testFilePath.pop();
	testFilePath.push('json');
	testFilePath = testFilePath.join('.');
	require('fs').writeFileSync(testFilePath, JSON.stringify(html2json, null, 2) , 'utf-8');
}

// by here, testFile need to be one single file which contains all steps and data, no variable should be in
// so, do not modify json file directly since it will be overwrite when html file with same filename is being parsing.
var testFile = require(testFilePath);
describe('test cases', function() {
		it('should run all steps in JSON', function() {
			var sgpt = require('sg-protractor-tools');


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
						return function(err){
							var errorMsg = 'Error in Step ID: '+ stepId_inner + '\n';
							errorMsg += ex;
							err.message += '\n' + errorMsg;
							throw err;
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
							var fooString;
							if(selectorText.indexOf("'") != -1 && selectorText.indexOf('"') != -1 && selectorText.indexOf("'") < selectorText.indexOf('"')){
								fooString = 'return $("selectorText")'
							}else if(selectorText.indexOf("'") != -1 && selectorText.indexOf('"') != -1 && selectorText.indexOf("'") > selectorText.indexOf('"')){
								fooString = "return $('selectorText')"
							}else if(selectorText.indexOf("'") != -1){
								fooString = 'return $("selectorText")'
							}else{
								fooString = "return $('selectorText')"
							}
							//selectorText = selectorText.replace('"', '\"');
							fooString = fooString.replace('selectorText', selectorText);
							console.log(fooString)
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
							var fooString;
							if(selectorText.indexOf("'") != -1 && selectorText.indexOf('"') != -1 && selectorText.indexOf("'") < selectorText.indexOf('"')){
								fooString = 'return $("selectorText")'
							}else if(selectorText.indexOf("'") != -1 && selectorText.indexOf('"') != -1 && selectorText.indexOf("'") > selectorText.indexOf('"')){
								fooString = "return $('selectorText')"
							}else if(selectorText.indexOf("'") != -1){
								fooString = 'return $("selectorText")'
							}else{
								fooString = "return $('selectorText')"
							}
							// selectorText = selectorText.replace('"', '\"');
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
							var fooString;
							if(selectorText.indexOf("'") != -1 && selectorText.indexOf('"') != -1 && selectorText.indexOf("'") < selectorText.indexOf('"')){
								fooString = 'return $("selectorText")'
							}else if(selectorText.indexOf("'") != -1 && selectorText.indexOf('"') != -1 && selectorText.indexOf("'") > selectorText.indexOf('"')){
								fooString = "return $('selectorText')"
							}else if(selectorText.indexOf("'") != -1){
								fooString = 'return $("selectorText")'
							}else{
								fooString = "return $('selectorText')"
							}
							//selectorText = selectorText.replace('"', '\"');
							fooString = fooString.replace('selectorText', selectorText);
							var foo = new Function(fooString);
							ele = element(by.js(foo));
						}else{
							ele = element(by[selectorType](selectorText));
						}
						var errFunc_inner = errFunc(__filename + ' line: ' + __line + '\nsend key failed \nselectorType: css, selector: '+ selectorText);

						ele.clear().sendKeys(data2).then(
							function(){},
							function(){
								helper.scrollElemFinderIntoView(ele.getWebElement());
								ele.clear().sendKeys(data2).then(
									function(){},
									errFunc_inner
								)
							}
						)
						break;
					case 'sendKeys':
						var selectorType = data1.split('=')[0];
						var selectorText = data1.split('=');
						selectorText.shift();
						selectorText = selectorText.join('=');
						var ele;
						if(selectorType == 'css'){
							var fooString;
							if(selectorText.indexOf("'") != -1 && selectorText.indexOf('"') != -1 && selectorText.indexOf("'") < selectorText.indexOf('"')){
								fooString = 'return $("selectorText")'
							}else if(selectorText.indexOf("'") != -1 && selectorText.indexOf('"') != -1 && selectorText.indexOf("'") > selectorText.indexOf('"')){
								fooString = "return $('selectorText')"
							}else if(selectorText.indexOf("'") != -1){
								fooString = 'return $("selectorText")'
							}else{
								fooString = "return $('selectorText')"
							}
							//selectorText = selectorText.replace('"', '\"');
							fooString = fooString.replace('selectorText', selectorText);
							var foo = new Function(fooString);
							ele = element(by.js(foo));
						}else{
							ele = element(by[selectorType](selectorText));
						}
						var errFunc_inner = errFunc(__filename + ' line: ' + __line + '\nsend key failed \nselectorType: css, selector: '+ selectorText);
						browser.executeScript("arguments[0].scrollIntoView();", ele.getWebElement());
						ele.sendKeys(data2).then(
							function(){},
							function(){
								helper.scrollElemFinderIntoView(ele.getWebElement());
								ele.sendKeys(data2).then(
									function(){},
									errFunc_inner
								)
							}
						)
						break;
					case 'click':
						var selectorType = data1.split('=')[0];
						var selectorText = data1.split('=');
						selectorText.shift();
						selectorText = selectorText.join('=');
						var ele;
						var fooString;

						if(selectorType == 'css'){
							var fooString;
							if(selectorText.indexOf("'") != -1 && selectorText.indexOf('"') != -1 && selectorText.indexOf("'") < selectorText.indexOf('"')){
								fooString = 'return $("selectorText")'
							}else if(selectorText.indexOf("'") != -1 && selectorText.indexOf('"') != -1 && selectorText.indexOf("'") > selectorText.indexOf('"')){
								fooString = "return $('selectorText')"
							}else if(selectorText.indexOf("'") != -1){
								fooString = 'return $("selectorText")'
							}else{
								fooString = "return $('selectorText')"
							}
							//selectorText = selectorText.replace('"', '\"');
							fooString = fooString.replace('selectorText', selectorText);
							var foo = new Function(fooString);
							ele = element(by.js(foo));
							var errFunc_inner = errFunc(__filename + ' line: ' + __line + '\nelement cannot be found, \nselectorType: css, selector: '+ selectorText);

							var rollbackFunc = (function(){
								var fooString_1;
								if(selectorText.indexOf("'") != -1 && selectorText.indexOf('"') != -1 && selectorText.indexOf("'") < selectorText.indexOf('"')){
									fooString_1 = '$("selectorText").click()'
								}else if(selectorText.indexOf("'") != -1 && selectorText.indexOf('"') != -1 && selectorText.indexOf("'") > selectorText.indexOf('"')){
									fooString_1 = "$('selectorText').click()"
								}else if(selectorText.indexOf("'") != -1){
									fooString_1 = '$("selectorText").click()'
								}else{
									fooString_1 = "$('selectorText').click()"
								}
								//selectorText = selectorText.replace('"', '\"');
								var errFunc_1 = errFunc_inner
								var errFunc_inner_1 = errFunc(__filename + ' line: ' + __line + '\nelement cannot be found, \nselectorType: css, selector: '+ selectorText);
								fooString_1 = fooString_1.replace(/selectorText/g, selectorText);
								return function(){
									browser.executeScript(fooString_1);
								}
							})();
							expect(ele.isPresent()).toBe(true);
							browser.executeScript("arguments[0].scrollIntoView();", ele.getWebElement());
							ele.click().then(
								function(){},
								function(){
									helper.scrollElemFinderIntoView(ele.getWebElement());
									ele.click().then(
										function(){},
										errFunc_inner
									)
								}
							)
							// var isClickable = global.EC.elementToBeClickable(ele);
							// browser.wait(isClickable, 10000, 'timeout' ).then(
							// 	function(){
							// 		ele.click();
							// 	},errFunc_inner
							// )

						}else if(selectorType == 'xpath'){
							ele = element(by[selectorType](selectorText));
							expect(ele.isPresent()).toBe(true);
							browser.executeScript("arguments[0].scrollIntoView();", ele.getWebElement());
							ele.click().then(
								function(){},
								function(){
									helper.scrollElemFinderIntoView(ele.getWebElement());
									ele.click().then(
										function(){},
										errFunc_inner
									)
								}
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
							var fooString;
							if(selectorText.indexOf("'") != -1 && selectorText.indexOf('"') != -1 && selectorText.indexOf("'") < selectorText.indexOf('"')){
								fooString = 'return $("selectorText")'
							}else if(selectorText.indexOf("'") != -1 && selectorText.indexOf('"') != -1 && selectorText.indexOf("'") > selectorText.indexOf('"')){
								fooString = "return $('selectorText')"
							}else if(selectorText.indexOf("'") != -1){
								fooString = 'return $("selectorText")'
							}else{
								fooString = "return $('selectorText')"
							}
							//selectorText = selectorText.replace('"', '\"');
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
					case 'storeEval':
						var errFunc_inner = errFunc(__filename + ' line: ' + __line + '\nEval failed');
						browser.executeScript(data1).then(
							function(res){
								global.storeMap[data2] = res
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
							var fooString;
							if(selectorText.indexOf("'") != -1 && selectorText.indexOf('"') != -1 && selectorText.indexOf("'") < selectorText.indexOf('"')){
								fooString = 'return $("selectorText")'
							}else if(selectorText.indexOf("'") != -1 && selectorText.indexOf('"') != -1 && selectorText.indexOf("'") > selectorText.indexOf('"')){
								fooString = "return $('selectorText')"
							}else if(selectorText.indexOf("'") != -1){
								fooString = 'return $("selectorText")'
							}else{
								fooString = "return $('selectorText')"
							}
							//selectorText = selectorText.replace('"', '\"');
							fooString = fooString.replace('selectorText', selectorText);
							var foo = new Function(fooString);
							ele = element(by.js(foo));
						}else{
							ele = element(by[selectorType](selectorText));
						}
						data2 = data2.replace('*', '').replace('*', '');
						var errFunc_inner = errFunc(__filename + ' line: ' + __line + '\nassert text failed, expect: ' + data2);
						browser.wait(global.EC.textToBePresentInElement(ele, data2), 5000).then(
							function(){},errFunc_inner
						)
						//expect(ele.getText()).toEqual(data2, __filename + ' line: ' + __line + '\nassert text of element failed, \nselectorType: css, selector: '+ selectorText);
						break;
					default:
						throw Error('unsupported action: ' + action);

			}
    }
	)
})});
