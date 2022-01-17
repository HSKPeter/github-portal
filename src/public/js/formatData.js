function concatKeyValuePairWithEqualSign(key, value){
    return encodeURIComponent(key) + '=' + encodeURIComponent(value)
}

function formatData(data){
    return Object.keys(data).map(key => concatKeyValuePairWithEqualSign(key, data[key])).join('&');
}

export {
    formatData
}