// alert('javescript page has been successfully linked');

console.log('this is a console messasge')

window.onload = async () =>{
    console.log("window has been loaded");

    document.getElementById('important');

    document.getElementById('important').innerHTML = "I have <span>changed</span> the text with javascript";

    let importantParagraph = document.getElementById('important');
    importantParagraph.style.backgroundColor = "coral";

    importantParagraph.classList.add("hide");
    importantParagraph.classList.remove("show");

    let c = document.getElementById('container');
    let i = document.createElement('img');
    i.src = "dog.jpg";
    c.appendChild(i);

    c.addEventListener("click", ()=>{
        console.log("clicked");

        if(importantParagraph.classList.contains('hide')){
            importantParagraph.classList.remove("hide");
        } else{
            importantParagraph.classList.add("hide");
        }
    });

    let blues = document.getElementsByClassName("blue");
    blues[1].style.backgroundColor = "skyblue";

    //api
    let params = new URLSearchParams({
        apikey: "3938baff",
        s: "one battle after another",
        type: "movie"
    });
    console.log(params);
    let url = "https://www.omdbapi.com/?" + params;
    console.log(url);
    let response = await fetch(url);
    console.log(response);
   
    let movieData = await response.json();
    console.log(movieData);

    let movies = movieData.Search;
    console.log(movies);

    for(let m of movies){
        let div = document.createElement("div");
        div.textContent = m.Title;
        let poster = document.createElement('img');
        poster.src = m.Poster;

        div.appendChild(poster);
        c.appendChild(div);
    }
} 