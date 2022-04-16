const puppeteer = require('puppeteer');
const path = require('path');

let browser, page, frame;

// store the top and tail of the js so the tests can reuse and only focus on the content of the <body> tag
const xmlHead = '<?xml  version="1.0" encoding="utf-8"?><!DOCTYPE TEI [<!ENTITY om ""><!ENTITY lac ""><!ENTITY lacorom "">]>' +
								'<?xml-model href="TEI-NTMSS.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>' +
								'<TEI xmlns="http://www.tei-c.org/ns/1.0">' +
								'<teiHeader><fileDesc><titleStmt><title/></titleStmt>' +
								'<publicationStmt><publisher/></publicationStmt>' +
								'<sourceDesc><msDesc><msIdentifier></msIdentifier></msDesc></sourceDesc>' +
								'</fileDesc></teiHeader><text><body>';
const xmlTail = '</body></text></TEI>';


beforeAll(async () => {
  jest.setTimeout(200000);
  browser = await puppeteer.launch({
    // for local testing
    // headless: false,
    // slowMo: 80,
    // args: ['--window-size=1920,1080', '--disable-web-security']

    // for online testing (only ever commit these)
     headless: true,
     args: ['--disable-web-security']
   });
});

beforeEach(async () => {
  page = await browser.newPage();
  await page.goto(`file:${path.join(__dirname, '..', 'wce-ote', 'index.html')}`);
  let frameHandle = await page.$("iframe[id='wce_editor_ifr']");
  frame = await frameHandle.contentFrame();
});

afterAll(async () => {
  await browser.close();
});

test('test basic words', async () => {
  await frame.type('body#tinymce', 'my words');
  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('my words');
  const xmlData = await page.evaluate(`getTEI()`);
  expect(xmlData).toBe(xmlHead + '<w>my</w><w>words</w>' + xmlTail);

}, 200000);

test('test expanded text', async () => {
  await frame.type('body#tinymce', 'my words');
  await page.keyboard.down('Shift');
  for (let i = 0; i < 'rds'.length; i++) {
    await page.keyboard.press('ArrowLeft');
  }
  await page.keyboard.up('Shift');
  // open A menu
  await page.click('button#mceu_14-open');
  // navigate submenu
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  // access mnu window and make selection
  const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
  const menuFrame = await menuFrameHandle.contentFrame();
  await menuFrame.click('input#insert');
  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('my wo<span class=\"part_abbr\" wce_orig=\"rds\" wce=\"__t=part_abbr&amp;__n=&amp;' +
                        'help=Help&amp;exp_rend=&amp;exp_rend_other=\"><span class=\"format_start mceNonEditable\">‹' +
                        '</span>(rds)<span class=\"format_end mceNonEditable\">›</span></span>');
}, 200000);

test('test expanded whole word with symbol', async () => {
  await frame.type('body#tinymce', 'my words');
  await page.keyboard.down('Shift');
  for (let i = 0; i < 'words'.length; i++) {
    await page.keyboard.press('ArrowLeft');
  }
  await page.keyboard.up('Shift');
  // open A menu
  await page.click('button#mceu_14-open');
  // navigate submenu
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  // access mnu window and make selection
  const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
  const menuFrame = await menuFrameHandle.contentFrame();
  await menuFrame.select('select[id="exp_rend"]', '÷');
  await menuFrame.click('input#insert');
  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('my <span class=\"part_abbr\" wce_orig=\"words\" wce=\"__t=part_abbr&amp;__n=&amp;' +
                        'help=Help&amp;exp_rend=%C3%B7&amp;exp_rend_other=\">' +
                        '<span class=\"format_start mceNonEditable\">‹</span>(words)' +
                        '<span class=\"format_end mceNonEditable\">›</span></span>');
}, 200000);

test('whole word unclear with no reason', async () => {
  await frame.type('body#tinymce', 'my words');
  await page.keyboard.down('Shift');
  for (let i = 0; i < 'words'.length; i++) {
    await page.keyboard.press('ArrowLeft');
  }
  await page.keyboard.up('Shift');
  // open D menu
  await page.click('button#mceu_12-open');
  // navigate submenu
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  // access mnu window and make selection
  const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
  const menuFrame = await menuFrameHandle.contentFrame();
  await menuFrame.click('input#insert');
  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('my <span class=\"unclear\" wce_orig=\"words\" wce=\"__t=unclear&amp;__n=&amp;' +
                        'help=Help&amp;unclear_text_reason=&amp;unclear_text_reason_other=\">' +
                        '<span class=\"format_start mceNonEditable\">‹</span>ẉọṛḍṣ' +
                        '<span class=\"format_end mceNonEditable\">›</span></span>');
}, 200000);

