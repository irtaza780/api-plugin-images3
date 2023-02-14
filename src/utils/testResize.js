const download = require("image-downloader");
const sharp = require("sharp");
const fs = require("fs");
const AWS = require("aws-sdk");
const uploadFile = require("./s3Handler");
// Enter copied or downloaded access ID and secret key here
const imgTransforms = [
  {
    name: "image",
    transform: { size: 1600, fit: "inside", format: "jpg", type: "image/jpeg" },
  },
  {
    name: "large",
    transform: { size: 1000, fit: "inside", format: "jpg", type: "image/jpeg" },
  },
  {
    name: "medium",
    transform: { size: 600, fit: "inside", format: "jpg", type: "image/jpeg" },
  },
  {
    name: "thumbnail",
    transform: { size: 235, fit: "inside", format: "png", type: "image/png" },
  },
];
const promises = [];

let url = `https://images.stockx.com/360/Air-Jordan-1-Retro-High-White-University-Blue-Black/Images/Air-Jordan-1-Retro-High-White-University-Blue-Black/Lv2/img01.jpg?auto=compress&w=480&q=90&dpr=1&updated_at=1611777406&h=320&fm=webp`;
module.exports = async function generateThumbs(url, sku, fallback, product) {
  for (i = 0; i < 36; i++) {
    promises.push(await downloadHandler(url, i, sku, fallback, product));
  }
  await Promise.all(promises)
    .then((results) => {
      // console.log("All done", results);
      return true;
    })
    .catch((e) => {
      // Handle errors here
      return e;
    });
};
function downloadHandler(url, i, sku, fallback, product) {
  return new Promise(async (resolve, reject) => {
    try {
      let index = i < 10 ? "0" + i : i;
      var options = {};
      var dir = "./brand/" + sku + "/";
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      if (url == fallback) {
        if (i > 0) {
          return resolve();
        } else {
          // console.log("fallback start",url)
          index = "01";
          options = {
            url: url.split("?")[0],
            // url: url.split("&w=480")[0],
            dest: "./brand/" + sku + "/" + index + ".jpg", // will be saved to /path/to/dest/image.jpg
          };
        }
      } else {
        options = {
          url: url.split("&w=480")[0].replace("01", index),
          // url: url.split("&w=480")[0],
          dest: "./brand/" + sku + "/" + index + ".jpg", // will be saved to /path/to/dest/image.jpg
        };
      }
      const { size, fit, format, type } = imgTransforms[3].transform;
      download
        .image(options)
        .then(({ filename }) => {
          var dir1 = "./generated/" + sku + "/";
          if (!fs.existsSync(dir1)) {
            fs.mkdirSync(dir1);
          }
          if (index == "01") {
            sharp(filename)
              .resize({
                height: size,
                fit: sharp.fit[fit],
                withoutEnlargement: true,
              })
              .webp({ lossless: false, alphaQuality: 50, quality: 80 })
              .toFile("./generated/" + sku + "/thumb" + ".webp")
              .then(() => {
                console.log(
                  "Single  ==================>",
                  url == fallback,
                  sku,
                  "<=================="
                );
                uploadFile(
                  "./generated/" + sku + "/thumb" + ".webp",
                  "public/" + sku + "/thumb" + ".webp",
                  url == fallback,
                  product
                );
              });
          }
          {
            sharp(filename)
              .resize({
                height: 1000,
                fit: sharp.fit[fit],
                withoutEnlargement: true,
              })
              .webp({ lossless: false, alphaQuality: 50, quality: 75 })
              .toFile("./generated/" + sku + "/" + index + ".webp")
              .then(() => {
                fs.unlinkSync(filename);
                uploadFile(
                  "./generated/" + sku + "/" + index + ".webp",
                  "public/" + sku + "/" + index + ".webp"
                );
                resolve(filename);
              });
          }
        })
        .catch((err) => {
          // console.error("not found ",sku)
          if (url != fallback) {
            // console.log("fallback",fallback,i,sku,fallback);
            downloadHandler(fallback, i, sku, fallback);
          }
          reject();
        });
    } catch (err) {
      reject();
    }
  });
}
