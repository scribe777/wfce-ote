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


describe('testing with bookNames settings', () => {

  beforeEach(async () => {
    let frameHandle;
    jest.setTimeout(5000000);
    page = await browser.newPage();
    await page.goto(`file:${path.join(__dirname, '../test_index_page.html')}`);
    await page.evaluate(`setWceEditor('wce_editor', {bookNames: ['John', 'Gal']})`);
    page.waitForSelector("#wce_editor_ifr");
    frameHandle = null;
    while (frameHandle === null) {
      frameHandle = await page.$("iframe[id='wce_editor_ifr']");
    }
    frame = await frameHandle.contentFrame();

  });

  // book
  test('book div', async () => {
    // open V menu
    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.click('input#insertBookRadio');
    await menuFrame.waitForSelector('select#insertBookNumber');
    // check there are 2 options
    const optionCount = await menuFrame.$$eval('select#insertBookNumber > option', element => element.length);
    expect(optionCount).toBe(2);
    // select Galatians
    await menuFrame.select('select#insertBookNumber', 'Gal');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_39"]', { hidden: true });
    await frame.type('body#tinymce', 'The content of my book');
    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('<span class=\"book_number mceNonEditable\" wce=\"__t=book_number\" id=\"book1\"> Gal</span>The content of my book');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<div type="book" n="Gal"><w>The</w><w>content</w><w>of</w><w>my</w><w>book</w></div>' + xmlTail);
  }, 200000);

});