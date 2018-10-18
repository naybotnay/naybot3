const Discord = require("discord.js");
const client = new Discord.Client();
const ytdl = require("ytdl-core");
const request = require("request");
const fs = require("fs");
const getYouTubeID = require("get-youtube-id");
const fetchVideoInfo = require("youtube-info");

var config = JSON.parse(fs.readFileSync('./settings.json', 'utf-8'));

const yt_api_key = config.yt_api_key;
const bot_controller = config.bot_controller;
const prefix = config.prefix;
const discord_token = config.discord_token;

 

var guilds = {};



client.login(discord_token);

client.on("message", function (message){
    const member = message.member;
    const mess = message.content.toLowerCase();
    const args = message.content.split(' ').slice(1).join(" ");

    if (!guilds[message.guild.id]) {
        guilds[message.guild.id] = {
            queue:  [],
             isPlaying : false,
            dispatcher : null,
             voiceChannel: null,
             skipReq:  0,
             skippers : [],
             queueNames: []
        }
    }

if(mess.startsWith(prefix + "!play")) {
    if(member.voiceChannel || client.guilds.get("488334414124810240").voiceConnection != null){
        if(guilds[message.guild.id].queue.length > 0 || guilds[message.guild.id].isPlaying) {
        getID(args, function (id){
            add_to_queue(id, message);
      fetchVideoInfo(id, function (err, videoInfo) {
        if(err) throw new Error(err);
      message.reply("Added to Queue **" + videoInfo.title + "**");
  
        });
    });
    } else {
        guilds[message.guild.id].isPlaying = true;
        getID(args, function(id) {
            guilds[message.guild.id].queue.push(id);
            playMusic(id, message);
            fetchVideoInfo(id, function(err, videoInfo) {
                if (err) throw new Error(err);
                guilds[message.guild.id].queueNames.push(videoInfo.title);
                message.reply(" now playing: **" + videoInfo.title + "**");
            });
        });
    }
}else{
    message.reply("You need to be in a Voice Channel!");
}
} else if (mess.startsWith(prefix + "skip")){
    if(guilds[message.guild.id].skippers.indexOf(message.author.id) === -1){
        guilds[message.guild.id].skippers.push(message.author.id);
        guilds[message.guild.id].skipReq++;
        if(guilds[message.guild.id].skipReq >= Math.ceil((guilds[message.guild.id].voiceChannel.members.size = -1 )/ 2)){
            skip_song(message)
            message.reply("Your skip has been acknowledged. Skipping Now")


        }else{
            message.reply("Your skip has been acknowledged. **" + Math.ceil((guilds[message.guild.id].voiceChannel.members.size = -1 )/ 2) - guilds[message.guild.id].skipReq) + "** more skip votes!" ;
        }

        
    }else{
        message.reply("You already voted to skip!");
    }
}
});
    
    


    
        

   

            
 
            
    
    

client.on("ready",function(){
    console.log("I am ready!");
});

function skip_song(message) {
    guilds[message.guild.id].dispatcher.end();
    
    
}

function playMusic(id, message){
    guilds[message.guild.id].voiceChannel = message.member.voiceChannel;

     guilds[message.guild.id].voiceChannel.join().then(function(connection) {
 stream = ytdl("https://www.youtube.com/watch?v=" + id, {
     filter: "audioonly"
 })
 guilds[message.guild.id].skipReq = 0;
 guilds[message.guild.id].skippers = [] ;

 guilds[message.guild.id].dispatcher = connection.playStream(stream);
 guilds[message.guild.id].dispatcher.on("end", function (){
    guilds[message.guild.id].skipReq = [0];
guilds[message.guild.id].skippers = [];
guilds[message.guild.id].queue.shift();
if (guilds[message.guild.id].queue.length === 0) {
    guilds[message.guild.id].queue = [];
    guilds[message.guild.id].isPlaying = false;

}else{
    playMusic(guilds[message.guild.id].queue[0], message);
}
 });
    });
}

