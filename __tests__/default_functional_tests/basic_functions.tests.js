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
    await page.goto(`file:${path.join(__dirname, '../test_index_page.html')}`);
    await page.evaluate(`setWceEditor('wce_editor', {})`);
    page.waitForSelector("#wce_editor_ifr");
    frameHandle = null;
    while (frameHandle === null) {
        frameHandle = await page.$("iframe[id='wce_editor_ifr']");
    }
    frame = await frameHandle.contentFrame();

});


describe('testing basic word/pc level functions', () => {

    test('test basic words', async () => {
        await frame.type('body#tinymce', 'my words');
        const htmlData = await page.evaluate(`getData()`);
        expect(htmlData).toBe('my words');
        const xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>my</w><w>words</w>' + xmlTail);

    }, 200000);

    test('test expanded text', async () => {
        await frame.type('body#tinymce', 'my words');
        await page.keyboard.down('Shift');
        for (let i = 0; i < 'rds'.length; i++) {
            await page.keyboard.press('ArrowLeft');
        }
        await page.keyboard.up('Shift');
        // open A menu
        await page.click('button#mceu_14-open');
        // navigate submenu
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');
        // access mnu window and make selection
        const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
        const menuFrame = await menuFrameHandle.contentFrame();
        await menuFrame.click('input#insert');
        await page.waitForSelector('div[id="mceu_40"]', { hidden: true });
        const htmlData = await page.evaluate(`getData()`);
        expect(htmlData).toBe('my wo<span class="part_abbr" wce_orig="rds" wce="__t=part_abbr&amp;__n=&amp;' +
            'help=Help&amp;exp_rend=&amp;exp_rend_other="><span class="format_start mceNonEditable">‹' +
            '</span>(rds)<span class="format_end mceNonEditable">›</span></span>');
    }, 200000);

    test('test expanded whole word with symbol', async () => {
        await frame.type('body#tinymce', 'my words');
        await page.keyboard.down('Shift');
        for (let i = 0; i < 'words'.length; i++) {
            await page.keyboard.press('ArrowLeft');
        }
        await page.keyboard.up('Shift');
        // open A menu
        await page.click('button#mceu_14-open');
        // navigate submenu
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');
        // access mnu window and make selection
        const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
        const menuFrame = await menuFrameHandle.contentFrame();
        await menuFrame.select('select[id="exp_rend"]', '÷');
        await menuFrame.click('input#insert');
        await page.waitForSelector('div[id="mceu_40"]', { hidden: true });
        const htmlData = await page.evaluate(`getData()`);
        expect(htmlData).toBe('my <span class="part_abbr" wce_orig="words" wce="__t=part_abbr&amp;__n=&amp;' +
            'help=Help&amp;exp_rend=%C3%B7&amp;exp_rend_other=">' +
            '<span class="format_start mceNonEditable">‹</span>(words)' +
            '<span class="format_end mceNonEditable">›</span></span>');
    }, 200000);

    // space
    test('space between words', async () => {
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
        expect(await menuFrame.$eval('#sp_extent', el => el.value)).toBe('');
        await menuFrame.type('input#sp_extent', '5');
        //NB the selected input will be char as that is at the top of the list and there is no empty select option
        await menuFrame.click('input#insert');
        await page.waitForSelector('div[id="mceu_41"]', { hidden: true });
        const htmlData = await page.evaluate(`getData()`);
        expect(htmlData).toBe('space between <span class="spaces" wce="__t=spaces&amp;__n=&amp;original_spaces_text=&amp;help=Help&amp;sp_unit=char&amp;sp_unit_other=&amp;sp_extent=5"><span class="format_start mceNonEditable">‹</span>sp<span class="format_end mceNonEditable">›</span></span> words');
        const xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>space</w><w>between</w><space unit="char" extent="5"/><w>words</w>' + xmlTail);

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
        expect(await menuFrame2.$eval('#sp_extent', el => el.value)).toBe('5');

        await menuFrame2.type('input#sp_extent', '4');
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('Backspace');

        //NB the selected input will be char as that is at the top of the list and there is no empty select option
        await menuFrame2.click('input#insert');
        await page.waitForSelector('div[id="mceu_42"]', { hidden: true });
        const htmlData2 = await page.evaluate(`getData()`);
        expect(htmlData2).toBe('space between <span class="spaces" wce="__t=spaces&amp;__n=&amp;original_spaces_text=&amp;help=Help&amp;sp_unit=char&amp;sp_unit_other=&amp;sp_extent=4"><span class="format_start mceNonEditable">‹</span>sp<span class="format_end mceNonEditable">›</span></span> words');
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

    test('test that editing and deletion works if data is loaded with setTEI', async () => {

        // preload the data
        const data = xmlHead + '<w>space</w><w>between</w><space unit="char" extent="5"/><w>words</w>' + xmlTail;
        await page.evaluate(`setTEI('${data}');`);

        // test editing
        for (let i = 0; i < 'space between '.length; i += 1) {
            await page.keyboard.press('ArrowRight');
        }
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');

        // open P menu
        await page.click('button#mceu_17-open');
        // navigate submenu
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        // access menu window and make selection
        const menuFrameHandle = await page.$('div[id="mceu_41"] > div > div > iframe');
        const menuFrame = await menuFrameHandle.contentFrame();
        // check extent is populated correctly
        expect(await menuFrame.$eval('#sp_extent', el => el.value)).toBe('5');
        await menuFrame.select('select[id="sp_unit"]', 'line');
        await menuFrame.type('input#sp_extent', '4');
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('Backspace');

        //NB the selected input will be char as that is at the top of the list and there is no empty select option
        await menuFrame.click('input#insert');
        await page.waitForSelector('div[id="mceu_41"]', { hidden: true });
        const htmlData = await page.evaluate(`getData()`);
        expect(htmlData).toBe('space between <span class="spaces" wce="__t=spaces&amp;__n=&amp;original_spaces_text=&amp;help=Help&amp;sp_unit=line&amp;sp_unit_other=&amp;sp_extent=4"><span class="format_start mceNonEditable">‹</span>sp<span class="format_end mceNonEditable">›</span></span>words');
        const xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>space</w><w>between</w><space unit="line" extent="4"/><w>words</w>' + xmlTail);

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

        const xmlData2 = await page.evaluate(`getTEI()`);
        expect(xmlData2).toBe(xmlHead + '<w>space</w><w>between</w><w>words</w>' + xmlTail);

    }, 200000);

    test('test that editing and deletion works if data is loaded with setTEI and the \'other\' option is required', async () => {
        // preload the data
        const data = xmlHead + '<w>space</w><w>between</w><space unit="millimetres" extent="5"/><w>words</w>' + xmlTail;
        await page.evaluate(`setTEI('${data}');`);

        // test editing
        for (let i = 0; i < 'space between '.length; i += 1) {
            await page.keyboard.press('ArrowRight');
        }
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');

        // open P menu
        await page.click('button#mceu_17-open');
        // navigate submenu
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        // access menu window and make selection
        const menuFrameHandle = await page.$('div[id="mceu_41"] > div > div > iframe');
        const menuFrame = await menuFrameHandle.contentFrame();
        // check form is populated correctly
        expect(await menuFrame.$eval('#sp_extent', el => el.value)).toBe('5');
        expect(await menuFrame.$eval('#sp_unit', el => el.value)).toBe('other');
        expect(await menuFrame.$eval('#sp_unit_other', el => el.disabled)).toBe(false);
        expect(await menuFrame.$eval('#sp_unit_other', el => el.value)).toBe('millimetres');

        await menuFrame.click('input#insert');
        await page.waitForSelector('div[id="mceu_41"]', { hidden: true });
        const htmlData = await page.evaluate(`getData()`);
        expect(htmlData).toBe('space between <span class="spaces" wce="__t=spaces&amp;__n=&amp;original_spaces_text=&amp;help=Help&amp;sp_unit=other&amp;sp_unit_other=millimetres&amp;sp_extent=5"><span class="format_start mceNonEditable">‹</span>sp<span class="format_end mceNonEditable">›</span></span>words');
        const xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>space</w><w>between</w><space unit="millimetres" extent="5"/><w>words</w>' + xmlTail);

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

        const xmlData2 = await page.evaluate(`getTEI()`);
        expect(xmlData2).toBe(xmlHead + '<w>space</w><w>between</w><w>words</w>' + xmlTail);
    }, 200000);

    test('test the form behaves correctly for \'other\' selection', async () => {

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
        // check the selections and disabled input
        expect(await menuFrame.$eval('#sp_extent', el => el.value)).toBe('');
        //NB the selected input will be char as that is at the top of the list and there is no empty select option
        expect(await menuFrame.$eval('#sp_unit', el => el.value)).toBe('char');
        expect(await menuFrame.$eval('#sp_unit_other', el => el.value)).toBe('');
        expect(await menuFrame.$eval('#sp_unit_other', el => el.disabled)).toBe(true);

        // test that selecting other undisabled the correct input box
        await menuFrame.select('select[id="sp_unit"]', 'other');
        // NB need to click on this because the function is onclick not onchange (need to understand why before changing it)
        await menuFrame.click('#sp_unit');
        expect(await menuFrame.$eval('#sp_unit_other', el => el.disabled)).toBe(false);

        // check that deselecting other disables the other box
        await menuFrame.select('select[id="sp_unit"]', 'char');
        // NB need to click on this because the function is onclick not onchange (need to understand why before changing it)
        await menuFrame.click('#sp_unit');
        expect(await menuFrame.$eval('#sp_unit_other', el => el.disabled)).toBe(true);

        // check that the other option works
        await menuFrame.select('select[id="sp_unit"]', 'other');
        // NB need to click on this because the function is onclick not onchange (need to understand why before changing it)
        await menuFrame.click('#sp_unit');
        expect(await menuFrame.$eval('#sp_unit_other', el => el.disabled)).toBe(false);
        await menuFrame.type('input#sp_unit_other', 'millimetres');
        await menuFrame.type('input#sp_extent', '4');

        await menuFrame.click('input#insert');
        await page.waitForSelector('div[id="mceu_41"]', { hidden: true });

        const xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>space</w><w>between</w><space unit="millimetres" extent="4"/><w>words</w>' + xmlTail);




    }, 200000);

    // pc typed in
    test('test pc typed', async () => {
        await frame.type('body#tinymce', 'my words.');
        const htmlData = await page.evaluate(`getData()`);
        expect(htmlData).toBe('my words<span class="pc" wce_orig="" wce="__t=pc">' +
            '<span class="format_start mceNonEditable">‹</span>.' +
            '<span class="format_end mceNonEditable">›</span></span>');
        const xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>my</w><w>words</w><pc>.</pc>' + xmlTail);
    }, 200000);

    // pc typed in
    test('test typed comma because we changed the way the key is identified', async () => {
        await frame.type('body#tinymce', 'my words, with comma');
        const htmlData = await page.evaluate(`getData()`);
        expect(htmlData).toBe('my words<span class="pc" wce_orig="" wce="__t=pc">' +
            '<span class="format_start mceNonEditable">‹</span>,' +
            '<span class="format_end mceNonEditable">›</span></span>  with comma');
        const xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>my</w><w>words</w><pc>,</pc><w>with</w><w>comma</w>' + xmlTail);
    }, 200000);

    // pc with menu
    test('test pc with menu', async () => {
        await frame.type('body#tinymce', 'my words');
        // open P menu
        await page.click('button#mceu_17-open');
        // navigate to question mark on submenu
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');

        const htmlData = await page.evaluate(`getData()`);
        expect(htmlData).toBe('my words<span class="pc" wce_orig="" wce="__t=pc">' +
            '<span class="format_start mceNonEditable">‹</span>?' +
            '<span class="format_end mceNonEditable">›</span></span>');
        const xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>my</w><w>words</w><pc>?</pc>' + xmlTail);
    }, 200000);


    // check other punctuation option [issue #25]
    // pc with menu
    test('test pc with menu', async () => {
        await frame.type('body#tinymce', 'my words');
        // open P menu
        await page.click('button#mceu_17-open');
        // navigate to the Other option on submenu (quicker to go up!)
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowUp');
        await page.keyboard.press('Enter');

        const menuFrameHandle = await page.$('div[id="mceu_59"] > div > div > iframe');
        const menuFrame = await menuFrameHandle.contentFrame();
        await menuFrame.type('input#pc_char', '-');
        await menuFrame.click('input#insert');
        await page.waitForSelector('div[id="mceu_59"]', { hidden: true });

        const htmlData = await page.evaluate(`getData()`);
        expect(htmlData).toBe('my words<span class="pc" wce="__t=pc">' +
            '<span class="format_start mceNonEditable">‹</span>-' +
            '<span class="format_end mceNonEditable">›</span></span>');
        const xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>my</w><w>words</w><pc>-</pc>' + xmlTail);
    }, 200000);

    // pc with menu
    test('test pc with menu (semicolon as I changed the code for that)', async () => {
        await frame.type('body#tinymce', 'my words');
        // open P menu
        await page.click('button#mceu_17-open');
        // navigate to question mark on submenu
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');

        const htmlData = await page.evaluate(`getData()`);
        expect(htmlData).toBe('my words<span class="pc" wce_orig="" wce="__t=pc">' +
            '<span class="format_start mceNonEditable">‹</span>;' +
            '<span class="format_end mceNonEditable">›</span></span>');
        const xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>my</w><w>words</w><pc>;</pc>' + xmlTail);
    }, 200000);

    // abbr
    // nomsac without overline including hover over
    test('test abbr adding without overline', async () => {
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
        await menuFrame.click('input#insert');
        await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

        let htmlData = await page.evaluate(`getData()`);
        expect(htmlData).toBe('a <span class="abbr" wce_orig="ns" wce="__t=abbr&amp;__n=&amp;original_abbr_text=&amp;help=Help&amp;abbr_type=nomSac&amp;abbr_type_other="><span class="format_start mceNonEditable">‹</span>ns<span class="format_end mceNonEditable">›</span></span> abbreviation');
        let xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>a</w><w><abbr type="nomSac">ns</abbr></w><w>abbreviation</w>' + xmlTail);

        // check that the hover over works
        const correction = await frame.$('span.abbr');
        const spanPos = await frame.evaluate((correction) => {
        const {top, left, bottom, right} = correction.getBoundingClientRect();
                return {top, left, bottom, right};
              }, correction);
        const sidebarWidth = await page.$eval('.wce-linenumber-sidebar', el => el.offsetWidth);
        const menubarHeight = await page.$eval('#mceu_25-body', el => el.offsetHeight);
        let targetX = spanPos.left + ((spanPos.right - spanPos.left) / 2) + sidebarWidth;
        let targetY = spanPos.top + ((spanPos.bottom - spanPos.top) / 2) + menubarHeight;
        await page.mouse.move(targetX, targetY);
        // check the content of the hover over
        const hoverValue = await page.$eval('#hover-data-content', el => el.innerHTML);
        expect(hoverValue).toBe('Nomen Sacrum');

        // check that it can be edited
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
        expect(await menuFrame.$eval('#add_overline', el => el.checked)).toBe(false);

        await menuFrame.click('input#insert');
        await page.waitForSelector('div[id="mceu_41"]', { hidden: true });

        xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>a</w><w><abbr type="nomSac">ns</abbr></w><w>abbreviation</w>' + xmlTail);

        // check that the hover over still works
        const correction2 = await frame.$('span.abbr');
        const spanPos2 = await frame.evaluate((correction2) => {
        const {top, left, bottom, right} = correction2.getBoundingClientRect();
                return {top, left, bottom, right};
              }, correction2);
        const sidebarWidth2 = await page.$eval('.wce-linenumber-sidebar', el => el.offsetWidth);
        const menubarHeight2 = await page.$eval('#mceu_25-body', el => el.offsetHeight);
        targetX = spanPos2.left + ((spanPos2.right - spanPos2.left) / 2) + sidebarWidth2;
        targetY = spanPos2.top + ((spanPos2.bottom - spanPos2.top) / 2) + menubarHeight2;
        await page.mouse.move(targetX, targetY);
        // check the content of the hover over
        const hoverValue2 = await page.$eval('#hover-data-content', el => el.innerHTML);
        expect(hoverValue2).toBe('Nomen Sacrum');

        // check that it can be deleted (after editing the cursor will already be in the correct place)
        // open A menu
        await page.click('button#mceu_14-open');
        // open abbreviation menu for editing
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');

        // await page.waitForTimeout(6000);
        xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>a</w><w>ns</w><w>abbreviation</w>' + xmlTail);
    }, 200000);

    // nomsac with overline including hover over
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
        let menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
        let menuFrame = await menuFrameHandle.contentFrame();
        await menuFrame.click('#add_overline');
        await menuFrame.click('input#insert');
        await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

        let htmlData = await page.evaluate(`getData()`);
        expect(htmlData).toBe('a <span class="abbr_add_overline" wce_orig="ns" wce="__t=abbr&amp;__n=&amp;original_abbr_text=&amp;help=Help&amp;abbr_type=nomSac&amp;abbr_type_other=&amp;add_overline=overline"><span class="format_start mceNonEditable">‹</span>ns<span class="format_end mceNonEditable">›</span></span> abbreviation');
        let xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>a</w><w><abbr type="nomSac"><hi rend="overline">ns</hi></abbr></w><w>abbreviation</w>' + xmlTail);

        // check that the hover over works if there is an overline
        const correction = await frame.$('span.abbr_add_overline');
        const spanPos = await frame.evaluate((correction) => {
        const {top, left, bottom, right} = correction.getBoundingClientRect();
                return {top, left, bottom, right};
              }, correction);
        const sidebarWidth = await page.$eval('.wce-linenumber-sidebar', el => el.offsetWidth);
        const menubarHeight = await page.$eval('#mceu_25-body', el => el.offsetHeight);
        let targetX = spanPos.left + ((spanPos.right - spanPos.left) / 2) + sidebarWidth;
        let targetY = spanPos.top + ((spanPos.bottom - spanPos.top) / 2) + menubarHeight;
        await page.mouse.move(targetX, targetY);
        // check the content of the hover over
        const hoverValue = await page.$eval('#hover-data-content', el => el.innerHTML);
        expect(hoverValue).toBe('Nomen Sacrum');

        //check that it can be edited
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
        await page.waitForSelector('div[id="mceu_41"]', { hidden: true });

        xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>a</w><w><abbr type="nomSac"><hi rend="overline">ns</hi></abbr></w><w>abbreviation</w>' + xmlTail);

        // check that the hover over still works if there is an overline
        const correction2 = await frame.$('span.abbr_add_overline');
        const spanPos2 = await frame.evaluate((correction2) => {
        const {top, left, bottom, right} = correction2.getBoundingClientRect();
                return {top, left, bottom, right};
              }, correction2);
        const sidebarWidth2 = await page.$eval('.wce-linenumber-sidebar', el => el.offsetWidth);
        const menubarHeight2 = await page.$eval('#mceu_25-body', el => el.offsetHeight);
        targetX = spanPos2.left + ((spanPos2.right - spanPos2.left) / 2) + sidebarWidth2;
        targetY = spanPos2.top + ((spanPos2.bottom - spanPos2.top) / 2) + menubarHeight2;
        await page.mouse.move(targetX, targetY);
        // check the content of the hover over
        const hoverValue2 = await page.$eval('#hover-data-content', el => el.innerHTML);
        expect(hoverValue2).toBe('Nomen Sacrum');

        // check that it can be deleted (after editing the cursor will already be in the correct place)
        // open A menu
        await page.click('button#mceu_14-open');
        // select delete
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');

        xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>a</w><w>ns</w><w>abbreviation</w>' + xmlTail);
    }, 200000);

    // Add a test to check that data loaded via setTEI can still be edited and deleted including hover over
    test('', async () => {
        const data = xmlHead + '<w>a</w><w><abbr type="nomSac"><hi rend="overline">ns</hi></abbr></w><w>abbreviation</w>' + xmlTail;
        await page.evaluate(`setTEI('${data}');`);

        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');

        // open A menu
        await page.click('button#mceu_14-open');
        // open abbreviation menu for editing
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');

        let menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
        let menuFrame = await menuFrameHandle.contentFrame();
        expect(await menuFrame.$eval('#add_overline', el => el.checked)).toBe(true);
        await menuFrame.click('#add_overline');
        await menuFrame.click('input#insert');
        await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

        let htmlData = await page.evaluate(`getData()`);
        expect(htmlData).toBe('a <span class="abbr" wce_orig="ns" wce="__t=abbr&amp;__n=&amp;original_abbr_text=&amp;help=Help&amp;abbr_type=nomSac&amp;abbr_type_other="><span class="format_start mceNonEditable">‹</span>ns<span class="format_end mceNonEditable">›</span></span> abbreviation');
        let xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>a</w><w><abbr type="nomSac">ns</abbr></w><w>abbreviation</w>' + xmlTail);

        // check that the hover over works 
        const correction = await frame.$('span.abbr');
        const spanPos = await frame.evaluate((correction) => {
        const {top, left, bottom, right} = correction.getBoundingClientRect();
                return {top, left, bottom, right};
              }, correction);
        const sidebarWidth = await page.$eval('.wce-linenumber-sidebar', el => el.offsetWidth);
        const menubarHeight = await page.$eval('#mceu_25-body', el => el.offsetHeight);
        let targetX = spanPos.left + ((spanPos.right - spanPos.left) / 2) + sidebarWidth;
        let targetY = spanPos.top + ((spanPos.bottom - spanPos.top) / 2) + menubarHeight;
        await page.mouse.move(targetX, targetY);
        // check the content of the hover over
        const hoverValue = await page.$eval('#hover-data-content', el => el.innerHTML);
        expect(hoverValue).toBe('Nomen Sacrum');

        // check that it can be deleted (after editing the cursor will already be in the correct place)
        // open A menu
        await page.click('button#mceu_14-open');
        // select delete
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');

        xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>a</w><w>ns</w><w>abbreviation</w>' + xmlTail);
    }, 200000);

    // including hover over
    test('test abbr form when \'other\' is selected/deselected', async () => {
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
        // initially the 'other' entry box is disabled
        expect(await menuFrame.$eval('#abbr_type_other', el => el.disabled)).toBe(true);
        // then enabled when 'other' is selected
        await menuFrame.select('select[id="abbr_type"]', 'other');
        expect(await menuFrame.$eval('#abbr_type_other', el => el.disabled)).toBe(false);
        // then disabled when a different option is selected
        await menuFrame.select('select[id="abbr_type"]', 'num');
        expect(await menuFrame.$eval('#abbr_type_other', el => el.disabled)).toBe(true);
        // now check the other option works
        await menuFrame.select('select[id="abbr_type"]', 'other');
        expect(await menuFrame.$eval('#abbr_type_other', el => el.disabled)).toBe(false);

        await menuFrame.type('#abbr_type_other', 'test');

        await menuFrame.click('input#insert');
        await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

        let htmlData = await page.evaluate(`getData()`);
        expect(htmlData).toBe('a <span class="abbr" wce_orig="ns" wce="__t=abbr&amp;__n=&amp;original_abbr_text=&amp;help=Help&amp;abbr_type=other&amp;abbr_type_other=test"><span class="format_start mceNonEditable">‹</span>ns<span class="format_end mceNonEditable">›</span></span> abbreviation');
        let xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>a</w><w><abbr type="test">ns</abbr></w><w>abbreviation</w>' + xmlTail);

        // check that the hover over works 
        const correction = await frame.$('span.abbr');
        const spanPos = await frame.evaluate((correction) => {
        const {top, left, bottom, right} = correction.getBoundingClientRect();
                return {top, left, bottom, right};
              }, correction);
        const sidebarWidth = await page.$eval('.wce-linenumber-sidebar', el => el.offsetWidth);
        const menubarHeight = await page.$eval('#mceu_25-body', el => el.offsetHeight);
        let targetX = spanPos.left + ((spanPos.right - spanPos.left) / 2) + sidebarWidth;
        let targetY = spanPos.top + ((spanPos.bottom - spanPos.top) / 2) + menubarHeight;
        await page.mouse.move(targetX, targetY);
        // check the content of the hover over
        const hoverValue = await page.$eval('#hover-data-content', el => el.innerHTML);
        expect(hoverValue).toBe('test');

        //check that it can be edited
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
        expect(await menuFrame.$eval('#add_overline', el => el.checked)).toBe(false);
        expect(await menuFrame.$eval('#abbr_type', el => el.value)).toBe('other');
        expect(await menuFrame.$eval('#abbr_type_other', el => el.disabled)).toBe(false);
        expect(await menuFrame.$eval('#abbr_type_other', el => el.value)).toBe('test');


        await menuFrame.click('input#insert');
        await page.waitForSelector('div[id="mceu_41"]', { hidden: true });

        xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>a</w><w><abbr type="test">ns</abbr></w><w>abbreviation</w>' + xmlTail);

        // check that the hover over still works if there is an overline
        const correction2 = await frame.$('span.abbr');
        const spanPos2 = await frame.evaluate((correction2) => {
        const {top, left, bottom, right} = correction2.getBoundingClientRect();
                return {top, left, bottom, right};
              }, correction2);
        const sidebarWidth2 = await page.$eval('.wce-linenumber-sidebar', el => el.offsetWidth);
        const menubarHeight2 = await page.$eval('#mceu_25-body', el => el.offsetHeight);
        targetX = spanPos2.left + ((spanPos2.right - spanPos2.left) / 2) + sidebarWidth2;
        targetY = spanPos2.top + ((spanPos2.bottom - spanPos2.top) / 2) + menubarHeight2;
        await page.mouse.move(targetX, targetY);
        // check the content of the hover over
        const hoverValue2 = await page.$eval('#hover-data-content', el => el.innerHTML);
        expect(hoverValue2).toBe('test');

        // check that it can be deleted (after editing the cursor will already be in the correct place)
        // open A menu
        await page.click('button#mceu_14-open');
        // select delete
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');

        xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>a</w><w>ns</w><w>abbreviation</w>' + xmlTail);
    }, 200000);


    test('test abbr form when \'other\' is selected/deselected if data is set using setTEI', async () => {
        const data = xmlHead + '<w>a</w><w><abbr type="test">ns</abbr></w><w>abbreviation</w>' + xmlTail;
        await page.evaluate(`setTEI('${data}');`);

        let htmlData = await page.evaluate(`getData()`);
        expect(htmlData).toBe('a <span class="abbr" wce_orig="ns" wce="__t=abbr&amp;__n=&amp;original_abbr_text=&amp;abbr_type=other&amp;abbr_type_other=test"><span class="format_start mceNonEditable">‹</span>ns<span class="format_end mceNonEditable">›</span></span> abbreviation');
        let xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>a</w><w><abbr type="test">ns</abbr></w><w>abbreviation</w>' + xmlTail);

        //check that it can be edited
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(5000)

        // open A menu
        await page.click('button#mceu_14-open');
        // open abbreviation menu for editing
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');

        menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
        menuFrame = await menuFrameHandle.contentFrame();
        expect(await menuFrame.$eval('#add_overline', el => el.checked)).toBe(false);
        expect(await menuFrame.$eval('#abbr_type', el => el.value)).toBe('other');
        expect(await menuFrame.$eval('#abbr_type_other', el => el.disabled)).toBe(false);
        expect(await menuFrame.$eval('#abbr_type_other', el => el.value)).toBe('test');


        await menuFrame.click('input#insert');
        await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

        xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>a</w><w><abbr type="test">ns</abbr></w><w>abbreviation</w>' + xmlTail);

        // check that the hover over works 
        const correction = await frame.$('span.abbr');
        const spanPos = await frame.evaluate((correction) => {
        const {top, left, bottom, right} = correction.getBoundingClientRect();
                return {top, left, bottom, right};
              }, correction);
        const sidebarWidth = await page.$eval('.wce-linenumber-sidebar', el => el.offsetWidth);
        const menubarHeight = await page.$eval('#mceu_25-body', el => el.offsetHeight);
        let targetX = spanPos.left + ((spanPos.right - spanPos.left) / 2) + sidebarWidth;
        let targetY = spanPos.top + ((spanPos.bottom - spanPos.top) / 2) + menubarHeight;
        await page.mouse.move(targetX, targetY);
        // check the content of the hover over
        const hoverValue = await page.$eval('#hover-data-content', el => el.innerHTML);
        expect(hoverValue).toBe('test');

        // check that it can be deleted (after editing the cursor will already be in the correct place)
        // open A menu
        await page.click('button#mceu_14-open');
        // select delete
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');

        xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>a</w><w>ns</w><w>abbreviation</w>' + xmlTail);
    }, 200000);

    // num abbreviation without overline including hover over
    test('test abbr num adding without overline', async () => {
        await frame.type('body#tinymce', 'a num abbreviation');

        for (let i = 0; i < ' abbreviation'.length; i++) {
            await page.keyboard.press('ArrowLeft');
        }
        await page.keyboard.down('Shift');
        for (let i = 0; i < 'num'.length; i++) {
            await page.keyboard.press('ArrowLeft');
        }
        await page.keyboard.up('Shift');
        // open A menu
        await page.click('button#mceu_14-open');
        // open abbreviation menu
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');
        // select number as type
        let menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
        let menuFrame = await menuFrameHandle.contentFrame();
        await menuFrame.select('select[id="abbr_type"]', 'num');
        await menuFrame.click('input#insert');
        await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

        let htmlData = await page.evaluate(`getData()`);
        expect(htmlData).toBe('a <span class="abbr" wce_orig="num" wce="__t=abbr&amp;__n=&amp;original_abbr_text=&amp;help=Help&amp;abbr_type=num&amp;abbr_type_other="><span class="format_start mceNonEditable">‹</span>num<span class="format_end mceNonEditable">›</span></span> abbreviation');
        let xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>a</w><w><abbr type="num">num</abbr></w><w>abbreviation</w>' + xmlTail);

        // check that the hover over works
        const correction = await frame.$('span.abbr');
        const spanPos = await frame.evaluate((correction) => {
        const {top, left, bottom, right} = correction.getBoundingClientRect();
                return {top, left, bottom, right};
                }, correction);
        const sidebarWidth = await page.$eval('.wce-linenumber-sidebar', el => el.offsetWidth);
        const menubarHeight = await page.$eval('#mceu_25-body', el => el.offsetHeight);
        let targetX = spanPos.left + ((spanPos.right - spanPos.left) / 2) + sidebarWidth;
        let targetY = spanPos.top + ((spanPos.bottom - spanPos.top) / 2) + menubarHeight;
        await page.mouse.move(targetX, targetY);
        // check the content of the hover over
        const hoverValue = await page.$eval('#hover-data-content', el => el.innerHTML);
        expect(hoverValue).toBe('Numeral');

        // check that it can be edited
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
        expect(await menuFrame.$eval('#add_overline', el => el.checked)).toBe(false);

        await menuFrame.click('input#insert');
        await page.waitForSelector('div[id="mceu_41"]', { hidden: true });

        xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>a</w><w><abbr type="num">num</abbr></w><w>abbreviation</w>' + xmlTail);

        // check that the hover over still works
        const correction2 = await frame.$('span.abbr');
        const spanPos2 = await frame.evaluate((correction2) => {
        const {top, left, bottom, right} = correction2.getBoundingClientRect();
                return {top, left, bottom, right};
                }, correction2);
        const sidebarWidth2 = await page.$eval('.wce-linenumber-sidebar', el => el.offsetWidth);
        const menubarHeight2 = await page.$eval('#mceu_25-body', el => el.offsetHeight);
        targetX = spanPos2.left + ((spanPos2.right - spanPos2.left) / 2) + sidebarWidth2;
        targetY = spanPos2.top + ((spanPos2.bottom - spanPos2.top) / 2) + menubarHeight2;
        await page.mouse.move(targetX, targetY);
        // check the content of the hover over
        const hoverValue2 = await page.$eval('#hover-data-content', el => el.innerHTML);
        expect(hoverValue2).toBe('Numeral');

        // check that it can be deleted (after editing the cursor will already be in the correct place)
        // open A menu
        await page.click('button#mceu_14-open');
        // open abbreviation menu for editing
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');

        // await page.waitForTimeout(6000);
        xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>a</w><w>num</w><w>abbreviation</w>' + xmlTail);
    }, 200000);

    // nomsac with overline including hover over
    test('test num abbr', async () => {
        await frame.type('body#tinymce', 'a num abbreviation');

        for (let i = 0; i < ' abbreviation'.length; i++) {
            await page.keyboard.press('ArrowLeft');
        }
        await page.keyboard.down('Shift');
        for (let i = 0; i < 'num'.length; i++) {
            await page.keyboard.press('ArrowLeft');
        }
        await page.keyboard.up('Shift');
        // open A menu
        await page.click('button#mceu_14-open');
        // open abbreviation menu
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');
        // select number and overline
        let menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
        let menuFrame = await menuFrameHandle.contentFrame();
        await menuFrame.select('select[id="abbr_type"]', 'num');
        await menuFrame.click('#add_overline');
        await menuFrame.click('input#insert');
        await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

        let htmlData = await page.evaluate(`getData()`);
        expect(htmlData).toBe('a <span class="abbr_add_overline" wce_orig="num" wce="__t=abbr&amp;__n=&amp;original_abbr_text=&amp;help=Help&amp;abbr_type=num&amp;abbr_type_other=&amp;add_overline=overline"><span class="format_start mceNonEditable">‹</span>num<span class="format_end mceNonEditable">›</span></span> abbreviation');
        let xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>a</w><w><abbr type="num"><hi rend="overline">num</hi></abbr></w><w>abbreviation</w>' + xmlTail);

        // check that the hover over works if there is an overline
        const correction = await frame.$('span.abbr_add_overline');
        const spanPos = await frame.evaluate((correction) => {
        const {top, left, bottom, right} = correction.getBoundingClientRect();
                return {top, left, bottom, right};
                }, correction);
        const sidebarWidth = await page.$eval('.wce-linenumber-sidebar', el => el.offsetWidth);
        const menubarHeight = await page.$eval('#mceu_25-body', el => el.offsetHeight);
        let targetX = spanPos.left + ((spanPos.right - spanPos.left) / 2) + sidebarWidth;
        let targetY = spanPos.top + ((spanPos.bottom - spanPos.top) / 2) + menubarHeight;
        await page.mouse.move(targetX, targetY);
        // check the content of the hover over
        const hoverValue = await page.$eval('#hover-data-content', el => el.innerHTML);
        expect(hoverValue).toBe('Numeral');

        //check that it can be edited
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
        await page.waitForSelector('div[id="mceu_41"]', { hidden: true });

        xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>a</w><w><abbr type="num"><hi rend="overline">num</hi></abbr></w><w>abbreviation</w>' + xmlTail);

        // check that the hover over still works if there is an overline
        const correction2 = await frame.$('span.abbr_add_overline');
        const spanPos2 = await frame.evaluate((correction2) => {
        const {top, left, bottom, right} = correction2.getBoundingClientRect();
                return {top, left, bottom, right};
                }, correction2);
        const sidebarWidth2 = await page.$eval('.wce-linenumber-sidebar', el => el.offsetWidth);
        const menubarHeight2 = await page.$eval('#mceu_25-body', el => el.offsetHeight);
        targetX = spanPos2.left + ((spanPos2.right - spanPos2.left) / 2) + sidebarWidth2;
        targetY = spanPos2.top + ((spanPos2.bottom - spanPos2.top) / 2) + menubarHeight2;
        await page.mouse.move(targetX, targetY);
        // check the content of the hover over
        const hoverValue2 = await page.$eval('#hover-data-content', el => el.innerHTML);
        expect(hoverValue2).toBe('Numeral');

        // check that it can be deleted (after editing the cursor will already be in the correct place)
        // open A menu
        await page.click('button#mceu_14-open');
        // select delete
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');

        xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>a</w><w>num</w><w>abbreviation</w>' + xmlTail);
    }, 200000);

});