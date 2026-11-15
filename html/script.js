
////------SCROLL THE MESSAGES DIV DOWN ---------
let messageboard = document.getElementById("messageboard");

function scrollMessageDown() {
    messageboard.scrollTop = messageboard.scrollHeight;
}

scrollMessageDown();
//--------------------------------------


//------ Updating Display--------

async function getChatData() { ///fetch chat messages
    let res = await fetch(window.location.href,{ ////get request to server
        method:'GET',
        headers:{
            "datafetch":"messages"
        }
    });
    return await res.json();
}


async function updateChat(){
    let chatData = await getChatData(); /// fetch the chat

    let messageboard = document.getElementById("messageboard"); //// the message board div


    //------Construct the chat
    let chatHtmlString = "" 
    for(const message of chatData){
        const div = document.createElement("div");
        div.className = message.sender === "user" ? "messageout" : "messagein";
        div.textContent = message.text;
        messageboard.appendChild(div);
    }
    scrollMessageDown();
}


// -----Message sending ---------
let inputField = document.getElementById("inputField"); //field you write msg
let sendbutton = document.getElementById("send"); // send message button

function clearField() { /// to clear the input field after sending
    inputField.value = "";
}

// sending the msg

async function sendMsg() {
    sendbutton.disabled=true;
    let fieldvalue = inputField.value.trim();
    if(fieldvalue === "") {
        return sendbutton.disabled=false;
    }
    let res = await fetch(window.location.href,{  // send msg post 
        method : 'POST',
        headers: {
            "timestamp": Date.now()
        },
        body: fieldvalue,
    });
    if (res.ok){
            clearField();// clear the text boc

            //// if new chat change the url
            const chatTitle = await res.text();
            const newPath = "/"+chatTitle;
            if(location.pathname !== newPath){
                location.pathname = newPath;
            }

            ///Update Chat and sidebar
            updateChat();
            
    } else {
        console.error(`HTTP error: ${res.status}`);
    }
    sendbutton.disabled=false;
}

if(location.pathname !== "/"){
    updateChat();
}

sendbutton.onclick = sendMsg;
