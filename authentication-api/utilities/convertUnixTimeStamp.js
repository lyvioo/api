function convertUnixToDate(unixTimestamp) {
    return new Date(unixTimestamp * 1000);
}


module.exports = convertUnixToDate;
