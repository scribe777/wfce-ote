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
    slowMo: 80,
    args: ['--disable-web-security']
  });
});

afterAll(async () => {
  await browser.close();
});

describe('testing Structure entry with bookNames setting', () => {

    beforeEach(async () => {
      let frameHandle;
      jest.setTimeout(5000000);
      page = await browser.newPage();
      await page.goto(`file:${path.join(__dirname, 'test_index_page.html')}`);
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
      const optionCount = await menuFrame.$$eval('select#insertBookNumber > option' , element => element.length);
      expect(optionCount).toBe(2);
      // select Galatians
      await menuFrame.select('select#insertBookNumber', 'Gal');
      await menuFrame.click('input#insert');
      await page.waitForSelector('div[id="mceu_39"]', {hidden: true});
      await frame.type('body#tinymce', 'The content of my book');
      const htmlData = await page.evaluate(`getData()`);
      expect(htmlData).toBe('<span class=\"book_number mceNonEditable\" wce=\"__t=book_number\" id=\"book1\"> Gal</span>The content of my book');
      const xmlData = await page.evaluate(`getTEI()`);
      expect(xmlData).toBe(xmlHead + '<div type="book" n="Gal"><w>The</w><w>content</w><w>of</w><w>my</w><w>book</w></div>' + xmlTail);
    }, 200000);
  
  });
  
  // tests using the checkOverlineForAbbr setting
  
  describe('testing with checkOverlineForAbbr client settings', () => {
  
    beforeEach(async () => {
      let frameHandle;
      jest.setTimeout(5000000);
      page = await browser.newPage();
      await page.goto(`file:${path.join(__dirname, 'test_index_page.html')}`);
      await page.evaluate(`setWceEditor('wce_editor', {checkOverlineForAbbr: true})`);
      page.waitForSelector("#wce_editor_ifr");
      frameHandle = null;
      while (frameHandle === null) {
        frameHandle = await page.$("iframe[id='wce_editor_ifr']");
      }
      frame = await frameHandle.contentFrame();
  
    });
  
    // nomsac with overline checked by default
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
      const addOverlineCheckbox = await menuFrame.$('#add_overline');
      expect(await (await addOverlineCheckbox.getProperty('checked')).jsonValue()).toBeTruthy();
      await menuFrame.click('input#insert');
      await page.waitForSelector('div[id="mceu_40"]', {hidden: true});
  
      const htmlData = await page.evaluate(`getData()`);
      expect(htmlData).toBe('a <span class="abbr_add_overline" wce_orig="ns" wce="__t=abbr&amp;__n=&amp;original_abbr_text=&amp;help=Help&amp;abbr_type=nomSac&amp;abbr_type_other=&amp;add_overline=overline"><span class="format_start mceNonEditable">‹</span>ns<span class="format_end mceNonEditable">›</span></span> abbreviation');
      const xmlData = await page.evaluate(`getTEI()`);
      expect(xmlData).toBe(xmlHead + '<w>a</w><w><abbr type="nomSac"><hi rend="overline">ns</hi></abbr></w><w>abbreviation</w>' + xmlTail);
    }, 200000);
  
  });
  
  describe('testing gaps with non-default optionsForGapMenu settings', () => {
  
    beforeEach(async () => {
      let frameHandle;
      jest.setTimeout(5000000);
      page = await browser.newPage();
      await page.goto(`file:${path.join(__dirname, 'test_index_page.html')}`);
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
    
  });
  
  describe('testing gaps with invalid optionsForGapMenu settings', () => {
  
    beforeEach(async () => {
      let frameHandle;
      jest.setTimeout(5000000);
      page = await browser.newPage();
      await page.goto(`file:${path.join(__dirname, 'test_index_page.html')}`);
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