function getID(str,cb){
    if (isYoutube(str)) {
        cb(getYouTubeID(str));
    } else {
        search_video(str, function (id){
          cb(id);
        });
    }
}

function add_to_queue(strID, message) {
    if (isYoutube(strID)) {
        guilds[message.guild.id].queue.push(getYouTubeID(strID));
    } else {
        guilds[message.guild.id].queue.push(strID);
    }
}

function search_video(query, callback) {
    request("https://www.googleapis.com/youtube/v3/search?part=id&type=video&q=" + encodeURIComponent(query) + "&key=" + yt_api_key, function(error, response, body) {
        var json = JSON.parse(body);
        callback(json.items[0].id.videoId);
        });


    }
function isYoutube(str){
    return str.toLowerCase().indexOf("youtube.com") > -1;
};

client.on('message', function(message) {
	const myID = "488334414124810240";
    let args = message.content.split(" ").slice(1).join(" ");
    if(message.content.startsWith(prefix + "setname")) {
		        if(message.author.id !== myID) return;
            if(!args) return message.reply('اكتب الحالة اللي تريدها.');
        client.user.setUsername(args);
        message.channel.send(':white_check_mark: Done!').then(msg => {
           msg.delete(5000);
          message.delete(5000);
        });
    } else if(message.content.startsWith(prefix + "stream")) {
		        if(message.author.id !== myID) return;
            if(!args) return message.reply('اكتب الحالة اللي تريدها.');
        client.user.setGame(args , 'https://twitch.tv/6xlez1');
        message.channel.send(':white_check_mark: Done!').then(msg => {
           msg.delete(5000);
          message.delete(5000);
        });
    } else if(message.content.startsWith(prefix + "playing")) {
				        if(message.author.id !== myID) return;
            if(!args) return message.reply('اكتب الحالة اللي تريدها.');
        client.user.setGame(args);
        message.channel.send(':white_check_mark: Done!').then(msg => {
           msg.delete(5000);
          message.delete(5000);
        });
    } else if(message.content.startsWith(prefix + "listen")) {
				        if(message.author.id !== myID) return;
            if(!args) return message.reply('اكتب الحالة اللي تريدها.');
        client.user.setActivity(args, {type:'LISTENING'});
        message.channel.send(':white_check_mark: Done!').then(msg => {
           msg.delete(5000);
          message.delete(5000);
        });
    } else if(message.content.startsWith(prefix + "watch")) {
				        if(message.author.id !== myID) return;
            if(!args) return message.reply('اكتب الحالة اللي تريدها.');
        client.user.setActivity(args, {type:'WATCHING'});
        message.channel.send(':white_check_mark: Done!').then(msg => {
           msg.delete(5000);
          message.delete(5000);
        });
    } else if(message.content.startsWith(prefix + "setavatar")) {
				        if(message.author.id !== myID) return;
        client.user.setAvatar(args);
        message.channel.send(':white_check_mark: Done!').then(msg => {
                if(!args) return message.reply('اكتب الحالة اللي تريدها.');
           msg.delete(5000);
          message.delete(5000);
        });
    }
});




client.on('message', async message => {
            if(!message.channel.guild) return;
             if (message.content.startsWith("!!")) {
let args = message.content.split(' ').slice(1).join(' ');
            let sigMessage = await args;
            
            if (sigMessage === "online") {
                client.user.setStatus("online");
                message.author.send("Your status was set to online.");
            }
            if (sigMessage === "idle") {
                client.user.setStatus("idle");
                message.author.send("Your status was set to idle.");
            }
            if (sigMessage === "invisible") {
                client.user.setStatus("invisible");
                message.author.send("Your status was set to invisible.");
            }
            if (sigMessage === "dnd") {
                client.user.setStatus("dnd");
                message.author.send("Your status was set to dnd.");
            }
            // message.author.send("." + message.content);
        
}
});



   
client.login(process.env.BOT_TOKEN);
