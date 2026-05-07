export class AudioManager {
  private musicVolume = 100;
  private sfxVolume = 100;

  setMusicVolume(vol: number) { this.musicVolume = vol; }
  setSfxVolume(vol: number) { this.sfxVolume = vol; }
  getMusicVolume() { return this.musicVolume; }
  getSfxVolume() { return this.sfxVolume; }

  playMusic(key: string) { /* stub - audio files added later */ }
  stopMusic() { /* stub */ }
  playSfx(key: string) { /* stub */ }
}