test('part word unclear with reason', async () => {
  await frame.type('body#tinymce', 'my words');
  await page.keyboard.down('Shift');
  for (let i = 0; i < 'rds'.length; i++) {
    await page.keyboard.press('ArrowLeft');
  }
  await page.keyboard.up('Shift');
  // open D menu
  await page.click('button#mceu_12-open');
  // navigate submenu
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  // access menu window and make selection
  const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
  const menuFrame = await menuFrameHandle.contentFrame();
  await menuFrame.select('select[id="unclear_text_reason"]', 'damage to page');
  await menuFrame.click('input#insert');
  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('my wo<span class="unclear" wce_orig="rds" wce="__t=unclear&amp;__n=&amp;help=Help' +
                        '&amp;unclear_text_reason=damage%20to%20page&amp;unclear_text_reason_other=">' +
                        '<span class="format_start mceNonEditable">‹</span>ṛḍṣ' +
                        '<span class="format_end mceNonEditable">›</span></span>');
  const xmlData = await page.evaluate(`getTEI()`);
  expect(xmlData).toBe(xmlHead + '<w>my</w><w>wo<unclear reason="damage to page">rds</unclear></w>' + xmlTail);
}, 200000);

// space
test('space between words', async () => {
  await frame.type('body#tinymce', 'space between  words');
  for (let i = 0; i < ' words'.length; i++) {
    await page.keyboard.press('ArrowLeft');
  }
  // open P menu
  await page.click('button#mceu_17-open');
  // navigate submenu
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  // access menu window and make selection
  const menuFrameHandle = await page.$('div[id="mceu_41"] > div > div > iframe');
  const menuFrame = await menuFrameHandle.contentFrame();
  await menuFrame.type('input#sp_extent', '5');
  await menuFrame.click('input#insert');
  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('space between <span class=\"spaces\" wce=\"__t=spaces&amp;__n=&amp;original_spaces_text=&amp;help=Help&amp;sp_unit=char&amp;sp_unit_other=&amp;sp_extent=5\"><span class=\"format_start mceNonEditable\">‹</span>sp<span class=\"format_end mceNonEditable\">›</span></span> words');
  const xmlData = await page.evaluate(`getTEI()`);
  expect(xmlData).toBe(xmlHead + '<w>space</w><w>between</w><space unit="char" extent="5"/><w>words</w>' + xmlTail);
}, 200000);

// pc typed in
test('test pc typed', async () => {
  await frame.type('body#tinymce', 'my words.');
  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('my words<span class=\"pc\" wce_orig=\"\" wce=\"__t=pc\">' +
                        '<span class=\"format_start mceNonEditable\">‹</span>.' +
                        '<span class=\"format_end mceNonEditable\">›</span></span>');
  const xmlData = await page.evaluate(`getTEI()`);
  expect(xmlData).toBe(xmlHead + '<w>my</w><w>words</w><pc>.</pc>' + xmlTail);
}, 200000);

// OTE-TODO: check what semicolon on the punctuation menu is doing cause its weird when used in a test
// pc with menu
test('test pc with menu', async () => {
  await frame.type('body#tinymce', 'my words');
  // open P menu
  await page.click('button#mceu_17-open');
  // navigate to question mark on submenu
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('my words<span class=\"pc\" wce_orig=\"\" wce=\"__t=pc\">' +
                        '<span class=\"format_start mceNonEditable\">‹</span>?' +
                        '<span class=\"format_end mceNonEditable\">›</span></span>');
  const xmlData = await page.evaluate(`getTEI()`);
  expect(xmlData).toBe(xmlHead + '<w>my</w><w>words</w><pc>?</pc>' + xmlTail);
}, 200000);

