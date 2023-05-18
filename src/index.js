import pkg from "../package.json";
import SimpleSchema from "simpl-schema";
import importAsString from "@reactioncommerce/api-utils/importAsString.js";
import fileUpload from "express-fileupload";
import cors from "cors";
import bodyParser from "body-parser";
import morgan from "morgan";
import _ from "lodash";
import getSignedUrl from "./utils/signedUrls.js";
import { S3UploadImage, S3UploadDocument } from "./utils/s3Upload.js";
import sharp from "sharp";
const mySchema = importAsString("./schema.graphql");

var _context = null;

const resolvers = {
  Product: {
    media: async (parent, args, context, info) => {
      return parent?.media
        ? Promise.all(
            parent?.media?.map(async (e) => {
              return {
                priority: e.priority,
                productId: e.productId,
                URLs: {
                  thumbnail: await getSignedUrl(e?.URLs.thumbnail),
                  large: await getSignedUrl(e?.URLs.large),
                  medium: await getSignedUrl(e?.URLs.medium),
                  original: await getSignedUrl(e?.URLs.original),
                  small: await getSignedUrl(e?.URLs.small),

                  unSignedThumbnail: e?.URLs.thumbnail,
                  unSignedLarge: e?.URLs.large,
                  unSignedMedium: e?.URLs.medium,
                  unSignedOriginal: e?.URLs.original,
                  unSignedSmall: e?.URLs.small,
                },
              };
            })
          )
        : [];
    },
    planMedia: async (parent, args, context, info) => {
      return parent?.media
        ? Promise.all(
            parent?.planMedia?.map(async (e) => {
              return {
                name: e?.name,
                url: await getSignedUrl(e?.url),
                unsignedUrl: e?.url,
              };
            })
          )
        : [];
    },
    documents: async (parent, args, context, info) => {
      return parent?.documents
        ? Promise.all(
            parent?.documents?.map(async (e) => {
              return {
                unsignedUrl: e?.url,
                url: await getSignedUrl(e?.url),
              };
            })
          )
        : [];
    },
  },

  ProductVariant: {
    async media(parent, args, context, info) {
      return parent.media ? parent.media : [];
    },
  },

  CatalogProduct: {
    documents: async (parent, args, context, info) => {
      return parent?.documents
        ? Promise.all(
            parent?.documents?.map(async (e) => {
              return {
                unsignedUrl: e?.url,
                url: await getSignedUrl(e?.url),
              };
            })
          )
        : [];
    },
    media: async (parent, args, context, info) => {
      return parent?.media
        ? Promise.all(
            parent?.media?.map(async (e) => {
              return {
                priority: e.priority,
                productId: e.productId,
                URLs: {
                  thumbnail: await getSignedUrl(e?.URLs.thumbnail),
                  large: await getSignedUrl(e?.URLs.large),
                  medium: await getSignedUrl(e?.URLs.medium),
                  original: await getSignedUrl(e?.URLs.original),
                  small: await getSignedUrl(e?.URLs.small),

                  unSignedThumbnail: e?.URLs.thumbnail,
                  unSignedLarge: e?.URLs.large,
                  unSignedMedium: e?.URLs.medium,
                  unSignedOriginal: e?.URLs.original,
                  unSignedSmall: e?.URLs.small,
                },
              };
            })
          )
        : [];
    },
    primaryImage: async (parent, args, context, info) => {
      if (parent?.primaryImage) {
        const URLs = parent.primaryImage.URLs;
        const signedURLs = {};
        for (const key in URLs) {
          signedURLs[key] = await getSignedUrl(URLs[key]);
        }
        return { URLs: signedURLs };
      } else {
        return null;
      }
    },
    planMedia: async (parent, args, context, info) => {
      return parent?.media
        ? Promise.all(
            parent?.planMedia?.map(async (e) => {
              return {
                name: e?.name,
                url: await getSignedUrl(e?.url),
                unsignedUrl: e?.url,
              };
            })
          )
        : [];
    },
  },
  Account: {
    unsignedProfileUrl: async (parent, args, context, info) =>
      parent?.profile?.picture,
    picture: async (parent, args, context, info) =>
      parent?.profile?.picture
        ? await getSignedUrl(parent?.profile?.picture)
        : "",

    govId: (parent, args, context, info) => {
      return parent?.govId
        ? Promise.all(
            parent?.govId?.map(async (e) => {
              return {
                key: e?.key,
                value: await getSignedUrl(e?.value),
                unsignedUrl: e?.value,
              };
            })
          )
        : [];
      // account.govId ?? []
    },
    poAddress: async (parent, args, context, info) => {
      return parent?.poAddress
        ? Promise.all(
            parent?.poAddress?.map(async (e) => {
              return {
                address: e.address,
                type: e.type,
                document: await getSignedUrl(e?.document),
              };
            })
          )
        : [];
    },
  },
  Transaction: {
    transactionProof: async (parent, args, context, info) => {
      const signedUrl =
        parent?.transactionProof &&
        (await getSignedUrl(parent?.transactionProof));
      return signedUrl ? signedUrl : null;
    },
  },
};

