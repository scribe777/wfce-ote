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
        expect(htmlData).toBe('my wo<span class=\"part_abbr\" wce_orig=\"rds\" wce=\"__t=part_abbr&amp;__n=&amp;' +
            'help=Help&amp;exp_rend=&amp;exp_rend_other=\"><span class=\"format_start mceNonEditable\">‹' +
            '</span>(rds)<span class=\"format_end mceNonEditable\">›</span></span>');
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
        expect(htmlData).toBe('my <span class=\"part_abbr\" wce_orig=\"words\" wce=\"__t=part_abbr&amp;__n=&amp;' +
            'help=Help&amp;exp_rend=%C3%B7&amp;exp_rend_other=\">' +
            '<span class=\"format_start mceNonEditable\">‹</span>(words)' +
            '<span class=\"format_end mceNonEditable\">›</span></span>');
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
        await menuFrame.type('input#sp_extent', '5');
        await menuFrame.click('input#insert');
        await page.waitForSelector('div[id="mceu_41"]', { hidden: true });
        const htmlData = await page.evaluate(`getData()`);
        expect(htmlData).toBe('space between <span class=\"spaces\" wce=\"__t=spaces&amp;__n=&amp;original_spaces_text=&amp;help=Help&amp;sp_unit=char&amp;sp_unit_other=&amp;sp_extent=5\"><span class=\"format_start mceNonEditable\">‹</span>sp<span class=\"format_end mceNonEditable\">›</span></span> words');
        const xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>space</w><w>between</w><space unit="char" extent="5"/><w>words</w>' + xmlTail);
    }, 200000);

    // pc typed in
    test('test pc typed', async () => {
        await frame.type('body#tinymce', 'my words.');
        const htmlData = await page.evaluate(`getData()`);
        expect(htmlData).toBe('my words<span class=\"pc\" wce_orig=\"\" wce=\"__t=pc\">' +
            '<span class=\"format_start mceNonEditable\">‹</span>.' +
            '<span class=\"format_end mceNonEditable\">›</span></span>');
        const xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>my</w><w>words</w><pc>.</pc>' + xmlTail);
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
        expect(htmlData).toBe('my words<span class=\"pc\" wce_orig=\"\" wce=\"__t=pc\">' +
            '<span class=\"format_start mceNonEditable\">‹</span>?' +
            '<span class=\"format_end mceNonEditable\">›</span></span>');
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

        const menuFrameHandle = await page.$('div[id="mceu_58"] > div > div > iframe');
        const menuFrame = await menuFrameHandle.contentFrame();
        await menuFrame.type('input#pc_char', '-');
        await menuFrame.click('input#insert');
        await page.waitForSelector('div[id="mceu_58"]', { hidden: true });

        const htmlData = await page.evaluate(`getData()`);
        expect(htmlData).toBe('my words<span class=\"pc\" wce=\"__t=pc\">' +
            '<span class=\"format_start mceNonEditable\">‹</span>-' +
            '<span class=\"format_end mceNonEditable\">›</span></span>');
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
        expect(htmlData).toBe('my words<span class=\"pc\" wce_orig=\"\" wce=\"__t=pc\">' +
            '<span class=\"format_start mceNonEditable\">‹</span>;' +
            '<span class=\"format_end mceNonEditable\">›</span></span>');
        const xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>my</w><w>words</w><pc>;</pc>' + xmlTail);
    }, 200000);

    // abbr
    // nomsac without overline
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
        expect(htmlData).toBe('a <span class=\"abbr\" wce_orig=\"ns\" wce=\"__t=abbr&amp;__n=&amp;original_abbr_text=&amp;help=Help&amp;abbr_type=nomSac&amp;abbr_type_other=\"><span class=\"format_start mceNonEditable\">‹</span>ns<span class=\"format_end mceNonEditable\">›</span></span> abbreviation');
        let xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>a</w><w><abbr type="nomSac">ns</abbr></w><w>abbreviation</w>' + xmlTail);

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

        await menuFrame.click('input#insert');
        await page.waitForSelector('div[id="mceu_41"]', { hidden: true });

        xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>a</w><w><abbr type="nomSac">ns</abbr></w><w>abbreviation</w>' + xmlTail);

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

    // nomsac with overline
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

    // Add a test to check that data loaded via setTEI can still be edited and deleted
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
        expect(htmlData).toBe('a <span class="abbr" wce_orig="ns" wce="__t=abbr&amp;__n=&amp;original_abbr_text=&amp;help=Help&amp;abbr_type=other&amp;abbr_type_other=test\"><span class="format_start mceNonEditable">‹</span>ns<span class="format_end mceNonEditable">›</span></span> abbreviation');
        let xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>a</w><w><abbr type="test">ns</abbr></w><w>abbreviation</w>' + xmlTail);

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
        expect(htmlData).toBe('a <span class="abbr" wce_orig="ns" wce="__t=abbr&amp;__n=&amp;original_abbr_text=&amp;abbr_type=other&amp;abbr_type_other=test\"><span class="format_start mceNonEditable">‹</span>ns<span class="format_end mceNonEditable">›</span></span> abbreviation');
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


    // TODO: add more tests on different abbr structures here?

});