// abbr
test('test abbr', async () => {
  await frame.type('body#tinymce', 'a ns abbreviation');

  for (let i = 0; i < ' abbreviation'.length; i++) {
    await page.keyboard.press('ArrowLeft');
  }
  await page.keyboard.down('Shift');
  for (let i = 0; i < 'ns'.length; i++) {
    await page.keyboard.press('ArrowLeft');
  }
  await page.keyboard.up('Shift');
  // open A menu
  await page.click('button#mceu_14-open');
  // open abbreviation menu
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  // use defaults
  const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
  const menuFrame = await menuFrameHandle.contentFrame();
  await menuFrame.click('input#insert');

  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('a <span class="abbr_add_overline" wce_orig="ns" wce="__t=abbr&amp;__n=&amp;original_abbr_text=&amp;help=Help&amp;abbr_type=nomSac&amp;abbr_type_other=&amp;add_overline=overline"><span class="format_start mceNonEditable">‹</span>ns<span class="format_end mceNonEditable">›</span></span> abbreviation');
  const xmlData = await page.evaluate(`getTEI()`);
  expect(xmlData).toBe(xmlHead + '<w>a</w><w><abbr type="nomSac"><hi rend="overline">ns</hi></abbr></w><w>abbreviation</w>' + xmlTail);
}, 200000);

// TODO: add more tests on different abbr structures here?

// capitals
test('capitals', async () => {
  await frame.type('body#tinymce', 'Initial capital');

  for (let i = 0; i < 'nitial capital'.length; i++) {
    await page.keyboard.press('ArrowLeft');
  }
  await page.keyboard.down('Shift');
  for (let i = 0; i < 'I'.length; i++) {
    await page.keyboard.press('ArrowLeft');
  }
  await page.keyboard.up('Shift');
  // open O menu
  await page.click('button#mceu_13-open');
  // open abbreviation menu
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  // use defaults
  const menuFrameHandle = await page.$('div[id="mceu_41"] > div > div > iframe');
  const menuFrame = await menuFrameHandle.contentFrame();
  await menuFrame.type('input#capitals_height', '3');
  await menuFrame.click('input#insert');

  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('<span class="formatting_capitals" wce_orig="I" wce="__t=formatting_capitals&amp;__n=&amp;capitals_height=3"><span class="format_start mceNonEditable">‹</span>I<span class="format_end mceNonEditable">›</span></span>nitial capital');
  const xmlData = await page.evaluate(`getTEI()`);
  expect(xmlData).toBe(xmlHead + '<w><hi rend="cap" height="3">I</hi>nitial</w><w>capital</w>' + xmlTail);
}, 200000);

// other ornamentation
test('other ornamentation', async () => {
  await frame.type('body#tinymce', 'test for rendering');

  for (let i = 0; i < ' rendering'.length; i++) {
    await page.keyboard.press('ArrowLeft');
  }
  await page.keyboard.down('Shift');
  for (let i = 0; i < 'for'.length; i++) {
    await page.keyboard.press('ArrowLeft');
  }
  await page.keyboard.up('Shift');
  // open O menu
  await page.click('button#mceu_13-open');
  // open abbreviation menu
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  // use defaults
  const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
  const menuFrame = await menuFrameHandle.contentFrame();
  await menuFrame.type('input#formatting_ornamentation_other', 'underlined');
  await menuFrame.click('input#insert');

  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('test <span class=\"formatting_ornamentation_other\" wce_orig=\"for\" wce=\"__t=formatting_ornamentation_other&amp;__n=&amp;formatting_ornamentation_other=underlined\"><span class=\"format_start mceNonEditable\">‹</span>for<span class=\"format_end mceNonEditable\">›</span></span> rendering');
  const xmlData = await page.evaluate(`getTEI()`);
  expect(xmlData).toBe(xmlHead + '<w>test</w><w><hi rend="underlined">for</hi></w><w>rendering</w>' + xmlTail);
}, 200000);

// example for the colour options
test('colour ornamentation', async () => {
  await frame.type('body#tinymce', 'test for rendering');

  for (let i = 0; i < ' rendering'.length; i++) {
    await page.keyboard.press('ArrowLeft');
  }
  await page.keyboard.down('Shift');
  for (let i = 0; i < 'for'.length; i++) {
    await page.keyboard.press('ArrowLeft');
  }
  await page.keyboard.up('Shift');
  // open O menu
  await page.click('button#mceu_13-open');
  // navigate submenu
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('test <span class=\"formatting_yellow\" wce_orig=\"for\" wce=\"__t=formatting_yellow\"><span class=\"format_start mceNonEditable\">‹</span>for<span class=\"format_end mceNonEditable\">›</span></span> rendering');
  const xmlData = await page.evaluate(`getTEI()`);
  expect(xmlData).toBe(xmlHead + '<w>test</w><w><hi rend="yellow">for</hi></w><w>rendering</w>' + xmlTail);
}, 200000);

