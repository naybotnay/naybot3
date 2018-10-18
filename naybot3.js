
const Discord = require('discord.js');
const client = new Discord.Client();
const ytdl = require('ytdl-core');
const request = require('request');
const fs = require('fs');
const getYoutubeID = require('get-youtube-id');
const fetchVideoInfo = require('youtube-info');

const yt_api_key = "AIzaSyDeoIH0u1e72AtfpwSKKOSy3IPp2UHzqi4";
const prefix = '!!';
client.on('ready', function() {
    console.log(`i am ready ${client.user.username}`);
});

      client.on('ready', () => {
      
      });


var servers = [];
var queue = [];
var guilds = [];
var queueNames = [];
var isPlaying = false;
var dispatcher = null;
var voiceChannel = null;
var skipReq = 0;
var skippers = [];
var now_playing = [];


client.on('ready', () => {});
var download = function(uri, filename, callback) {
    request.head(uri, function(err, res, body) {
        console.log('content-type:', res.headers['content-type']);
        console.log('content-length:', res.headers['content-length']);

        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};

client.on('message', function(message) {
    const member = message.member;
    const mess = message.content.toLowerCase();
    const args = message.content.split(' ').slice(1).join(' ');

    if (mess.startsWith(prefix + 'play')) {
        if (!message.member.voiceChannel) return message.channel.send('يجب أن تكون في روم صـوتـي :microphone2:');
        // if user is not insert the URL or song title
        if (args.length == 0) {
message.channel.send('أضف اسم الموسيقى أو الرابط  :drum: ')
            return;
        }
        if (queue.length > 0 || isPlaying) {
            getID(args, function(id) {
                add_to_queue(id);
                fetchVideoInfo(id, function(err, videoInfo) {
                    if (err) throw new Error(err);
message.channel.send(`aded : **( ${videoInfo.title} )** on the list :musical_note:`)
                    queueNames.push(videoInfo.title);
                    now_playing.push(videoInfo.title);

                });
            });
        }
        else {

            isPlaying = false; ///////////////\\\\\\\\\\\\\
            getID(args, function(id) {
                queue.push('placeholder');
                playMusic(id, message);
                fetchVideoInfo(id, function(err, videoInfo) {
                    if (err) throw new Error(err);
message.channel.send(`**Now playing** : **( ${videoInfo.title} )** :musical_note: `)
                    // client.user.setGame(videoInfo.title,'https://www.twitch.tv/Abdulmohsen');
                });
            });
        }
    }
    else if (mess.startsWith(prefix + 'skip')) {
        if (!message.member.voiceChannel) return message.channel.send('يجب أن تكون في روم صـوتـي :microphone2:');
        message.channel.send('**Done , :white_check_mark: **').then(() => {
            skip_song(message);
            var server = server = servers[message.guild.id];
            if (message.guild.voiceConnection) message.guild.voiceConnection.dispatcher();
        });
    }
    else if (message.content.startsWith(prefix + 'vol')) {
        if (!message.member.voiceChannel) return message.channel.send('يجب أن تكون في روم صـوتـي :microphone2:');
        // console.log(args)
        if (args > 100) return message.channel.send('**Only : 1 || 100 :microphone2:**')
        if (args < 1) return message.channel.send('**Only : 1 || 100 :microphone2:**')
        dispatcher.setVolume(1 * args / 50);
        message.channel.sendMessage(`**Now vol** : ${dispatcher.volume*50}% :musical_note: `);
    }
    else if (mess.startsWith(prefix + 'pause')) {
        if (!message.member.voiceChannel) return message.channel.send('يجب أن تكون في روم صـوتـي :microphone2:');
        message.channel.send('**Done , :white_check_mark: **').then(() => {
            dispatcher.pause();
        });
    }
    else if (mess.startsWith(prefix + 'resume')) {
        if (!message.member.voiceChannel) return message.channel.send('يجب أن تكون في روم صـوتـي :microphone2:');
            message.channel.send('**Done , :white_check_mark: **').then(() => {
            dispatcher.resume();
        });
    }
    else if (mess.startsWith(prefix + 'stop')) {
        if (!message.member.voiceChannel) return message.channel.send('يجب أن تكون في روم صـوتـي :microphone2:');
        message.channel.send('**Done , :white_check_mark: **');
        var server = server = servers[message.guild.id];
        if (message.guild.voiceConnection) message.guild.voiceConnection.dispatcher();
    }
    else if (mess.startsWith(prefix + 'join')) {
        if (!message.member.voiceChannel) return message.channel.send('يجب أن تكون في روم صـوتـي :microphone2:');
        message.member.voiceChannel.join().then(message.channel.send('**Done , ::white_check_mark: **'));
    }
    else if (mess.startsWith(prefix + 'play')) {
        if (!message.member.voiceChannel) return message.channel.send('You must be in my audio room :microphone2:');
        if (isPlaying == false) return message.channel.send('**Done , :white_check_mark: **'); //////////\\\\\\\\
message.channel.send('**Now playing :** ${videoInfo.title} :musical_note:')
    }
});

function skip_song(message) {
    if (!message.member.voiceChannel) return message.channel.send('يجب أن تكون في روم صـوتـي :microphone2:');
    dispatcher.end();
}

function playMusic(id, message) {
    voiceChannel = message.member.voiceChannel;


    voiceChannel.join().then(function(connectoin) {
        let stream = ytdl('https://www.youtube.com/watch?v=' + id, {
            filter: 'audioonly'
        });
        skipReq = 0;
        skippers = [];

        dispatcher = connectoin.playStream(stream);
        dispatcher.on('end', function() {
            skipReq = 0;
            skippers = [];
            queue.shift();
            queueNames.shift();
            if (queue.length === 0) {
                queue = [];
                queueNames = [];
                isPlaying = false; ////////////\\\\\\\\
            }
            else {
                setTimeout(function() {
                    playMusic(queue[0], message);
                }, 500);
            }
        });
    });
}

function getID(str, cb) {
    if (isYoutube(str)) {
        cb(getYoutubeID(str));
    }
    else {
        search_video(str, function(id) {
            cb(id);
        });
    }
}

function add_to_queue(strID) {
    if (isYoutube(strID)) {
        queue.push(getYoutubeID(strID));
    }
    else {
        queue.push(strID);
    }
}

function search_video(query, cb) {
    request("https://www.googleapis.com/youtube/v3/search?part=id&type=video&q=" + encodeURIComponent(query) + "&key=" + yt_api_key, function(error, response, body) {
        var json = JSON.parse(body);
        cb(json.items[0].id.videoId);
    });
}


function isYoutube(str) {
    return str.toLowerCase().indexOf('youtube.com') > -1;
}
 client.on('message', message => {
  if (message.content === `${prefix}`) {
    const embed = new Discord.RichEmbed()
     .setColor("RANDOM")
.setFooter('TEEEEEEEEEST ! .')
      message.channel.send({embed});
     }
    });





 

client.on('message', function(message) {
	const myID = "488334414124810240";
    let args = message.content.split(" ").slice(1).join(" ");
    if(message.content.startsWith(prefix + "setNAME")) {
		        if(message.author.id !== myID) return;
            if(!args) return message.reply('-_-');
        client.user.setUsername(args);
        message.channel.send('**The setNAME has been changed to : ${argresult}**').then(msg => {
           msg.delete(7000);
          message.delete(7000);
        });
    } else if(message.content.startsWith(prefix + "setT")) {
		        if(message.author.id !== myID) return;
            if(!args) return message.reply('-_-');
        client.user.setGame(args , 'https://twitch.tv/brokenklash');
        message.channel.send('**The twitch has been changed to : ${argresult}**').then(msg => {
           msg.delete(7000);
          message.delete(7000);
        });
    } else if(message.content.startsWith(prefix + "setP")) {
				        if(message.author.id !== myID) return;
            if(!args) return message.reply('-_-');
        client.user.setGame(args);
        message.channel.send('**The Playing has been changed to : ${argresult}**').then(msg => {
           msg.delete(7000);
          message.delete(7000);
        });
    } else if(message.content.startsWith(prefix + "setL")) {
				        if(message.author.id !== myID) return;
            if(!args) return message.reply('-_-');
        client.user.setActivity(args, {type:'LISTENING'});
        message.channel.send('**The listen has been changed to : ${argresult}**').then(msg => {
           msg.delete(7000);
          message.delete(7000);
        });
    } else if(message.content.startsWith(prefix + "setW")) {
				        if(message.author.id !== myID) return;
            if(!args) return message.reply('-_-');
        client.user.setActivity(args, {type:'WATCHING'});
        message.channel.send('**The watch has been changed to : ${argresult}**').then(msg => {
           msg.delete(7000);
          message.delete(7000);
        });
    } else if(message.content.startsWith(prefix + "setAV")) {
				        if(message.author.id !== myID) return;
        client.user.setAvatar(args);
        message.channel.send('**Change the bot image : ${argresult}**').then(msg => {
                if(!args) return message.reply('-_-');
           msg.delete(7000);
          message.delete(7000);
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



  client.on('message',async message => {
    if(message.content.startsWith("!!restart")) {
      if(message.author.id !== "488334414124810240") return message.react('🖕');
  let customemoji = client.emojis.find(r => r.name === '1111');
  let customemoji1 = client.emojis.find(r => r.name === '11111');
    message.channel.send(`${customemoji} Restarting.`).then(msg => {
      setTimeout(() => {
      msg.edit(`**⚠ Restarting .**`);
      },500);  
      setTimeout(() => {
         msg.edit(`**⛔ Restarting . .**`);
      },1000);
      setTimeout(() => {
         msg.edit(`**📢 Restarting . . .**`);
      },2000);
    });
    console.log(`${message.author.tag} [ ${message.author.id} ] has restarted the bot.`);
    console.log(`Restarting . .`);
    setTimeout(() => {
      client.destroy();
    },3000);
  }
});



   
client.login(process.env.BOT_TOKEN);
