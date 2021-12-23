const maskIt = (inp, masks) => {
    if (!masks.forEach) {
        throw new Error('Array of strings expected for masks');
    }
    if (inp === null || inp === undefined) {
        return inp;
    }
    if (typeof inp !== 'object') {
        if (!inp) return inp;
        if (masks.indexOf(inp) > -1) return '****';
        try {
            inp = JSON.parse(inp); //if this is stringified JSON, try to parse it.
            if (typeof inp !== 'object') return inp;
        } catch (e) {
            return inp;
        }
        return maskIt(inp, masks);
    }
    if (Array.isArray(inp)) {
        return inp.map((e) => {
            if (masks.indexOf(e) > -1) return '****';
            if (typeof e === 'object') return maskIt(e, masks);
            return e;
        });
    }
    let op = {};
    for (let prop in inp) {
        //eslint-disable-next-line no-prototype-builtins
        if (inp.hasOwnProperty(prop)) {
            if (masks.indexOf(prop) > -1) op[prop] = '****';
            else op[prop] = maskIt(inp[prop], masks);
        }
    }
    return op;
};
module.exports = maskIt;
