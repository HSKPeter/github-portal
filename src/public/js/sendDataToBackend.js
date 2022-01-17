import {formatData} from "./formatData.js";
import {updateRepositoriesFeeds} from "./fetchGitHubRepos.js"

function addSubscription(htmlElement){
    
    const {dataset} = htmlElement;
    const {github_id, github_node_id, github_username, repos_url, html_url} = dataset;
    const formattedData = formatData({github_id, github_node_id, github_username, repos_url});
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
        if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {
            htmlElement.remove();

            if (document.querySelector("#subscriptionsContainer").innerHTML === "<i>You have no subscriptions.</i>") {
                document.querySelector("#subscriptionsContainer").innerHTML = ""
            }

            document.querySelector("#subscriptionsContainer").innerHTML += `
            <div class="subscriptionItem" data-github_id="${github_id}" data-github_node_id="${github_node_id}" data-github_username="${github_username}">                
                <a href="${"https://github.com/" + html_url}" target="_blank">${github_username}</a>
                <i class="material-icons text-secondary-color-scheme clearIcon">clear</i>
            </div>
            `   
            document.querySelectorAll(".clearIcon").forEach(element => element.addEventListener("click", (event) => {
                const {parentElement} = event.target;
                deleteSubscription(parentElement);
            }))
            updateRepositoriesFeeds();
        } else {
            console.log(this.status);
        }
    }
    xhr.open("POST", "/subscription");
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(formattedData);
}

function deleteSubscription(htmlElement){
    const {dataset} = htmlElement;
    const {github_id, github_node_id, github_username, repos_url} = dataset;
    const formattedData = formatData({github_id, github_node_id, github_username, repos_url});
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
        if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {            
            htmlElement.remove();

            const subscriptions = JSON.parse(this.responseText);
            if (subscriptions.length === 0){
                document.querySelector("#subscriptionsContainer").innerHTML = "<i>You have no subscriptions.</i>"
            }
            updateRepositoriesFeeds();
        } else {
            console.log(this.status);
        }
    }
    xhr.open("POST", "/unsubscribe");
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(formattedData);
}

export {
    addSubscription,
    deleteSubscription
}