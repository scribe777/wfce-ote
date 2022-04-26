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

// store the top and tail of the js so the tests can reuse and only focus on the content of the <body> tag
const xmlHead = '<?xml  version="1.0" encoding="utf-8"?><!DOCTYPE TEI [<!ENTITY om ""><!ENTITY lac ""><!ENTITY lacorom "">]>' +
								'<?xml-model href="TEI-NTMSS.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>' +
								'<TEI xmlns="http://www.tei-c.org/ns/1.0">' +
								'<teiHeader><fileDesc><titleStmt><title/></titleStmt>' +
								'<publicationStmt><publisher/></publicationStmt>' +
								'<sourceDesc><msDesc><msIdentifier></msIdentifier></msDesc></sourceDesc>' +
								'</fileDesc></teiHeader><text><body>';
const xmlTail = '</body></text></TEI>';


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


// General annotation tests where nothing in the XML should change
const generalAnnotation = new Map([
	[ 'simple correction',
		'<app><rdg type="orig" hand="firsthand"><w>correctedword</w></rdg>' +
		'<rdg type="corr" hand="corrector"><w>word</w></rdg></app>'
	],
	[ 'uncertain midword',
		'<w>w<unclear reason="faded ink">or</unclear>d</w>'
	],
	[ 'expanded full word',
		'<w>this</w><w>is</w><w>my</w><w><ex rend="÷">symbol</ex></w><w>as</w><w>word</w>'
	]
]);

generalAnnotation.forEach((value, key, map) => {
	test('generalAnnotation: ' + key, () => {
		let testInput, tei;
		testInput = xmlHead + value + xmlTail;
		testDOM.window.eval(`setTEI('${testInput}');`);
		tei = testDOM.window.eval(`getTEI();`);
		expect(tei).toBe(testInput);
	});
});


// General annotation tests when changes are expected between input and output
const generalAnnotation2 = new Map([
	[ '<w> tags are correctly added to text',
	  [ 'these are my words for tags',
	 		'<w>these</w><w>are</w><w>my</w><w>words</w><w>for</w><w>tags</w>'
 		],
	],
  [ '<w> tags are correctly added to text if nomina sacra already present',
	  [ 'these are <abbr type="nomSac"><hi rend="overline">word</hi></abbr> words for tags',
			'<w>these</w><w>are</w><w><abbr type="nomSac"><hi rend="overline">word</hi></abbr></w><w>words</w><w>for</w><w>tags</w>'
		]
 	]
	// ideally the code would allow this to work for protection of legacy transcriptions
	// ['If <ex> tags are provided as a full word without <w> tags then <w> tags are added',
	// ['<?xml  version="1.0" encoding="utf-8"?><!DOCTYPE TEI [<!ENTITY om ""><!ENTITY lac ""><!ENTITY lacorom "">]>' +
	// '<?xml-model href="TEI-NTMSS.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>' +
	// '<TEI xmlns="http://www.tei-c.org/ns/1.0">' +
	// '<teiHeader><fileDesc><titleStmt><title/></titleStmt>' +
	// '<publicationStmt><publisher/></publicationStmt>' +
	// '<sourceDesc><msDesc><msIdentifier></msIdentifier></msDesc></sourceDesc>' +
	// '</fileDesc></teiHeader><text><body>' +
	// '<w>these</w><w>are</w><w>my</w><ex>words</ex><w>for</w><w>tags</w>' +
	// '</body></text></TEI>',
	//
	// '<?xml  version="1.0" encoding="utf-8"?><!DOCTYPE TEI [<!ENTITY om ""><!ENTITY lac ""><!ENTITY lacorom "">]>' +
	// '<?xml-model href="TEI-NTMSS.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>' +
	// '<TEI xmlns="http://www.tei-c.org/ns/1.0">' +
	// '<teiHeader><fileDesc><titleStmt><title/></titleStmt>' +
	// '<publicationStmt><publisher/></publicationStmt>' +
	// '<sourceDesc><msDesc><msIdentifier></msIdentifier></msDesc></sourceDesc>' +
	// '</fileDesc></teiHeader><text><body>' +
	// '<w>these</w><w>are</w><w>my</w><w><ex>words</ex></w><w>for</w><w>tags</w>' +
	// '</body></text></TEI>']
  // ]

]);

generalAnnotation2.forEach((value, key, map) => {
	test('generalAnnotation2: ' + key, () => {
		let testInput, expectedOutput, tei;
		testInput = xmlHead + value[0] + xmlTail;
		expectedOutput = xmlHead + value[1] + xmlTail;
		testDOM.window.eval(`setTEI('${testInput}');`);
		tei = testDOM.window.eval(`getTEI();`);
		expect(tei).toBe(expectedOutput);
	});
});


// Book/chapter/verse structure tests where nothing in the XML should change
const textStructure = new Map([
	[ 'Standard structure single verse',
		'<div type="book" n="B04"><div type="chapter" n="B04K3">' +
		'<ab n="B04K3V2"><w>the</w><w>second</w><w>verse</w><w>of</w><w>chapter</w><w>three</w></ab></div></div>'
	],
	[ 'Standard structure multiple verses',
		'<div type="book" n="B04"><div type="chapter" n="B04K3">' +
		'<ab n="B04K3V2"><w>the</w><w>second</w><w>verse</w><w>of</w><w>chapter</w><w>one</w></ab>' +
		'<ab n="B04K3V3"><w>third</w><w>verse</w><w>of</w><w>chapter</w><w>3</w></ab></div></div>'
	],
]);

