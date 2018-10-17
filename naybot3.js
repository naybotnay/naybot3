const Discord = require("discord.js");
const ytdl = require("ytdl-core");
const { Client, Util } = require('discord.js');
const getYoutubeID = require('get-youtube-id');
const fetchVideoInfo = require('youtube-info');
const YouTube = require('simple-youtube-api');
const youtube = new YouTube("AIzaSyAdORXg7UZUo7sePv97JyoDqtQVi3Ll0b8");
const queue = new Map();
const client = new Discord.Client();

client.on('ready', () => {
  console.log('---------------');
  console.log(' Bot Is Online')
  console.log('---------------')
});

const prefix = "!!"
var isPlaying = false;
var dispatcher = null;
var voiceChannel = null;
var skipReq = 0;
var skippers = [];

//fact
client.on('message', message => {
    if (message.content === prefix + 'ping'){
    require("request")("https://murkapi.com/fact.php?key=<KEY>&json",
      function(err, res, body) {
        var data = JSON.parse(body);
        if (data && data.text) {
          message.channel.send(data.text)
        }
      });
  }

//fact
//help
  client.on('message', message => {
    if (message.content === prefix + 'help') {
    message.channel.send({embed: {
    color: 3447003,
    author: {
      name: client.user.username,
      icon_url: client.user.avatarURL
    },
    title: "Bot Info",
    url: "",
    description: "This Bot Was Created By SmokingPorts#5809",
    fields: [{
        name: "Bot Commands",
        value: "~ping , ~help , ~userinfo (Provides info for your user only)"
      },
      {
        name: "Music Commands",
        value: "~play <SongURL> , ~skip"
      },
      {
        name: "Universal Generator",
        url: "UniversalGenerator.xyz",
        value: "Universal Generator is on sale prices are dropping soon 10/18/17 enjoy!!"
      }
    ],
    timestamp: new Date(),
    footer: {
      icon_url: client.user.avatarURL,
      text: "© UniversalGenerator.xyz"
    }
  }
});
    }
  });
//help
//ping
   client.on('message', message => {
    if (message.content === prefix + 'ping') {
    message.channel.send(`${(client.ping)}ms`);
    }
  });
//ping
//userinfo
client.on('message', message => {
    if (message.content === prefix + 'userinfo') {
        const embed = new Discord.RichEmbed()
  .addField("Are you a bot?", message.author.bot, true)
  .setAuthor(message.author.username, message.author.avatarURL)
  .setColor(3447003)
  .setFooter("© UniversalGenerator.xyz", client.user.avatarURL)
  .setThumbnail(message.author.avatarURL)
  .setTimestamp()
  .setURL("")
  .addBlankField(true)
  .addField("User Id", message.author.id, true)
  .addField("User Created", message.author.createdAt , true);
    message.channel.send({embed});
    }
  });
//userinfo
client.on('message', function (message) {
    const member = message.member;
    const mess = message.content.toLowerCase();
    const args = message.content.split(' ').slice(1).join(" ");

    if (mess.startsWith(prefix + "play")) {
        if (member.voiceChannel || client.guilds.get("").voiceConnection != null) {
        if (queue.length > 0 || isPlaying) {
            getID(args, function (id) {
                add_to_queue(id)
                fetchVideoInfo(id, function (err, videoInfo) {
                    if (err) throw new Error(err);
                    message.reply(" added to queue; **" + videoInfo.title + "**");
                });
            });
        } else {
            isPlaying = true;
            getID(args, function (id) {
                queue.push("placeholder");
                playMusic(id, message);
                fetchVideoInfo(id, function (err, videoInfo) {
                    if (err) throw new Error(err);
                    message.reply(" now playing **" + videoInfo.title + "**");
                });
            });
        }
    } else {
        message.reply(" you need to be in a voice channel!");
    }
} else if (mess.startsWith(prefix + "skip")) {
        if (skippers.indexOf(message.author.id) === -1) {
            skippers.push(message.author.id);
            skipReq++;
            if (skipReq >= Math.ceil((voiceChannel.members.size - 1) / 2)) {
                skip_song(message);
                message.reply(" your skip has been acknowledged. Skipping now!");
            } else {
                message.reply(" your skip has been acknowledged. You need **" + Math.ceil((voiceChannel.members.size -1) / 2) - skipReq) = "** more skip votes";
            }
        } else {
            message.reply(" you already voted to skip!");
        }
    }
});

    client.on('ready', function(){
    console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
});

function skip_song(message) {
    dispatcher.end();
    if (queue.length > 1) {
        playMusic(queue[0]. message);
    } else {
        skipReq = 0;
        skippers = [];
    }
}

function playMusic(id, message) {
    voiceChannel = message.member.voiceChannel;

    voiceChannel.join().then(function (connection) {
        stream = ytdl("https://www.youtube.com/watch?v=" + id, {
            filter: 'audioonly'
        });
        skipReq = 0;
        skippers = [];

        dispatcher = connection.playStream(stream);
        dispatcher.on('end', function () {
            skipReq = 0;
            skippers = [];
            queue.shift();
            if (queue.length === 0) {
                queue = [];
                isPlaying = false;
            } else {
                playMusic(queue[0], message);
            }
        });
    });
}

function getID(str, cb) {
    if (isYoutube(str)) {
        cb(getYouTubeID(str));
    } else {
        search_vsideo(str, function(id) {
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
        if (!json.items[0]) callback("3_-a9nVZYjk");
        else {
            callback(jsonf.items[0].id.videoId);
        }
    });
}

function isYoutube(str) {
   return str.toLowerCase().indexOf("youtube.com") > -1;
}

client.login(process.env.BOT_TOKEN);
