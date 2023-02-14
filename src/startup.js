function myStartup(context) {
    context.simpleSchemas.ProductVariant.extend({
      uploadedBy: {
        type: Number,
        min: 0,
        optional: true
      }
    });
  
    context.simpleSchemas.CatalogProductVariant.extend({
      uploadedBy: {
        type: Number,
        min: 0,
        optional: true
      }
    })
  }

  export {myStartup};