textStructure.forEach((value, key, map) => {
	test('textStructure: ' + key, () => {
		let testInput, tei;
		testInput = xmlHead + value + xmlTail;
		testDOM.window.eval(`setTEI('${testInput}');`);
		tei = testDOM.window.eval(`getTEI();`);
		expect(tei).toBe(testInput);
	});
});

// Page/column/line annotation tests where nothing in the XML should change
// In the real world the siglum of the ms would appear after the dash in @xml:id of pb and @n of cb and lb
const pageLayout = new Map([
	[ 'initial page',
		'<pb n="1r" type="folio" xml:id="P1r-"/><cb n="P1rC1-"/><lb n="P1rC1L-"/><w>my</w><w>first</w><w>page</w>'
	],
	[ 'mid-text page',
		'<w>end</w><w>of</w><w>page</w><pb n="1v" type="folio" xml:id="P1v-"/><cb n="P1vC1-"/><lb n="P1vC1L-"/>' +
		'<w>my</w><w>second</w><w>page</w>'
	],
	[ 'mid-word page',
		'<w>half</w><w>of</w><w>wo<pb n="1v" type="folio" xml:id="P1v-" break="no"/><cb n="P1vC1-"/>' +
		'<lb n="P1vC1L-"/>rd</w><w>on</w><w>second</w><w>page</w>'
	],
	[ 'between-word column',
		'<pb n="1v" type="folio" xml:id="P1v-"/><cb n="P1vC1-"/><lb n="P1vC1L-"/><w>my</w><w>first</w><w>column</w>' +
		'<cb n="P1vC2-"/><lb n="P1vC2L-"/><w>my</w><w>second</w><w>column</w>'
	],
	[ 'mid-word column',
		'<pb n="1v" type="folio" xml:id="P1v-"/><cb n="P1vC1-"/><lb n="P1vC1L-"/><w>my</w><w>first</w><w>colu' +
		'<cb n="P1vC2-" break="no"/><lb n="P1vC2L-"/>mn</w><w>my</w><w>second</w><w>column</w>'
	],
	[ 'between-word linebreak',
		'<pb n="1v" type="folio" xml:id="P1v-"/><cb n="P1vC1-"/><lb n="P1vC1L-"/><w>my</w><w>first</w><w>line</w>' +
		'<lb n="P1vC1L-"/><w>my</w><w>second</w><w>line</w>'
	],
	[ 'mid-word linebreak',
		'<pb n="1v" type="folio" xml:id="P1v-"/><cb n="P1vC1-"/><lb n="P1vC1L-"/><w>my</w><w>first</w><w>li' +
		'<lb n="P1vC1L-" break="no"/>ne</w><w>my</w><w>second</w><w>line</w>'
	],
	// [ 'lone quire break',
	// 	'<gb n="3"/>'
	// ],
	// [ 'quire break with all the rest',
	//   '<gb n="3"/><pb n="1r" type="folio" xml:id="P1r-"/><cb n="P1rC1-"/><lb n="P1rC1L-"/>'
	// ],
]);

pageLayout.forEach((value, key, map) => {
	test('roundtrip: ' + key, () => {
		let testInput, tei;
		testInput = xmlHead + value + xmlTail;
		testDOM.window.eval(`setTEI('${testInput}');`);
		tei = testDOM.window.eval(`getTEI();`);
		expect(tei).toBe(testInput);
	});
});


// Special tests for ITSEE which test for unwanted behaviour that is currently being fixed in the export in the ITSEE
// tools. If ever these tests fail, the ITSEE code can be changed.
const specialItsee = new Map([
	[ 'test for seg after internal word page break',
		[ '<pb n="1r" type="folio" xml:id="P1r-"/><cb n="P1rC1-"/><lb n="P1rC1L-"/><w>here</w><w>is</w><w>the</w>' +
		  '<w>text</w><lb n="P1rC1L-"/><w>of</w><w>the</w><w>page</w><w>whi' +
			'<pb n="1v" type="folio" xml:id="P1v-" break="no"/><cb n="P1vC1-"/><lb n="P1vC1L-"/>' +
			'<fw type="runTitle"><w>Running</w><w>Title</w></fw>ch</w><w>ends</w><w>mid</w><w>word</w>',

			'<pb n="1r" type="folio" xml:id="P1r-"/><cb n="P1rC1-"/><lb n="P1rC1L-"/><w>here</w><w>is</w><w>the</w>' +
			'<w>text</w><lb n="P1rC1L-"/><w>of</w><w>the</w><w>page</w><w>whi' +
			'<pb n="1v" type="folio" xml:id="P1v-" break="no"/><cb n="P1vC1-"/><lb n="P1vC1L-"/></w>' +
			'<fw type="runTitle"><w>Running</w><w>Title</w></fw><w>ch</w><w>ends</w><w>mid</w><w>word</w>'
		]
	]
]);

specialItsee.forEach((value, key, map) => {
	test('specialItsee: ' + key, () => {
		let testInput, expectedOutput, tei;
		testInput = xmlHead + value[0] + xmlTail;
		expectedOutput = xmlHead + value[1] + xmlTail;
		testDOM.window.eval(`setTEI('${testInput}');`);
		tei = testDOM.window.eval(`getTEI();`);
		expect(tei).toBe(expectedOutput);
	});
});
