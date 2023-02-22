const uploadedBy={
    Account(parent, args, { db }, info) {
      
        console.log("Account resolver");
        return "Account resolver";
      }
    
}
export {uploadedBy as default}