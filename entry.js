global.storeMap = {};
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
	var stepId = 1;
	var tmpStep = {};
	var tokens = htmlString.match(/<td>(.|[\n\r])*?<\/td>/g).map(function(val){return val.replace('</td>', '')}).map(function(val){return val.replace('<td>', '')}).map(function(val){return val.replace('\r\n', ' ')});
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
				tmpStep.data3 = stepId;
				stepId += 1;
				html2json.steps.push(tmpStep);
				tmpStep = {};
				j = 0;
			}else{
				throw Error('error in parsing html to json');
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
			function executeStepGI(x){
				if(x >= testFile.steps.length){
					return;
				}

				var step = testFile.steps[x];
        var action = step.action;
				var data1 = step.data1;
				var data2 = step.data2;
				browser.controlFlow().execute(
					function(){
						console.log('action' + action + '\n');
						console.log('data1' + data1 + '\n');
						console.log('data3' + step.data3 + '\n');
					}
				);
        switch (action) {
          case 'open':
            browser.get(step.data1).then(
							function(){
								executeStepGI(x+1);
							}
						);
            break;
					case 'store':
						global.storeMap[data2] = data1;
						executeStepGI(x+1);
            break;
					case 'waitForPageToLoad':
						browser.waitForAngular().then(
							function(){
								executeStepGI(x+1);
							}
						)
						break;
					case 'waitForElementPresent':
						for(var key in global.storeMap){
							var keyPattern = '${' + key;
							keyPattern += '}';
							if(data1.indexOf(keyPattern) > -1){
								data1 = data1.replace(keyPattern, global.storeMap[key]);
							}
							if(data2.indexOf(keyPattern) > -1){
								data2 = data2.replace(keyPattern, global.storeMap[key]);
							}
						}
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
						browser.wait(global.EC.presenceOf(ele, 10000)).then(
							function(){
								executeStepGI(x+1);
							},function(err){
								browser.controlFlow().execute(function(){console.log(selectorType + '::' + selectorText +' is not a valid selector or not present')})
								err.message += '\n' + selectorType + ':' + selectorText +' is not a valid selector or not present';
								browser.pause();
								throw err;
							}
						);
						break;
					case 'type':
						for(var key in global.storeMap){
							var keyPattern = '${' + key;
							keyPattern += '}';
							if(data1.indexOf(keyPattern) > -1){
								data1 = data1.replace(keyPattern, global.storeMap[key]);
							}
							if(data2.indexOf(keyPattern) > -1){
								data2 = data2.replace(keyPattern, global.storeMap[key]);
							}
						}
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

						ele.sendKeys(data2).then(
							function(){
								executeStepGI(x+1);
							},function(err){
								if(data1.includes('ace')){
									browser.actions().doubleClick($('div.ace_content')).perform();
									$('textarea.ace_text-input').sendKeys(data2).then(
										function(){
											executeStepGI(x+1);
										},function(err1){
											throw err1;
										}
									)
								}
							}
						);
						break;
					case 'click':
						for(var key in global.storeMap){
							var keyPattern = '${' + key;
							keyPattern += '}';
							if(data1.indexOf(keyPattern) > -1){
								data1 = data1.replace(keyPattern, global.storeMap[key]);
							}
							if(data2.indexOf(keyPattern) > -1){
								data2 = data2.replace(keyPattern, global.storeMap[key]);
							}
						}
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
						ele.click().then(
							function(){
								executeStepGI(x+1);
							},function(err){
								if(selectorType == 'css'){
									var fooString = "return $('selectorText').click()"
									selectorText = selectorText.replace('"', '\"');
									fooString = fooString.replace('selectorText', selectorText);
									var foo = new Function(fooString);
									browser.executeScript(fooString).then(
										function(res){
											if(res == null){
												browser.controlFlow().execute(function(){console.log('ERROR: selectorType:'+selectorType+',selectorText:'+selectorText+'\n')}).then(
													function(){
														browser.pause();
														throw err;
													}
												);
											}else{
												executeStepGI(x+1);
											}
										}
									)
								}else{

									browser.controlFlow().execute(function(){console.log('ERROR: selectorType:'+selectorType+',selectorText:'+selectorText+'\n')}).then(
									function(){
										browser.pause();
									}
								);
							}

							}
						);
						break;
					case 'doubleClick':
						for(var key in global.storeMap){
							var keyPattern = '${' + key;
							keyPattern += '}';
							if(data1.indexOf(keyPattern) > -1){
								data1 = data1.replace(keyPattern, global.storeMap[key]);
							}
							if(data2.indexOf(keyPattern) > -1){
								data2 = data2.replace(keyPattern, global.storeMap[key]);
							}
						}
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
						browser.actions().doubleClick(ele).perform().then(
							function(){
								executeStepGI(x+1);
							}
						);
						break;
					case 'pause':
						browser.sleep(data1).then(
							function(){
								executeStepGI(x+1);
							}
						);
					case 'runScript':
						browser.executeScript(data1).then(
							function(){
								//browser.controlFlow().execute(function(){console.log(data1)});
								executeStepGI(x+1);
							}
						);
						break;
					default:
						browser.controlFlow().execute(
							function(){
								console.log('unsupported action:' + action);
							}
						).then(
							function(){
								executeStepGI(x+1);
							}
						)

				}
			}

			var jsonString = fs.readFileSync(jsonFilePath,'utf-8',function(err,data){
		    if(err){
		      return console.error(err);
		    }

		  });
			parser.write(jsonString).close();
			testFile.lineNumbers = lineNumberLog.slice();
			testFile.jsonFilePath = jsonFilePath.slice();
			if(testFile.testInfo.type == null || testFile.testInfo.type != "GI"){
				executeStep(0);
			}else{
				executeStepGI(0);
			}


    })});
