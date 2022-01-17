import {updateRepositoriesFeeds} from "./fetchGitHubRepos.js"
import { deleteSubscription } from "./sendDataToBackend.js";

function getSubscriptions(){    
    
    const xhr = new XMLHttpRequest();

    xhr.onload = function() {
        document.querySelector("#subscriptionsContainer").innerHTML = "";
        if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {            
            
            const subscriptions = JSON.parse(this.responseText);
            subscriptions.forEach(subscription => {
                document.querySelector("#subscriptionsContainer").innerHTML += `
                <div class="subscriptionItem" data-github_id="${subscription.github_id}" data-github_node_id="${subscription.github_node_id}" data-github_username="${subscription.username}">
                    <a href="${"https://github.com/" + subscription.html_url}" target="_blank">${subscription.username}</a>
                    <i class="material-icons text-secondary-color-scheme clearIcon">clear</i>
                </div>
                `
            });
            
            document.querySelectorAll(".clearIcon").forEach(element => element.addEventListener("click", (event) => {
                const {parentElement} = event.target;
                deleteSubscription(parentElement);
            }))

            if (subscriptions.length === 0){
                document.querySelector("#subscriptionsContainer").innerHTML = "<i>You have no subscriptions.</i>"
            }

            updateRepositoriesFeeds();
        } else {
            console.log(this.status);
        }
    }

    xhr.open("GET", "/subscription");
    xhr.send();
}

function getUserInfo(){
    const xhr = new XMLHttpRequest();

    xhr.onload = function() {
        if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {
            const userInfo = JSON.parse(this.responseText);
            const {email,firstName,lastName } = userInfo;
            document.querySelector("#userLastName").textContent = lastName;
            document.querySelector("#userFirstName").textContent = firstName;
            document.querySelector("#userEmail").textContent = email;
        } else {
            console.log(this.status);
        }
    }

    xhr.open("GET", "/user");
    xhr.send();
}


getSubscriptions();
getUserInfo();

export {
    getSubscriptions
}