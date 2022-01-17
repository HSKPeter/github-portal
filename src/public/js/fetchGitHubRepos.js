function fetchGitHubRepos(url) {
    document.querySelector('#feedsContainer').innerHTML = "<i>Loading ...</i>";
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
        if (this.readyState == XMLHttpRequest.DONE) {
            const repositories = JSON.parse(this.responseText);
            document.querySelector('#feedsContainer').innerHTML = "";
            repositories.forEach(repository => {
                document.querySelector('#feedsContainer').innerHTML += 
                `
                <div class="repositoryFeed">
                <div class="repositoryDetailsContainer">
                    <a class="repositoryName" href="${repository.html_url}" target="_blank">${repository.name}</a>
                    <div class="repositoryDescription">${repository.description}</div>
                </div>
                <div class="repoOwnerInfo">
                    <img class="gitHubProfilePicInRepos" src="${repository.owner.avatar_url}" alt="GitHub profile picture of ${repository.name}"/>
                    <a href="${repository.owner.html_url}" class="gitHubRepoOwnerName" target="_blank">${repository.owner.login}</a>
                </div>
                </div>
                `
            });
            
            if (repositories.length === 0){
                document.querySelector('#feedsContainer').innerHTML = "<i>No feeds.</i>";
            }
        } else {
            console.log(this.status);
        }
    }
    xhr.open("GET", url);
    xhr.send();
}


function updateRepositoriesFeeds(){
    const dayRange = document.querySelector("#dayRange").value;
    fetchGitHubRepos(`/search/github/repos?day_range=${dayRange}`);
}


document.querySelector("#dayRange").addEventListener('change', () => {    
    updateRepositoriesFeeds()
})

export {
    updateRepositoriesFeeds
}