const { Builder, By, Key, until, WebElement } = require("selenium-webdriver");
require("chromedriver");
const moment = require("moment");
const chrome = require("selenium-webdriver/chrome");

async function Login() {
  let setChromeOptions = new chrome.Options();
  //setChromeOptions.addArguments('--headless');
  setChromeOptions.addArguments("--no-sandbox");
  setChromeOptions.addArguments("--hide-scrollbars");
  setChromeOptions.addArguments("window-size=1024,768");
  setChromeOptions.addArguments("--disable-gpu");
  let driver = await new Builder()
    .setChromeOptions(setChromeOptions)
    .forBrowser("chrome")
    .build();
  // Open web ttb
  await driver.get("https://www.ttbdirect.com/ttb/kdw1.39.1#_frmIBPreLogin");
  await driver.sleep(2000);
  // click eng
  await driver
    .wait(until.elementLocated(By.id("hbxIBPreLogin_btnEng")), 3000)
    .click();
  await driver.sleep(2000);
  // input username & password & click login
  await driver
    .findElement(By.id("frmIBPreLogin_txtUserId"))
    .sendKeys("natkingsize2");
  await driver
    .findElement(By.id("frmIBPreLogin_txtPassword"))
    .sendKeys("natl@2iriY");
  await driver.findElement(By.id("frmIBPreLogin_btnLogIn")).click();
  await driver.sleep(5000);
  // click menu transfer
  await driver
    .findElement(By.id("hbxIBPostLogin_lnkHome"))
    .click();
  await driver.sleep(2000);
  await driver
    .findElement(By.id("frmIBPostLoginDashboard_btnMenuTransfer"))
    .click();
  await driver.sleep(2000);
  // select to account
  newButton = await driver.wait(
    until.elementLocated(By.id("frmIBTransferCustomWidgetLP_arrow")),
    30000
  );
  await driver.executeScript("arguments[0].click()", newButton);
  await driver.sleep(2000);
  newButton = await driver.wait(
    until.elementLocated(By.id("popIBTransferOptions_hbxToAccount")),
    30000
  );
  await driver.executeScript("arguments[0].click()", newButton);
  await driver.sleep(2000);
  //click bank item0
  button = await driver.wait(
    until.elementLocated(By.xpath('//*[@id="item-0"]/table/tbody')),
    30000
  );
  await button.click();
  await driver.sleep(2000);
  //click show contact
  newButton = await driver.wait(
    until.elementLocated(By.id("frmIBTranferLP_btnXferShowContact")),
    30000
  );
  await newButton.click();
  //   click accountawait
  driver.sleep(2000);
  button = await driver.wait(
    until.elementLocated(
      By.xpath(
        "/html/body/div/div[1]/form/div/div[2]/div/div/div/div/div[2]/div/div[3]/div/div/div/div/div/div/div[2]/div/div/ul/li[2]/div"
      )
    ),
    30000
  );
  //   button = await driver.wait(
  //     until.elementLocated(By.id("hbxXferSegmentInitial_hbxXferSegmentInitial")),
  //     30000
  //   );
  //   await button.click();
  await driver.sleep(2000);
  await driver
    .findElement(By.id("frmIBTranferLP_txbXferAmountRcvd"))
    .sendKeys("1");
  await driver.sleep(1000);
  button = await driver.wait(
    until.elementLocated(By.id("frmIBTranferLP_txtArMn")),
    30000
  );
  await button.click();
//   await driver.sleep(2000);
//   button = await driver.wait(
//     until.elementLocated(By.id("frmIBTranferLP_btnXferNext")),
//     30000
//   );
//   await button.click();
//   await driver.sleep(3000);
  //   button = await driver.wait(
  //     until.elementLocated(By.id("frmIBTransferNowConfirmation_btnXferNext")),
  //     3000
  //   );
  //   await button.click();
}
Login();
