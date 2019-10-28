const jwt = require('jsonwebtoken');

module.exports = (tokenVal) => {
    const authHeader = tokenVal;
    if (!authHeader)
        return null;

    const token = authHeader.split(' ')[1];


    if (!token || token === '')
        return null;
    let decodeTocken;
    try {

        decodeTocken = jwt.verify(token, ',(F-h"FL&,YP,P7xf#FeBT/K9>#o');
    } catch (error) {
        return null;
    }

    if (!decodeTocken)
        return null;
    return decodeTocken;
}