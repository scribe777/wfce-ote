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


describe('testing gaps with non-default optionsForGapMenu settings', () => {
  
    beforeEach(async () => {
      let frameHandle;
      jest.setTimeout(5000000);
      page = await browser.newPage();
      await page.goto(`file:${path.join(__dirname, '../test_index_page.html')}`);
      await page.evaluate(`setWceEditor('wce_editor', {optionsForGapMenu: {reason: 'lacuna', suppliedSource: 'transcriber',
                                                                           sourceOptions: [{value: 'transcriber', labelEn: 'Transcriber', labelDe: 'Vorschlag des Transkribenten'},
                                                                                           {value: 'vl', labelEn: 'Vetus Latina', labelDe: 'Vetus Latina'}]}})`);
      page.waitForSelector("#wce_editor_ifr");
      frameHandle = null;
      while (frameHandle === null) {
        frameHandle = await page.$("iframe[id='wce_editor_ifr']");
      }
      frame = await frameHandle.contentFrame();
  
    });
  
    test('test supplied text non-default optional pre-selects and the interface behaviour', async () => {
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
      expect(await menuFrame.$eval('#gap_reason_dummy_lacuna', el => el.checked)).toBe(true);
  
      // check the non-dummy value agrees
      expect(await menuFrame.$eval('#gap_reason', el => el.value)).toBe('lacuna');
   
      // check the drop down menu for supplied_source is the right length
      expect(await menuFrame.$eval('#supplied_source', el => el.options.length)).toBe(4);
      expect(await menuFrame.$eval('#supplied_source', el => el.options[0].value)).toBe('transcriber');
      expect(await menuFrame.$eval('#supplied_source', el => el.options[1].value)).toBe('vl');
      expect(await menuFrame.$eval('#supplied_source', el => el.options[2].value)).toBe('none');
      expect(await menuFrame.$eval('#supplied_source', el => el.options[3].value)).toBe('other');
  
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
  
      await menuFrame.click('input#insert');
  
      const xmlData = await page.evaluate(`getTEI()`);
      expect(xmlData).toBe(xmlHead + '<w>this</w><w>is</w><w><supplied source="transcriber" reason="lacuna">supplied</supplied></w>' + xmlTail);

    });


    test('test supplied text non-default optional pre-selects can be overwritten and edited', async () => {
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
      expect(await menuFrame.$eval('#gap_reason_dummy_lacuna', el => el.checked)).toBe(true);

      // check the non-dummy value agrees
      expect(await menuFrame.$eval('#gap_reason', el => el.value)).toBe('lacuna');
      // change the value
      await menuFrame.click('input#gap_reason_dummy_illegible');
      expect(await menuFrame.$eval('#gap_reason', el => el.value)).toBe('illegible');

      // check the 'mark as supplied' box is checked
      expect(await menuFrame.$eval('#mark_as_supplied', el => el.checked)).toBe(true);
  
      // check the default select supplied_source is correct and active and the 'other' box is inactive
      expect(await menuFrame.$eval('#supplied_source', el => el.value)).toBe('transcriber');
      expect(await menuFrame.$eval('#supplied_source', el => el.disabled)).toBe(false);
      expect(await menuFrame.$eval('#supplied_source_other', el => el.disabled)).toBe(true);
  
      // check when other is selected for supplied_source the box to type the value options
      await menuFrame.select('select[id="supplied_source"]', 'other');
      expect(await menuFrame.$eval('#supplied_source', el => el.value)).toBe('other');
      // NB need to click on this because the function is onclick not onchange (need to understand why before changing it)
      await menuFrame.click('#supplied_source');
      expect(await menuFrame.$eval('#supplied_source_other', el => el.disabled)).toBe(false);
      await menuFrame.type('input[id="supplied_source_other"]', 'basetext');
  
      await menuFrame.click('input#insert');
  
      const xmlData = await page.evaluate(`getTEI()`);
      expect(xmlData).toBe(xmlHead + '<w>this</w><w>is</w><w><supplied source="basetext" reason="illegible">supplied</supplied></w>' + xmlTail);

      // test editing (ensure defaults don't override data)
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
      await page.waitForTimeout(5000)
      const menuFrame2 = await menuFrameHandle2.contentFrame();

      // check the data is correct
      expect(await menuFrame2.$eval('#gap_reason_dummy_illegible', el => el.checked)).toBe(true);
      expect(await menuFrame2.$eval('#gap_reason', el => el.value)).toBe('illegible');
      expect(await menuFrame2.$eval('#mark_as_supplied', el => el.checked)).toBe(true);
      expect(await menuFrame2.$eval('#supplied_source', el => el.value)).toBe('other');
      expect(await menuFrame2.$eval('#supplied_source_other', el => el.disabled)).toBe(false);
      expect(await menuFrame2.$eval('#supplied_source_other', el => el.value)).toBe('basetext');
      await menuFrame2.click('input#insert');

      const xmlData2 = await page.evaluate(`getTEI()`);
      expect(xmlData2).toBe(xmlHead + '<w>this</w><w>is</w><w><supplied source="basetext" reason="illegible">supplied</supplied></w>' + xmlTail);

    });
    
  });
  
  describe('testing gaps with invalid optionsForGapMenu settings', () => {
  
    beforeEach(async () => {
      let frameHandle;
      jest.setTimeout(5000000);
      page = await browser.newPage();
      await page.goto(`file:${path.join(__dirname, '../test_index_page.html')}`);
      await page.evaluate(`setWceEditor('wce_editor', {optionsForGapMenu: {'reason': 'nonsense', 'suppliedSource': 'nonsense',
                                                                           'sourceOptions': [{'value': 'transcriber','labelEn': 'Transcriber', 'labelDe': 'Vorschlag des Transkribenten'},
                                                                                             {'value': 'vl','labelEn': 'Vetus Latina', 'labelDe': 'Vetus Latina'}]}})`);
      page.waitForSelector("#wce_editor_ifr");
      frameHandle = null;
      while (frameHandle === null) {
        frameHandle = await page.$("iframe[id='wce_editor_ifr']");
      }
      frame = await frameHandle.contentFrame();
  
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
      // check the gap reason pre-select is correct (in this case the supplied one is nonsense so we defualt ro the hardcoded illegible)
      expect(await menuFrame.$eval('#gap_reason_dummy_illegible', el => el.checked)).toBe(true);
  
      // check the non-dummy value agrees
      expect(await menuFrame.$eval('#gap_reason', el => el.value)).toBe('illegible');
   
      // check the drop down menu for supplied_source is the right length
      expect(await menuFrame.$eval('#supplied_source', el => el.options.length)).toBe(4);
  
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
       expect(await menuFrame.$eval('#supplied_source_other', el => el.value)).toBe('nonsense');
       expect(await menuFrame.$eval('#supplied_source_other', el => el.disabled)).toBe(false);
  
       await menuFrame.click('input#insert');
  
       const xmlData = await page.evaluate(`getTEI()`);
       expect(xmlData).toBe(xmlHead + '<w>this</w><w>is</w><w><supplied source="nonsense" reason="illegible">supplied</supplied></w>' + xmlTail);
    });
    
  });