// STRUCTURE DIVS

// book
test('book div', async () => {
  // open V menu
  await page.click('button#mceu_18-open');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
  const menuFrame = await menuFrameHandle.contentFrame();
  await menuFrame.click('input#insertBookRadio');
  await menuFrame.type('input#insertBookNumber', '4');
  await menuFrame.click('input#insert');
  await frame.type('body#tinymce', 'The content of my book');

  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('<span class=\"book_number mceNonEditable\" wce=\"__t=book_number\" id=\"book1\"> 4</span>The content of my book');
  const xmlData = await page.evaluate(`getTEI()`);
  expect(xmlData).toBe(xmlHead + '<div type="book" n="B04"><w>The</w><w>content</w><w>of</w><w>my</w><w>book</w></div>' + xmlTail);
}, 200000);

// chapter
test('chapter div', async () => {
  // open V menu
  await page.click('button#mceu_18-open');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
  const menuFrame = await menuFrameHandle.contentFrame();
  await menuFrame.click('input#insertChapterRadio');
  await menuFrame.type('input#insertChapterNumber', '1');
  await menuFrame.click('input#insert');
  await frame.type('body#tinymce', 'The content of my chapter');

  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('<span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\" id=\"chap1\"> 1</span>The content of my chapter');
  const xmlData = await page.evaluate(`getTEI()`);
  expect(xmlData).toBe(xmlHead + '<div type="chapter" n="BK1"><w>The</w><w>content</w><w>of</w><w>my</w><w>chapter</w></div>' + xmlTail);
}, 200000);

// book and chapter
test('book and chapter div', async () => {
  // open V menu
  await page.click('button#mceu_18-open');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
  const menuFrame = await menuFrameHandle.contentFrame();
  await menuFrame.click('input#insertBookRadio');
  await menuFrame.type('input#insertBookNumber', '4');
  await menuFrame.click('input#insert');
  await page.click('button#mceu_18-open');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  const menuFrameHandle2 = await page.$('div[id="mceu_40"] > div > div > iframe');
  const menuFrame2 = await menuFrameHandle2.contentFrame();
  await menuFrame2.click('input#insertChapterRadio');
  await menuFrame2.type('input#insertChapterNumber', '1');
  await menuFrame2.click('input#insert');
  await frame.type('body#tinymce', 'The content of my chapter');

  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('<span class=\"book_number mceNonEditable\" wce=\"__t=book_number\" id=\"book1\"> 4</span> <span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\" id=\"chap2\"> 1</span> The content of my chapter');
  const xmlData = await page.evaluate(`getTEI()`);
  expect(xmlData).toBe(xmlHead + '<div type="book" n="B04"><div type="chapter" n="B04K1"><w>The</w><w>content</w><w>of</w><w>my</w><w>chapter</w></div></div>' + xmlTail);
}, 200000);

// book, chapter and verse
test('book, chapter and verse', async () => {
  // open V menu
  await page.click('button#mceu_18-open');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
  const menuFrame = await menuFrameHandle.contentFrame();
  await menuFrame.click('input#insertBookRadio');
  await menuFrame.type('input#insertBookNumber', '4');
  await menuFrame.click('input#insert');

  await page.click('button#mceu_18-open');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  const menuFrameHandle2 = await page.$('div[id="mceu_40"] > div > div > iframe');
  const menuFrame2 = await menuFrameHandle2.contentFrame();
  await menuFrame2.click('input#insertChapterRadio');
  await menuFrame2.type('input#insertChapterNumber', '1');
  await menuFrame2.click('input#insert');

  await page.click('button#mceu_18-open');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  const menuFrameHandle3 = await page.$('div[id="mceu_41"] > div > div > iframe');
  const menuFrame3 = await menuFrameHandle3.contentFrame();
  await menuFrame3.click('input#insertVerseRadio');
  await menuFrame3.type('input#insertVerseNumber', '2');
  await menuFrame3.click('input#insert');
  await frame.type('body#tinymce', 'The content of my verse');

  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('<span class=\"book_number mceNonEditable\" wce=\"__t=book_number\" id=\"book1\"> 4</span> <span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\" id=\"chap2\"> 1</span> <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\"> 2</span> The content of my verse');
  const xmlData = await page.evaluate(`getTEI()`);
  expect(xmlData).toBe(xmlHead + '<div type="book" n="B04"><div type="chapter" n="B04K1"><ab n="B04K1V2"><w>The</w><w>content</w><w>of</w>' +
                       '<w>my</w><w>verse</w></ab></div></div>' + xmlTail);
}, 200000);

