const puppeteer = require('puppeteer');

test('we can excute functions remotly',async(done)=>{
    jest.setTimeout(30000);
    const browser = await puppeteer.launch({headless : false});
    const page = await browser.newPage();
    await page.goto('localhost:3000');
    const createRes = await page.evaluate(()=>create(0));
    expect(createRes).toHaveProperty("message");
    const dropRes = await page.evaluate(()=>drop(0));
    expect(dropRes).toHaveProperty("message");
    await browser.close();
    done();
})
