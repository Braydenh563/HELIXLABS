/*
 * BackgroundAmbienceManager class - Manages ambient soundtrack playback
 * for the simulation, including shuffle ordering, crossfade transitions
 * between tracks, volume control, and mute toggling.
 *
 * Music tracks are each stored and registered externally via the addTrack()
 * function, and then played back in a random shuffled order. When a track is
 * about to finish, a crossfade automatically begins so the next track fades
 * in before the current one finishes.
 *
 * Name: Brayden Hoyle | Student Number: n11967340
 */

class BackgroundAmbienceManager {
  constructor() {
    this.soundtracks = [];
    this.shuffledOrder = [];
    this.shuffleOrderIndex = 0;
    this.currentTrack = null;
    this.isMuted = false;
    this.targetVolume = 1; // 0-1 range
    this.fadeDuration = 5; // Seconds
    this.isStarted = false;
    this.isCrossfading = false;
    this.checkInterval = 20; // Number of frames between eahc update chack
    this.checkTimer = 0;
  }

  // Register and store the sound file
  addTrack(soundFile) {
    this.soundtracks.push(soundFile);
  }

  /* This function generates a new play order for all the registered tracks by assigning each index a random value and sorting by it. shuffleOrderIndex is reset to 0 so the next cycle begins from at the start of the new order.
   */
  shuffleOrder() {
    let indexed = [
      { index: 0, rng: random() },
      { index: 1, rng: random() },
      { index: 2, rng: random() },
    ];

    indexed.sort((a, b) => a.rng - b.rng);
    this.shuffledOrder = indexed.map((entry) => entry.index);
    this.shuffleOrderIndex = 0;
  }

  /* Initialises playback by shuffling the track order and starting the first track. Does nothing if no tracks are registered or if playback has already been started.
   */
  start() {
    if (this.soundtracks.length === 0 || this.isStarted) {
      return;
    }

    this.shuffleOrder();
    this.isStarted = true;
    this.playNextTrack();
  }

  /* Begins playinmg the next track in the shuffled order, fading in from silence across the length of fadeDuration seconds. If every song has been played in the current shyffle cycle, a new shuffle order is then generated for a new cycle to begin.
   */
  playNextTrack() {
    if (this.soundtracks.length === 0) {
      return;
    }

    // Once the full list has played, reshuffle for a new random cycle
    if (this.shuffleOrderIndex >= this.shuffledOrder.length) {
      this.shuffleOrder();
    }

    let trackIndex = this.shuffledOrder[this.shuffleOrderIndex++];
    let track = this.soundtracks[trackIndex];

    this.currentTrack = track;
    this.isCrossfading = false;

    console.log("New Track Beginning: " + this.currentTrack);

    // Begin at 0 volume then raise to meet targetVolume across the fadeDuration
    track.setVolume(0);
    track.play();
    track.setVolume(this.isMuted ? 0 : this.targetVolume, this.fadeDuration);
  }

  /* This function is called every frame to manage the transitions between each track. It uses the checkInterval property to decrease the amount of checks made on the audio state. When the current track is about to finish and has fadeDuration seconds remaining, it triggers a crossfade, fading out the current track while simultaneously fading in the next one in the generated shuffle order for that cycle.
   */
  update() {
    if (
      !this.isStarted ||
      this.soundtracks.length === 0 ||
      !this.currentTrack
    ) {
      return;
    }

    this.checkTimer++;
    if (this.checkTimer < this.checkInterval) {
      return;
    }

    this.checkTimer = 0;

    let track = this.currentTrack;

    // Move to next soundtrack once the current one ends
    if (!track.isPlaying()) {
      this.playNextTrack();
      return;
    }

    // When there is the equivalent of fadeDuration seconds left in the current soundtrack, fade out the current track and simultaneously. When it begins fading the new track in, it uses asmall 0.5 second buffer
    let timeRemaining = track.duration() - track.currentTime();
    if (
      !this.isCrossfading &&
      timeRemaining > 0 &&
      timeRemaining <= this.fadeDuration + 0.5
    ) {
      this.isCrossfading = true;
      track.setVolume(0, timeRemaining); // Lower current track volume
      this.playNextTrack(); // At the same time, raise the next track volume
    }
  }

  /* This function handles toggling mute on and off. If a music/sound track is currently playing, its volume is adjusted over the course of 0.6 seconds to avoid an instant and jarring cut. It returns  the new isMuted state as a boolean flag.
   */
  toggleMute() {
    this.isMuted = !this.isMuted;

    if (this.currentTrack && this.currentTrack.isPlaying()) {
      this.currentTrack.setVolume(this.isMuted ? 0 : this.targetVolume, 0.6); // Use a 0.6 second smoother volume fade when muting and unmuting
    }

    return this.isMuted;
  }
}