// Partial too hard to do just now with functional test as needs right click and mouse accessed menu

// lection
test('lection', async () => {
  // open V menu
  await page.click('button#mceu_18-open');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
  const menuFrame = await menuFrameHandle.contentFrame();
  await menuFrame.click('input#insertLectionRadio');
  await menuFrame.type('input#insertLectionNumber', 'R12');
  await menuFrame.click('input#insert');

  await frame.type('body#tinymce', 'The content of my lection');

  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('<span class=\"lection_number mceNonEditable\" wce=\"__t=lection_number&amp;__n=&amp;number=R12\"> Lec</span>The content of my lection');
  const xmlData = await page.evaluate(`getTEI()`);
  expect(xmlData).toBe(xmlHead + '<div type="lection" n="R12"><w>The</w><w>content</w><w>of</w><w>my</w><w>lection</w></div>' + xmlTail);
  }, 200000);


// lection, book and chapter
test('lection, book and chapter', async () => {
  // open V menu
  await page.click('button#mceu_18-open');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
  const menuFrame = await menuFrameHandle.contentFrame();
  await menuFrame.click('input#insertLectionRadio');
  await menuFrame.type('input#insertLectionNumber', 'R12');
  await menuFrame.click('input#insert');

  await page.click('button#mceu_18-open');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  const menuFrameHandle2 = await page.$('div[id="mceu_40"] > div > div > iframe');
  const menuFrame2 = await menuFrameHandle2.contentFrame();
  await menuFrame2.click('input#insertBookRadio');
  await menuFrame2.type('input#insertBookNumber', '4');
  await menuFrame2.click('input#insert');

  await page.click('button#mceu_18-open');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  const menuFrameHandle3 = await page.$('div[id="mceu_41"] > div > div > iframe');
  const menuFrame3 = await menuFrameHandle3.contentFrame();
  await menuFrame3.click('input#insertChapterRadio');
  await menuFrame3.type('input#insertChapterNumber', '1');
  await menuFrame3.click('input#insert');

  await frame.type('body#tinymce', 'The content of my chapter');

  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('<span class=\"lection_number mceNonEditable\" wce=\"__t=lection_number&amp;__n=&amp;number=R12\"> Lec</span> <span class=\"book_number mceNonEditable\" wce=\"__t=book_number\" id=\"book1\"> 4</span> <span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\" id=\"chap2\"> 1</span> The content of my chapter');
  const xmlData = await page.evaluate(`getTEI()`);
  expect(xmlData).toBe(xmlHead + '<div type="lection" n="R12"><div type="book" n="B04"><div type="chapter" n="B04K1">' +
                       '<w>The</w><w>content</w><w>of</w><w>my</w><w>chapter</w></div></div></div>' + xmlTail);
}, 200000);


// book and inscriptio
test('book and inscriptio divs', async () => {
  // open V menu
  await page.click('button#mceu_18-open');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
  const menuFrame = await menuFrameHandle.contentFrame();
  await menuFrame.click('input#insertBookRadio');
  await menuFrame.type('input#insertBookNumber', '4');
  await menuFrame.click('input#insert');
  await page.click('button#mceu_18-open');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  const menuFrameHandle2 = await page.$('div[id="mceu_40"] > div > div > iframe');
  const menuFrame2 = await menuFrameHandle2.contentFrame();
  await menuFrame2.click('input#insertInscriptioRadio');
  await menuFrame2.click('input#insert');
  await page.keyboard.down('Shift');
  for (let i = 0; i < 'PLACE THE INSCRIPTIO HERE! '.length; i++) {
    await page.keyboard.press('ArrowLeft');
  }
  await page.keyboard.down('Shift');
  await page.keyboard.press('Backspace');
  await frame.type('body#tinymce', 'inscriptio text');

  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('<span class=\"book_number mceNonEditable\" wce=\"__t=book_number\" id=\"book1\"> 4</span> <span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\">Inscriptio</span> <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\"></span>inscriptio text');
  const xmlData = await page.evaluate(`getTEI()`);
  expect(xmlData).toBe(xmlHead + '<div type="book" n="B04"><div type="incipit" n="B04incipit"><ab><w>inscriptio</w><w>text</w></ab></div></div>' + xmlTail);
}, 200000);

