import CryptoJS from "crypto-js";

// The api requires a "sign" key to be passed in the post body
// The sign key is bascially a hash of the post body and a hardcoded secret
// This function generates the sign key from the post body
// Most of the code is directly copied from the api

function getSignKey(postBodyObject: { [key: string]: any }) {
  const crypto = CryptoJS;
  const headersList: string[] = [];
  let index = 0;

  for (let key in postBodyObject) {
    if (
      postBodyObject[key] !== "" &&
      postBodyObject[key] !== undefined &&
      typeof postBodyObject[key] !== "boolean" &&
      postBodyObject[key] !== null
    ) {
      headersList[index] = key;
      index++;
    }
  }

  const sortedKeys = headersList.sort();
  let queryString = "";

  // Build the query string
  for (let index in sortedKeys) {
    const currentKey = sortedKeys[index];
    if (Array.isArray(postBodyObject[currentKey])) {
      queryString += currentKey + "=Array&";
    } else {
      queryString += currentKey + "=" + postBodyObject[currentKey] + "&";
    }
  }

  // Trim leading and trailing ampersands
  queryString = queryString.replace(/^\&+|\&+$/g, "");

  // Append a predefined string to the query string
  queryString = queryString.concat("&05469137076236813460585715952089");

  // Define encryption key and IV
  const encryptionKey = crypto.enc.Utf8.parse(
    "05469137076236813460585715952089"
  );
  const iv = crypto.enc.Utf8.parse("5161557162012237");

  // Encrypt the query string using AES with CBC mode and PKCS7 padding
  const encryptedString = crypto.AES.encrypt(queryString, encryptionKey, {
    iv: iv,
    mode: crypto.mode.CBC,
    padding: crypto.pad.Pkcs7,
  }).toString();

  // Return the encrypted string
  return encryptedString;
}

export default getSignKey;
