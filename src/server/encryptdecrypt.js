const crypto = require('crypto');
const algorithm = 'aes-256-cbc'; //Using AES encryption
const pass = process.env.ENCRYPTION_PASSWORD;
const salt = process.env.ENCRYPTION_SALT;

function getEncryptionKey(password) {
    return new Promise((resolve, reject) => {
        crypto.pbkdf2(password, salt, 100, 32, 'sha512', (err, derivedKey) => {
            if (err) reject(err);
            else resolve(derivedKey);
        });
    });
}

//Encrypting text
async function encrypt(text) {
    const key = await getEncryptionKey(pass);
    const iv = crypto.randomBytes(16);
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}

// Decrypting text
async function decrypt(hash) {
    const key = await getEncryptionKey(pass);
    const iv = Buffer.from(hash.iv, 'hex');
    let encryptedText = Buffer.from(hash.encryptedData, 'hex');
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

module.exports = { encrypt, decrypt };
