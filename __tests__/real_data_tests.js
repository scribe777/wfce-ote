/**
 * @jest-environment jsdom
 */
jest.setTimeout(200000);
const fs = require('fs');
const jsdom = require("jsdom");

// we supply our own virtualConsole here so we can skip "unimplemented" jsdom errors for things like window.focus
const virtualConsole = new jsdom.VirtualConsole();

// you can forward all to node console
virtualConsole.sendTo(console, { omitJSDOMErrors : true });

const { JSDOM } = jsdom;

// directory path
const dir = './__tests__/data_files/';

let xmlData;

beforeAll(async () => {
    xmlData = new Map();
    const filenames = await fs.promises.readdir(dir);
    for (let file of filenames) {
        const data = await fs.promises.readFile(dir + file);
        xmlData.set(file, data.toString().replace(/\n/g, '').replace(/\s+/g, ' ').replace(/> </g, '><').replace(/" >/g, '">'));   
    } 
});

// first test is simply to see if we can create our dom with a tinymce object and our plugin
test('initiate tinymce', done => {
	JSDOM.fromFile('wce-ote/index.html', {
		virtualConsole : virtualConsole,
		runScripts     : 'dangerously',
		resources      : 'usable'
	}).then(dom => {
		dom.window.onModulesLoaded = () => {
			// if we were successful, let's save our dom to the outer testDOM for subsequent tests
			testDOM = dom;
			done();
		};
	});
});

test('xml files', () => {
    for (const [key, value] of xmlData.entries()) {
        testInput = value;
        expectedOutput = value;
        testDOM.window.eval(`setTEI('${testInput}');`);
        tei = testDOM.window.eval(`getTEI();`);
        expect(tei).toBe(expectedOutput);
    }
});
