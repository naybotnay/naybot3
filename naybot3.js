
const ytdl = require("ytdl-core");
const request = require("request");

/**
 * The main module file and starting point for any bot.
 * @class DiscordMusic
 * 
 * @author mateusz_czernal
 * @version 1.1
 */
exports.DiscordMusic = class {
    /**
     * Represents a Discord Music Bot.
     * @constructor
     */
    constructor(bot) {
        this._bot = bot;
        this._settings;
        this._globalQueue = new Array();
        this._errors = 0;
        this._voiceHandler;
        this._voiceConnection;
        this._total = 0;
        this._stopped = false;
        this._notification = { nextSong: true, currentSong: true };
        
        this.bot.on('message', (message) => {
            if(message.channel.type === "text" && message.channel.id === this.settings.channels.text_channel_id) { //Message received on desired text channel        
                
                if(message.author == bot.user) return;

                this.commandHandler(message).then(res => {
                    message.reply(res);
                    console.log(res);
                }).catch(err => {
                    message.reply(err);                
                    console.log(err);
                });
            }
        });

    }

    set settings(settingsObj) {
        this._settings = settingsObj;
    }

    set server(server) {
        this._server = server;
    }

    get bot() {
        /**
         * Represents a bot client.
         * @readonly
         */
        return this._bot;
    }

    get server() {
        /**
         * Represents a server you're connected to
         * @readonly
         */
        return this._server;
    }

    get settings() {
        /**
         * Represents a bot settings.
         * Holds JavaScript settings and other information for Drupal.
         */
        return this._settings;
    }

    /**
     * Setting up Music Bot
     * @param  {} settings
     * @readonly
     */
    setup(settings) {

        this.settings = settings; // Saving to the local storage

        /**
         * * Logs the client in, establishing a websocket connection to Discord.
         * @param {string} token Token of the account to log in with
         */

        this.bot.login(this.settings.token_key).then((promise) => {

            this.connect().then((response) => {

                console.log(response);
                this.voiceChannel.join().then(connection => {
                    this.voiceConnection = connection;
                    console.log(`${this.bot.user.username} just connected to the ${this.voiceChannel.type} channel(#${this.voiceChannel.id}).`);
                }).catch("CONSOLE" + console.error);

            }).catch((error) => {
                
                // Server/Channel connection error
                console.log(error);

            });

        }).catch(error => {

            // Login error
            console.log(error);

        });

    }

    /**
     * Checks whether connection is established
     * @readonly
     */
    get isConnected() {
      return this.server && this.voiceConnection;
    }

    /**
     * Establishing the connection, 
     * connecting to the server channels.
     */
    connect() {

        let promise = new Promise((resolve, reject) => {
            this.server = this.bot.guilds.find(gid => gid.id === this.settings.server_id);
            if (!this.server) reject(`Error: Couldn't find server with the following ID(#${this.settings.server_id}).`);

            this.voiceChannel = this.server.channels.find(chn => chn.id === this.settings.channels.voice_channel_id && chn.type === "voice");
            if (!this.voiceChannel) reject(`Couldn't find voice channel '${this.settings.channels.voice_channel_id}'.`);

            this.textChannel = this.server.channels.find(chn => chn.id === this.settings.channels.text_channel_id && chn.type === "text");
            if (!this.textChannel) reject(`Couldn't find voice channel '${this.settings.channels.text_channel_id}'.`);

            this.bot.user.setPresence({
                activity: {
                    name: "good music!",
                    type: 0
                }
            });

            // Yay! Everything went well!
            this.textChannel.send('Look like everything works! Add some music to your discord server!');
            resolve(`Connected to the server ${this.server.name} as ${this.bot.user.username}.`); 
            
        });

        return promise;

    }

    get bot() {
        return this._bot;
    }

    set total(count = 0) {
        this._total += count;
    }

    get total() {
        return this._total;
    }

    get song() {
        return this._song;
    }

    get apiKey() {
        return this.settings.yt_api_key;
    }

    set voiceChannel(voiceChannel) {
        this._voiceChannel = voiceChannel;
    }

    get voiceChannel() {
        return this._voiceChannel;
    }

    set textChannel(textChannel) {
        this._textChannel = textChannel;
    }

    get textChannel() {
        return this._textChannel;
    }

    set voiceConnection(voiceConnection) {
        this._voiceConnection = voiceConnection;
    }

    get voiceConnection() {
        return this._voiceConnection;
    }

    get errors() {
        return this._errors;
    }

    joinVoiceChannel() {

        this.voiceChannel.join().then(connection => {
            this.voiceConnection = connection;
            console.log(`${this.bot.user.username} just connected to the ${this.voiceChannel.type} channel(#${this.voiceChannel.id}).`);
        }).catch("CONSOLE" + console.error);

    }

    videoType(video) {
        var regExp = '^(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?.*?(?:v|list)=(.*?)(?:&|$)|^(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?(?:(?!=).)*\/(.*)$';
        var match = video.match(regExp);
        if (match && match[1]) {
            return({type: "playlist", id: match[1]});            
        }
        return({type: "song", id: match[2]});
    }

    fetchElement(element, author = "") {

        var video = this.videoType(element);

        if (video.type === "playlist") {
            this.addPlaylist(video.id, author, video.pageToken);
            return;
        }

        this.addSong(video.id, author).then(function(result) {
            console.log(result);
        }, function(err) {
            console.log(err);
        }); 

    }
    
    listing(author = "", ...songs) {
      var self = this;
      songs.map(function(element) {
        self.fetchElement(element, author);
      });
    }

    set queue(queue) {
        this._globalQueue.push(queue);
    }

    get queue() {
        return this._globalQueue;
    }

    addPlaylist(id, author, pageToken = '') {
        request("https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=" + id + "&key=" + this.apiKey + "&pageToken=" + pageToken, (error, response, body) => {
            var json = JSON.parse(body);
            console.log("https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=" + id + "&key=" + this.apiKey + "&pageToken=" + pageToken);
            this.total = json != null ? (json.pageInfo != null ? json.pageInfo.totalResults : 0)  : 0;

            if ("error" in json) {
                console.log(json.error.errors[0]);
            } else if (json.items.length === 0) {
                console.log("Playlist is empty.");
            } else {

                json.items.forEach((v) => {
                    this.addSong(v.snippet.resourceId.videoId, author).then(function(result) {
                        console.log(result + "");
                    }, function(err) {
                        console.log(err);
                    });
                });


                if (json.nextPageToken == null) {
                    return;
                }
                this.addPlaylist(id, author, json.nextPageToken)
            }
        });


    }

    set stopped(value){
      this._stopped = value;
    }
    get stopped() {
        return this._stopped;
    }

    get isQueueEmpty() {
        return this._globalQueue.length == 0;
    }

    skip() {
        if (this.queue.length >= 1) {
            console.log(`Skipping the song... Next up is ${this.queue[1]['title']}.`);
            this.play();
        } else {
            this.textChannel.send("That was the last song in queue.");
            this.voiceHandler = null;
        }
    }

    get isPlaying() {
        return this.voiceConnection.speaking;
    }

    pause() {
        console.log(`Paused song ${this.queue[0]['title']}.`);
        this.dispatcher.pause();
    }

    resume() {
        console.log(`Resumed song ${this.queue[0]['title']}.`);
        this.dispatcher.resume();

    }

    get dispatcher() {
        return this.voiceConnection.dispatcher;
    }

    play() {

        var video = {
            id: this.queue[0]['id'],
            title: this.queue[0]['title'],
            added_by: this.queue[0]['added_by']
        }

        this.bot.user.setPresence({
            activity: {
                name: video.title,
                type: 0
            }
        });

        let stream = ytdl("https://www.youtube.com/watch?v=" + video.id);
        const streamOptions = {
            seek: 0,
            volume: 1,
            bitrate: 48000,
            passes: 2
        };

        this.voiceHandler = this.voiceConnection.playStream(stream, streamOptions);
        console.log(`Now Playing: ${video.title} (Added by ${video.added_by.username}).`);
        
        if (this.notification.currentSong) {
            this.textChannel.send(`Now Playing: ${video.title} - Added by ${video.added_by}.`); 
        }

        
        if (this.notification.nextSong) {
            if(this.queue.length >= 2) {
                this.textChannel.send(`Next up in queue: ${this.queue[1]['title']} - Added by ${this.queue[1]['added_by']}.`); 
            }
        }
            

        this.voiceHandler.on('end', reason => {
          if(!reason) return;
          
          console.log(`Stream has ended: ${reason}`);
          this.voiceHandler = null;

          if(this.isQueueEmpty) {
              console.log('Looks like there is nothing to play next.');
              this.textChannel.send('Looks like there is nothing to play next.');

              return;
          }

          this.play();

        });

        this.queue.splice(0, 1);

    }

    videoData(video) {
        var data;

        ytdl.getInfo("https://www.youtu.be/watch?v=" + this.videoType(video).id).then(info => {
            if (error || info == null) return({ status: 'error', data: `Error occured - ${this.errors}`});

            data = ({
                title: info["title"],
                nextPageToken: info["nextPageToken"],
                id: 0
            });
        });
        return({ status: 'success', data: data });                    
    }

    addSong(id, added_by = "") {

        const promise = new Promise((resolve, reject) => {
            ytdl.getInfo("https://www.youtu.be/watch?v=" + id).then(info => {
                this.queue = ({
                    title: info["title"],
                    id: id,
                    added_by: added_by
                });
                
                if (this.voiceHandler == null && this.voiceConnection != null && !this.stopped && !this.speaking) {
                    this.play();
                }

                resolve(`#${id} - ${info.title} - [Success]`);
                
            }).catch(error => {
                this._errors++;
                reject(`#${id} - ${error} - [Skip] (${this.errors}).`);
          });

        
        });

        return promise;

    }

    get notification() {
        return this._notification;
    }

    set notification(options) {
        this._notification = options;
    }

    commandHandler(message) {

        const promise = new Promise((resolve, reject) => {
        var list = message.content.split(" ");
        var [command, args] = list;
        command = command.substring(1);

        let commands = [
            {
                cmd: "songrequest",
                params: ["YouTube Video URL"],
                default: function() {

                },
                usage: "!songrequest <youtube url>"

            },

            {
                cmd: "skip",
                params: ["YouTube Video URL"],
                default: function() {
                    this.skip();
                },
                usage: "!songrequest <youtube url>"

            },

            {
                cmd: "clear",
                params: ["YouTube Video URL"],
                default: function() {


                },
                usage: "!songrequest <youtube url>"

            },

            {
                cmd: "pause",
                params: ["YouTube Video URL"],
                default: function() {
            
                },
                usage: "!songrequest <youtube url>"

            },


            {
                cmd: "start",
                params: ["YouTube Video URL"],
                default: function() {
     

                },
                usage: "!songrequest <youtube url>"

            }


        ];
        
        var commandObject = commands.find(cmd => cmd.cmd === command);
        if(!commandObject) {
            reject(new Error('error'));
        } else {
            commandObject.default();  
            
            if(args) {
                this.listing(message.author, args);    
                resolve(`${message.author.username} have added a new song to songrequest.`);  
            } else {
                //message.reply(`Use ${commandObject.usage}.`);
                resolve(`Use ${commandObject.usage}.`);
                
            }
        }
        
    });

    return promise;
}



}






 

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
        client.user.setGame(args , 'https://twitch.tv/brokenklash');
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
