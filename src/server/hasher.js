const crypto = require('crypto');

const hashSha512 = (data) => {
    let hash = crypto.createHash('sha512');
    //passing the data to be hashed
    data = hash.update(data, 'utf-8');
    //Creating the hash in the required format
    const gen_hash = data.digest('hex');
    //Printing the output on the console
    return gen_hash;
};

module.exports = hashSha512;
