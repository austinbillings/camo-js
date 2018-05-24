const fs = require('fs');
const atob = require('atob');
const btoa = require('btoa');
const path = require('path');
const crypto = require('crypto');

const loadFile = (filePath) => {
    if (typeof filePath !== 'string')
        throw new TypeError(`Camo@loadFile: input 'filePath' is not a string. (Got "${typeof filePath}")`);
    const contents = fs.readFileSync(path.resolve(filePath), 'utf8');
    if (!contents)
        throw new Error(`Camo@loadFile: couldn't load contents from path "${filePath}"`);
    return contents;
};

const saveFile = (filePath, contents) => {
    if (typeof filePath !== 'string')
        throw new TypeError(`Camo@saveFile: input 'filePath' is not a string. (Got "${typeof filePath}")`);
    if (typeof contents !== 'string')
        throw new TypeError(`Camo@saveFile: input 'contents' is not a string. (Got "${typeof contents}")`);
    return fs.writeFileSync(path.resolve(filePath), contents)
};

const getSecret = () => {
    return crypto.randomBytes(8).toString('hex')
};

const encodeContents = (contents) => {
    if (typeof contents !== 'string')
        throw new TypeError(`Camo@encodeContents: input 'contents' is not a string. (Got "${typeof contents}")`);
    const binary = btoa(contents);
    const split = binary.split('0');
    const secret = getSecret();
    return `${secret}:${split.join(secret)}`;
};

const PIVOT_CHAR = '0'; // split the encoded output by this char (should be a BASE64 char)
const JOINER_CHAR = ':'; // join the encoded output to the secret by this char (should NOT be a BASE64 char)

const decodeContents = (encodedContents) => {
    if (typeof encodedContents !== 'string')
        throw new TypeError(`Camo@decodeContents: input 'encodedContents' is not a string. (Got "${typeof encodedContents}")`);
    const [ secret, contents ] = encodedContents.split(JOINER_CHAR);
    const repaired = contents.split(secret).join(PIVOT_CHAR);
    return atob(repaired);
}

// 'a' and 'b' args are junk for string parsing
const clientDecodeContents = function(a,e,b,d,j){var i=e.split(d),s=i[0],c=i[1];return atob(c.split(i).join(j))};


const wrapEncodedContents = (encodedContents) => {
    if (typeof encodedContents !== 'string')
        throw new TypeError(`Camo@wrapEncodedContents: input 'encodedContents' is not a string. (Got "${typeof encodedContents}")`);

    const fn = clientDecodeContents.toString();
    return `(function(){eval((${fn})('<<',${encodedContents}','>>','${JOINER_CHAR}','${PIVOT_CHAR}'))})()`;
}

const unwrapEncodedContents = (wrappedEncodedContents) => {
    if (typeof wrappedEncodedContents !== 'string')
        throw new TypeError(`Camo@wunrapEncodedContents: input 'wrappedEncodedContents' is not a string. (Got "${typeof wrappedEncodedContents}")`);
    const [ preJunk, rest ] = wrappedEncodedContents.split('<<');
    const [ paddedContents, postJunk ] = rest.split('>>');
    const contents = paddedContents.substring(2, paddedContents.length - 2);
    console.log(contents);
    return contents;
}

const deobfuscateContents = (wrappedEncodedContents) => {
    if (typeof wrappedEncodedContents !== 'string')
        throw new TypeError(`Camo@deobfuscateContents: input 'wrappedEncodedContents' is not a string. (Got "${typeof wrappedEncodedContents}")`);

    const unwrapped = unwrapEncodedContents(wrappedEncodedContents);
    return decodeContents(unwrapped);
}

const obfuscateContents = (originalContents) => {
    if (typeof originalContents !== 'string')
        throw new TypeError(`Camo@obfuscateContents: input 'originalContents' is not a string. (Got "${typeof originalContents}")`);

    const encodedContents = encodeContents(originalContents);
    return wrapEncodedContents(encodedContents);
};

const obfuscateJsFile = (filePath) => {
    if (typeof filePath !== 'string')
        throw new TypeError(`Camo@obfuscateJsFile: input 'filePath' is not a string. (Got "${typeof filePath}")`);

    const original = loadFile(filePath);
    const obfuscated = obfuscateContents(original);
    return saveFile(filePath, obfuscated);
}

const deobfuscateJsFile = (filePath) => {
    if (typeof filePath !== 'string')
        throw new TypeError(`Camo@deobfuscateJsFile: input 'filePath' is not a string. (Got "${typeof filePath}")`);

    const obfuscated = loadFile(filePath);
    const original = deobfuscateContents(obfuscated);
    return saveFile(filePath, obfuscated);
}

module.exports = {
    wrapEncodedContents,
    unwrapEncodedContents,
    
    obfuscateContents,
    deobfuscateContents,

    obfuscateJsFile,
    deobfuscateJsFile,

    encodeContents,
    decodeContents
};
