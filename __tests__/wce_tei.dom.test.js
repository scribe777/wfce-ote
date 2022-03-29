/**
 * @jest-environment jsdom
 */
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

// we supply our own virtualConsole here so we can skip "unimplemented" jsdom errors for things like window.focus
const virtualConsole = new jsdom.VirtualConsole();
// you can forward all to node console
virtualConsole.sendTo(console, { omitJSDOMErrors : true });
var testDOM = null;


const wce_tei = require('../wce-ote/wce_tei');

test('use jsdom in this test file', () => {
  const element = document.createElement('div');
  expect(element).not.toBeNull();
});


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

// TEI to HTML tests and the reverse
const teiToHtmlAndBack = new Map([
  // w
	[ '<w> tag',
	  [ '<w>word</w>',
	 		'word ' //space at end is important
 		],
	],
  // ex
  [ 'part word <ex> tag',
	  [ '<w>wo<ex>rd</ex></w>',
	 		'wo<span class="part_abbr" wce="__t=part_abbr&amp;__n=&amp;exp_rend=&amp;exp_rend_other=">' +
      '<span class="format_start mceNonEditable">‹</span>(rd)<span class="format_end mceNonEditable">›</span>' +
      '</span> ' //space at end is important
 		],
	],
  [ 'whole word <ex> tag',
	  [ '<w><ex rend="÷">word</ex></w>',
	 		'<span class="part_abbr" wce="__t=part_abbr&amp;__n=&amp;exp_rend_other=&amp;exp_rend=%C3%B7">' +
      '<span class="format_start mceNonEditable">‹</span>(word)<span class="format_end mceNonEditable">›</span>' +
      '</span> ' //space at end is important
 		],
	],
  // OTE-TODO: Add here a test for whole word <ex> and see if you can make that work correctly in input

  // unclear
  [ 'part word <unclear> tag with no reason',
	  [ '<w>wor<unclear>d</unclear></w>',
	 		'wor<span class="unclear" wce_orig="d" wce="__t=unclear&amp;__n=&amp;unclear_text_reason=&amp;unclear_text_reason_other=">' +
      '<span class="format_start mceNonEditable">‹</span>ḍ<span class="format_end mceNonEditable">›</span></span> ' //space at end is important
 		],
	],
  // OTE-TODO: faded ink should have an underscore rather than a space, same for all other reason attributes
  [ 'whole word <unclear> tag with reason',
	  [ '<w><unclear reason="faded ink">word</unclear></w>',
	 		'<span class="unclear" wce_orig="word" wce="__t=unclear&amp;__n=&amp;unclear_text_reason_other=&amp;unclear_text_reason=faded ink">' +
      '<span class="format_start mceNonEditable">‹</span>ẉọṛḍ<span class="format_end mceNonEditable">›</span></span> ' //space at end is important
 		],
	],
  // divs
  // OTE-TODO: these will need to change when references change
  [ 'book div',
	  [ '<div type="book" n="B04"><w>The</w><w>content</w><w>of</w><w>my</w><w>book</w></div>',
	 		' <span class="book_number mceNonEditable" wce="__t=book_number" id="1">4</span> The content of my book ' //spaces at beg and end are important
 		],
	],
  [ 'chapter div', // note that book value is empty until we combine them
	  [ '<div type="chapter" n="BK1"><w>The</w><w>content</w><w>of</w><w>my</w><w>chapter</w></div>',
	 		' <span class="chapter_number mceNonEditable" wce="__t=chapter_number" id="1">1</span> The content of my chapter ' //spaces at beg and end are important
 		],
	],
  [ 'book and chapter div',
	  [ '<div type="book" n="B04"><div type="chapter" n="B04K1"><w>The</w><w>content</w><w>of</w><w>my</w><w>chapter</w></div></div>',
	 		' <span class="book_number mceNonEditable" wce="__t=book_number" id="1">4</span>  ' +
      '<span class="chapter_number mceNonEditable" wce="__t=chapter_number" id="2">1</span> The content of my chapter ' //spaces at beg and end are important
 		],
	],
  [ 'lection div',
	  [ '<div type="lection" n="R12"><w>The</w><w>content</w><w>of</w><w>my</w><w>lection</w></div>',
	 		' <span class="lection_number mceNonEditable" wce="__t=lection_number&amp;number=R12" id="1">Lec</span> The content of my lection ' //spaces at beg and end are important
 		],
	],
  [ 'lection, book and chapter div',
    [ '<div type="lection" n="R12"><div type="book" n="B04"><div type="chapter" n="B04K1">' +
      '<w>The</w><w>content</w><w>of</w><w>my</w><w>chapter</w></div></div></div>',
      ' <span class="lection_number mceNonEditable" wce="__t=lection_number&amp;number=R12" id="1">Lec</span>  ' +
      '<span class="book_number mceNonEditable" wce="__t=book_number" id="2">4</span>  '+
      '<span class="chapter_number mceNonEditable" wce="__t=chapter_number" id="3">1</span> The content of my chapter ' //spaces at beg and end are important
    ],
  ],
  // TODO: add inscriptio and subscriptio test here






  [ 'simple <pc> tag',
	  [ '<pc>.</pc>',
	 		'<span class="pc" wce="__t=pc"><span class="format_start mceNonEditable">‹</span>.<span class="format_end mceNonEditable">›</span></span> ' //space at end is important
 		],
	]
]);

teiToHtmlAndBack.forEach((value, key, map) => {
	test('TEI2HTML: ' + key, () => {
		let testInput, expectedOutput, html;
		testInput = xmlHead + value[0] + xmlTail;
		expectedOutput = '<TEMP>' + value[1] + '</TEMP>';
		html = testDOM.window.eval(`getHtmlByTei('${testInput}');`);
		expect(html.htmlString).toBe(expectedOutput);
	});
  test('HTML2TEI: ' + key, () => {
		let testInput, expectedOutput, xml;
		testInput = value[1];
		expectedOutput = xmlHead + value[0] + xmlTail;
		xml = testDOM.window.eval(`getTeiByHtml('${testInput}', {});`);
		expect(xml).toBe(expectedOutput);
	});

});
