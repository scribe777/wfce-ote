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
        await page.waitForTimeout(600)
        await page.keyboard.press('Enter');
        await page.waitForTimeout(6000)

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

    //abbr
    // nomsac without overline
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
        await menuFrame.click('input#insert');
        await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

        const htmlData = await page.evaluate(`getData()`);
        expect(htmlData).toBe('a <span class=\"abbr\" wce_orig=\"ns\" wce=\"__t=abbr&amp;__n=&amp;original_abbr_text=&amp;help=Help&amp;abbr_type=nomSac&amp;abbr_type_other=\"><span class=\"format_start mceNonEditable\">‹</span>ns<span class=\"format_end mceNonEditable\">›</span></span> abbreviation');
        const xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>a</w><w><abbr type="nomSac">ns</abbr></w><w>abbreviation</w>' + xmlTail);
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
        const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
        const menuFrame = await menuFrameHandle.contentFrame();
        await menuFrame.click('#add_overline');
        await menuFrame.click('input#insert');
        await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

        const htmlData = await page.evaluate(`getData()`);
        expect(htmlData).toBe('a <span class="abbr_add_overline" wce_orig="ns" wce="__t=abbr&amp;__n=&amp;original_abbr_text=&amp;help=Help&amp;abbr_type=nomSac&amp;abbr_type_other=&amp;add_overline=overline"><span class="format_start mceNonEditable">‹</span>ns<span class="format_end mceNonEditable">›</span></span> abbreviation');
        const xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<w>a</w><w><abbr type="nomSac"><hi rend="overline">ns</hi></abbr></w><w>abbreviation</w>' + xmlTail);
    }, 200000);

    // TODO: add more tests on different abbr structures here?

});