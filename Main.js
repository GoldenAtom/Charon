"use strict";

const { createServer } = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const hostname = '127.0.0.1';
const port = 3000;

var codeFiles = {
    head : {path:"/html/head.html",data:""},
    header: {path:"html/header.html",data:""},
    body: {path:"html/body.html",data:""},
    style: {path:"html/style.css",data:""},
    javascript : {path:"html/script.js",data:""},
}

function refreshFiles(){ // function to allow for refreshing of files on the go
///read html files
    for (const [name,object] of Object.entries(codeFiles)){
        try {
        object.data = fs.readFileSync(path.join(__dirname,object.path),'utf-8');
        } catch(err){
            console.log("file fetch error, fetching ",name," : ",err);
        }
    }
}
refreshFiles();  ///fetch initial files


//make server
const server = createServer();


function createMSGFileTemplate(title){
    let object = {
        title: title,
        readable_title:"Chat without a name",
        timeOfCreation: Date.now(),
        messages: [],
        latest_sender:"",
        last_interact: Date.now(),
    }
    return object;
}

let dateFormat = Intl.DateTimeFormat("en-EN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  });

function handleMessage(message,dir,timestamp,sender){
    ///// fetch chat data
    let data = "";
    if (!(dir==="")){
        try {
            data = fs.readFileSync(path.join(__dirname,"data","chats",[dir,".json"].join("")),"utf-8");
            console.log("did file read");
        } catch(error) {
            data = ""
            console.log(error);

        }
    }

    if(data==""){
        data = createMSGFileTemplate(Date.now().toString());
    } else {
        try {
            data=JSON.parse(data);
        } catch {
            return console.error("Failed to parse json");
        }
    }

    ////// append new msg

    let msgObject = {
        index:data.messages.length,
        sender:sender,
        timestamp:timestamp,
        readable_timestamp:dateFormat.format(timestamp),
        text:message,
    }
    data.messages.push(msgObject);

    data.latest_sender = sender;

    data.last_interact = Date.now();

    fs.writeFileSync(path.join(__dirname,"data","chats",[data.title,".json"].join("")),JSON.stringify(data));

    return data.title;
}

function addAgentMSGflag(dir){

    const timestamp = Date.now();

    ///// fetch chat data
    let data = "";
    if (!(dir==="")){
        try {
            data = fs.readFileSync(path.join(__dirname,"data","chats",[dir,".json"].join("")),"utf-8");
            console.log("did file read");
        } catch(error) {
            data = ""
            console.log(error);

        }
    }

    if(data==""){
        data = createMSGFileTemplate(Date.now().toString());
    } else {
        try {
            data=JSON.parse(data);
        } catch {
            return console.error("Failed to parse json");
        }
    }

    ////// append new msg

    let msgObject = {
        index:data.messages.length,
        sender:"charon",
        timestamp:timestamp,
        readable_timestamp:dateFormat.format(timestamp),
        text:"Charon is pondering",
    }
    const newlen = data.messages.push(msgObject);

    data.latest_sender = "charon";

    data.last_interact = Date.now();

    fs.writeFileSync(path.join(__dirname,"data","chats",[data.title,".json"].join("")),JSON.stringify(data));

    return newlen-1;
}




//server gets pinged
server.on("request",(req,res) => {

    if (req.url === "/favicon.ico") { res.statusCode = 204; return res.end(); }

    if(req.method === "POST"){
        let body = "";
        req.setEncoding('utf-8');
        req.on("data",chunk => body += chunk);
        req.on("end", () => {
            console.log("posted");
            console.log(req.url);
            console.log(body);
            let chatTitle = handleMessage(body,req.url.replace("/",""),Number(req.headers.timestamp),"user");
            res.statusCode=200;
            res.setHeader("Content-Type","text/plain");
            res.write(chatTitle);
            console.log(chatTitle);
            res.end();
        });
        return;
    }

    res.setHeader("Vary", "DataFetch");   

    if(req.headers['datafetch'] !== undefined){
        res.setHeader("Cache-Control", "no-store");
        let headerValue = req.headers.datafetch;
        if(headerValue === "messages"){ // if the client requests the messages in a chat
            // fetch chat data
            let chatDir = req.url.replace("/","");
            let messages = []; // declare messages list
            if(chatDir ==""){res.statusCode=200;res.setHeader("Content-Type","application/json");res.write("[]");res.end();return;} /// return nothing if no chat has been requested (New chat page)

            ///try fetching data
            try {
                const chat = JSON.parse(fs.readFileSync(path.join(__dirname,"data","chats",[chatDir,".json"].join("")),"utf-8"));
                messages = chat.messages;
            } catch {
                console.log("File read failed when attempring to send chat data for chat ",chatDir);
            }

            //Building the response
            res.statusCode=200;
            res.setHeader("Content-Type","application/json");
            res.write(JSON.stringify(messages));
            res.end();

        } else if (headerValue == "chats"){ /// if the client requests list of chats

            let chatsList = fs.readdirSync(path.join(__dirname,"data","chats"),"utf-8"); /// check for saved chats
            let returnList = [];
            for(const dirs of chatsList){ // iterate trough saved chats adding the relevant data to the list
                let chat = JSON.parse(fs.readFileSync(path.join(__dirname,"data","chats",dirs),"utf-8"));
                returnList.push({ //object containing the relevant data
                    name:chat.readable_title,
                    dir:chat.title,
                    timestamp:chat.last_interact
                });
            }

            // sorting the list
            returnList.sort(function(a,b){return b.timestamp - a.timestamp});

            //Building the response
            res.statusCode=200;
            res.setHeader("Content-Type","application/json");
            res.write(JSON.stringify(returnList));
            res.end();
        }
        return;
    }

    res.statusCode=200

    res.setHeader("Content-Type", "text/html")

    res.write("<!DOCTYPE html>\n")
    res.write("<html>\n")

    res.write(codeFiles.head.data);//write head

    res.write("<style>\n")
    res.write(codeFiles.style.data); // write css
    res.write("\n</style>\n")

    res.write("<body>\n");
    res.write(codeFiles.header.data); // write header
    res.write(codeFiles.body.data);// write body

    res.write("<script>"); //init javascript
    res.write(codeFiles.javascript.data); // insert javascript
    res.write("</script>"); //close script section

    res.write("\n</body>"); // close body
    
    res.end("\n</html>")

});

server.listen(port,hostname);

fs.watch(path.join(__dirname,"html"), () =>{
console.log("change detected, refreshing active files");
refreshFiles();
});


///// ========= Agent Handling =============
let agentBusy = false;

function agentsTurn(chat){return chat.latest_sender === "user" ? true : false;} // I know teniary (or wathever its called) is uneccessary here asking if condition is true return true, but Its a nice note on how it works so Ill keep it

function checkChats(){
    let chat_keys = fs.readdirSync(path.join(__dirname,"data","chats"),"utf-8"); /// fetch all chat names
    let chats = [];
    let unPocessed = [];

    for(const names of chat_keys){ // get the actual chats
        try{
            chats.push(fs.readFileSync(path.join(__dirname,"data","chats",names),"utf-8"));
        } catch {
            console.log("Ops developed dyslexia reading chat ",names);
        }
    }

    /// now iterate trough the chats to see which needs attention
    for(const chat of chats){
        if(agentsTurn(chat)){
            unPocessed.push(chat);
        }
    }
    unPocessed.sort(function(a,b){return b.last_interact - a.last_interact});
    return unPocessed;
}


function doCharon(){ /// yes sexually ;3
    const UndoneDeeds = checkChats(); /// check for chats to act on
    if(UndoneDeeds.length < 1){console.log("no deeds undone");return true;} /// no chats yippee!
    if(UndoneDeeds.length > 1){console.log("too many deeds to do :(")} /// overworked, not yippee D:

    const todaysDeed = UndoneDeeds[0];


}


async function checkOllama(){
    let res;
    try{res = await fetch("http://127.0.0.1:11434/api/version");} catch {console.log("ollama fetch failed it probably killed itself witnessing these horrors"); return;}
    console.log(res.ok ? "Ollama looking soo very fine":"OLLAMA IS NOT DOING TO WELL");
}
checkOllama();

async function testModel() {
    const model = "gemma3:4b";
    let res = await fetch("http://localhost:11434/api/generate",{
        method:"POST",
        headers:{
            "Content-Type":"Application/json"
        },
        body:JSON.stringify({
            model:model,
            prompt:"This is a test please reply with banana and a sentence of your choice",
            stream:false,
            raw:true,
            keep_alive:0
        })

    });
    if(res.ok){
        console.log(await res.json());
    } else{
        console.log("RES NO BUENO");
        console.log(res);
        console.log(await res.json());
    }
}
testModel();