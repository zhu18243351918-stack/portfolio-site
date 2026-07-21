import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Music2, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import "./MusicPlayer.css";

const TRACK = {
  title: "We Don't Talk Anymore",
  artist: "Charlie Puth ft. Selena Gomez",
  source: "./audio/we-dont-talk-anymore.mp3",
  artwork: "./audio/nine-track-mind.jpg",
};

const PLAYER_ENABLED_KEY = "portfolio-music-enabled";
const PLAYER_COLLAPSED_KEY = "portfolio-music-collapsed";
const PLAYER_PROMPT_SEEN_KEY = "portfolio-music-prompt-seen";
let sharedAudio;

function readPreference(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value === "true";
  } catch {
    return fallback;
  }
}

function savePreference(key, value) {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // The player still works when storage is unavailable.
  }
}

function hasSeenPrompt() {
  try {
    return window.sessionStorage.getItem(PLAYER_PROMPT_SEEN_KEY) === "true";
  } catch {
    return false;
  }
}

function markPromptSeen() {
  try {
    window.sessionStorage.setItem(PLAYER_PROMPT_SEEN_KEY, "true");
  } catch {
    // The prompt can still be dismissed when session storage is unavailable.
  }
}

function getAudio() {
  if (!sharedAudio && typeof window !== "undefined") {
    sharedAudio = new Audio(TRACK.source);
    sharedAudio.preload = "auto";
    sharedAudio.loop = true;
    sharedAudio.volume = 0.32;
  }
  return sharedAudio;
}

