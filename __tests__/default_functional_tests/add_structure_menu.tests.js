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

jest.setTimeout(5000000);

beforeAll(async () => {
  browser = await puppeteer.launch({
    // for local testing
    // headless: false,
    // slowMo: 80,
    // args: ['--window-size=1920,1080', '--disable-web-security']

    // for online testing (only ever commit these)
    headless: true,
    slowMo: 60,
    args: ['--disable-web-security']
  });
});

afterAll(async () => {
  await browser.close();
});

beforeEach(async () => {
  let frameHandle;
  jest.setTimeout(5000000);
  page = await browser.newPage();
  // await page.goto(`file:${path.join(__dirname, '..', 'wce-ote', 'index.html')}`);
  await page.goto(`file:${path.join(__dirname, '../test_index_page.html')}`);
  await page.evaluate(`setWceEditor('wce_editor', {})`);
  page.waitForSelector("#wce_editor_ifr");
  frameHandle = null;
  while (frameHandle === null) {
    frameHandle = await page.$("iframe[id='wce_editor_ifr']");
  }
  frame = await frameHandle.contentFrame();

});


describe('testing structure menu', () => {

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
    await menuFrame.type('input#insertBookNumber', 'John');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_39"]', { hidden: true });
    await frame.type('body#tinymce', 'The content of my book');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('<span class=\"book_number mceNonEditable\" wce=\"__t=book_number\" id=\"book1\"> John</span>The content of my book');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<div type="book" n="John"><w>The</w><w>content</w><w>of</w><w>my</w><w>book</w></div>' + xmlTail);
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
    await page.waitForSelector('div[id="mceu_39"]', { hidden: true });
    await frame.type('body#tinymce', 'The content of my chapter');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('<span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\" id=\"chap1\"> 1</span>The content of my chapter');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<div type="chapter" n=".1"><w>The</w><w>content</w><w>of</w><w>my</w><w>chapter</w></div>' + xmlTail);
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
    await menuFrame.type('input#insertBookNumber', 'John');
    await menuFrame.click('input#insert');
    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle2 = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame2 = await menuFrameHandle2.contentFrame();
    await menuFrame2.click('input#insertChapterRadio');
    await menuFrame2.type('input#insertChapterNumber', '1');
    await menuFrame2.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });
    await frame.type('body#tinymce', 'The content of my chapter');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('<span class=\"book_number mceNonEditable\" wce=\"__t=book_number\" id=\"book1\"> John</span> <span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\" id=\"chap2\"> 1</span> The content of my chapter');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<div type="book" n="John"><div type="chapter" n="John.1"><w>The</w><w>content</w><w>of</w><w>my</w><w>chapter</w></div></div>' + xmlTail);
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
    await menuFrame.type('input#insertBookNumber', 'John');
    await menuFrame.click('input#insert');

    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle2 = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame2 = await menuFrameHandle2.contentFrame();
    await menuFrame2.click('input#insertChapterRadio');
    await menuFrame2.type('input#insertChapterNumber', '1');
    await menuFrame2.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle3 = await page.$('div[id="mceu_41"] > div > div > iframe');
    const menuFrame3 = await menuFrameHandle3.contentFrame();
    await menuFrame3.click('input#insertVerseRadio');
    await menuFrame3.type('input#insertVerseNumber', '2');
    await menuFrame3.click('input#insert');
    await page.waitForSelector('div[id="mceu_41"]', { hidden: true });
    await frame.type('body#tinymce', 'The content of my verse');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('<span class=\"book_number mceNonEditable\" wce=\"__t=book_number\" id=\"book1\"> John</span> <span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\" id=\"chap2\"> 1</span> <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\"> 2</span> The content of my verse');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<div type="book" n="John"><div type="chapter" n="John.1"><ab n="John.1.2"><w>The</w><w>content</w><w>of</w>' +
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
    await page.waitForSelector('div[id="mceu_39"]', { hidden: true });
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
    await menuFrame2.type('input#insertBookNumber', 'John');
    await menuFrame2.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle3 = await page.$('div[id="mceu_41"] > div > div > iframe');
    const menuFrame3 = await menuFrameHandle3.contentFrame();
    await menuFrame3.click('input#insertChapterRadio');
    await menuFrame3.type('input#insertChapterNumber', '1');
    await menuFrame3.click('input#insert');
    await page.waitForSelector('div[id="mceu_41"]', { hidden: true });

    await frame.type('body#tinymce', 'The content of my chapter');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('<span class=\"lection_number mceNonEditable\" wce=\"__t=lection_number&amp;__n=&amp;number=R12\"> Lec</span> <span class=\"book_number mceNonEditable\" wce=\"__t=book_number\" id=\"book1\"> John</span> <span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\" id=\"chap2\"> 1</span> The content of my chapter');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<div type="lection" n="R12"><div type="book" n="John"><div type="chapter" n="John.1">' +
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
    await menuFrame.type('input#insertBookNumber', 'John');
    await menuFrame.click('input#insert');
    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle2 = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame2 = await menuFrameHandle2.contentFrame();
    await menuFrame2.click('input#insertInscriptioRadio');
    await menuFrame2.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'PLACE THE INSCRIPTIO HERE! '.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.down('Shift');
    await page.keyboard.press('Backspace');
    await frame.type('body#tinymce', 'inscriptio text');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('<span class=\"book_number mceNonEditable\" wce=\"__t=book_number\" id=\"book1\"> John</span> <span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\">Inscriptio</span> <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">0</span>inscriptio text');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<div type="book" n="John"><div type="inscriptio"><ab n="John.inscriptio"><w>inscriptio</w><w>text</w></ab></div></div>' + xmlTail);
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
    await menuFrame.type('input#insertBookNumber', 'John');
    await menuFrame.click('input#insert');
    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle2 = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame2 = await menuFrameHandle2.contentFrame();
    await menuFrame2.click('input#insertSubscriptioRadio');
    await menuFrame2.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'PLACE THE SUBSCRIPTIO HERE! '.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.down('Shift');
    await page.keyboard.press('Backspace');
    await frame.type('body#tinymce', 'subscriptio text');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('<span class=\"book_number mceNonEditable\" wce=\"__t=book_number\" id=\"book1\"> John</span> <span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\">Subscriptio</span> <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">0</span>subscriptio text');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<div type="book" n="John"><div type="subscriptio"><ab n="John.subscriptio"><w>subscriptio</w><w>text</w></ab></div></div>' + xmlTail);
  }, 200000);

});