// book and subscriptio
test('book and subscriptio divs', async () => {
  // open V menu
  await page.click('button#mceu_18-open');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
  const menuFrame = await menuFrameHandle.contentFrame();
  await menuFrame.click('input#insertBookRadio');
  await menuFrame.type('input#insertBookNumber', '4');
  await menuFrame.click('input#insert');
  await page.click('button#mceu_18-open');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  const menuFrameHandle2 = await page.$('div[id="mceu_40"] > div > div > iframe');
  const menuFrame2 = await menuFrameHandle2.contentFrame();
  await menuFrame2.click('input#insertSubscriptioRadio');
  await menuFrame2.click('input#insert');
  await page.keyboard.down('Shift');
  for (let i = 0; i < 'PLACE THE SUBSCRIPTIO HERE! '.length; i++) {
    await page.keyboard.press('ArrowLeft');
  }
  await page.keyboard.down('Shift');
  await page.keyboard.press('Backspace');
  await frame.type('body#tinymce', 'subscriptio text');

  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('<span class=\"book_number mceNonEditable\" wce=\"__t=book_number\" id=\"book1\"> 4</span> <span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\">Subscriptio</span> <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\"></span>subscriptio text');
  const xmlData = await page.evaluate(`getTEI()`);
  expect(xmlData).toBe(xmlHead + '<div type="book" n="B04"><div type="explicit" n="B04explicit"><ab><w>subscriptio</w><w>text</w></ab></div></div>' + xmlTail);
}, 200000);

// gaps
test('gap between words', async () => {
  await frame.type('body#tinymce', 'this  continues');
  for (let i = 0; i < ' continues'.length; i++) {
    await page.keyboard.press('ArrowLeft');
  }

  // open D menu
  await page.click('button#mceu_12-open');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
  const menuFrame = await menuFrameHandle.contentFrame();
  await menuFrame.select('select[id="unit"]', 'char');
  await menuFrame.type('input#extent', '10');
  await menuFrame.click('input#insert');

  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('this <span class=\"gap\" wce_orig=\"\" wce=\"__t=gap&amp;__n=&amp;original_gap_text=&amp;help=Help&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=illegible&amp;unit=char&amp;unit_other=&amp;extent=10&amp;extent_unspecified=Extent%3DUnspecified&amp;extent_part=Extent%3DPart&amp;supplied_source=na28&amp;supplied_source_other=\"><span class=\"format_start mceNonEditable\">‹</span>[10]<span class=\"format_end mceNonEditable\">›</span></span> continues');
  const xmlData = await page.evaluate(`getTEI()`);
  expect(xmlData).toBe(xmlHead + '<w>this</w><gap reason="illegible" unit="char" extent="10"/><w>continues</w>' + xmlTail);
}, 200000);

test('gap between words no details given', async () => {
  await frame.type('body#tinymce', 'this  continues');
  for (let i = 0; i < ' continues'.length; i++) {
    await page.keyboard.press('ArrowLeft');
  }

  // open D menu
  await page.click('button#mceu_12-open');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
  const menuFrame = await menuFrameHandle.contentFrame();
  await menuFrame.click('input#gap_reason_dummy_unspecified');
  await menuFrame.click('input#insert');

  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('this <span class=\"gap\" wce_orig=\"\" wce=\"__t=gap&amp;__n=&amp;original_gap_text=&amp;help=Help&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=unspecified&amp;unit=&amp;unit_other=&amp;extent=&amp;extent_unspecified=Extent%3DUnspecified&amp;extent_part=Extent%3DPart&amp;supplied_source=na28&amp;supplied_source_other=\"><span class=\"format_start mceNonEditable\">‹</span>[...]<span class=\"format_end mceNonEditable\">›</span></span> continues');
  const xmlData = await page.evaluate(`getTEI()`);
  expect(xmlData).toBe(xmlHead + '<w>this</w><gap/><w>continues</w>' + xmlTail);
}, 200000);