function formatTime(value) {
  if (!Number.isFinite(value)) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function MusicPlayer() {
  const audio = useMemo(() => getAudio(), []);
  const [isCollapsed, setIsCollapsed] = useState(() => readPreference(PLAYER_COLLAPSED_KEY, false));
  const [isPromptVisible, setIsPromptVisible] = useState(() => !hasSeenPrompt());
  const [isPlaying, setIsPlaying] = useState(() => Boolean(audio && !audio.paused));
  const [isMuted, setIsMuted] = useState(() => Boolean(audio?.muted));
  const [currentTime, setCurrentTime] = useState(() => audio?.currentTime || 0);
  const [duration, setDuration] = useState(() => audio?.duration || 0);

  useEffect(() => {
    if (!audio) return undefined;

    const syncPlayback = () => setIsPlaying(!audio.paused);
    const syncTime = () => {
      setCurrentTime(audio.currentTime || 0);
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    };
    const syncVolume = () => setIsMuted(audio.muted || audio.volume === 0);

    audio.addEventListener("play", syncPlayback);
    audio.addEventListener("pause", syncPlayback);
    audio.addEventListener("timeupdate", syncTime);
    audio.addEventListener("durationchange", syncTime);
    audio.addEventListener("volumechange", syncVolume);
    syncPlayback();
    syncTime();
    syncVolume();

    return () => {
      audio.removeEventListener("play", syncPlayback);
      audio.removeEventListener("pause", syncPlayback);
      audio.removeEventListener("timeupdate", syncTime);
      audio.removeEventListener("durationchange", syncTime);
      audio.removeEventListener("volumechange", syncVolume);
    };
  }, [audio]);

  const dismissPrompt = () => {
    markPromptSeen();
    setIsPromptVisible(false);
  };

  const acceptMusic = () => {
    dismissPrompt();
    savePreference(PLAYER_ENABLED_KEY, true);
    audio?.play().catch(() => {});
  };

  const declineMusic = () => {
    dismissPrompt();
    savePreference(PLAYER_ENABLED_KEY, false);
    audio?.pause();
  };

  const togglePlayback = () => {
    if (!audio) return;
    dismissPrompt();
    if (audio.paused) {
      savePreference(PLAYER_ENABLED_KEY, true);
      audio.play().catch(() => {});
    } else {
      savePreference(PLAYER_ENABLED_KEY, false);
      audio.pause();
    }
  };

  const toggleMute = () => {
    if (!audio) return;
    audio.muted = !audio.muted;
  };

  const updateProgress = (event) => {
    if (!audio || !duration) return;
    audio.currentTime = Number(event.target.value);
    setCurrentTime(audio.currentTime);
  };

  const toggleCollapsed = () => {
    dismissPrompt();
    setIsCollapsed((current) => {
      const next = !current;
      savePreference(PLAYER_COLLAPSED_KEY, next);
      return next;
    });
  };

  const consentPrompt = isPromptVisible ? (
    <div className="music-consent" role="dialog" aria-label="背景音乐播放询问" aria-live="polite">
      <div className="music-consent__heading">
        <Music2 size={14} strokeWidth={1.8} />
        <p>欢迎浏览，是否愿意播放背景音乐？</p>
      </div>
      <p className="music-consent__track">Charlie Puth · We Don't Talk Anymore</p>
      <div className="music-consent__actions">
        <button className="cursor-target music-consent__accept" type="button" onClick={acceptMusic}>
          <Play size={12} fill="currentColor" />
          播放音乐
        </button>
        <button className="cursor-target music-consent__decline" type="button" onClick={declineMusic}>
          暂不播放
        </button>
      </div>
    </div>
  ) : null;

  if (isCollapsed) {
    return (
      <div className="music-player-anchor">
        <button
          className={`cursor-target music-player-trigger${isPlaying ? " is-playing" : ""}`}
          type="button"
          aria-label="展开音乐播放器"
          title="展开音乐播放器"
          onClick={toggleCollapsed}
        >
          <Music2 size={17} strokeWidth={1.8} />
          <span className="music-player-trigger__pulse" aria-hidden="true" />
        </button>
        {consentPrompt}
      </div>
    );
  }

  const progress = duration ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="music-player-anchor">
      <div className={`header-music-player${isPlaying ? " is-playing" : ""}`} aria-label={`${TRACK.title} 音乐播放器`}>
        <button
        className="cursor-target music-player__cover"
        type="button"
        aria-label={isPlaying ? "暂停音乐" : "播放音乐"}
        title={isPlaying ? "暂停" : "播放"}
        onClick={togglePlayback}
      >
        <img src={TRACK.artwork} alt="Nine Track Mind album cover" />
        <span className="music-player__cover-state" aria-hidden="true">
          {isPlaying ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
        </span>
        </button>

        <div className="music-player__body">
        <div className="music-player__copy">
          <span className="music-player__title">{TRACK.title}</span>
          <span className="music-player__artist">{TRACK.artist}</span>
        </div>
        <div className="music-player__timeline">
          <input
            aria-label="音乐播放进度"
            className="cursor-target music-player__range"
            type="range"
            min="0"
            max={duration || 30}
            step="0.1"
            value={Math.min(currentTime, duration || 30)}
            onChange={updateProgress}
            style={{ "--music-progress": `${progress}%` }}
          />
          <span>{formatTime(currentTime)}</span>
        </div>
        </div>

        <div className="music-player__controls">
        <button
          className="cursor-target music-player__icon-button"
          type="button"
          aria-label={isMuted ? "开启声音" : "静音"}
          title={isMuted ? "开启声音" : "静音"}
          onClick={toggleMute}
        >
          {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>
        <button
          className="cursor-target music-player__icon-button music-player__collapse"
          type="button"
          aria-label="隐藏音乐播放器"
          title="隐藏播放器"
          onClick={toggleCollapsed}
        >
          <ChevronRight size={16} />
        </button>
        </div>
        <button
        className="cursor-target music-player__mobile-collapse"
        type="button"
        aria-label="隐藏音乐播放器"
        title="隐藏播放器"
        onClick={toggleCollapsed}
      >
        <X size={10} strokeWidth={2.2} />
        </button>
      </div>
      {consentPrompt}
    </div>
  );
}
