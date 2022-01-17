function isLatest(repo, dayRange){
    const current = new Date;
    const inputTime = new Date(repo.updated_at);
    const dayInMs = 1000 * 60 * 60 * 24;
    const range = parseInt(dayRange) * dayInMs;
    return current - inputTime <= range
}

module.exports = {
    isLatest
}