test('gap within word', async () => {
  await frame.type('body#tinymce', 'wo');

  // open D menu
  await page.click('button#mceu_12-open');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
  const menuFrame = await menuFrameHandle.contentFrame();
  await menuFrame.select('select[id="unit"]', 'char');
  await menuFrame.type('input#extent', '2');
  await menuFrame.click('input#insert');

  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('wo<span class=\"gap\" wce_orig=\"\" wce=\"__t=gap&amp;__n=&amp;original_gap_text=&amp;help=Help&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=illegible&amp;unit=char&amp;unit_other=&amp;extent=2&amp;extent_unspecified=Extent%3DUnspecified&amp;extent_part=Extent%3DPart&amp;supplied_source=na28&amp;supplied_source_other=\"><span class=\"format_start mceNonEditable\">‹</span>[2]<span class=\"format_end mceNonEditable\">›</span></span>');
  const xmlData = await page.evaluate(`getTEI()`);
  expect(xmlData).toBe(xmlHead + '<w>wo<gap reason="illegible" unit="char" extent="2"/></w>' + xmlTail);
}, 200000);

test('gap within word no unit given', async () => {
  await frame.type('body#tinymce', 'wo');

  // open D menu
  await page.click('button#mceu_12-open');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
  const menuFrame = await menuFrameHandle.contentFrame();
  await menuFrame.click('input#insert');

  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('wo<span class=\"gap\" wce_orig=\"\" wce=\"__t=gap&amp;__n=&amp;original_gap_text=&amp;help=Help&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=illegible&amp;unit=&amp;unit_other=&amp;extent=&amp;extent_unspecified=Extent%3DUnspecified&amp;extent_part=Extent%3DPart&amp;supplied_source=na28&amp;supplied_source_other=\"><span class=\"format_start mceNonEditable\">‹</span>[...]<span class=\"format_end mceNonEditable\">›</span></span>');
  const xmlData = await page.evaluate(`getTEI()`);
  expect(xmlData).toBe(xmlHead + '<w>wo<gap reason="illegible"/></w>' + xmlTail);
}, 200000);

// it is not possible to keep extent empty when entering in the console

test('gap with unit line and extent part', async () => {
  await frame.type('body#tinymce', 'missing line');

  // open D menu
  await page.click('button#mceu_12-open');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
  const menuFrame = await menuFrameHandle.contentFrame();
  await menuFrame.select('select[id="unit"]', 'line');
  await menuFrame.click('input#extent_part');
  await menuFrame.click('input#insert');
  const idRegex = /id="gap_(\d)_\d+"/g;
  const htmlData = await page.evaluate(`getData()`);
  const modifiedHtml = htmlData.replace(idRegex, 'id="gap_$1_MATH.RAND"');
  expect(modifiedHtml).toBe('missing line<span class=\"gap\" wce_orig=\"\" wce=\"__t=gap&amp;__n=&amp;original_gap_text=&amp;help=Help&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=illegible&amp;unit=line&amp;unit_other=&amp;extent=part&amp;extent_unspecified=Extent%3DUnspecified&amp;extent_part=Extent%3DPart&amp;supplied_source=na28&amp;supplied_source_other=\" id=\"gap_2_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span>[...]<span class=\"format_end mceNonEditable\">›</span></span>');
  const xmlData = await page.evaluate(`getTEI()`);
  expect(xmlData).toBe(xmlHead + '<w>missing</w><w>line<gap reason="illegible" unit="line" extent="part"/></w>' + xmlTail);
}, 200000);

test('gap with unit line and unspecified extent', async () => {
  await frame.type('body#tinymce', 'missing line');

  // open D menu
  await page.click('button#mceu_12-open');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
  const menuFrame = await menuFrameHandle.contentFrame();
  await menuFrame.select('select[id="unit"]', 'line');
  await menuFrame.click('input#extent_unspecified');
  await menuFrame.click('input#insert');
  const idRegex = /id="gap_(\d)_\d+"/g;
  const htmlData = await page.evaluate(`getData()`);
  const modifiedHtml = htmlData.replace(idRegex, 'id="gap_$1_MATH.RAND"');
  expect(modifiedHtml).toBe('missing line<span class=\"gap\" wce_orig=\"\" wce=\"__t=gap&amp;__n=&amp;original_gap_text=&amp;help=Help&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=illegible&amp;unit=line&amp;unit_other=&amp;extent=unspecified&amp;extent_unspecified=Extent%3DUnspecified&amp;extent_part=Extent%3DPart&amp;supplied_source=na28&amp;supplied_source_other=\" id=\"gap_2_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span>[...]<span class=\"format_end mceNonEditable\">›</span></span>');
  const xmlData = await page.evaluate(`getTEI()`);
  expect(xmlData).toBe(xmlHead + '<w>missing</w><w>line<gap reason="illegible" unit="line" extent="unspecified"/></w>' + xmlTail);
}, 200000);


