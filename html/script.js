
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

async function getChatList() {
        let res = await fetch(window.location.href,{ ////get request to server
        method:'GET',
        headers:{
            "datafetch":"chats"
        }
    });
    return await res.json();
}

let oldChatData = [];
async function updateChat(){
    let chatData = await getChatData(); /// fetch the chat
    if(JSON.stringify(chatData) === JSON.stringify(oldChatData)){return;}
    oldChatData = chatData;

    let messageboard = document.getElementById("messageboard"); //// the message board div

    messageboard.replaceChildren();

    //------Construct the chat
    for(const message of chatData){
        /// add message 
        const div = document.createElement("div");
        div.className = message.sender === "user" ? "messageout" : "messagein";
        div.textContent = message.text;
        messageboard.appendChild(div);

        /// add timestamp
        const M_timestamp = document.createElement("div"); 
        M_timestamp.className = "timestamp";
        M_timestamp.textContent = message.readable_timestamp;
        div.appendChild(M_timestamp);
    }
    scrollMessageDown();
}


async function updateChatList() {
    let list = await getChatList();
    const localpath = window.location.pathname;
    const sidebar = document.getElementById("sidebar");
    if(localpath == "/"){
        const newChatLink = document.getElementById("new_chat");
        newChatLink.className = "active";
    }
    for(const object of list){
        const link = document.createElement("a");
        if(["/",object.dir].join("") == localpath){
            link.className = "active";
        }
        link.href = [window.location.origin,"/",object.dir].join("");
        link.textContent = object.name;
        sidebar.appendChild(link);
    }
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

setInterval(updateChat,2000);

updateChatList();

sendbutton.onclick = sendMsg;
