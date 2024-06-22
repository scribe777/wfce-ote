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

describe('testing unclear text functions', () => {

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
    // access menu window and make selection
    const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    // check nothing is selected (we have an option for that now)
    expect(await menuFrame.$eval('#unclear_text_reason', el => el.value)).toBe('');

    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('my <span class=\"unclear\" wce_orig=\"words\" wce=\"__t=unclear&amp;__n=&amp;' +
      'help=Help&amp;unclear_text_reason=&amp;unclear_text_reason_other=\">' +
      '<span class=\"format_start mceNonEditable\">‹</span>ẉọṛḍṣ' +
      '<span class=\"format_end mceNonEditable\">›</span></span>');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>my</w><w><unclear>words</unclear></w>' + xmlTail);

    // check editing works
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
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
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // access menu window and make selection
    const menuFrameHandle2 = await page.$('div[id="mceu_41"] > div > div > iframe');
    const menuFrame2 = await menuFrameHandle2.contentFrame();

    expect(await menuFrame2.$eval('#unclear_text_reason', el => el.value)).toBe('');
    expect(await menuFrame2.$eval('#unclear_text_reason_other', el => el.disabled)).toBe(true);
    await menuFrame2.click('input#insert');
    await page.waitForSelector('div[id="mceu_41"]', { hidden: true });

    const xmlData2 = await page.evaluate(`getTEI()`);
    expect(xmlData2).toBe(xmlHead + '<w>my</w><w><unclear>words</unclear></w>' + xmlTail);

    // check deleting works (text will still be highlighted)
    // open D menu
    await page.click('button#mceu_12-open');
    // navigate submenu
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const xmlData3 = await page.evaluate(`getTEI()`);
    expect(xmlData3).toBe(xmlHead + '<w>my</w><w>words</w>' + xmlTail);

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
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });
    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('my wo<span class="unclear" wce_orig="rds" wce="__t=unclear&amp;__n=&amp;help=Help' +
      '&amp;unclear_text_reason=damage%20to%20page&amp;unclear_text_reason_other=">' +
      '<span class="format_start mceNonEditable">‹</span>ṛḍṣ' +
      '<span class="format_end mceNonEditable">›</span></span>');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>my</w><w>wo<unclear reason="damage to page">rds</unclear></w>' + xmlTail);

    // check editing works
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
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
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // access menu window and make selection
    const menuFrameHandle2 = await page.$('div[id="mceu_41"] > div > div > iframe');
    const menuFrame2 = await menuFrameHandle2.contentFrame();

    expect(await menuFrame2.$eval('#unclear_text_reason', el => el.value)).toBe('damage to page');
    expect(await menuFrame2.$eval('#unclear_text_reason_other', el => el.disabled)).toBe(true);
    await menuFrame2.click('input#insert');
    await page.waitForSelector('div[id="mceu_41"]', { hidden: true });

    const xmlData2 = await page.evaluate(`getTEI()`);
    expect(xmlData2).toBe(xmlHead + '<w>my</w><w>wo<unclear reason="damage to page">rds</unclear></w>' + xmlTail);

    // check deleting works (text will still be highlighted)
    // open D menu
    await page.click('button#mceu_12-open');
    // navigate submenu
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const xmlData3 = await page.evaluate(`getTEI()`);
    expect(xmlData3).toBe(xmlHead + '<w>my</w><w>words</w>' + xmlTail);


  }, 200000);

  test('part word unclear with reason \'other\'', async () => {
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

    // test the interface responds as required
    await menuFrame.select('select[id="unclear_text_reason"]', 'other');
    // NB need to click on this because the function is onclick not onchange (need to understand why before changing it)
    await menuFrame.click('#unclear_text_reason');
    expect(await menuFrame.$eval('#unclear_text_reason_other', el => el.disabled)).toBe(false);

    // check the other details box is disabled if we select something else 
    await menuFrame.select('select[id="unclear_text_reason"]', 'faded ink');
    // NB need to click on this because the function is onclick not onchange (need to understand why before changing it)
    await menuFrame.click('#unclear_text_reason');
    expect(await menuFrame.$eval('#unclear_text_reason_other', el => el.disabled)).toBe(true);

    // actually test other reason is added correctly
    await menuFrame.select('select[id="unclear_text_reason"]', 'other');
    // NB need to click on this because the function is onclick not onchange (need to understand why before changing it)
    await menuFrame.click('#unclear_text_reason');
    expect(await menuFrame.$eval('#unclear_text_reason_other', el => el.disabled)).toBe(false);
    await menuFrame.type('input#unclear_text_reason_other', 'chemical_damage');

    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });
    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('my wo<span class="unclear" wce_orig="rds" wce="__t=unclear&amp;__n=&amp;help=Help' +
      '&amp;unclear_text_reason=other&amp;unclear_text_reason_other=chemical_damage">' +
      '<span class="format_start mceNonEditable">‹</span>ṛḍṣ' +
      '<span class="format_end mceNonEditable">›</span></span>');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>my</w><w>wo<unclear reason="chemical_damage">rds</unclear></w>' + xmlTail);

    // check editing works
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
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
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // access menu window and make selection
    const menuFrameHandle2 = await page.$('div[id="mceu_41"] > div > div > iframe');
    const menuFrame2 = await menuFrameHandle2.contentFrame();

    expect(await menuFrame2.$eval('#unclear_text_reason', el => el.value)).toBe('other');
    expect(await menuFrame2.$eval('#unclear_text_reason_other', el => el.disabled)).toBe(false);
    expect(await menuFrame2.$eval('#unclear_text_reason_other', el => el.value)).toBe('chemical_damage');
    await menuFrame2.click('input#insert');
    await page.waitForSelector('div[id="mceu_41"]', { hidden: true });

    const xmlData2 = await page.evaluate(`getTEI()`);
    expect(xmlData2).toBe(xmlHead + '<w>my</w><w>wo<unclear reason="chemical_damage">rds</unclear></w>' + xmlTail);

    // check deleting works (text will still be highlighted)
    // open D menu
    await page.click('button#mceu_12-open');
    // navigate submenu
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const xmlData3 = await page.evaluate(`getTEI()`);
    expect(xmlData3).toBe(xmlHead + '<w>my</w><w>words</w>' + xmlTail);

  }, 200000);

  test('check editing and deletion of unclear text works if it was loaded with setTEI', async () => {

    const data = xmlHead + '<w>my</w><w>wo<unclear reason="damage to page">rds</unclear></w>' + xmlTail;
    await page.evaluate(`setTEI('${data}');`);

    // check editing works
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'rds'.length; i++) {
      await page.keyboard.press('ArrowRight');
    }
    await page.keyboard.up('Shift');

    // open D menu
    await page.click('button#mceu_12-open');
    // navigate submenu
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // access menu window and make selection
    const menuFrameHandle2 = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame2 = await menuFrameHandle2.contentFrame();

    expect(await menuFrame2.$eval('#unclear_text_reason', el => el.value)).toBe('damage to page');
    expect(await menuFrame2.$eval('#unclear_text_reason_other', el => el.disabled)).toBe(true);
    await menuFrame2.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

    const xmlData2 = await page.evaluate(`getTEI()`);
    expect(xmlData2).toBe(xmlHead + '<w>my</w><w>wo<unclear reason="damage to page">rds</unclear></w>' + xmlTail);

    // check deleting works (text will still be highlighted)
    // open D menu
    await page.click('button#mceu_12-open');
    // navigate submenu
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const xmlData3 = await page.evaluate(`getTEI()`);
    expect(xmlData3).toBe(xmlHead + '<w>my</w><w>words</w>' + xmlTail);

  }, 200000);


  test('check editing and deletion of unclear text works if it was loaded with setTEI with \'other\'', async () => {

    const data = xmlHead + '<w>my</w><w>wo<unclear reason="chemical_damage">rds</unclear></w>' + xmlTail;
    await page.evaluate(`setTEI('${data}');`);

    // check editing works
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'rds'.length; i++) {
      await page.keyboard.press('ArrowRight');
    }
    await page.keyboard.up('Shift');

    // open D menu
    await page.click('button#mceu_12-open');
    // navigate submenu
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // access menu window and make selection
    const menuFrameHandle2 = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame2 = await menuFrameHandle2.contentFrame();

    expect(await menuFrame2.$eval('#unclear_text_reason', el => el.value)).toBe('other');
    expect(await menuFrame2.$eval('#unclear_text_reason_other', el => el.value)).toBe('chemical_damage');
    expect(await menuFrame2.$eval('#unclear_text_reason_other', el => el.disabled)).toBe(false);
    await menuFrame2.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

    const xmlData2 = await page.evaluate(`getTEI()`);
    expect(xmlData2).toBe(xmlHead + '<w>my</w><w>wo<unclear reason="chemical_damage">rds</unclear></w>' + xmlTail);

    // check deleting works (text will still be highlighted)
    // open D menu
    await page.click('button#mceu_12-open');
    // navigate submenu
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const xmlData3 = await page.evaluate(`getTEI()`);
    expect(xmlData3).toBe(xmlHead + '<w>my</w><w>words</w>' + xmlTail);

  }, 200000);

});
