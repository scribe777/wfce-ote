/**
 * @jest-environment jsdom
 */

const jsdom = require("jsdom");

// we supply our own virtualConsole here so we can skip "unimplemented" jsdom errors for things like window.focus
const virtualConsole = new jsdom.VirtualConsole();

// you can forward all to node console
virtualConsole.sendTo(console, { omitJSDOMErrors : true });

// or you can decide which messages you want to see or hide like this
/*
virtualConsole.sendTo({
		error: (x) => {  console.log(x);  },
		warn : (x) => {  console.log(x);  },
		info : (x) => {  console.log(x);  },
		dir  : (x) => {  console.log(x);  },
		log  : (x) => {  console.log(x);  },
	},
	{ omitJSDOMErrors : true }
);
*/

const { JSDOM } = jsdom;

// here is our dom we will setup in our first test and use in subsequent tests
var testDOM = null;


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


// Roundtrip tests
const roundtrips = new Map([
	[ 'simple correction',
	  '<?xml  version="1.0" encoding="utf-8"?><!DOCTYPE TEI [<!ENTITY om ""><!ENTITY lac ""><!ENTITY lacorom "">]><?xml-model href="TEI-NTMSS.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?><TEI xmlns="http://www.tei-c.org/ns/1.0"><teiHeader><fileDesc><titleStmt><title/></titleStmt><publicationStmt><publisher/></publicationStmt><sourceDesc><msDesc><msIdentifier></msIdentifier></msDesc></sourceDesc></fileDesc></teiHeader><text><body><app><rdg type="orig" hand="firsthand"><w>correctedword</w></rdg><rdg type="corr" hand="corrector"><w>word</w></rdg></app></body></text></TEI>'
	],
	[ 'uncertain midword',
	  '<?xml  version="1.0" encoding="utf-8"?><!DOCTYPE TEI [<!ENTITY om ""><!ENTITY lac ""><!ENTITY lacorom "">]><?xml-model href="TEI-NTMSS.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?><TEI xmlns="http://www.tei-c.org/ns/1.0"><teiHeader><fileDesc><titleStmt><title/></titleStmt><publicationStmt><publisher/></publicationStmt><sourceDesc><msDesc><msIdentifier></msIdentifier></msDesc></sourceDesc></fileDesc></teiHeader><text><body><w>w<unclear reason="faded ink">or</unclear>d</w></body></text></TEI>'
	]
]);

roundtrips.forEach((value, key, map) => {
	test('rountrip: ' + key, () => {
		testDOM.window.eval(`setTEI('${value}');`);
		var tei = testDOM.window.eval(`getTEI();`);
		expect(tei).toBe(value);
	});
});


