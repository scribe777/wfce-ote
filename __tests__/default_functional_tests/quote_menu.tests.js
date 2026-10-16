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
    headless: "new",
    slowMo: 60,
    args: ['--disable-web-security', '--no-sandbox']
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

const quoteStart = (type, ref, n) => '<span class="quote_start mceNonEditable" wce="__t=quote&amp;__n=&amp;quote_type=' + type +
  '&amp;quote_ref=' + ref + '" id="quote_s_' + n + '">❝' + ref + '</span>';
const quoteEnd = (type, ref, n) => '<span class="quote_end mceNonEditable" wce="__t=quote&amp;__n=&amp;quote_type=' + type +
  '&amp;quote_ref=' + ref + '" id="quote_e_' + n + '">❞</span>';

// the V menu: Add structure(s), Delete structure(s), Add quotation, Edit quotation, Delete quotation
const openVMenu = async () => {
  await page.click('button#mceu_18-open');
  await page.waitForSelector('div#menu-add-quote');
};
const menuItemDisabled = async (id) => {
  return await page.$eval('div#' + id, el => el.classList.contains('mce-disabled'));
};
const chooseVMenuItem = async (position) => {
  for (let i = 0; i < position; i++) {
    await page.keyboard.press('ArrowDown');
  }
  await page.keyboard.press('Enter');
};

describe('testing quotations in the V menu', () => {

  // QUOTATIONS (TEI <quote>): two non-editable markers around whole words

  test('add a quotation around the selected words', async () => {
    await frame.type('body#tinymce', 'a quoted text here');
    for (let i = 0; i < ' here'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'quoted text'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');

    await openVMenu();
    expect(await menuItemDisabled('menu-add-quote')).toBe(false);
    expect(await menuItemDisabled('menu-edit-quote')).toBe(true);
    expect(await menuItemDisabled('menu-delete-quote')).toBe(true);
    await chooseVMenuItem(3);

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select#quote_type', 'quotation');
    await menuFrame.type('input#quote_ref', 'Matt.7.7');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_39"]', { hidden: true });

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('a ' + quoteStart('quotation', 'Matt.7.7', 1) + ' quoted text ' + quoteEnd('quotation', 'Matt.7.7', 1) + ' here');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>a</w><quote type="quotation" n="Matt.7.7"><w>quoted</w><w>text</w></quote><w>here</w>' + xmlTail);

    // test the hover over on the start marker
    const marker = await frame.$('span.quote_start');
    const spanPos = await frame.evaluate((marker) => {
      const {top, left, bottom, right} = marker.getBoundingClientRect();
      return {top, left, bottom, right};
    }, marker);
    const sidebarWidth = await page.$eval('.wce-linenumber-sidebar', el => el.offsetWidth);
    const menubarHeight = await page.$eval('#mceu_25-body', el => el.offsetHeight);
    const targetX = spanPos.left + ((spanPos.right - spanPos.left) / 2) + sidebarWidth;
    const targetY = spanPos.top + ((spanPos.bottom - spanPos.top) / 2) + menubarHeight;
    await page.mouse.move(targetX, targetY);
    const hoverValue = await page.$eval('#hover-data-content', el => el.innerHTML);
    expect(hoverValue).toBe('<div>Quotation</div><div>Reference: Matt.7.7</div>');
  }, 200000);

  test('the words inside a quotation stay editable and keep their own menus', async () => {
    const data = xmlHead + '<w>a</w><quote type="sequential" n="Rom.1.1"><w>b</w><w>c</w></quote><w>d</w>' + xmlTail;
    await page.evaluate(`setTEI('${data}');`);
    // put the caret just before the end marker and type a new word: it belongs to the quotation
    await frame.click('body#tinymce');
    await page.keyboard.press('End');
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.type('x');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>a</w><quote type="sequential" n="Rom.1.1"><w>b</w><w>c</w><w>x</w></quote><w>d</w>' + xmlTail);
    // inside the quotation a note can still be added
    await openVMenu();
    expect(await menuItemDisabled('menu-add-quote')).toBe(true);
    await page.click('button#mceu_18-open');
    const noteDisabled = await page.$eval('div#mceu_16', el => el.getAttribute('aria-disabled') === 'true');
    expect(noteDisabled).toBe(false);
  }, 200000);

  test('edit a quotation from one of its markers', async () => {
    const data = xmlHead + '<w>a</w><quote type="sequential" n="Rom.1.1"><w>b</w><w>c</w></quote><w>d</w>' + xmlTail;
    await page.evaluate(`setTEI('${data}');`);
    const endMarker = await frame.$('span.quote_end');
    await endMarker.click();

    await openVMenu();
    expect(await menuItemDisabled('menu-add-quote')).toBe(true);
    expect(await menuItemDisabled('menu-edit-quote')).toBe(false);
    expect(await menuItemDisabled('menu-delete-quote')).toBe(false);
    await chooseVMenuItem(4);

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    expect(await menuFrame.$eval('select#quote_type', el => el.value)).toBe('sequential');
    expect(await menuFrame.$eval('input#quote_ref', el => el.value)).toBe('Rom.1.1');
    await menuFrame.select('select#quote_type', 'quotation');
    await menuFrame.click('input#quote_ref', { clickCount: 3 });
    await menuFrame.type('input#quote_ref', 'Rom.1.2');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_39"]', { hidden: true });

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('a ' + quoteStart('quotation', 'Rom.1.2', 1) + ' b c ' + quoteEnd('quotation', 'Rom.1.2', 1) + ' d');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>a</w><quote type="quotation" n="Rom.1.2"><w>b</w><w>c</w></quote><w>d</w>' + xmlTail);
  }, 200000);

  test('delete a quotation and keep its words', async () => {
    const data = xmlHead + '<w>a</w><quote type="sequential" n="Rom.1.1"><w>b</w><w>c</w></quote><w>d</w>' + xmlTail;
    await page.evaluate(`setTEI('${data}');`);
    const startMarker = await frame.$('span.quote_start');
    await startMarker.click();

    await openVMenu();
    await chooseVMenuItem(5);

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('a b c d');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>a</w><w>b</w><w>c</w><w>d</w>' + xmlTail);
  }, 200000);

  test('a quotation continued in the next verse', async () => {
    const data = xmlHead + '<div type="book" n="John"><div type="chapter" n="John.1"><ab n="John.1.1"><w>a</w>' +
      '<quote type="sequential" n="Rom.1.1"><w>b</w></quote></ab><ab n="John.1.2"><quote type="sequential" n="Rom.1.1"><w>c</w></quote><w>d</w></ab></div></div>' + xmlTail;
    await page.evaluate(`setTEI('${data}');`);
    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('<span class="book_number mceNonEditable" wce="__t=book_number" id="1">John</span> ' +
      '<span class="chapter_number mceNonEditable" wce="__t=chapter_number" id="2">1</span> ' +
      '<span class="verse_number mceNonEditable" wce="__t=verse_number">1</span> a ' + quoteStart('sequential', 'Rom.1.1', 1) + ' b ' + quoteEnd('sequential', 'Rom.1.1', 1) + ' ' +
      '<span class="verse_number mceNonEditable" wce="__t=verse_number">2</span> ' + quoteStart('sequential', 'Rom.1.1', 2) + ' c ' + quoteEnd('sequential', 'Rom.1.1', 2) + ' d');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(data);
  }, 200000);

});
