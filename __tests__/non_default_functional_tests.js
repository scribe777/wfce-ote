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
    test('test the overline box is checked by default and is used in the output', async () => {
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
      let menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
      let menuFrame = await menuFrameHandle.contentFrame();
      expect(await menuFrame.$eval('#add_overline', el => el.checked)).toBe(true);

      await menuFrame.click('input#insert');
      await page.waitForSelector('div[id="mceu_40"]', {hidden: true});
  
      let htmlData = await page.evaluate(`getData()`);
      expect(htmlData).toBe('a <span class="abbr_add_overline" wce_orig="ns" wce="__t=abbr&amp;__n=&amp;original_abbr_text=&amp;help=Help&amp;abbr_type=nomSac&amp;abbr_type_other=&amp;add_overline=overline"><span class="format_start mceNonEditable">‹</span>ns<span class="format_end mceNonEditable">›</span></span> abbreviation');
      let xmlData = await page.evaluate(`getTEI()`);
      expect(xmlData).toBe(xmlHead + '<w>a</w><w><abbr type="nomSac"><hi rend="overline">ns</hi></abbr></w><w>abbreviation</w>' + xmlTail);

      // add check for reloading the menu
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      // open A menu
      await page.click('button#mceu_14-open');
      // open abbreviation menu for editing
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');

      menuFrameHandle = await page.$('div[id="mceu_41"] > div > div > iframe');
      menuFrame = await menuFrameHandle.contentFrame();
      expect(await menuFrame.$eval('#add_overline', el => el.checked)).toBe(true);

      await menuFrame.click('input#insert');
      await page.waitForSelector('div[id="mceu_41"]', {hidden: true});
  
      xmlData = await page.evaluate(`getTEI()`);
      expect(xmlData).toBe(xmlHead + '<w>a</w><w><abbr type="nomSac"><hi rend="overline">ns</hi></abbr></w><w>abbreviation</w>' + xmlTail);

    }, 200000);


    // test('test that if the default can be overwritten', async () => {

    //     await frame.type('body#tinymce', 'a ns abbreviation');
    
    //     for (let i = 0; i < ' abbreviation'.length; i++) {
    //         await page.keyboard.press('ArrowLeft');
    //     }
    //     await page.keyboard.down('Shift');
    //     for (let i = 0; i < 'ns'.length; i++) {
    //         await page.keyboard.press('ArrowLeft');
    //     }
    //     await page.keyboard.up('Shift');
    //     // open A menu
    //     await page.click('button#mceu_14-open');
    //     // open abbreviation menu
    //     await page.keyboard.press('ArrowDown');
    //     await page.keyboard.press('ArrowRight');
    //     await page.keyboard.press('Enter');
    //     // use defaults
    //     let menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
    //     let menuFrame = await menuFrameHandle.contentFrame();
    //     expect(await menuFrame.$eval('#add_overline', el => el.checked)).toBe(true);
    //     // uncheck the overline box
    //     await menuFrame.click('#add_overline');
    //     expect(await menuFrame.$eval('#add_overline', el => el.checked)).toBe(false);

    //     await menuFrame.click('input#insert');
    //     await page.waitForSelector('div[id="mceu_40"]', {hidden: true});
    
    //     let htmlData = await page.evaluate(`getData()`);
    //     expect(htmlData).toBe('a <span class="abbr" wce_orig="ns" wce="__t=abbr&amp;__n=&amp;original_abbr_text=&amp;help=Help&amp;abbr_type=nomSac&amp;abbr_type_other="><span class="format_start mceNonEditable">‹</span>ns<span class="format_end mceNonEditable">›</span></span> abbreviation');
    //     let xmlData = await page.evaluate(`getTEI()`);
    //     expect(xmlData).toBe(xmlHead + '<w>a</w><w><abbr type="nomSac">ns</abbr></w><w>abbreviation</w>' + xmlTail);

    //     // add check for reloading the menu
    //     await page.keyboard.press('ArrowLeft');
    //     await page.keyboard.press('ArrowLeft');
    //     await page.keyboard.press('ArrowLeft');
    //     // open A menu
    //     await page.click('button#mceu_14-open');
    //     // open abbreviation menu for editing
    //     await page.keyboard.press('ArrowDown');
    //     await page.keyboard.press('ArrowRight');
    //     await page.keyboard.press('ArrowDown');
    //     await page.keyboard.press('Enter');

    //     menuFrameHandle = await page.$('div[id="mceu_41"] > div > div > iframe');
    //     menuFrame = await menuFrameHandle.contentFrame();
    //     expect(await menuFrame.$eval('#add_overline', el => el.checked)).toBe(false);

    //     await menuFrame.click('input#insert');
    //     await page.waitForSelector('div[id="mceu_41"]', {hidden: true});
    
    //     xmlData = await page.evaluate(`getTEI()`);
    //     expect(xmlData).toBe(xmlHead + '<w>a</w><w><abbr type="nomSac">ns</abbr></w><w>abbreviation</w>' + xmlTail);

    // });
  });

  describe('testing with defaultReasonForUnclearText', () => {

    beforeEach(async () => {
      let frameHandle;
      jest.setTimeout(5000000);
      page = await browser.newPage();
      await page.goto(`file:${path.join(__dirname, 'test_index_page.html')}`);
      await page.evaluate(`setWceEditor('wce_editor', {defaultReasonForUnclearText: 'poor image'})`);
      page.waitForSelector("#wce_editor_ifr");
      frameHandle = null;
      while (frameHandle === null) {
        frameHandle = await page.$("iframe[id='wce_editor_ifr']");
      }
      frame = await frameHandle.contentFrame();
  
    });
  
    test('part word unclear with default reason', async () => {
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
      expect(await menuFrame.$eval('#unclear_text_reason', el => el.value)).toBe('poor image');
  
      await menuFrame.click('input#insert');
      await page.waitForSelector('div[id="mceu_40"]', {hidden: true});
      const htmlData = await page.evaluate(`getData()`);
      expect(htmlData).toBe('my wo<span class="unclear" wce_orig="rds" wce="__t=unclear&amp;__n=&amp;help=Help' +
                            '&amp;unclear_text_reason=poor%20image&amp;unclear_text_reason_other=">' +
                            '<span class="format_start mceNonEditable">‹</span>ṛḍṣ' +
                            '<span class="format_end mceNonEditable">›</span></span>');
      const xmlData = await page.evaluate(`getTEI()`);
      expect(xmlData).toBe(xmlHead + '<w>my</w><w>wo<unclear reason="poor image">rds</unclear></w>' + xmlTail);
    }, 200000);
  
    test('whole word unclear with reason that has been changed from default', async () => {
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
      // test default is selected
      expect(await menuFrame.$eval('#unclear_text_reason', el => el.value)).toBe('poor image');
      // check the value can still be changed
      await menuFrame.select('select[id="unclear_text_reason"]', 'faded ink');
      await menuFrame.click('input#insert');
      await page.waitForSelector('div[id="mceu_40"]', {hidden: true});
      const htmlData = await page.evaluate(`getData()`);
      expect(htmlData).toBe('my <span class=\"unclear\" wce_orig=\"words\" wce=\"__t=unclear&amp;__n=&amp;' +
                            'help=Help&amp;unclear_text_reason=faded%20ink&amp;unclear_text_reason_other=\">' +
                            '<span class=\"format_start mceNonEditable\">‹</span>ẉọṛḍṣ' +
                            '<span class=\"format_end mceNonEditable\">›</span></span>');
      const xmlData = await page.evaluate(`getTEI()`);
      expect(xmlData).toBe(xmlHead + '<w>my</w><w><unclear reason="faded ink">words</unclear></w>' + xmlTail);

      // test editing works and isn't overwritten with default
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

      expect(await menuFrame2.$eval('#unclear_text_reason', el => el.value)).toBe('faded ink');
      expect(await menuFrame2.$eval('#unclear_text_reason_other', el => el.disabled)).toBe(true);
      await menuFrame2.click('input#insert');
      await page.waitForSelector('div[id="mceu_41"]', {hidden: true});

      const xmlData2 = await page.evaluate(`getTEI()`);
      expect(xmlData2).toBe(xmlHead + '<w>my</w><w><unclear reason="faded ink">words</unclear></w>' + xmlTail);
    
    }, 200000);
  
  });


  describe('testing with defaultReasonForUnclearText which isn\'t in the list', () => {

    beforeEach(async () => {
      let frameHandle;
      jest.setTimeout(5000000);
      page = await browser.newPage();
      await page.goto(`file:${path.join(__dirname, 'test_index_page.html')}`);
      await page.evaluate(`setWceEditor('wce_editor', {defaultReasonForUnclearText: 'chemical_damage'})`);
      page.waitForSelector("#wce_editor_ifr");
      frameHandle = null;
      while (frameHandle === null) {
        frameHandle = await page.$("iframe[id='wce_editor_ifr']");
      }
      frame = await frameHandle.contentFrame();
  
    });
  
    test('part word unclear with default reason', async () => {
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
      expect(await menuFrame.$eval('#unclear_text_reason', el => el.value)).toBe('other');
      expect(await menuFrame.$eval('#unclear_text_reason_other', el => el.disabled)).toBe(false);
      expect(await menuFrame.$eval('#unclear_text_reason_other', el => el.value)).toBe('chemical_damage');
  
      await menuFrame.click('input#insert');
      await page.waitForSelector('div[id="mceu_40"]', {hidden: true});
      const htmlData = await page.evaluate(`getData()`);
      expect(htmlData).toBe('my wo<span class="unclear" wce_orig="rds" wce="__t=unclear&amp;__n=&amp;help=Help' +
                            '&amp;unclear_text_reason=other&amp;unclear_text_reason_other=chemical_damage">' +
                            '<span class="format_start mceNonEditable">‹</span>ṛḍṣ' +
                            '<span class="format_end mceNonEditable">›</span></span>');
      const xmlData = await page.evaluate(`getTEI()`);
      expect(xmlData).toBe(xmlHead + '<w>my</w><w>wo<unclear reason="chemical_damage">rds</unclear></w>' + xmlTail);
    }, 200000);
  
    test('whole word unclear with reason that has been changed from default', async () => {
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
      // test default is selected
      expect(await menuFrame.$eval('#unclear_text_reason', el => el.value)).toBe('other');
      expect(await menuFrame.$eval('#unclear_text_reason_other', el => el.disabled)).toBe(false);
      expect(await menuFrame.$eval('#unclear_text_reason_other', el => el.value)).toBe('chemical_damage');

      // check the value can still be changed
      await menuFrame.select('select[id="unclear_text_reason"]', 'faded ink');
      await menuFrame.click('select#unclear_text_reason');
      expect(await menuFrame.$eval('#unclear_text_reason_other', el => el.disabled)).toBe(true);
      await page.waitForTimeout(5000)
      await menuFrame.click('input#insert');
      await page.waitForSelector('div[id="mceu_40"]', {hidden: true});
      const xmlData = await page.evaluate(`getTEI()`);
      expect(xmlData).toBe(xmlHead + '<w>my</w><w><unclear reason="faded ink">words</unclear></w>' + xmlTail);
    
    }, 200000);
  });