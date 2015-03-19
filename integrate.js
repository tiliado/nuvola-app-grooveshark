/*
 * Copyright 2014 Jiří Janoušek <janousek.jiri@gmail.com>
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met: 
 * 
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer. 
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution. 
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/*
 * TODO: Love song action.
 * TODO: Rate song action.
 */
 
"use strict";

(function(Nuvola)
{

// Create media player component
var player = Nuvola.$object(Nuvola.MediaPlayer);

// Handy aliases
var PlaybackState = Nuvola.PlaybackState;
var PlayerAction = Nuvola.PlayerAction;

// Create new WebApp prototype
var WebApp = Nuvola.$WebApp();

// Initialization routines
WebApp._onInitWebWorker = function(emitter)
{
    Nuvola.WebApp._onInitWebWorker.call(this, emitter);
    
    var track = {
        title: null,
        artist: null,
        album: null,
        artLocation: null
    }
    player.setTrack(track);
    player.setPlaybackState(PlaybackState.UNKNOWN);
    player.setCanGoPrev( false);
    player.setCanGoNext( false);
    player.setCanPlay(false);
    player.setCanPause(false);
    
    var state = document.readyState;
    if (state === "interactive" || state === "complete")
        this._onPageReady();
    else
        document.addEventListener("DOMContentLoaded", this._onPageReady.bind(this));
}

// Page is ready for magic
WebApp._onPageReady = function()
{
    this.groovesharkRetro = location.hostname == "retro.grooveshark.com";
    // Connect handler for signal ActionActivated
    Nuvola.actions.connect("ActionActivated", this);

    // Start update routine
    this.timeout = setInterval(this._setCallback.bind(this), 100);
}

    
/* Set callback function for GrooveShark JS API */
WebApp._setCallback = function()
{
    try
    {
        window.Grooveshark.setSongStatusCallback(this.update.bind(this));
        clearInterval(this.timeout); // done!
        this.update();
    }
    catch (e)
    {
        // Grooveshark API is probably not finished yet
    }
}
    
// Extract data from the web page
WebApp.update = function(currentSong)
{
    if (!currentSong)
    {
        if (!this.groovesharkRetro)
	    setTimeout(this.update.bind(this), 250);
	
	try
        {
            currentSong = window.Grooveshark.getCurrentSongStatus();
        }
        catch(e)
        {
            console.log(e.message);
        }
    }
    
    if (!currentSong || !currentSong.song)
        return;
    
    var song = currentSong.song;
    var track = {
        title: song.songName || null,
        artist: song.artistName ||null,
        album: song.albumName || null,
        artLocation: song.artURL || null
    }
    player.setTrack(track);
    
    var elm;
    if (!this.groovesharkRetro)
    {
	elm = document.getElementById("play-pause");
	this.state = !elm ? PlaybackState.UNKNOWN : (
	    elm.className.indexOf("playing") >= 0 ? PlaybackState.PLAYING : PlaybackState.PAUSED);
    }
    else
    {
	var status = currentSong.status;
	if (status === "playing" || status === "buffering")
	    this.state = PlaybackState.PLAYING;
	else if (status === "paused" || song)
	    this.state = PlaybackState.PAUSED;
	else
	    this.state = PlaybackState.UNKNOWN;
    }
    player.setPlaybackState(this.state);
    
    
    elm = document.getElementById("play-prev");
    player.setCanGoPrev(elm ? elm.className.indexOf("disabled") < 0 : false);
    elm = document.getElementById("play-next");
    player.setCanGoNext(elm ? elm.className.indexOf("disabled") < 0 : false);
    player.setCanPlay(this.state === PlaybackState.PAUSED);
    player.setCanPause(this.state === PlaybackState.PLAYING);
}

// Handler of playback actions
WebApp._onActionActivated = function(emitter, name, param)
{
    switch (name)
    {
    case PlayerAction.TOGGLE_PLAY:
        if (this.state !== PlaybackState.PLAYING)
            window.Grooveshark.play();
        else
            window.Grooveshark.togglePlayPause();
        break;
    case PlayerAction.PLAY:
        window.Grooveshark.play();
        break;
    case PlayerAction.PAUSE:
    case PlayerAction.STOP:
        window.Grooveshark.pause();
        break;
    case PlayerAction.PREV_SONG:
        window.Grooveshark.previous();
        break;
    case PlayerAction.NEXT_SONG:
        window.Grooveshark.next();
        break;
    }
}

WebApp.start();

})(this);  // function(Nuvola)
