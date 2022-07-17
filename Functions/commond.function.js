const fetch = require("node-fetch");
const { promise } = require("selenium-webdriver");
var exports = (module.exports = {});
const model = require("../models/server.model.js");

exports.get_ip = function () {
  return new Promise(async (resolve, reject) => {
    await fetch("http://httpbin.org/ip")
      .then((response) => response.json())
      .then((result) => resolve(result.origin))
      .catch((error) => reject(error));
  });
};

exports.find_OTP = function (request, response) {
  return new Promise(async (resolve, reject) => {
    console.log("request => ", request.Ref);
    let result = await model.callOTP(request.Ref).catch(() => {
      throw err;
    });
    console.log("result => ", result);
    if (result.length !== 0) {
      console.log(result[0].value);
      let remove = await model.removeOTP(result[0]._id).catch(() => {
        throw err;
      });
      //   response
      //     .send({ status: "200", message: "success", result: result[0] })
      // .end();
      return result[0].value;
    } else {
      console.log(result[0]);
      response
        .send({
          status: "300",
          message: "con not find Ref.ID",
          result: result[0],
        })
        .end();
    }
    console.log(result[0].value);
  });
};

exports.checkalertweb = function (driver) {
  return new Promise(async function (resolve) {
    try {
      await driver
        .switchTo()
        .alert()
        .then(
          async function () {
            let checktext = await driver.switchTo().alert().getText();
            console.log("checktext =>", checktext);
            if (
              checktext.match(
                /Service is temporarily unavailable at this moment/g
              )
            ) {
              await driver.switchTo().alert().accept();
              resolve(true);
            } else {
              await driver.switchTo().alert().accept();
              resolve(checktext);
            }
          },
          async function () {
            resolve(true);
          }
        );
    } catch (error) {
      console.error("checkAlertWebSlow => ", error);
      resolve(true);
    }
  });
};
