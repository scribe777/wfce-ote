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


describe('testing notes menu', () => {

  // NOTES

  test('a local note', async () => {
    await frame.type('body#tinymce', 'a note');

    // open N menu
    await page.click('button#mceu_16-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();

    await menuFrame.type('textarea#note_text', 'my new local note');

    await menuFrame.click('input#insert');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('a note<span class=\"note\" wce_orig=\"\" wce=\"__t=note&amp;__n=&amp;help=Help&amp;note_type=local&amp;note_type_other=&amp;newHand=&amp;note_text=my%20new%20local%20note\"><span class=\"format_start mceNonEditable\">‹</span>Note<span class=\"format_end mceNonEditable\">›</span></span>');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>a</w><w>note</w><note type="local">my new local note</note>' + xmlTail);
  }, 200000);

  test('a handShift note', async () => {
    await frame.type('body#tinymce', 'a note');

    // open N menu
    await page.click('button#mceu_16-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select[id="note_type"]', 'changeOfHand');

    await menuFrame.click('input#insert');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('a note<span class=\"note\" wce_orig=\"\" wce=\"__t=note&amp;__n=&amp;help=Help&amp;note_type=changeOfHand&amp;note_type_other=&amp;newHand=&amp;note_text=\"><span class=\"format_start mceNonEditable\">‹</span>Note<span class=\"format_end mceNonEditable\">›</span></span>');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>a</w><w>note</w><note type="editorial"><handShift/></note>' + xmlTail);
  }, 200000);

  test('a handShift note with new hand', async () => {
    await frame.type('body#tinymce', 'a note');

    // open N menu
    await page.click('button#mceu_16-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select[id="note_type"]', 'changeOfHand');
    await menuFrame.type('input#newHand', 'new hand');

    await menuFrame.click('input#insert');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('a note<span class=\"note\" wce_orig=\"\" wce=\"__t=note&amp;__n=&amp;help=Help&amp;note_type=changeOfHand&amp;note_type_other=&amp;newHand=new%20hand&amp;note_text=\"><span class=\"format_start mceNonEditable\">‹</span>Note<span class=\"format_end mceNonEditable\">›</span></span>');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>a</w><w>note</w><note type="editorial"><handShift scribe="new hand"/></note>' + xmlTail);
  }, 200000);

});
