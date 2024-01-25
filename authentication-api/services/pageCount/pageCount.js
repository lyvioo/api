let currentPage = 0;

function incrementPageCount() {
    currentPage++;
    return currentPage;
}

function getCurrentPage() {
    return currentPage;
}

function resetPageCount() {
    currentPage = 1;
}

module.exports = {
    incrementPageCount,
    getCurrentPage,
    resetPageCount
};
