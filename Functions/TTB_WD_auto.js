const model = require("../models/server.model.js");
const fn = require("../Functions/commond.function");
const ObjectDriver = new Map();
const express = require("express");
const { Builder, By, Key, until, WebElement } = require("selenium-webdriver");
require("chromedriver");
const moment = require("moment");
const chrome = require("selenium-webdriver/chrome");
const { request } = require("express");
const imageToBase64 = require("image-to-base64");
const { CronJob } = require("cron");
const { job } = require("cron");

module.exports.wd_ttb_auto = (driver, acc_type, agent_id) => {
  return new Promise(async (resolve, reject) => {
    try {
      //-----------prepare data_wd------------//

      let account_id = await model.getcof_acct(acc_type, agent_id);
      let robot = account_id[0];
      let agnet_bankacc_id = robot._id;
      let agnet_bankacc_no = robot.account_number;
      let agent_bankacc_username = robot.username;
      let agent_bankacc_password = robot.password;
      let agent_bank_id = robot.bank_id;

      //-------Open web ttb-----------//
      await driver.get(
        "https://www.ttbdirect.com/ttb/kdw1.39.1#_frmIBPreLogin"
      );
      await driver.sleep(2000);

      try {
        console.log("start Login...");
        await step_Login(
          driver,
          agent_bankacc_username,
          agent_bankacc_password
        );
      } catch (err) {
        await driver.sleep(150000);
        await driver.close();
        reject(err);
      }
      let i = 0;
      //----i = 30 : 5 min
      //----i = 60 : 10 min
      //----i = 90 : 15 min
      //----i = 180 : 30 min
      //----i = 360 : 60 min
      for (; i < 180; ) {
        console.log("set i =>", i);
        let all_job = await model.get_job_doc_wd(agent_id, agnet_bankacc_id);
        console.log("all job =>", all_job);

        console.log("check alert.....");
        let textalert = await fn.checkalertweb(driver);
        if (textalert !== "" && textalert !== true) {
          console.log("alert =>", textalert);
          if (
            textalert.includes("services are not available") === true ||
            textalert.includes("Service is temporarily unavailable") === true ||
            textalert.includes("unavailable") === true
          ) {
            try {
              await driver
                .switchTo()
                .alert()
                .accept()
                .catch(() => {
                  throw err;
                });
            } catch {
              console.log("No alert accept");
            }
            throw "ไม่สามารถดำเนินรายการถอนได้เนื่องจากระบบธนาคารอยู่ในระหว่างการปิดปรับปรุง";
          }
        } else {
          console.log("No Alert");
        }

        console.log("   ...click home");
        await driver
          .wait(until.elementLocated(By.id("hbxIBPostLogin_lnkHome")), 3000)
          .click();
        await driver.sleep(500);

        if (Object.keys(all_job).length !== 0) {
          i = 0;
          for (let j = 0; j < Object.keys(all_job).length; j++) {
            let job = all_job[j];
            console.log("job =>", job);
            try {
              //------------------update processing---------------//
              let { _id, description } = job;
              await model.update_status_wd(_id, "processing", description);

              try {
                console.log("   ...click home");
                await driver
                  .wait(
                    until.elementLocated(By.id("hbxIBPostLogin_lnkHome")),
                    3000
                  )
                  .click();
                await driver.sleep(500);

                console.log("check alert.....");
                let textalert = await fn.checkalertweb(driver);
                if (textalert !== "" && textalert !== true) {
                  console.log("alert =>", textalert);
                  if (
                    textalert.includes("services are not available") === true ||
                    textalert.includes("Service is temporarily unavailable") ===
                      true ||
                    textalert.includes("unavailable") === true
                  ) {
                    try {
                      await driver
                        .switchTo()
                        .alert()
                        .accept()
                        .catch(() => {
                          throw err;
                        });
                    } catch {
                      console.log("No alert accept");
                    }
                    throw "ไม่สามารถดำเนินรายการถอนได้เนื่องจากระบบธนาคารอยู่ในระหว่างการปิดปรับปรุง";
                  }
                } else {
                  console.log("No Alert");
                }
              } catch {
                console.log("   ...click home");
                await driver
                  .wait(
                    until.elementLocated(By.id("hbxIBPostLogin_lnkHome")),
                    3000
                  )
                  .click();
                await driver.sleep(500);
              }
              console.log("start click abount me...");
              await step_clickabountme(driver);

              console.log("start delete contact...");
              await step_del_firstcontact(driver);

              console.log("start add contact...");
              await step_add_contact(driver, job);

              console.log("start tranfer...");
              await step_insert_tranfer_acc(driver, job);
            } catch (err) {
              console.log("catch job...");
              //-----------update status failed-----------//
              let { _id, description } = job;
              description = description.concat({
                username: "system",
                note: err,
                note_date: new Date(moment().format()),
              });
              console.log("description =>", description);
              let last_note = description[Number(description.length) - 1].note;
              console.log("last_arr =>", last_note);
              try {
                if (
                  last_note.includes("กำลังดำเนินการถอนใหม่อีกครั้ง") === true
                ) {
                  await model.update_status_wd(_id, "approve", description);
                  j = j - 1;
                } else {
                  await model.update_status_wd(_id, "failed", description);
                }
              } catch (err) {
                console.log("   ...takeScreenshot");
                let err_img = `./img/${new Date().getTime()}.png`;
                console.log("err_img =>", err_img);
                await driver.takeScreenshot().then(function (img, err) {
                  require("fs").writeFile(
                    err_img,
                    img,
                    "base64",
                    function (err) {
                      console.log("err", err);
                    }
                  );
                });
                await driver.sleep(1000);
                console.log("   ...convert to base64");
                await imageToBase64(err_img) // Path to the image
                  .then((response) => {
                    let img = "data:image/jpeg;base64," + response;
                    // console.log("imgtobase64 => ", img); // "cGF0aC90by9maWxlLmpwZw=="
                    err_img = img;
                  })
                  .catch((error) => {
                    console.log("err => ", error); // Logs an error if there was one
                  });
                console.log(err);
                await model.update_status_wd(_id, "failed", description);
                await model.update_err_msg_wd(_id, err, err_img);
              }
            }
          }
        } else {
          await driver.sleep(10000);
          i++;
        }
      }

      console.log("start Logout...");
      await step_logout(driver);
    } catch (err) {
      console.log("wd_ttb_auto catch => ", err);
      try {
        if (err.includes("end loop") === true) {
          console.log(
            "---------------------END-AUTO-WITHDRAW--------------------"
          );
          reject("END AUTO WITHDRAW");
        }
        console.log("start Logout...");
        await step_logout(driver);
        reject(err);
      } catch (err) {
        console.log("start Logout...");
        await step_logout(driver);
        reject(err);
      }
    }
  });

  async function step_Login(
    driver,
    agent_bankacc_username,
    agent_bankacc_password
  ) {
    try {
      //--------click eng----------//
      console.log("   ...click eng");
      await driver
        .wait(until.elementLocated(By.id("hbxIBPreLogin_btnEng")), 3000)
        .click();
      await driver.sleep(1000);
      //---------input username & password & click login-------------//
      console.log("   ...input username", agent_bankacc_username);
      await driver
        .findElement(By.id("frmIBPreLogin_txtUserId"))
        .sendKeys(agent_bankacc_username);
      console.log("   ...input password", agent_bankacc_password);
      await driver
        .findElement(By.id("frmIBPreLogin_txtPassword"))
        .sendKeys(agent_bankacc_password);
      console.log("   ...click login");
      await driver.findElement(By.id("frmIBPreLogin_btnLogIn")).click();
      await driver.sleep(4000);
      console.log("check alert.....");
      let textalert = await fn.checkalertweb(driver);
      if (textalert !== "" && textalert !== true) {
        console.log("alert =>", textalert);
        if (textalert.includes("already logged") === true) {
          try {
            await driver
              .switchTo()
              .alert()
              .accept()
              .catch(() => {
                throw err;
              });
          } catch {
            console.log("No alert accept");
          }
          throw "ไม่สามารถดำเนินการถอนได้เนื่องจากระบบธนาคารช้า กรุณารอ 10 นาทีเพื่อดำเนินการถอนใหม่อีกครั้ง";
        }
      } else {
        console.log("No Alert login");
      }
    } catch (err) {
      console.log("****   ...step_Login", err);
      throw err;
    }
  }

  async function step_clickabountme(driver) {
    try {
      //--------click eng----------//
      await driver.sleep(1000);
      console.log("   ...click eng");
      await driver
        .wait(until.elementLocated(By.id("hbxIBPostLogin_btnEng")), 3000)
        .click();
      await driver.sleep(1000);
      //----------click aboutme & favorites menu------------//
      console.log("   ...click aboutme");
      console.log("check alert.....");
      let textalert = await fn.checkalertweb(driver);
      if (textalert !== "" && textalert !== true) {
        console.log("alert =>", textalert);
        throw textalert;
      } else {
        console.log("No Alert login");
      }
      await driver
        .findElement(By.id("frmIBPostLoginDashboard_btnMenuAboutMe"))
        .click();
      await driver.sleep(1000);
      console.log("   ...click favorites menu");
      await driver
        .findElement(
          By.xpath('//*[@id="frmIBPostLoginDashboard_segMenuOptions"]/ul/li[3]')
        )
        .click();
      await driver.sleep(1000);
    } catch (err) {
      console.log("****   ...catch step_clickabountme", err);
      throw err;
    }
  }

  async function step_del_firstcontact(driver) {
    try {
      //-----------delete first favorites contact----------------//
      await driver
        .findElement(
          By.xpath(
            "/html/body/div/div[1]/form/div/div[2]/div/div/div/div/div[1]/div/div[6]/div/div/div/div/div/div/div/div/div/ul/li/div/div/div[5]"
          )
        )
        .click();
      await driver.sleep(500);
      await driver
        .findElement(
          By.xpath(
            "/html/body/div/div[4]/form/div/div/div/div/div/div[3]/div/div/div[2]"
          )
        )
        .click();
      await driver.sleep(500);
    } catch {}
  }

  async function step_add_contact(driver, job) {
    try {
      //----------prepare data_wd----------//
      console.log("   ...Prepare data_wd");
      let {
        memb_bank_account_name,
        memb_bank_nameen,
        memb_bank_account_number,
      } = job;
      console.log("memb_bank_account_name =>", memb_bank_account_name);
      console.log("memb_bank_nameen =>", memb_bank_nameen);
      //-------add favorites contact-------//
      console.log("   ...click add contact");
      await driver
        .findElement(By.id("frmIBMyReceipentsHome_btnAddFavorites"))
        .click();
      await driver.sleep(500);
      //--------input name favorites----------//
      console.log("   ...input name contact");
      await driver
        .findElement(By.id("frmIBMyReceipentsAddBankAccnt_tbxAddAccntNickName"))
        .sendKeys(memb_bank_account_name);
      //----------select bank------------//
      console.log("   ...select bank");
      await driver.sleep(500);
      let lengthElems = await driver.executeScript(
        `return document.getElementById("frmIBMyReceipentsAddBankAccnt_comboBankName").length`
      );
      if (memb_bank_nameen !== "") {
        for (let i = 1; i <= lengthElems - 1; i++) {
          let textBookBank = await driver
            .wait(
              until.elementLocated(
                By.xpath(
                  '//*[@id="frmIBMyReceipentsAddBankAccnt_comboBankName"]/option[' +
                    i +
                    "]"
                )
              ),
              1000
            )
            .getText();
          console.log(textBookBank);
          if (textBookBank.match(memb_bank_nameen)) {
            await driver
              .wait(
                until.elementLocated(
                  By.xpath(
                    '//*[@id="frmIBMyReceipentsAddBankAccnt_comboBankName"]/option[' +
                      i +
                      "]"
                  )
                ),
                3000
              )
              .click();
            break;
          }
        }
      } else {
        console.log("No Data Bank Contact");
        throw err;
      }
      //-----------add account number------------//
      console.log("   ...input acc number");
      await driver
        .findElement(By.id("frmIBMyReceipentsAddBankAccnt_tbxAddAccntNumber"))
        .sendKeys(memb_bank_account_number);
      await driver
        .findElement(By.id("frmIBMyReceipentsAddBankAccnt_btnAddAccntNext"))
        .click();
      await driver.sleep(2000);
      console.log("check alert.....");
      let textalert = await fn.checkalertweb(driver);
      if (textalert !== "" && textalert !== true) {
        console.log("alert =>", textalert);
        if (
          textalert.includes("incorrect") === true ||
          textalert.includes("INACTIVE") === true
        ) {
          try {
            await driver
              .switchTo()
              .alert()
              .accept()
              .catch(() => {
                throw err;
              });
          } catch {
            console.log("No alert accept");
          }
          throw (
            "เลขบัญชี " +
            memb_bank_account_number +
            " ไม่ถูกต้อง ไม่สามารถทำรายการถอนได้"
          );
        } else if (
          textalert.includes("recipient's bank account has not responded") ===
            true ||
          textalert.includes("not responded") === true
        ) {
          try {
            await driver
              .switchTo()
              .alert()
              .accept()
              .catch(() => {
                throw err;
              });
          } catch {
            console.log("No alert accept");
          }
          throw "ระบบธนาคารปลายทางไม่ตอบสนองกรุณาดำเนินการถอนใหม่อีกครั้งในภายหลัง";
        } else if (
          textalert.includes("services are not available") === true ||
          textalert.includes("Service is temporarily unavailable") === true ||
          textalert.includes("unavailable") === true
        ) {
          try {
            await driver
              .switchTo()
              .alert()
              .accept()
              .catch(() => {
                throw err;
              });
          } catch {
            console.log("No alert accept");
          }
          throw "ไม่สามารถดำเนินรายการถอนได้เนื่องจากระบบธนาคารอยู่ในระหว่างการปิดปรับปรุง";
        }
      } else {
        console.log("No Alert");
      }
      await driver.sleep(500);
      await driver
        .findElement(
          By.id("frmIBMyReceipentsAddContactManually_btnAddAccntNext")
        )
        .click();
      await driver.sleep(3000);
      console.log("check alert.....");
      textalert = await fn.checkalertweb(driver);
      if (textalert !== "" && textalert !== true) {
        console.log("alert =>", textalert);
        if (textalert.includes("something went wrong") === true) {
          try {
            await driver
              .switchTo()
              .alert()
              .accept()
              .catch(() => {
                throw err;
              });
          } catch {
            console.log("No alert accept");
          }
          throw "พบข้อผิดพลาดจากระบบธนาคาร กำลังดำเนินการถอนใหม่อีกครั้ง";
        } else if (
          textalert.includes("recipient's bank account has not responded") ===
            true ||
          textalert.includes("not responded") === true
        ) {
          try {
            await driver
              .switchTo()
              .alert()
              .accept()
              .catch(() => {
                throw err;
              });
          } catch {
            console.log("No alert accept");
          }
          throw "ระบบธนาคารปลายทางไม่ตอบสนองกรุณาดำเนินการถอนใหม่อีกครั้งในภายหลัง";
        } else if (textalert.includes("services are not available") === true) {
          try {
            await driver
              .switchTo()
              .alert()
              .accept()
              .catch(() => {
                throw err;
              });
          } catch {
            console.log("No alert accept");
          }
          throw "ไม่สามารถดำเนินรายการถอนได้เนื่องจากระบบธนาคารอยู่ในระหว่างการปิดปรับปรุง";
        }
      } else {
        console.log("No Alert");
      }
      await driver.sleep(500);
      //-------------OTP-------------//
      console.log("   ...call OTP");
      let ref = await driver
        .wait(
          until.elementLocated(
            By.id("frmIBMyReceipentsAddContactManually_lblrefvalue")
          ),
          1000
        )
        .getText();
      let mob = await driver
        .wait(
          until.elementLocated(
            By.id("frmIBMyReceipentsAddContactManually_lblotpmob")
          ),
          1000
        )
        .getText();
      console.log("ref =>", ref);
      console.log("mob =>", mob);
      await driver.sleep(5000);
      let OTP;
      for (let k = 0; k < 5; k++) {
        console.log("OTP_", k);
        OTP = await model.callOTP(ref);
        await driver.sleep(500);
        if (OTP.length == 0) {
          await driver.sleep(3000);
        } else {
          break;
        }
      }
      if (OTP.length == 0) {
        throw "ไม่พบเลขข้อมูล OTP ในระบบ";
      }
      console.log("OTP =>", OTP[0].value);
      await driver.sleep(500);
      await model.removeOTP(OTP[0]._id);
      //---------------Confirm OTP-------------//
      console.log("   ...input OTP");
      await driver
        .findElement(By.id("frmIBMyReceipentsAddContactManually_txtotp"))
        .sendKeys(OTP[0].value);
      await driver.sleep(500);
      await driver
        .findElement(
          By.id("frmIBMyReceipentsAddContactManually_btnAddAccntNext")
        )
        .click();
      await driver.sleep(1000);
      console.log("click transfer");
      await driver
        .findElement(
          // By.xpath(
          //   "/html/body/div/div/form/div/div[2]/div/div/div/div/div[2]/div/div/div/div/div/div/div[11]/div/div/div/div/div/div/div/div/div/ul/li/div/div/div/div/div[4]/div/div/div/div"
          // )
          By.id("hbox1010001831107419_btnTransfer")
        )
        .click();
      await driver.sleep(1000);
    } catch (err) {
      console.log("****   ...catch step_add_contact", err);
      throw err;
    }
  }

  async function step_insert_tranfer_acc(driver, job) {
    try {
      //----------prepare data_wd----------//
      console.log("   ...Prepare data_wd");
      console.log("job =>", job);
      let { _id, amount, agent_id, memb_id, description, from_account_id } = job;

      //------click bank item0-------//
      console.log("   ...click bank web");
      button = await driver.wait(
        until.elementLocated(By.xpath('//*[@id="item-0"]/table/tbody')),
        30000
      );
      await button.click();
      await driver.sleep(1000);
      //-------click show contact----------//
      console.log("   ...click show contact");
      newButton = await driver.wait(
        until.elementLocated(By.id("frmIBTranferLP_btnXferShowContact")),
        30000
      );
      await newButton.click();
      //------click account-------------//
      console.log("   ...click account contact ");
      await driver.sleep(1000);
      //   button = await driver.wait(
      //     until.elementLocated(
      //       By.xpath(
      //         "/html/body/div/div[1]/form/div/div[2]/div/div/div/div/div[2]/div/div[3]/div/div/div/div/div/div/div[2]/div/div/ul/li[2]/div"
      //       )
      //     ),
      //     30000
      //   );
      button = await driver.wait(
        until.elementLocated(
          By.id("hbxXferSegmentInitial_hbxXferSegmentInitial")
        ),
        30000
      );
      await button.click();
      await driver.sleep(1000);
      let balance_before_trans = await driver
        .wait(
          until.elementLocated(
            By.id("frmIBTranferLP_lblTranLandFromBalanceAmtVal")
          ),
          1000
        )
        .getText();
      balance_before_trans = balance_before_trans.replace(/\฿/g, "");
      console.log("balance_before_trans =>", balance_before_trans);
      await driver.sleep(500);
      await driver
        .findElement(By.id("frmIBTranferLP_txbXferAmountRcvd"))
        .sendKeys(amount);
      await driver.sleep(500);
      button = await driver.wait(
        until.elementLocated(By.id("frmIBTranferLP_txtArMn")),
        30000
      );
      await button.click();
      console.log("   ...click Next");
      await driver.sleep(1000);
      button = await driver.wait(
        until.elementLocated(By.id("frmIBTranferLP_btnXferNext")),
        30000
      );
      await button.click();
      await driver.sleep(1000);
      console.log("check alert.....");
      let textalert = await fn.checkalertweb(driver);
      if (textalert !== "" && textalert !== true) {
        console.log("alert =>", textalert);
        if (
          textalert.includes("exceeds your available balance") === true ||
          textalert.includes("exceeds") === true
        ) {
          try {
            await driver
              .switchTo()
              .alert()
              .accept()
              .catch(() => {
                throw err;
              });
          } catch {
            console.log("No alert accept");
          }
          throw (
            "จำนวนเงินคงเหลือในบัญชี " +
            balance_before_trans +
            " บาท ไม่เพียงพอสำหรับการถอนของยอด " +
            amount +
            " บาท"
          );
        }
      } else {
        console.log("No Alert login");
      }
      button = await driver.wait(
        until.elementLocated(By.id("frmIBTransferNowConfirmation_btnXferNext")),
        3000
      );
      await button.click();
      await driver.sleep(3000);
      //----------OTP----------//
      console.log("   ...call OTP");
      let ref = await driver
        .wait(
          until.elementLocated(
            By.id("frmIBTransferNowConfirmation_lblBankRefVal")
          ),
          1000
        )
        .getText();
      console.log("ref =>", ref);
      await driver.sleep(5000);
      let OTP;
      for (let k = 0; k < 5; k++) {
        console.log("OTP_", k);
        OTP = await model.callOTP(ref);
        await driver.sleep(500);
        if (OTP.length == 0) {
          await driver.sleep(3000);
        } else {
          break;
        }
      }
      if (OTP.length == 0) {
        throw "ไม่พบเลขข้อมูล OTP ในระบบ";
      }
      console.log("OTP =>", OTP[0].value);
      await driver.sleep(500);
      await model.removeOTP(OTP[0]._id);
      //---------------Confirm OTP-------------//
      console.log("   ...comfirm OTP");
      await driver
        .findElement(By.id("frmIBTransferNowConfirmation_txtBxOTP"))
        .sendKeys(OTP[0].value);
      await driver.sleep(500);
      await driver
        .findElement(By.id("frmIBTransferNowConfirmation_brnConfirm"))
        .click();
      await driver.sleep(1000);
      //---------------get data-------------//
      console.log("   ...get data");
      let silp_date, silp_image;
      let balance_after_trans = await driver
        .wait(
          until.elementLocated(By.id("frmIBTransferNowCompletion_lblBal")),
          1000
        )
        .getText();
      balance_after_trans = balance_after_trans.replace(/\฿/g, "");
      console.log("balance_after_trans =>", balance_after_trans);
      let acc = await driver
        .wait(
          until.elementLocated(
            By.id("frmIBTransferNowCompletion_lblAccountNo")
          ),
          1000
        )
        .getText();
      console.log("acc =>", acc);
      let nameonbank = await driver
        .wait(
          until.elementLocated(
            By.id("frmIBTransferNowCompletion_lblXferToAccTyp")
          ),
          1000
        )
        .getText();
      console.log("nameonbank =>", nameonbank);
      let timetransfer = await driver
        .wait(
          until.elementLocated(
            By.id("frmIBTransferNowCompletion_lblTransferVal")
          ),
          1000
        )
        .getText();
      console.log("timetransfer =>", timetransfer);
      //---------------Task Screen-------------//
      console.log("   ...task screen");
      // let base64 = await driver
      //   .wait(
      //     until.elementsLocated(By.id("frmIBTransferNowCompletion_vbxTransaction")),
      //     5000
      //   )
      //   .takeScreenshot();
      //   console.log(base64)
      let pathpic = `./img/${new Date().getTime()}.png`;
      console.log("pathpic =>", pathpic);
      await driver
        .findElement(By.id("frmIBTransferNowCompletion_vbxTransaction"))
        .takeScreenshot()
        .then(function (img, err) {
          require("fs").writeFile(pathpic, img, "base64", function (err) {
            console.log("err", err);
          });
        });
      await driver.sleep(1000);
      //------------convert to base64------------//
      console.log("   ...convert to base64");
      await imageToBase64(pathpic) // Path to the image
        .then((response) => {
          let img = "data:image/jpeg;base64," + response;
          // console.log("imgtobase64 => ", img); // "cGF0aC90by9maWxlLmpwZw=="
          silp_image = img;
        })
        .catch((error) => {
          console.log("err => ", error); // Logs an error if there was one
        });
      //--------------update data_wd------------//
      console.log("   ...update data_wd");
      console.log("agent_id =>", agent_id);
      console.log("mem_id =>", memb_id);
      let boo = false;
      let arr_memname = await model.get_member_name(agent_id, memb_id);
      console.log("arr membername =>", arr_memname[0]);
      memname = arr_memname[0].account_name;
      console.log("memname =>", memname);
      desmem = arr_memname.description;
      console.log("member description =>", arr_memname.description);
      if (desmem != null) {
        desmem = desmem.concat({
          username: "system",
          note:
            "มีการเปลี่ยนชื่อบัญชีจาก (" +
            memname +
            ") เป็นชื่อ (" +
            nameonbank +
            ")",
          note_date: new Date(moment().format()),
        });
      } else {
        desmem = {
          username: "system",
          note:
            "มีการเปลี่ยนชื่อบัญชีจาก (" +
            memname +
            ") เป็นชื่อ (" +
            nameonbank +
            ")",
          note_date: new Date(moment().format()),
        };
      }
      console.log("member description =>", desmem);
      if (memname != nameonbank) {
        await model.update_member_name(arr_memname[0]._id, nameonbank, desmem);
        boo = true;
      }
      await model.updatebalance(from_account_id, balance_after_trans);
      silp_date = timetransfer;
      description = description.concat({
        username: "system",
        note: "ทำรายการถอนสำเร็จ",
        note_date: new Date(moment().format()),
      });
      if (boo == true) {
        description = description.concat({
          username: "system",
          note:
            "มีการเปลี่ยนชื่อบัญชีจาก (" +
            memname +
            ") เป็นชื่อ (" +
            nameonbank +
            ")",
          note_date: new Date(moment().format()),
        });
      }
      console.log("description =>", description);
      await model.update_status_wd(_id, "processing", description);
      //-------------------update doc------------------//
      // console.log("silp_image =>", silp_image);
      console.log("silp_date =>", silp_date);
      await model.update_doc_wd(_id, silp_date, silp_image);
      await driver.sleep(500);
    } catch (err) {
      console.log("****   ...catch step_insert_tranfer_acc", err);
      throw err;
    }
  }

  async function step_logout(driver) {
    try {
      //-----------Logout----------------//
      await driver.sleep(1000);
      await driver.findElement(By.id("hbxIBPostLogin_lnkLogOut")).click();
      await driver.sleep(1000);
      await driver.close();
      throw "end loop";
    } catch (err) {
      console.log("****   ...catch step_logout", err);
      throw err;
    }
  }
};