test('missing quire', async () => {
  await frame.type('body#tinymce', 'missing  quire');
  for (let i = 0; i < ' quire'.length; i++) {
    await page.keyboard.press('ArrowLeft');
  }
  // open D menu
  await page.click('button#mceu_12-open');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
  const menuFrame = await menuFrameHandle.contentFrame();
  await menuFrame.select('select[id="unit"]', 'quire');
  await menuFrame.click('input#gap_reason_dummy_lacuna');
  await menuFrame.type('input#extent', '1');
  await menuFrame.click('input#insert');
  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('missing <span class=\"gap\" wce_orig=\"\" wce=\"__t=gap&amp;__n=&amp;original_gap_text=&amp;help=Help&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=lacuna&amp;unit=quire&amp;unit_other=&amp;extent=1&amp;extent_unspecified=Extent%3DUnspecified&amp;extent_part=Extent%3DPart&amp;supplied_source=na28&amp;supplied_source_other=\"><span class=\"format_start mceNonEditable\">‹</span><br />QB<br />[...]<span class=\"format_end mceNonEditable\">›</span></span> quire');
  const xmlData = await page.evaluate(`getTEI()`);
  expect(xmlData).toBe(xmlHead + '<w>missing</w><gap reason="lacuna" unit="quire" extent="1"/><w>quire</w>' + xmlTail);
}, 200000);

test('missing pages', async () => {
  await frame.type('body#tinymce', 'missing  pages');
  for (let i = 0; i < ' pages'.length; i++) {
    await page.keyboard.press('ArrowLeft');
  }
  // open D menu
  await page.click('button#mceu_12-open');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
  const menuFrame = await menuFrameHandle.contentFrame();
  await menuFrame.select('select[id="unit"]', 'page');
  await menuFrame.click('input#gap_reason_dummy_lacuna');
  await menuFrame.type('input#extent', '2');
  await menuFrame.click('input#insert');
  const idRegex = /id="(\D+)_(\d)_\d+"/g;
  const htmlData = await page.evaluate(`getData()`);
  const modifiedHtml = htmlData.replace(idRegex, 'id="$1_$2_MATH.RAND"');
  expect(modifiedHtml).toBe('missing <span class=\"gap\" wce_orig=\"\" wce=\"__t=gap&amp;__n=&amp;original_gap_text=&amp;help=Help&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=lacuna&amp;unit=page&amp;unit_other=&amp;extent=2&amp;extent_unspecified=Extent%3DUnspecified&amp;extent_part=Extent%3DPart&amp;supplied_source=na28&amp;supplied_source_other=\" id=\"gap_4_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />PB<br />[...]<br />PB<br />[...]<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;break_type=pb&amp;number=1&amp;rv=r&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\" id=\"pb_4_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />PB 1r<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\" id=\"cb_4_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />CB 1<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\" id=\"lb_4_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />↵<span class=\"format_end mceNonEditable\">›</span></span>  pages');
  const xmlData = await page.evaluate(`getTEI()`);
  // NB when created in the editor the XML is different compared to this test starting from XML input (page, col and line breaks added here for last page)
  expect(xmlData).toBe(xmlHead + '<w>missing</w><gap reason="lacuna" unit="page" extent="2"/><pb n="1r" type="folio" xml:id="P1r-"/><cb n="P1rC1-"/><lb n="P1rC1L-"/><w>pages</w>' + xmlTail);
}, 200000);

test('gap witness end', async () => {
  await frame.type('body#tinymce', 'the end of the witness ');

  // open D menu
  await page.click('button#mceu_12-open');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('the end of the witness <span class=\"witnessend\" wce=\"__t=gap&amp;__n=&amp;original_gap_text=&amp;gap_reason=witnessEnd&amp;unit=&amp;unit_other=&amp;extent=&amp;supplied_source=na28&amp;supplied_source_other=&amp;insert=Insert&amp;cancel=Cancel\"><span class=\"format_start mceNonEditable\">‹</span>Witness End<span class=\"format_end mceNonEditable\">›</span></span>');
  const xmlData = await page.evaluate(`getTEI()`);
  expect(xmlData).toBe(xmlHead + '<w>the</w><w>end</w><w>of</w><w>the</w><w>witness</w><gap reason="witnessEnd"/>' + xmlTail);
}, 200000);
