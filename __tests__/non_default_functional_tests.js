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
  
  
  describe('testing with defaultValuesForSpaceMenu setting', () => {

    beforeEach(async () => {
      let frameHandle;
      jest.setTimeout(5000000);
      page = await browser.newPage();
      await page.goto(`file:${path.join(__dirname, 'test_index_page.html')}`);
      // because char is the first option in the select it is always populated with that so I'm using line instead
      await page.evaluate(`setWceEditor('wce_editor', {defaultValuesForSpaceMenu: {'unit': 'line', 'extent': 5}})`);
      page.waitForSelector("#wce_editor_ifr");
      frameHandle = null;
      while (frameHandle === null) {
        frameHandle = await page.$("iframe[id='wce_editor_ifr']");
      }
      frame = await frameHandle.contentFrame();
  
    });
  
    test('test default space options', async () => {
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
      // check extent is pre-populated 
      expect(await menuFrame.$eval('#sp_extent', el => el.value)).toBe('5');
      //check unit is pre-populated
      expect(await menuFrame.$eval('#sp_unit', el => el.value)).toBe('line');
      await menuFrame.click('input#insert');
      await page.waitForSelector('div[id="mceu_41"]', {hidden: true});
      const htmlData = await page.evaluate(`getData()`);
      expect(htmlData).toBe('space between <span class=\"spaces\" wce=\"__t=spaces&amp;__n=&amp;original_spaces_text=&amp;help=Help&amp;sp_unit=line&amp;sp_unit_other=&amp;sp_extent=5\"><span class=\"format_start mceNonEditable\">‹</span>sp<span class=\"format_end mceNonEditable\">›</span></span> words');
      const xmlData = await page.evaluate(`getTEI()`);
      expect(xmlData).toBe(xmlHead + '<w>space</w><w>between</w><space unit="line" extent="5"/><w>words</w>' + xmlTail);

    }, 200000);
  
    test('test default space options can be overriden', async () => {
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
      // check extent is not populated (since we have a setting for that now)
      expect(await menuFrame.$eval('#sp_extent', el => el.value)).toBe('5');
      await menuFrame.click('input#sp_extent');
      await page.keyboard.press('Backspace');
      await menuFrame.type('input#sp_extent', '4');
      //check unit is pre-populated
      expect(await menuFrame.$eval('#sp_unit', el => el.value)).toBe('line');
      await menuFrame.select('select[id="sp_unit"]', 'char');
      await menuFrame.click('input#insert');
      await page.waitForSelector('div[id="mceu_41"]', {hidden: true});
      const htmlData = await page.evaluate(`getData()`);
      expect(htmlData).toBe('space between <span class=\"spaces\" wce=\"__t=spaces&amp;__n=&amp;original_spaces_text=&amp;help=Help&amp;sp_unit=char&amp;sp_unit_other=&amp;sp_extent=4\"><span class=\"format_start mceNonEditable\">‹</span>sp<span class=\"format_end mceNonEditable\">›</span></span> words');
      const xmlData = await page.evaluate(`getTEI()`);
      expect(xmlData).toBe(xmlHead + '<w>space</w><w>between</w><space unit="char" extent="4"/><w>words</w>' + xmlTail);

      // test editing
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      // open P menu
      await page.click('button#mceu_17-open');
      // navigate submenu
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      // access menu window and make selection
      const menuFrameHandle2 = await page.$('div[id="mceu_42"] > div > div > iframe');
      const menuFrame2 = await menuFrameHandle2.contentFrame();
      // check extent is populated correctly
      expect(await menuFrame2.$eval('#sp_extent', el => el.value)).toBe('4');
      expect(await menuFrame.$eval('#sp_unit', el => el.value)).toBe('char');
      expect(await menuFrame.$eval('#sp_unit_other', el => el.disabled)).toBe(true);
      
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('Backspace');

      //NB the selected input will be char as that is at the top of the list and there is no empty select option
      await menuFrame2.click('input#insert');
      await page.waitForSelector('div[id="mceu_42"]', {hidden: true});
      const htmlData2 = await page.evaluate(`getData()`);
      expect(htmlData2).toBe('space between <span class=\"spaces\" wce=\"__t=spaces&amp;__n=&amp;original_spaces_text=&amp;help=Help&amp;sp_unit=char&amp;sp_unit_other=&amp;sp_extent=4\"><span class=\"format_start mceNonEditable\">‹</span>sp<span class=\"format_end mceNonEditable\">›</span></span> words');
      const xmlData2 = await page.evaluate(`getTEI()`);
      expect(xmlData2).toBe(xmlHead + '<w>space</w><w>between</w><space unit="char" extent="4"/><w>words</w>' + xmlTail);

      // test deletion
      // open P menu
      await page.click('button#mceu_17-open');
      // navigate submenu
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');

      const xmlData3 = await page.evaluate(`getTEI()`);
      expect(xmlData3).toBe(xmlHead + '<w>space</w><w>between</w><w>words</w>' + xmlTail);

    }, 200000);
  
  });
  
  describe('testing with invalid defaultValuesForSpaceMenu settings', () => {
  
    beforeEach(async () => {
      let frameHandle;
      jest.setTimeout(5000000);
      page = await browser.newPage();
      await page.goto(`file:${path.join(__dirname, 'test_index_page.html')}`);
      // because char is the first option in the select it is always populated with that so I'm using line instead
      await page.evaluate(`setWceEditor('wce_editor', {defaultValuesForSpaceMenu: {'unit': 'nonsense', 'extent': 'five'}})`);
      page.waitForSelector("#wce_editor_ifr");
      frameHandle = null;
      while (frameHandle === null) {
        frameHandle = await page.$("iframe[id='wce_editor_ifr']");
      }
      frame = await frameHandle.contentFrame();
  
    });
  
    test('test incorrect default behaviour and that they can still be overridden by user actions', async () => {
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
      // check extent is not pre-populated because the value supplied was not a number 
      expect(await menuFrame.$eval('#sp_extent', el => el.value)).toBe('');
      await menuFrame.click('input#sp_extent');
      await menuFrame.type('input#sp_extent', '5');
      //check unit is other as the default requested is not in the option list
      expect(await menuFrame.$eval('#sp_unit', el => el.value)).toBe('other');
      expect(await menuFrame.$eval('#sp_unit_other', el => el.value)).toBe('nonsense');
      
      expect(await menuFrame.$eval('#sp_unit_other', el => el.disabled)).toBe(false);

      await menuFrame.click('input#insert');
      await page.waitForSelector('div[id="mceu_41"]', {hidden: true});
      const htmlData = await page.evaluate(`getData()`);
      expect(htmlData).toBe('space between <span class=\"spaces\" wce=\"__t=spaces&amp;__n=&amp;original_spaces_text=&amp;help=Help&amp;sp_unit=other&amp;sp_unit_other=nonsense&amp;sp_extent=5\"><span class=\"format_start mceNonEditable\">‹</span>sp<span class=\"format_end mceNonEditable\">›</span></span> words');
      const xmlData = await page.evaluate(`getTEI()`);
      expect(xmlData).toBe(xmlHead + '<w>space</w><w>between</w><space unit="nonsense" extent="5"/><w>words</w>' + xmlTail);
    }, 200000);
  
  });

  