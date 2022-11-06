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


describe('testing coptic settings', () => {

    beforeEach(async () => {
        let frameHandle;
        jest.setTimeout(5000000);
        page = await browser.newPage();
        await page.goto(`file:${path.join(__dirname, '../test_index_page.html')}`);
        await page.evaluate(`setWceEditor('wce_editor', {transcriptionLanguage: 'coptic'})`);
        page.waitForSelector("#wce_editor_ifr");
        frameHandle = null;
        while (frameHandle === null) {
            frameHandle = await page.$("iframe[id='wce_editor_ifr']");
        }
        frame = await frameHandle.contentFrame();

    });

    // 
    test('test coptic font', async () => {
        expect(await frame.$eval('.mce-content-body', el => getComputedStyle(el).font)).toBe('24px / 48px AntinoouWeb, GentiumPlus');
    });
});

describe('testing with toolbar settings', () => {

    beforeEach(async () => {
        let frameHandle;
        jest.setTimeout(5000000);
        page = await browser.newPage();
        await page.goto(`file:${path.join(__dirname, '../test_index_page.html')}`);
        await page.evaluate(`setWceEditor('wce_editor', {toolbar: 'undo redo charmap | breaks correction illegible decoration abbreviation paratext note punctuation versemodify'})`);
        page.waitForSelector("#wce_editor_ifr");
        frameHandle = null;
        while (frameHandle === null) {
            frameHandle = await page.$("iframe[id='wce_editor_ifr']");
        }
        frame = await frameHandle.contentFrame();

    });


    test('check that the correct functions are avilable', async () => {
        expect(await page.waitForSelector('div[aria-label="Undo"]')).toBeTruthy();
        expect(await page.waitForSelector('div[aria-label="Redo"]')).toBeTruthy();
        // expect(await page.waitForSelector('div[aria-label="WCE special character map"]')).toBeTruthy();

        expect(await page.$$eval('div[aria-label="Source code"]', button => button.length)).toBe(0);

        expect(await page.$$eval('#mceu_4 > button > span', button => button.length)).toBe(0);

        expect(await page.$$eval('div[aria-label="Print"]', button => button.length)).toBe(0);
        expect(await page.$$eval('div[aria-label="Cut"]', button => button.length)).toBe(0);
        expect(await page.$$eval('div[aria-label="Copy"]', button => button.length)).toBe(0);
        expect(await page.$$eval('div[aria-label="Paste"]', button => button.length)).toBe(0);
        expect(await page.$$eval('div[aria-label="Fullscreen"]', button => button.length)).toBe(0);

        expect(await page.$$eval('#mceu_19 > button > i', button => button.length)).toBe(0);
        expect(await page.$$eval('#mceu_20 > button > i', button => button.length)).toBe(0);
        expect(await page.$$eval('#mceu_21 > button > i', button => button.length)).toBe(0);
        expect(await page.$$eval('#mceu_22 > button > i', button => button.length)).toBe(0);

    });

});