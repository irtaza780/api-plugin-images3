import sharp from "sharp";




function imageTransformAndUpload(fileContent, thumbIndex, uploadName, key) {
  const { size, fit, format, type } = imgTransforms[thumbIndex].transform;
  return new Promise(async (resolve, reject) => {
    sharp(fileContent)
      .resize({
        height: size,
        fit: sharp.fit[fit],
        withoutEnlargement: true,
      })
      .webp({ lossless: false, alphaQuality: 50, quality: 80 })
      .toBuffer()
      .then((result) => {
        console.log("thumb generation complete");
        console.log("result is ", result);
      
      })
      .catch((err) => {
        console.log("reaching catch ");
        console.log("error is ", err);
      });
  });
}
