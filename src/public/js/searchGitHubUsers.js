import {addSubscription} from "./sendDataToBackend.js"

document.querySelector('#searchGitHubUsers').addEventListener('submit', (event) => {
    event.preventDefault();
    document.querySelector('#searchResults').innerHTML = "<i>Loading ...</i>";
    const searchTerm = document.querySelector('#searchBar').value;
    document.querySelector('#searchBar').value = "";
    
    if (searchTerm.length === 0){
        return;
    }

    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
        if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {
            const users = JSON.parse(this.responseText);
            document.querySelector('#searchResults').innerHTML = "";
            users.forEach(user => {                
                document.querySelector('#searchResults').innerHTML += 
                `
                <div class="subscriptionItem" data-github_id="${user.id}" data-github_node_id="${user.node_id}" data-github_username="${user.login}" data-repos_url="${user.repos_url.split('https://api.github.com/users/')[1]}" data-html_url="${user.html_url.split("https://github.com/")[1]}">
                <a href="${user.html_url}" target="_blank">${user.login}</a>
                <i class="material-icons text-secondary-color-scheme addIcon">add</i>
                </div>
                `
            });

            document.querySelectorAll(".addIcon").forEach(element => element.addEventListener("click", (event) => {
                event.stopPropagation();
                const {parentElement} = event.target;
                addSubscription(parentElement);                
            }))
        } else {
            document.querySelector('#searchResults').innerHTML = "Error. Please try again"
        }
    }
    xhr.open("GET", `/search/github/users?q=${searchTerm}`);
    xhr.send();
})
