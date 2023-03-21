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
    // devtools: true,
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
  await page.goto(`file:${path.join(__dirname, '../test_index_page.html')}`);
  await page.evaluate(`setWceEditor('wce_editor', {})`);
  page.waitForSelector("#wce_editor_ifr");
  frameHandle = null;
  while (frameHandle === null) {
    frameHandle = await page.$("iframe[id='wce_editor_ifr']");
  }
  frame = await frameHandle.contentFrame();

});


describe('testing gap menu', () => {

  // gaps
  test('test non-supplied all the default preselects and the interface behaviour', async () => {
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
    // check the gap reason pre-select is correct
    expect(await menuFrame.$eval('#gap_reason_dummy_illegible', el => el.checked)).toBe(true);

    // check the non-dummy value agrees
    expect(await menuFrame.$eval('#gap_reason', el => el.value)).toBe('illegible');

    // check the drop down menu for supplied_source is the right length 
    expect(await menuFrame.$eval('#supplied_source', el => el.options.length)).toBe(5);

    // check the 'mark as supplied' box is unchecked
    expect(await menuFrame.$eval('#mark_as_supplied', el => el.checked)).toBe(false);

    // check the default select supplied_source is correct but inactive (because this is not supplied text)
    expect(await menuFrame.$eval('#supplied_source', el => el.value)).toBe('na28');
    expect(await menuFrame.$eval('#supplied_source', el => el.disabled)).toBe(true);

    // check the boxes only used for other are not enabled when it is not selected as unit
    expect(await menuFrame.$eval('#unit', el => el.value)).toBe('');
    expect(await menuFrame.$eval('#unit_other', el => el.disabled)).toBe(true);
    expect(await menuFrame.$eval('#extent', el => el.disabled)).toBe(true);

    // check that when unit is set to other the correct boxes are activated
    await menuFrame.select('select[id="unit"]', 'other');
    expect(await menuFrame.$eval('#unit', el => el.value)).toBe('other');
    expect(await menuFrame.$eval('#unit_other', el => el.disabled)).toBe(false);
    expect(await menuFrame.$eval('#extent', el => el.disabled)).toBe(false);

    // check that when we select an option other than other is selected 
    await menuFrame.select('select[id="unit"]', 'line');
    expect(await menuFrame.$eval('#unit', el => el.value)).toBe('line');
    expect(await menuFrame.$eval('#unit_other', el => el.disabled)).toBe(true);
    expect(await menuFrame.$eval('#extent', el => el.disabled)).toBe(false);

    // no need to output here as we are only testing the interface behaviour

  });

  test('test supplied text all the default preselects and the interface behaviour', async () => {
    await frame.type('body#tinymce', 'this is supplied');
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'supplied'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');

    // open D menu
    await page.click('button#mceu_12-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    // check the gap reason pre-select is correct
    expect(await menuFrame.$eval('#gap_reason_dummy_illegible', el => el.checked)).toBe(true);

    // check the non-dummy value agrees
    expect(await menuFrame.$eval('#gap_reason', el => el.value)).toBe('illegible');

    // check the drop down menu for supplied_source is the right length
    expect(await menuFrame.$eval('#supplied_source', el => el.options.length)).toBe(5);

    // check unit is not prepopulated and all relevant boxes are inactive
    expect(await menuFrame.$eval('#unit', el => el.value)).toBe('');
    expect(await menuFrame.$eval('#unit', el => el.disabled)).toBe(true);
    expect(await menuFrame.$eval('#unit_other', el => el.disabled)).toBe(true);
    expect(await menuFrame.$eval('#extent', el => el.disabled)).toBe(true);

    // check the 'mark as supplied' box is checked
    expect(await menuFrame.$eval('#mark_as_supplied', el => el.checked)).toBe(true);

    // check the default select supplied_source is correct and active and the 'other' box is inactive
    expect(await menuFrame.$eval('#supplied_source', el => el.value)).toBe('na28');
    expect(await menuFrame.$eval('#supplied_source', el => el.disabled)).toBe(false);
    expect(await menuFrame.$eval('#supplied_source_other', el => el.disabled)).toBe(true);

    // check when other is selected for supplied_source the box to type the value options
    await menuFrame.select('select[id="supplied_source"]', 'other');
    expect(await menuFrame.$eval('#supplied_source', el => el.value)).toBe('other');
    // NB need to click on this because the function is onclick not onchange (need to understand why before changing it)
    await menuFrame.click('#supplied_source');
    expect(await menuFrame.$eval('#supplied_source_other', el => el.disabled)).toBe(false);

    // check when a non-other option is selected the 'other' input is disabled
    await menuFrame.select('select[id="supplied_source"]', 'transcriber');
    expect(await menuFrame.$eval('#supplied_source', el => el.value)).toBe('transcriber');
    // NB need to click on this because the function is onclick not onchange (need to understand why before changing it)
    await menuFrame.click('#supplied_source');
    expect(await menuFrame.$eval('#supplied_source_other', el => el.disabled)).toBe(true);

    // no need to output here as we are only testing the interface
  });


  test('test that when data already exists the menu loading is correct (standard options)', async () => {
    // preload the data
    const data = xmlHead + '<w>this</w><w>is</w><w><supplied source="transcriber" reason="lacuna">supplied</supplied></w>' + xmlTail;
    await page.evaluate(`setTEI('${data}');`);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');

    // open D menu
    await page.click('button#mceu_12-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();

    // check reason is correctly populated and does not use default
    expect(await menuFrame.$eval('#gap_reason_dummy_illegible', el => el.checked)).toBe(false);
    expect(await menuFrame.$eval('#gap_reason_dummy_lacuna', el => el.checked)).toBe(true);

    // check the non-dummy value agrees
    expect(await menuFrame.$eval('#gap_reason', el => el.value)).toBe('lacuna');

    // check the drop down menu for supplied_source is the right length
    expect(await menuFrame.$eval('#supplied_source', el => el.options.length)).toBe(5);

    // check unit is not prepopulated and all relevant boxes are inactive
    expect(await menuFrame.$eval('#unit', el => el.value)).toBe('');
    expect(await menuFrame.$eval('#unit', el => el.disabled)).toBe(true);
    expect(await menuFrame.$eval('#unit_other', el => el.disabled)).toBe(true);
    expect(await menuFrame.$eval('#extent', el => el.disabled)).toBe(true);

    // check the 'mark as supplied' box is checked
    expect(await menuFrame.$eval('#mark_as_supplied', el => el.checked)).toBe(true);

    // check the default select supplied_source is correct and active and the 'other' box is inactive
    expect(await menuFrame.$eval('#supplied_source', el => el.value)).toBe('transcriber');
    expect(await menuFrame.$eval('#supplied_source', el => el.disabled)).toBe(false);
    expect(await menuFrame.$eval('#supplied_source_other', el => el.disabled)).toBe(true);

    // reconfirm the data and check the output
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>this</w><w>is</w><w><supplied source="transcriber" reason="lacuna">supplied</supplied></w>' + xmlTail);

    // test it can be deleted
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');

    // open D menu
    await page.click('button#mceu_12-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const xmlData2 = await page.evaluate(`getTEI()`);
    expect(xmlData2).toBe(xmlHead + '<w>this</w><w>is</w><w>supplied</w>' + xmlTail);

  });

  test('test that when data already exists the menu loading is correct (including \'other\')', async () => {
    // preload the data
    const data = xmlHead + '<w>this</w><w>is</w><w><supplied source="nonsense" reason="unspecified">supplied</supplied></w>' + xmlTail;
    await page.evaluate(`setTEI('${data}');`);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');

    // open D menu
    await page.click('button#mceu_12-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();

    // check reason is correctly populated and does not use default
    expect(await menuFrame.$eval('#gap_reason_dummy_illegible', el => el.checked)).toBe(false);
    expect(await menuFrame.$eval('#gap_reason_dummy_unspecified', el => el.checked)).toBe(true);

    // check the non-dummy value agrees
    expect(await menuFrame.$eval('#gap_reason', el => el.value)).toBe('unspecified');

    // check the drop down menu for supplied_source is the right length
    expect(await menuFrame.$eval('#supplied_source', el => el.options.length)).toBe(5);

    // check unit is not prepopulated and all relevant boxes are inactive
    expect(await menuFrame.$eval('#unit', el => el.value)).toBe('');
    expect(await menuFrame.$eval('#unit', el => el.disabled)).toBe(true);
    expect(await menuFrame.$eval('#unit_other', el => el.disabled)).toBe(true);
    expect(await menuFrame.$eval('#extent', el => el.disabled)).toBe(true);

    // check the 'mark as supplied' box is checked
    expect(await menuFrame.$eval('#mark_as_supplied', el => el.checked)).toBe(true);

    // check the default select supplied_source is correct and active and the 'other' box is inactive
    expect(await menuFrame.$eval('#supplied_source', el => el.value)).toBe('other');
    expect(await menuFrame.$eval('#supplied_source', el => el.disabled)).toBe(false);
    expect(await menuFrame.$eval('#supplied_source_other', el => el.disabled)).toBe(false);
    expect(await menuFrame.$eval('#supplied_source_other', el => el.value)).toBe('nonsense');

    // reconfirm the data and check the output
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>this</w><w>is</w><w><supplied source="nonsense" reason="unspecified">supplied</supplied></w>' + xmlTail);

    // test it can be deleted
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');

    // open D menu
    await page.click('button#mceu_12-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const xmlData2 = await page.evaluate(`getTEI()`);
    expect(xmlData2).toBe(xmlHead + '<w>this</w><w>is</w><w>supplied</w>' + xmlTail);

  });

  test('gap between words (form behaviour)', async () => {
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
    // check the gap reason pre-select is correct
    expect(await menuFrame.$eval('#gap_reason_dummy_illegible', el => el.checked)).toBe(true);

    // check the non-dummy value agrees
    expect(await menuFrame.$eval('#gap_reason', el => el.value)).toBe('illegible');

    // check the drop down menu for supplied_source is the right length 
    expect(await menuFrame.$eval('#supplied_source', el => el.options.length)).toBe(5);

    // check the 'mark as supplied' box is unchecked
    expect(await menuFrame.$eval('#mark_as_supplied', el => el.checked)).toBe(false);

    // check the default select supplied_source is correct but inactive (because this is not supplied text)
    expect(await menuFrame.$eval('#supplied_source', el => el.value)).toBe('na28');
    expect(await menuFrame.$eval('#supplied_source', el => el.disabled)).toBe(true);

    // check the boxes only used for other are not enabled when it is not selected as unit
    expect(await menuFrame.$eval('#unit', el => el.value)).toBe('');
    expect(await menuFrame.$eval('#unit_other', el => el.disabled)).toBe(true);
    expect(await menuFrame.$eval('#extent', el => el.disabled)).toBe(true);

    // check that when unit is set to other the correct boxes are activated
    await menuFrame.select('select[id="unit"]', 'other');
    expect(await menuFrame.$eval('#unit', el => el.value)).toBe('other');
    expect(await menuFrame.$eval('#unit_other', el => el.disabled)).toBe(false);
    expect(await menuFrame.$eval('#extent', el => el.disabled)).toBe(false);

    // check that when we select an option other than other is selected 
    await menuFrame.select('select[id="unit"]', 'line');
    expect(await menuFrame.$eval('#unit', el => el.value)).toBe('line');
    expect(await menuFrame.$eval('#unit_other', el => el.disabled)).toBe(true);
    expect(await menuFrame.$eval('#extent', el => el.disabled)).toBe(false);

    // no need to output here as we are only testing the interface behaviour

  });

  test('test supplied text all the default preselects and the interface behaviour', async () => {
    await frame.type('body#tinymce', 'this is supplied');
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'supplied'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');

    // open D menu
    await page.click('button#mceu_12-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    // check the gap reason pre-select is correct
    expect(await menuFrame.$eval('#gap_reason_dummy_illegible', el => el.checked)).toBe(true);

    // check the non-dummy value agrees
    expect(await menuFrame.$eval('#gap_reason', el => el.value)).toBe('illegible');

    // check the drop down menu for supplied_source is the right length
    expect(await menuFrame.$eval('#supplied_source', el => el.options.length)).toBe(5);

    // check unit is not prepopulated and all relevant boxes are inactive
    expect(await menuFrame.$eval('#unit', el => el.value)).toBe('');
    expect(await menuFrame.$eval('#unit', el => el.disabled)).toBe(true);
    expect(await menuFrame.$eval('#unit_other', el => el.disabled)).toBe(true);
    expect(await menuFrame.$eval('#extent', el => el.disabled)).toBe(true);

    // check the 'mark as supplied' box is checked
    expect(await menuFrame.$eval('#mark_as_supplied', el => el.checked)).toBe(true);

    // check the default select supplied_source is correct and active and the 'other' box is inactive
    expect(await menuFrame.$eval('#supplied_source', el => el.value)).toBe('na28');
    expect(await menuFrame.$eval('#supplied_source', el => el.disabled)).toBe(false);
    expect(await menuFrame.$eval('#supplied_source_other', el => el.disabled)).toBe(true);

    // check when other is selected for supplied_source the box to type the value options
    await menuFrame.select('select[id="supplied_source"]', 'other');
    expect(await menuFrame.$eval('#supplied_source', el => el.value)).toBe('other');
    // NB need to click on this because the function is onclick not onchange (need to understand why before changing it)
    await menuFrame.click('#supplied_source');
    expect(await menuFrame.$eval('#supplied_source_other', el => el.disabled)).toBe(false);

    // check when a non-other option is selected the 'other' input is disabled
    await menuFrame.select('select[id="supplied_source"]', 'transcriber');
    expect(await menuFrame.$eval('#supplied_source', el => el.value)).toBe('transcriber');
    // NB need to click on this because the function is onclick not onchange (need to understand why before changing it)
    await menuFrame.click('#supplied_source');
    expect(await menuFrame.$eval('#supplied_source_other', el => el.disabled)).toBe(true);

    // no need to output here as we are only testing the interface
  });


  test('test that when data already exists the menu loading is correct (standard options)', async () => {
    // preload the data
    const data = xmlHead + '<w>this</w><w>is</w><w><supplied source="transcriber" reason="lacuna">supplied</supplied></w>' + xmlTail;
    await page.evaluate(`setTEI('${data}');`);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');

    // open D menu
    await page.click('button#mceu_12-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();

    // check reason is correctly populated and does not use default
    expect(await menuFrame.$eval('#gap_reason_dummy_illegible', el => el.checked)).toBe(false);
    expect(await menuFrame.$eval('#gap_reason_dummy_lacuna', el => el.checked)).toBe(true);

    // check the non-dummy value agrees
    expect(await menuFrame.$eval('#gap_reason', el => el.value)).toBe('lacuna');

    // check the drop down menu for supplied_source is the right length
    expect(await menuFrame.$eval('#supplied_source', el => el.options.length)).toBe(5);

    // check unit is not prepopulated and all relevant boxes are inactive
    expect(await menuFrame.$eval('#unit', el => el.value)).toBe('');
    expect(await menuFrame.$eval('#unit', el => el.disabled)).toBe(true);
    expect(await menuFrame.$eval('#unit_other', el => el.disabled)).toBe(true);
    expect(await menuFrame.$eval('#extent', el => el.disabled)).toBe(true);

    // check the 'mark as supplied' box is checked
    expect(await menuFrame.$eval('#mark_as_supplied', el => el.checked)).toBe(true);

    // check the default select supplied_source is correct and active and the 'other' box is inactive
    expect(await menuFrame.$eval('#supplied_source', el => el.value)).toBe('transcriber');
    expect(await menuFrame.$eval('#supplied_source', el => el.disabled)).toBe(false);
    expect(await menuFrame.$eval('#supplied_source_other', el => el.disabled)).toBe(true);

    // reconfirm the data and check the output
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>this</w><w>is</w><w><supplied source="transcriber" reason="lacuna">supplied</supplied></w>' + xmlTail);

  });

  test('test that when data already exists the menu loading is correct (including \'other\')', async () => {
    // preload the data
    const data = xmlHead + '<w>this</w><w>is</w><w><supplied source="nonsense" reason="unspecified">supplied</supplied></w>' + xmlTail;
    await page.evaluate(`setTEI('${data}');`);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');

    // open D menu
    await page.click('button#mceu_12-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();

    // check reason is correctly populated and does not use default
    expect(await menuFrame.$eval('#gap_reason_dummy_illegible', el => el.checked)).toBe(false);
    expect(await menuFrame.$eval('#gap_reason_dummy_unspecified', el => el.checked)).toBe(true);

    // check the non-dummy value agrees
    expect(await menuFrame.$eval('#gap_reason', el => el.value)).toBe('unspecified');

    // check the drop down menu for supplied_source is the right length
    expect(await menuFrame.$eval('#supplied_source', el => el.options.length)).toBe(5);

    // check unit is not prepopulated and all relevant boxes are inactive
    expect(await menuFrame.$eval('#unit', el => el.value)).toBe('');
    expect(await menuFrame.$eval('#unit', el => el.disabled)).toBe(true);
    expect(await menuFrame.$eval('#unit_other', el => el.disabled)).toBe(true);
    expect(await menuFrame.$eval('#extent', el => el.disabled)).toBe(true);

    // check the 'mark as supplied' box is checked
    expect(await menuFrame.$eval('#mark_as_supplied', el => el.checked)).toBe(true);

    // check the default select supplied_source is correct and active and the 'other' box is inactive
    expect(await menuFrame.$eval('#supplied_source', el => el.value)).toBe('other');
    expect(await menuFrame.$eval('#supplied_source', el => el.disabled)).toBe(false);
    expect(await menuFrame.$eval('#supplied_source_other', el => el.disabled)).toBe(false);
    expect(await menuFrame.$eval('#supplied_source_other', el => el.value)).toBe('nonsense');

    // reconfirm the data and check the output
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>this</w><w>is</w><w><supplied source="nonsense" reason="unspecified">supplied</supplied></w>' + xmlTail);

  });

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

    // check the form is properly set up for gaps (not supplied)
    // check the 'mark as supplied' box is not checked
    expect(await menuFrame.$eval('#mark_as_supplied', el => el.checked)).toBe(false);
    expect(await menuFrame.$eval('#supplied_source', el => el.disabled)).toBe(true);

    // check the gap reason pre-select is correct
    expect(await menuFrame.$eval('#gap_reason_dummy_illegible', el => el.checked)).toBe(true);
    // check the non-dummy value agrees
    expect(await menuFrame.$eval('#gap_reason', el => el.value)).toBe('illegible');

    expect(await menuFrame.$eval('#unit', el => el.value)).toBe('');
    expect(await menuFrame.$eval('#unit', el => el.disabled)).toBe(false);

    await menuFrame.select('select[id="unit"]', 'char');
    await menuFrame.type('input#extent', '10');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

    var htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('this <span class="gap" wce_orig="" wce="__t=gap&amp;__n=&amp;original_gap_text=&amp;help=Help&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=illegible&amp;unit=char&amp;unit_other=&amp;extent=10&amp;extent_unspecified=Extent%3DUnspecified&amp;extent_part=Extent%3DPart&amp;supplied_source=na28&amp;supplied_source_other="><span class="format_start mceNonEditable">‹</span>[10]<span class="format_end mceNonEditable">›</span></span> continues');
    var xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>this</w><gap reason="illegible" unit="char" extent="10"/><w>continues</w>' + xmlTail);

    // now check that we can edit it 
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');

    await page.click('button#mceu_12-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle2 = await page.$('div[id="mceu_41"] > div > div > iframe');

    const menuFrame2 = await menuFrameHandle2.contentFrame();

    expect(await menuFrame2.$eval('#unit', el => el.value)).toBe('char');
    expect(await menuFrame2.$eval('#unit', el => el.disabled)).toBe(false);
    expect(await menuFrame2.$eval('input#extent', el => el.value)).toBe('10');
    expect(await menuFrame2.$eval('#gap_reason_dummy_illegible', el => el.checked)).toBe(true);
    expect(await menuFrame2.$eval('#gap_reason', el => el.value)).toBe('illegible');

    await menuFrame2.click('input#insert');
    await page.waitForSelector('div[id="mceu_41"]', { hidden: true });

    xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>this</w><gap reason="illegible" unit="char" extent="10"/><w>continues</w>' + xmlTail);

  }, 200000);

  test('test that the gap created can be edited properly if the data is loaded with setTEI', async () => {
    // preload the data
    const data = xmlHead + '<w>this</w><gap reason="illegible" unit="char" extent="10"/><w>continues</w>' + xmlTail;
    await page.evaluate(`setTEI('${data}');`);

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');

    // open D menu
    await page.click('button#mceu_12-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();

    expect(await menuFrame.$eval('#unit', el => el.value)).toBe('char');
    expect(await menuFrame.$eval('#unit', el => el.disabled)).toBe(false);
    expect(await menuFrame.$eval('input#extent', el => el.value)).toBe('10');
    expect(await menuFrame.$eval('#gap_reason_dummy_illegible', el => el.checked)).toBe(true);
    expect(await menuFrame.$eval('#gap_reason', el => el.value)).toBe('illegible');

    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>this</w><gap reason="illegible" unit="char" extent="10"/><w>continues</w>' + xmlTail);

    // check it can be deleted
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    // open D menu
    await page.click('button#mceu_12-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const xmlData2 = await page.evaluate(`getTEI()`);
    expect(xmlData2).toBe(xmlHead + '<w>this</w><w>continues</w>' + xmlTail);

  }, 200000);

  test('test that the gap created can be edited properly if the data is loaded with setTEI', async () => {
    // preload the data
    const data = xmlHead + '<w>this</w><gap reason="illegible" unit="char" extent="10"/><w>continues</w>' + xmlTail;
    await page.evaluate(`setTEI('${data}');`);

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');

    // open D menu
    await page.click('button#mceu_12-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();

    expect(await menuFrame.$eval('#unit', el => el.value)).toBe('char');
    expect(await menuFrame.$eval('#unit', el => el.disabled)).toBe(false);
    expect(await menuFrame.$eval('input#extent', el => el.value)).toBe('10');
    expect(await menuFrame.$eval('#gap_reason_dummy_illegible', el => el.checked)).toBe(true);
    expect(await menuFrame.$eval('#gap_reason', el => el.value)).toBe('illegible');

    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', {hidden: true});

    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>this</w><gap reason="illegible" unit="char" extent="10"/><w>continues</w>' + xmlTail);

    // check it can be deleted
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    // open D menu
    await page.click('button#mceu_12-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const xmlData2 = await page.evaluate(`getTEI()`);
    expect(xmlData2).toBe(xmlHead + '<w>this</w><w>continues</w>' + xmlTail);

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
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('this <span class="gap" wce_orig="" wce="__t=gap&amp;__n=&amp;original_gap_text=&amp;help=Help&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=unspecified&amp;unit=&amp;unit_other=&amp;extent=&amp;extent_unspecified=Extent%3DUnspecified&amp;extent_part=Extent%3DPart&amp;supplied_source=na28&amp;supplied_source_other="><span class="format_start mceNonEditable">‹</span>[...]<span class="format_end mceNonEditable">›</span></span> continues');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>this</w><gap reason="unspecified"/><w>continues</w>' + xmlTail);
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
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('wo<span class="gap" wce_orig="" wce="__t=gap&amp;__n=&amp;original_gap_text=&amp;help=Help&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=illegible&amp;unit=char&amp;unit_other=&amp;extent=2&amp;extent_unspecified=Extent%3DUnspecified&amp;extent_part=Extent%3DPart&amp;supplied_source=na28&amp;supplied_source_other="><span class="format_start mceNonEditable">‹</span>[2]<span class="format_end mceNonEditable">›</span></span>');
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
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('wo<span class="gap" wce_orig="" wce="__t=gap&amp;__n=&amp;original_gap_text=&amp;help=Help&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=illegible&amp;unit=&amp;unit_other=&amp;extent=&amp;extent_unspecified=Extent%3DUnspecified&amp;extent_part=Extent%3DPart&amp;supplied_source=na28&amp;supplied_source_other="><span class="format_start mceNonEditable">‹</span>[...]<span class="format_end mceNonEditable">›</span></span>');
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
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });
    const idRegex = /id="gap_(\d)_\d+"/g;
    const htmlData = await page.evaluate(`getData()`);
    const modifiedHtml = htmlData.replace(idRegex, 'id="gap_$1_MATH.RAND"');
    expect(modifiedHtml).toBe('missing line<span class="gap" wce_orig="" wce="__t=gap&amp;__n=&amp;original_gap_text=&amp;help=Help&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=illegible&amp;unit=line&amp;unit_other=&amp;extent=part&amp;extent_unspecified=Extent%3DUnspecified&amp;extent_part=Extent%3DPart&amp;supplied_source=na28&amp;supplied_source_other=" id="gap_2_MATH.RAND"><span class="format_start mceNonEditable">‹</span>[...]<span class="format_end mceNonEditable">›</span></span>');
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
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });
    const idRegex = /id="gap_(\d)_\d+"/g;
    const htmlData = await page.evaluate(`getData()`);
    const modifiedHtml = htmlData.replace(idRegex, 'id="gap_$1_MATH.RAND"');
    expect(modifiedHtml).toBe('missing line<span class="gap" wce_orig="" wce="__t=gap&amp;__n=&amp;original_gap_text=&amp;help=Help&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=illegible&amp;unit=line&amp;unit_other=&amp;extent=unspecified&amp;extent_unspecified=Extent%3DUnspecified&amp;extent_part=Extent%3DPart&amp;supplied_source=na28&amp;supplied_source_other=" id="gap_2_MATH.RAND"><span class="format_start mceNonEditable">‹</span>[...]<span class="format_end mceNonEditable">›</span></span>');
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
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });
    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('missing <span class="gap" wce_orig="" wce="__t=gap&amp;__n=&amp;original_gap_text=&amp;help=Help&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=lacuna&amp;unit=quire&amp;unit_other=&amp;extent=1&amp;extent_unspecified=Extent%3DUnspecified&amp;extent_part=Extent%3DPart&amp;supplied_source=na28&amp;supplied_source_other="><span class="format_start mceNonEditable">‹</span><br />QB<br />[...]<span class="format_end mceNonEditable">›</span></span>​ quire');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>missing</w><gap reason="lacuna" unit="quire" extent="1"/><w>quire</w>' + xmlTail);

    // check editing
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');

    // open D menu
    await page.click('button#mceu_12-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle2 = await page.$('div[id="mceu_41"] > div > div > iframe');
    const menuFrame2 = await menuFrameHandle2.contentFrame();

    expect(await menuFrame2.$eval('#unit', el => el.value)).toBe('quire');
    expect(await menuFrame2.$eval('#unit', el => el.disabled)).toBe(false);
    expect(await menuFrame2.$eval('input#extent', el => el.value)).toBe('1');
    expect(await menuFrame2.$eval('#gap_reason_dummy_lacuna', el => el.checked)).toBe(true);
    expect(await menuFrame2.$eval('#gap_reason', el => el.value)).toBe('lacuna');

    await menuFrame2.click('input#insert');
    await page.waitForSelector('div[id="mceu_41"]', { hidden: true });

    const xmlData2 = await page.evaluate(`getTEI()`);
    expect(xmlData2).toBe(xmlHead + '<w>missing</w><gap reason="lacuna" unit="quire" extent="1"/><w>quire</w>' + xmlTail);

    // check deleting
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');

    // open D menu
    await page.click('button#mceu_12-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const xmlData3 = await page.evaluate(`getTEI()`);
    expect(xmlData3).toBe(xmlHead + '<w>missing</w><w>quire</w>' + xmlTail);

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
    expect(modifiedHtml).toBe('missing <span class="gap" wce_orig="" wce="__t=gap&amp;__n=&amp;original_gap_text=&amp;help=Help&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=lacuna&amp;unit=page&amp;unit_other=&amp;extent=2&amp;extent_unspecified=Extent%3DUnspecified&amp;extent_part=Extent%3DPart&amp;supplied_source=na28&amp;supplied_source_other=" id="gap_4_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />PB<br />[...]<br />PB<br />[...]<span class="format_end mceNonEditable">›</span></span>​ pages');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>missing</w><gap reason="lacuna" unit="page" extent="2"/><w>pages</w>' + xmlTail);
  
    // check we can add a page break after the gap (the OTE used to add this as part of the gap but it caused more 
    // problems than it solved so it was changed but we do need to be able to add the next page break from the line
    // that the gap ends on)
    await page.click('button#mceu_10-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle2 = await page.$('div[id="mceu_42"] > div > div > iframe');
    const menuFrame2 = await menuFrameHandle2.contentFrame();
    await menuFrame2.select('select[id="break_type"]', 'pb');
    await menuFrame2.click('input#insert');

    // check editing
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');

    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');

    // open D menu
    await page.click('button#mceu_12-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle3 = await page.$('div[id="mceu_43"] > div > div > iframe');
    const menuFrame3 = await menuFrameHandle3.contentFrame();

    expect(await menuFrame3.$eval('#unit', el => el.value)).toBe('page');
    expect(await menuFrame3.$eval('#unit', el => el.disabled)).toBe(false);
    expect(await menuFrame3.$eval('input#extent', el => el.value)).toBe('2');
    expect(await menuFrame3.$eval('#gap_reason_dummy_lacuna', el => el.checked)).toBe(true);
    expect(await menuFrame3.$eval('#gap_reason', el => el.value)).toBe('lacuna');

    await menuFrame3.click('input#insert');
    await page.waitForSelector('div[id="mceu_41"]', { hidden: true });

    const xmlData2 = await page.evaluate(`getTEI()`);
    expect(xmlData2).toBe(xmlHead + '<w>missing</w><gap reason="lacuna" unit="page" extent="2"/><pb n="1r" type="folio" xml:id="P1r-"/><cb n="P1rC1-"/><lb n="P1rC1L-"/><w>pages</w>' + xmlTail);

    // check deleting
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');

    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');

    // open D menu
    await page.click('button#mceu_12-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const xmlData3 = await page.evaluate(`getTEI()`);
    expect(xmlData3).toBe(xmlHead + '<w>missing</w><pb n="1r" type="folio" xml:id="P1r-"/><cb n="P1rC1-"/><lb n="P1rC1L-"/><w>pages</w>' + xmlTail);

  }, 200000);

  test('page break can be added straight after a page gap', async () => {

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
    expect(modifiedHtml).toBe('<span class="gap" wce_orig="" wce="__t=gap&amp;__n=&amp;original_gap_text=&amp;help=Help&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=lacuna&amp;unit=page&amp;unit_other=&amp;extent=2&amp;extent_unspecified=Extent%3DUnspecified&amp;extent_part=Extent%3DPart&amp;supplied_source=na28&amp;supplied_source_other=" id="gap_4_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />PB<br />[...]<br />PB<br />[...]<span class="format_end mceNonEditable">›</span></span>​');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<gap reason="lacuna" unit="page" extent="2"/>' + xmlTail);

    // navigate away and back again to check break menu still activated
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');

    // open B menu
    await page.click('button#mceu_10-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle2 = await page.$('div[id="mceu_42"] > div > div > iframe');
    const menuFrame2 = await menuFrameHandle2.contentFrame();
    await menuFrame2.select('select[id="break_type"]', 'pb');
    await menuFrame2.click('input#insert');
    await page.waitForSelector('div[id="mceu_42"]', { hidden: true });

    const htmlData2 = await page.evaluate(`getData()`);
    const modifiedHtml2 = htmlData2.replace(idRegex, 'id="$1_$2_MATH.RAND"');
    expect(modifiedHtml2).toBe('<span class="gap" wce_orig="" wce="__t=gap&amp;__n=&amp;original_gap_text=&amp;help=Help&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=lacuna&amp;unit=page&amp;unit_other=&amp;extent=2&amp;extent_unspecified=Extent%3DUnspecified&amp;extent_part=Extent%3DPart&amp;supplied_source=na28&amp;supplied_source_other=" id="gap_4_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />PB<br />[...]<br />PB<br />[...]<span class="format_end mceNonEditable">›</span></span>​<span class="mceNonEditable brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=pb&amp;number=1&amp;rv=r&amp;fibre_type=&amp;lb_alignment=&amp;facs=" id="pb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />PB 1r<span class="format_end mceNonEditable">›</span></span><span class="mceNonEditable brea" wce="__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="cb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />CB 1<span class="format_end mceNonEditable">›</span></span><span class="mceNonEditable brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="lb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />↵<span class="format_end mceNonEditable">›</span></span>');
    const xmlData2 = await page.evaluate(`getTEI()`);
    expect(xmlData2).toBe(xmlHead + '<gap reason="lacuna" unit="page" extent="2"/><pb n="1r" type="folio" xml:id="P1r-"/><cb n="P1rC1-"/><lb n="P1rC1L-"/>' + xmlTail);

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
    expect(htmlData).toBe('the end of the witness <span class="witnessend" wce="__t=gap&amp;__n=&amp;original_gap_text=&amp;gap_reason=witnessEnd&amp;unit=&amp;unit_other=&amp;extent=&amp;supplied_source=na28&amp;supplied_source_other=&amp;insert=Insert&amp;cancel=Cancel"><span class="format_start mceNonEditable">‹</span>Witness End<span class="format_end mceNonEditable">›</span></span>');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>the</w><w>end</w><w>of</w><w>the</w><w>witness</w><gap reason="witnessEnd"/>' + xmlTail);
  }, 200000);

  test('supplied word', async () => {
    await frame.type('body#tinymce', 'a supplied word');
    for (let i = 0; i < ' word'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'supplied'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');

    // open D menu
    await page.click('button#mceu_12-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    // NB: when test is selected makr as supplied is automatically checked
    await menuFrame.click('input#insert');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('a <span class="gap" wce_orig="supplied" wce="__t=gap&amp;__n=&amp;original_gap_text=&amp;help=Help&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=illegible&amp;unit=&amp;unit_other=&amp;extent=&amp;extent_unspecified=Extent%3DUnspecified&amp;extent_part=Extent%3DPart&amp;mark_as_supplied=supplied&amp;supplied_source=na28&amp;supplied_source_other="><span class="format_start mceNonEditable">‹</span>[supplied]<span class="format_end mceNonEditable">›</span></span> word');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>a</w><w><supplied source="na28" reason="illegible">supplied</supplied></w><w>word</w>' + xmlTail);
  }, 200000);

  test('multi-word/part-word supplied with no source given', async () => {
    await frame.type('body#tinymce', 'a supplied word');
    for (let i = 0; i < 'rd'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'supplied wo'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');

    // open D menu
    await page.click('button#mceu_12-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    // NB: when test is selected makr as supplied is automatically checked
    await menuFrame.select('select[id="supplied_source"]', 'none');
    await menuFrame.click('input#insert');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('a <span class="gap" wce_orig="supplied%20wo" wce="__t=gap&amp;__n=&amp;original_gap_text=&amp;help=Help&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=illegible&amp;unit=&amp;unit_other=&amp;extent=&amp;extent_unspecified=Extent%3DUnspecified&amp;extent_part=Extent%3DPart&amp;mark_as_supplied=supplied&amp;supplied_source=none&amp;supplied_source_other="><span class="format_start mceNonEditable">‹</span>[supplied wo]<span class="format_end mceNonEditable">›</span></span>rd');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>a</w><w><supplied reason="illegible">supplied</supplied></w><w><supplied reason="illegible">wo</supplied>rd</w>' + xmlTail);
  }, 200000);

});
