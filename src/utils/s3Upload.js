import fs from "fs";
import AWS from "aws-sdk";
import sharp from "sharp";
const BUCKET_NAME = process.env.BUCKET_NAME;
const s3 = new AWS.S3({
  accessKeyId: process.env.ID,
  secretAccessKey: process.env.SECRET,
  region: process.env.REGION,
});
const promises = [];

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

export async function generateThumbs(filename, uploadName, key) {
  // for (i = 0; i < 4; i++) {
  //   promises.push(await imageTransformAndUpload(filename, i, uploadName, key));
  // }
  await Promise.all(promises)
    .then((results) => {
      console.log("All done", results);
      return true;
    })
    .catch((e) => {
      // Handle errors here
      return e;
    });
}

export async function S3UploadImage(fileContent, uploadName, key, fileType, uploadPath) {
  return new Promise(async function (resolve, reject) {
    console.log("fileName,uploadName", fileContent, uploadName);
    console.log("image api hitting");
    const currentTime = Date.now()
    if (fileType === "image") {
      for (let i = 0; i < 4; i++) {
        let name = imgTransforms[i].name;
        let { size, fit, format, type } = imgTransforms[i].transform;
        const resizedImage = await sharp(fileContent)
          .resize({
            height: size,
            fit: sharp.fit[fit],
            withoutEnlargement: true,
          })
          .webp({ lossless: false, alphaQuality: 50, quality: 80 })
          .toBuffer();

        console.log("resized image is ", i, " , ", resizedImage);
        const params = {
          Bucket: BUCKET_NAME,
          Key: `${uploadPath}/${name}-${currentTime}-${uploadName}`, // File name you want to save as in S3
          Body: resizedImage,
        };
        console.log({
          accessKeyId: process.env.ID,
          secretAccessKey: process.env.SECRET,
          region: process.env.REGION,
          bucketName: BUCKET_NAME,
        });
        s3.upload(params, function (err, data) {
          console.log("data is ", data, "iteration no. ", i);
          if (err) {
            console.log("reaching error");
            reject(err);
          }
          resolve({
            status: true,
            msg: `File uploaded successfully. ${data.Location}`,
            key,
            url: data.Location,
          });
        });
      }
    } else {
      const params = {
        Bucket: BUCKET_NAME,
        Key: `${uploadPath}/${uploadName}`, // File name you want to save as in S3
        Body: fileContent,
      };
      console.log({
        accessKeyId: process.env.ID,
        secretAccessKey: process.env.SECRET,
        region: process.env.REGION,
        bucketName: BUCKET_NAME,
      });
      s3.upload(params, function (err, data) {
        console.log("data is ", data);
        if (err) {
          console.log("reaching error");
          reject(err);
        }
        resolve({
          status: true,
          msg: `File uploaded successfully. ${data.Location}`,
          key,
          url: data.Location,
        });
      });
    }
  });
}

export async function S3UploadDocument(fileContent, uploadName, key) {
  return new Promise(async function (resolve, reject) {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: `documents/${uploadName}`, // File name you want to save as in S3
        Body: result,
      };
      console.log({
        accessKeyId: process.env.ID,
        secretAccessKey: process.env.SECRET,
        region: process.env.REGION,
        bucketName: BUCKET_NAME,
      });
      // Uploading files to the bucket
      s3.upload(params, function (err, data) {
        console.log("data is ", data, "iteration no. ", i);
        if (err) {
          console.log("reaching error");
          reject(err);
        }
        resolve({
          status: true,
          msg: `File uploaded successfully. ${data.Location}`,
          key,
          url: data.Location,
        });
      });
    } catch (err) {
      console.log("S3 Upload Handler");
      console.log(err);
      reject(err);
    }
  });
}