function myStartup1(context) {
  _context = context;
  const { app, collections, rootUrl } = context;

  if (app.expressApp) {
    // enable files upload
    app.expressApp.use(fileUpload());

    //add other middleware
    app.expressApp.use(cors());
    app.expressApp.use(bodyParser.json());
    app.expressApp.use(bodyParser.urlencoded({ extended: true }));
    app.expressApp.use(morgan("dev"));
    app.expressApp.post("/upload", async (req, res) => {
      console.log("req.body", req.body);
      console.log("req.files", req.files);
      let isMulti = req.body.isMulti;
      let uploadPath = req.body.uploadPath;
      console.log("upload path is ", uploadPath);
      let uploads = [];

      sharp.cache(false);
      try {
        if (!req.files) {
          res.send({
            status: false,
            message: "No file uploaded",
          });
        } else if (isMulti == "true") {
          let data = [];

          //loop all files
          _.forEach(_.keysIn(req.files.photos), (key) => {
            let photo = req.files.photos[key];
            let getType = photo.mimetype.split("/");
            console.log("get type is ", getType);
            let fileType = getType[key];
            console.log("file type is ", fileType);
            let promise = S3UploadImage(
              req.files.photos[key].data,
              req.files.photos[key].name,
              key,
              fileType,
              uploadPath
            ).then((uploadResponse) => {
              console.log("upload response", uploadResponse);
              if (uploadResponse[key]) {
                data[uploadResponse[key]].url = uploadResponse.url;
              }
            });
            uploads.push(promise);
            data.push({
              name: photo.name,
              mimetype: photo.mimetype,
              size: photo.size,
            });
            Promise.all(uploads);
            S3UploadImage(
              req.files.photos.data,
              req.files.photos.name,
              0,
              fileType,
              uploadPath
            )
              .then((uploadResponse) => {
                data[0].url = uploadResponse.url;
                console.log("upload response is ", uploadResponse);

                res.send({
                  status: true,
                  message: "File is uploaded",
                  data,
                });
              })
              .catch(function (err) {
                console.log(err);
                res.send(err);
              });
          });

          //return response
        } else if (isMulti == "false") {
          let data = [];

          //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
          let photo = req.files.photos;
          let getType = photo.mimetype.split("/");
          console.log("get type is ", getType);
          let fileType = getType[0];
          console.log("file type is ", fileType);
          console.log("photo is ", photo);

          data.push({
            name: photo.name,
            mimetype: photo.mimetype,
            size: photo.size,
          });
          S3UploadImage(
            req.files.photos.data,
            req.files.photos.name,
            0,
            fileType,
            uploadPath
          ).then((uploadResponse) => {
            data[0].url = uploadResponse.url;
            console.log("upload response is ", uploadResponse);

            res.send({
              status: true,
              message: "File is uploaded",
              data,
            });
          });
        }
      } catch (err) {
        console.log("err", err);
        res.status(500).send(err);
      }
    });
  }

  const ImageSizes = new SimpleSchema({
    large: {
      type: String,
      label: "Large",
      optional: true,
    },
    medium: {
      type: String,
      label: "Medium",
      optional: true,
    },
    original: {
      type: String,
      label: "Original",
      optional: true,
    },
    small: {
      type: String,
      label: "Small",
      optional: true,
    },
    thumbnail: {
      type: String,
      label: "Thumbnail",
      optional: true,
    },
  });
  const ImageInfo = new SimpleSchema({
    priority: {
      type: Number,
      defaultValue: 0,
    },
    productId: {
      type: String,
      label: "Product Id",
    },
    variantId: {
      type: String,
      label: "Variant Id",
      optional: true,
    },
    URLs: {
      type: ImageSizes,
      optional: true,
    },
  });

  context.simpleSchemas.Product.extend({
    media: {
      type: Array,
      label: "Media",
      optional: true,
    },
    "media.$": {
      type: ImageInfo,
    },
    mediaS3: {
      type: Array,
      label: "Media",
      optional: true,
    },
    "mediaS3.$": {
      type: ImageInfo,
    },
  });
  context.simpleSchemas.ProductVariant.extend({
    media: {
      type: Array,
      label: "Media",
      optional: true,
    },
    "media.$": {
      type: ImageInfo,
    },
    mediaS3: {
      type: Array,
      label: "Media",
      optional: true,
    },
    "mediaS3.$": {
      type: ImageInfo,
    },
  });
}

// The new myPublishProductToCatalog function parses our products,
// gets the new uploadedBy attribute, and adds it to the corresponding catalog variant in preparation for publishing it to the catalog
async function S3PublishMedia(
  catalogProduct,
  { context, product, shop, variants }
) {
  const { app, collections, rootUrl } = context;
  const { Product } = collections;
  // let productObj=await getProductMedia(context,catalogProduct.productId);
  catalogProduct.media = product.media;
  catalogProduct.primaryImage = product?.media?.[0];
  catalogProduct.variants &&
    catalogProduct.variants.map(async (catalogVariant) => {
      const productVariant = variants.find(
        (variant) => variant._id === catalogVariant.variantId
      );
      // catalogVariant.uploadedBy = productVariant.uploadedBy || null;
      // catalogVariant.ancestorId = productVariant["ancestors"][0]
      // ? productVariant["ancestors"][0]
      // : null;

      catalogVariant.media = productVariant.media;
    });
}

/**
 * @summary Import and call this function to add this plugin to your API.
 * @param {ReactionAPI} app The ReactionAPI instance
 * @returns {undefined}
 */
export default async function register(app) {
  await app.registerPlugin({
    label: "Image to S3",
    name: "images-S3",
    version: pkg.version,
    functionsByType: {
      startup: [myStartup1],
      publishProductToCatalog: [S3PublishMedia],
    },
    graphQL: {
      schemas: [mySchema],
      resolvers,
    },
  });
}
