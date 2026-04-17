import React, { useState, useEffect, useRef } from 'react';

const AUDIO = {
  1: { src: '/audio/01_morning_brief.mp3', duration: 15300 },
  3: { src: '/audio/02_draft_ready.mp3',   duration: 4600 },
  5: { src: '/audio/03_handled.mp3',       duration: 6400 }
};

export default function EricAssistantDemo() {
  const [started, setStarted] = useState(false);
  const [currentScene, setCurrentScene] = useState(0);
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [showVoiceOption, setShowVoiceOption] = useState(false);
  const [showApproval, setShowApproval] = useState(false);
  const [approved, setApproved] = useState(false);
  const [recording, setRecording] = useState(false);
  const [muted, setMuted] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const messagesEndRef = useRef(null);
  const audioRefs = useRef({});

  useEffect(() => {
    const checkDevice = () => {
      setIsDesktop(window.innerWidth > 640);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);

    // Preload all audio
    Object.entries(AUDIO).forEach(([key, val]) => {
      const audio = new Audio(val.src);
      audio.preload = 'auto';
      audioRefs.current[key] = audio;
    });

    // Prevent pull-to-refresh & overscroll
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overscrollBehavior = 'none';

    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const scenes = [
    { chapter: '01', title: 'Overnight',     subtitle: 'The assistant works while you sleep', time: '3:47' },
    { chapter: '02', title: 'Morning Brief', subtitle: 'One message. Everything you need.',   time: '5:00' },
    { chapter: '03', title: 'You Respond',   subtitle: 'A voice memo. Nothing else.',         time: '5:02' },
    { chapter: '04', title: 'Draft Ready',   subtitle: 'Written in your voice.',              time: '5:02' },
    { chapter: '05', title: 'Approved',      subtitle: 'One tap.',                            time: '5:03' },
    { chapter: '06', title: 'Handled',       subtitle: 'Sent. Logged. Scheduled.',            time: '5:03' }
  ];

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  useEffect(() => { scrollToBottom(); }, [messages, typing, showApproval]);

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const playAudio = (sceneKey) => {
    if (muted) return;
    const audio = audioRefs.current[sceneKey];
    if (!audio) return;
    try {
      audio.currentTime = 0;
      const promise = audio.play();
      if (promise) {
        setAudioPlaying(true);
        audio.onended = () => setAudioPlaying(false);
        audio.onpause = () => setAudioPlaying(false);
        promise.catch(() => setAudioPlaying(false));
      }
    } catch (e) {
      setAudioPlaying(false);
    }
  };

  const stopAllAudio = () => {
    Object.values(audioRefs.current).forEach(a => {
      a.pause();
      a.currentTime = 0;
    });
    setAudioPlaying(false);
  };

  const toggleMute = () => {
    if (!muted) stopAllAudio();
    setMuted(!muted);
  };

  const reset = () => {
    stopAllAudio();
    setCurrentScene(0);
    setMessages([]);
    setTyping(false);
    setShowVoiceOption(false);
    setShowApproval(false);
    setApproved(false);
    setRecording(false);
  };

  const playScene = async (idx) => {
    if (idx === 1) {
      // Play audio FIRST so voice leads the visual
      playAudio(1);
      setTyping(true);
      await sleep(1200);
      setTyping(false);
      setMessages([{
        from: 'assistant',
        time: '5:00',
        type: 'brief',
        greeting: 'Good morning, Eric.',
        content: 'While you were sleeping...',
        body: 'Overnight summary',
        items: [
          { label: '3 new doctor leads', meta: 'qualified' },
          { label: '2 drafts ready to send', meta: 'for review' },
          { label: 'Callback: Dr. Patel, Riverside', meta: 'priority' }
        ],
        footer: 'Voice memo whenever you\u2019re ready.'
      }]);
      // Wait for voice to finish before showing voice button
      await sleep(AUDIO[1].duration - 1200 + 800);
      setShowVoiceOption(true);
    }
    if (idx === 2) {
      setShowVoiceOption(false);
      setRecording(true);
      await sleep(1400);
      setRecording(false);
      await sleep(200);
      setMessages(prev => [...prev, {
        from: 'eric',
        time: '5:02',
        type: 'voice',
        duration: '0:12',
        transcript: 'Reply to Patel \u2014 confirm we onboard this week, quote the metabolic stack around four thousand, set a call Thursday morning.'
      }]);
    }
    if (idx === 3) {
      setTyping(true);
      await sleep(1400);
      setTyping(false);
      playAudio(3);
      setMessages(prev => [...prev, {
        from: 'assistant',
        time: '5:02',
        type: 'draft',
        label: 'Draft \u00b7 Dr. Patel',
        draft: 'Dr. Patel \u2014 great connecting yesterday. We can get you onboarded this week. Metabolic stack quote coming over shortly; starting order runs around $4K. Let\u2019s grab a quick call Thursday morning \u2014 I\u2019ll send a time. \u2014 Eric'
      }]);
      await sleep(AUDIO[3].duration + 400);
      setShowApproval(true);
    }
    if (idx === 4) {
      setApproved(true);
      setShowApproval(false);
      await sleep(700);
      setMessages(prev => [...prev, {
        from: 'eric',
        time: '5:03',
        type: 'tap',
        content: 'Approved'
      }]);
    }
    if (idx === 5) {
      setTyping(true);
      await sleep(1000);
      setTyping(false);
      playAudio(5);
      setMessages(prev => [...prev, {
        from: 'assistant',
        time: '5:03',
        type: 'confirm',
        steps: [
          'Message sent to Dr. Patel',
          'Contact logged',
          'Thursday 9:00 AM call on your calendar',
          'Quote queued for send'
        ]
      }]);
      // Wait for all the staggered checkmarks to finish animating (~1.5s) + audio tail
      await sleep(Math.max(AUDIO[5].duration, 2500));
      setTyping(false); // belt and suspenders — make sure dots are gone
    }
  };

  const advance = () => {
    const next = currentScene + 1;
    if (next <= 5) {
      setCurrentScene(next);
      playScene(next);
    }
  };

  const handleStart = () => {
    setStarted(true);
    setCurrentScene(1);
    playScene(1);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=JetBrains+Mono:wght@400;500;600&family=Instrument+Sans:wght@400;500;600&display=swap');

        :root {
          --ink: #0c0c0c;
          --ink-deep: #000000;
          --ink-2: #1c1c1e;
          --bone: #F4EFE6;
          --bone-dim: #A8A294;
          --teal: #e15bc3;
          --teal-dim: #f38161;
          --amber: #f38161;
          --line: rgba(244, 239, 230, 0.08);
          --line-2: rgba(244, 239, 230, 0.14);
          --safe-top: env(safe-area-inset-top, 0px);
          --safe-bottom: env(safe-area-inset-bottom, 0px);
        }

        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

        html, body, #root {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          background: #000;
          color: var(--bone);
          font-family: 'Inter', system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
          overflow: hidden;
          position: fixed;
          overscroll-behavior: none;
          touch-action: manipulation;
        }

        #root {
          position: relative;
          overflow: hidden;
        }

        .serif { font-family: 'Fraunces', Georgia, serif; font-optical-sizing: auto; }
        .mono { font-family: 'JetBrains Mono', monospace; }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes breathe { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } }
        @keyframes orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse-dot { 0%, 60%, 100% { opacity: 0.25; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-3px); } }
        @keyframes wave { 0%, 100% { transform: scaleY(0.3); } 50% { transform: scaleY(1); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes tick { from { opacity: 0; transform: scale(0.6); } to { opacity: 1; transform: scale(1); } }
        @keyframes speaker-pulse { 0%, 100% { transform: scaleY(0.4); } 50% { transform: scaleY(1); } }
        @keyframes intro-fade {
          0% { opacity: 0; transform: scale(0.98); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes sheen {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes starfield {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }

        .msg-enter { animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .fade-in { animation: fadeIn 0.7s ease both; }
        .intro-enter { animation: intro-fade 1s cubic-bezier(0.16, 1, 0.3, 1) both; }

        .grain {
          position: fixed; inset: 0; pointer-events: none;
          opacity: 0.04; mix-blend-mode: overlay; z-index: 20;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        .app-bg {
          position: fixed; inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 50% 0%, rgba(225,91,195,0.18) 0%, transparent 70%),
            radial-gradient(ellipse 100% 80% at 50% 100%, rgba(243,129,97,0.1) 0%, transparent 70%),
            linear-gradient(180deg, var(--ink) 0%, var(--ink-deep) 100%);
        }

        .wave-bar { width: 3px; background: var(--teal); border-radius: 2px; transform-origin: center; animation: wave 0.9s ease-in-out infinite; }
        .typing-dot { width: 7px; height: 7px; background: var(--teal); border-radius: 50%; animation: pulse-dot 1.4s ease-in-out infinite; }
        .speaker-bar { width: 2.5px; background: var(--teal); border-radius: 1px; transform-origin: center; animation: speaker-pulse 0.8s ease-in-out infinite; }
        .checkmark-enter { animation: tick 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        .chapter-num { font-feature-settings: 'tnum'; }

        .chat-scroll::-webkit-scrollbar { width: 0; }
        .chat-scroll { scrollbar-width: none; -webkit-overflow-scrolling: touch; }

        .btn-primary {
          background: var(--teal); color: var(--ink);
          font-family: 'Instrument Sans', sans-serif;
          font-weight: 600; letter-spacing: 0.02em;
          border: none; cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          -webkit-appearance: none;
        }
        .btn-primary:active { transform: scale(0.97); background: #e974ca; }

        .btn-ghost {
          background: rgba(244,239,230,0.04);
          color: var(--bone);
          border: 1px solid var(--line-2);
          font-family: 'Instrument Sans', sans-serif;
          font-weight: 500; cursor: pointer;
          transition: all 0.2s;
          -webkit-appearance: none;
        }
        .btn-ghost:active { background: var(--line); }

        .header-bg {
          background: rgba(11, 18, 32, 0.85);
          backdrop-filter: saturate(180%) blur(24px);
          -webkit-backdrop-filter: saturate(180%) blur(24px);
        }

        .star {
          position: absolute;
          width: 2px;
          height: 2px;
          background: var(--bone);
          border-radius: 50%;
          animation: starfield 3s ease-in-out infinite;
        }

        .intro-headline {
          background: linear-gradient(90deg, var(--bone) 0%, var(--bone) 40%, var(--teal) 50%, var(--bone) 60%, var(--bone) 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: sheen 4s ease-in-out infinite;
        }

        .selection-none { user-select: none; -webkit-user-select: none; }
      `}</style>

      {/* Desktop fallback */}
      {isDesktop && <DesktopView />}

      {/* Mobile / app view */}
      {!isDesktop && (
        <>
          <div className="app-bg"></div>
          <div className="grain"></div>

          {!started && <IntroScreen onStart={handleStart} />}

          {started && (
            <AppView
              scenes={scenes}
              currentScene={currentScene}
              messages={messages}
              typing={typing}
              recording={recording}
              showVoiceOption={showVoiceOption}
              showApproval={showApproval}
              approved={approved}
              audioPlaying={audioPlaying}
              muted={muted}
              advance={advance}
              reset={reset}
              toggleMute={toggleMute}
              messagesEndRef={messagesEndRef}
            />
          )}
        </>
      )}
    </>
  );
}

// ==========================================
// DESKTOP FALLBACK
// ==========================================
function DesktopView() {
  return (
    <>
      <div className="app-bg"></div>
      <div className="grain"></div>
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        zIndex: 10
      }}>
        <div style={{
          maxWidth: '480px',
          textAlign: 'center',
          padding: '40px',
          borderRadius: '24px',
          background: 'rgba(244,239,230,0.03)',
          border: '1px solid rgba(244,239,230,0.1)'
        }} className="intro-enter">
          <div className="mono" style={{
            fontSize: '12px',
            letterSpacing: '0.3em',
            color: '#e15bc3',
            marginBottom: '24px'
          }}>
            MAMMOTH <span style={{ opacity: 0.5 }}>×</span> PEPLOGIX
          </div>

          {/* Phone icon */}
          <div style={{
            margin: '0 auto 32px',
            width: '80px',
            height: '120px',
            borderRadius: '16px',
            border: '2px solid #A8A294',
            position: 'relative',
            opacity: 0.6
          }}>
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '24px',
              height: '4px',
              background: '#A8A294',
              borderRadius: '2px'
            }}></div>
            <div style={{
              position: 'absolute',
              inset: '20px 12px 20px 12px',
              borderRadius: '4px',
              background: 'rgba(225,91,195,0.15)',
              border: '1px solid rgba(225,91,195,0.4)'
            }}></div>
          </div>

          <h1 className="serif" style={{
            fontSize: '36px',
            fontWeight: 400,
            color: '#F4EFE6',
            margin: '0 0 12px',
            lineHeight: 1.1,
            letterSpacing: '-0.02em'
          }}>
            Open on <em style={{ fontStyle: 'italic', color: '#e15bc3' }}>your phone</em>.
          </h1>

          <p style={{
            fontSize: '17px',
            lineHeight: 1.6,
            color: '#A8A294',
            margin: '0 0 32px'
          }}>
            This is designed to be experienced on mobile — the way Eric will actually use it.
          </p>

          <div style={{
            padding: '20px',
            borderRadius: '12px',
            background: 'rgba(11,18,32,0.6)',
            border: '1px solid rgba(244,239,230,0.08)',
            textAlign: 'left'
          }}>
            <div className="mono" style={{
              fontSize: '12px',
              letterSpacing: '0.2em',
              color: '#e15bc3',
              marginBottom: '12px'
            }}>
              HOW TO VIEW
            </div>
            <ol style={{
              margin: 0,
              paddingLeft: '20px',
              color: '#F4EFE6',
              fontSize: '16px',
              lineHeight: 1.8
            }}>
              <li>Share this URL to your phone (text, WhatsApp, or AirDrop)</li>
              <li>Open it in Safari or Chrome on mobile</li>
              <li>Tap <span className="mono" style={{ color: '#e15bc3' }}>Share → Add to Home Screen</span> for the full app experience</li>
            </ol>
          </div>

          <div className="mono" style={{
            marginTop: '32px',
            fontSize: '11px',
            letterSpacing: '0.3em',
            color: '#A8A294',
            opacity: 0.5
          }}>
            INTERNAL PREVIEW
          </div>
        </div>
      </div>
    </>
  );
}

// ==========================================
// INTRO SCREEN
// ==========================================
function IntroScreen({ onStart }) {
  const [stars] = useState(() =>
    Array.from({ length: 30 }, () => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      size: Math.random() * 1.5 + 0.5
    }))
  );

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      paddingTop: 'calc(48px + var(--safe-top))',
      paddingBottom: 'calc(40px + var(--safe-bottom))',
      paddingLeft: '28px',
      paddingRight: '28px',
      zIndex: 10
    }} className="intro-enter">

      {/* Stars */}
      {stars.map((s, i) => (
        <div key={i} className="star" style={{
          top: `${s.top}%`,
          left: `${s.left}%`,
          width: `${s.size}px`,
          height: `${s.size}px`,
          animationDelay: `${s.delay}s`
        }}></div>
      ))}

      {/* Top */}
      <div className="selection-none">
        <div className="mono" style={{
          fontSize: '12px',
          letterSpacing: '0.3em',
          color: '#A8A294',
          textTransform: 'uppercase'
        }}>
          Mammoth <span style={{ color: '#e15bc3', margin: '0 6px' }}>×</span> Peplogix
        </div>
      </div>

      {/* Middle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="mono" style={{
          fontSize: '13px',
          letterSpacing: '0.15em',
          color: '#e15bc3'
        }}>
          ——— CHAPTER 001
        </div>

        <h1 className="serif intro-headline" style={{
          fontSize: 'clamp(48px, 12vw, 72px)',
          fontWeight: 300,
          lineHeight: 1,
          letterSpacing: '-0.03em',
          margin: 0
        }}>
          A morning,<br/>
          <em style={{ fontStyle: 'italic' }}>without<br/>the noise.</em>
        </h1>

        <p style={{
          fontSize: '18px',
          lineHeight: 1.6,
          color: '#A8A294',
          margin: '8px 0 0',
          maxWidth: '320px'
        }}>
          A preview of what your day could look like when everything routes through one place.
        </p>
      </div>

      {/* Bottom */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <button
          onClick={onStart}
          className="btn-primary"
          style={{
            width: '100%',
            padding: '20px',
            borderRadius: '100px',
            fontSize: '17px',
            letterSpacing: '0.02em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          Begin the morning
          <span style={{ fontSize: '18px' }}>→</span>
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="#A8A294" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15.54 8.46A5 5 0 0115.54 15.54" stroke="#A8A294" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="mono" style={{
            fontSize: '12px',
            letterSpacing: '0.15em',
            color: '#A8A294',
            textTransform: 'uppercase'
          }}>
            Best with sound on
          </span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// APP VIEW
// ==========================================
function AppView({
  scenes, currentScene, messages, typing, recording,
  showVoiceOption, showApproval, approved, audioPlaying, muted,
  advance, reset, toggleMute, messagesEndRef
}) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 10
    }}>

      {/* Status bar simulacrum (for iPhone-y feel) */}
      <div style={{
        height: 'var(--safe-top)',
        background: 'transparent',
        flexShrink: 0
      }}></div>

      {/* Top bar — time + chapter + mute */}
      <div className="header-bg" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px 12px',
        borderBottom: '1px solid rgba(244,239,230,0.06)',
        flexShrink: 0,
        position: 'relative',
        zIndex: 5
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #e15bc3 0%, #f38161 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 14px -2px rgba(225,91,195,0.5)'
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="#0c0c0c" />
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="serif" style={{
              fontSize: '17px',
              fontWeight: 500,
              color: '#F4EFE6',
              letterSpacing: '-0.01em',
              lineHeight: 1.1
            }}>
              Assistant
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
              {audioPlaying ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5px', height: '7px' }}>
                    <div className="speaker-bar" style={{ animationDelay: '0s', height: '7px' }}></div>
                    <div className="speaker-bar" style={{ animationDelay: '0.15s', height: '7px' }}></div>
                    <div className="speaker-bar" style={{ animationDelay: '0.3s', height: '7px' }}></div>
                  </div>
                  <span className="mono" style={{ fontSize: '11px', color: '#e15bc3', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                    Speaking
                  </span>
                </>
              ) : (
                <>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#e15bc3', animation: 'breathe 2s ease-in-out infinite' }}></div>
                  <span className="mono" style={{ fontSize: '11px', color: '#A8A294', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    Always on
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={toggleMute}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: '1px solid rgba(244,239,230,0.1)',
            background: 'rgba(244,239,230,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#F4EFE6',
            flexShrink: 0
          }}
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15.54 8.46A5 5 0 0115.54 15.54" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </div>

      {/* Chapter indicator (sub-bar) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 20px',
        background: 'rgba(7, 16, 28, 0.6)',
        borderBottom: '1px solid rgba(244,239,230,0.04)',
        flexShrink: 0
      }}>
        <div className="mono fade-in" key={currentScene} style={{
          fontSize: '12px',
          letterSpacing: '0.15em',
          color: '#A8A294'
        }}>
          <span style={{ color: '#e15bc3' }}>CH. {scenes[currentScene].chapter}</span>
          <span style={{ opacity: 0.4, margin: '0 8px' }}>·</span>
          {scenes[currentScene].title.toUpperCase()}
        </div>
        <div style={{ display: 'flex', gap: '3px' }}>
          {scenes.map((s, i) => (
            <div key={i} style={{
              width: i === currentScene ? '20px' : '10px',
              height: '2px',
              background: i <= currentScene ? '#e15bc3' : 'rgba(244,239,230,0.14)',
              transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
              borderRadius: '1px'
            }}></div>
          ))}
        </div>
      </div>

      {/* Message area */}
      <div className="chat-scroll" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px 16px',
        position: 'relative'
      }}>
        {currentScene === 0 && <OvernightView />}

        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}

        {typing && <TypingIndicator />}
        {recording && <RecordingIndicator />}

        {showApproval && !approved && (
          <div className="msg-enter" style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end',
            marginTop: '12px'
          }}>
            <button className="btn-ghost" style={{
              padding: '12px 20px',
              borderRadius: '999px',
              fontSize: '15px'
            }}>
              Edit
            </button>
            <button
              onClick={advance}
              className="btn-primary"
              style={{
                padding: '12px 22px',
                borderRadius: '999px',
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Approve & Send
            </button>
          </div>
        )}

        {showVoiceOption && (
          <div className="msg-enter" style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={advance}
              className="btn-primary"
              style={{
                padding: '13px 22px',
                borderRadius: '999px',
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2a3 3 0 00-3 3v6a3 3 0 006 0V5a3 3 0 00-3-3z" fill="currentColor" />
                <path d="M19 11a1 1 0 10-2 0 5 5 0 01-10 0 1 1 0 10-2 0 7 7 0 006 6.93V21a1 1 0 102 0v-3.07A7 7 0 0019 11z" fill="currentColor" />
              </svg>
              Hold to speak
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom CTA bar */}
      <div style={{
        padding: '16px 20px',
        paddingBottom: 'calc(16px + var(--safe-bottom))',
        background: 'rgba(7, 16, 28, 0.9)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(244,239,230,0.06)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '72px'
      }}>
        {currentScene === 2 && !showApproval && !recording && (
          <button onClick={advance} className="btn-primary" style={{
            width: '100%',
            maxWidth: '320px',
            padding: '16px',
            borderRadius: '100px',
            fontSize: '16px',
            fontWeight: 600
          }}>
            See the draft →
          </button>
        )}
        {currentScene === 4 && (
          <button onClick={advance} className="btn-primary" style={{
            width: '100%',
            maxWidth: '320px',
            padding: '16px',
            borderRadius: '100px',
            fontSize: '16px',
            fontWeight: 600
          }}>
            What happens next →
          </button>
        )}
        {currentScene === 5 && (
          <button onClick={reset} className="btn-primary" style={{
            width: '100%',
            maxWidth: '320px',
            padding: '16px',
            borderRadius: '100px',
            fontSize: '16px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M1 4V10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.51 15A9 9 0 1021 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Replay from the top
          </button>
        )}
        {(currentScene === 1 || currentScene === 3) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {audioPlaying ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '10px' }}>
                  <div className="speaker-bar" style={{ animationDelay: '0s', height: '10px' }}></div>
                  <div className="speaker-bar" style={{ animationDelay: '0.15s', height: '10px' }}></div>
                  <div className="speaker-bar" style={{ animationDelay: '0.3s', height: '10px' }}></div>
                  <div className="speaker-bar" style={{ animationDelay: '0.1s', height: '10px' }}></div>
                </div>
                <div className="mono" style={{
                  fontSize: '12px',
                  letterSpacing: '0.2em',
                  color: '#e15bc3',
                  fontWeight: 600
                }}>
                  LISTENING
                </div>
              </>
            ) : (
              <div className="mono" style={{
                fontSize: '12px',
                letterSpacing: '0.2em',
                color: '#A8A294',
                opacity: 0.5
              }}>
                {currentScene === 1 ? 'TAP TO RESPOND' : 'PLEASE WAIT'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// OVERNIGHT VIEW (Scene 0 — unused after start but kept)
// ==========================================
function OvernightView() {
  return (
    <div style={{ padding: '40px 12px', textAlign: 'center' }}>
      <div className="mono" style={{ fontSize: '12px', color: '#A8A294', letterSpacing: '0.2em' }}>
        LOADING
      </div>
    </div>
  );
}

// ==========================================
// MESSAGE BUBBLES
// ==========================================
function MessageBubble({ msg }) {
  if (msg.type === 'brief') {
    return (
      <div className="msg-enter" style={{ marginBottom: '16px' }}>
        <div style={{
          background: 'rgba(244,239,230,0.04)',
          border: '1px solid rgba(244,239,230,0.1)',
          borderRadius: '22px 22px 22px 6px',
          padding: '20px',
          maxWidth: '92%'
        }}>
          <div className="serif" style={{
            fontSize: '26px',
            color: '#F4EFE6',
            marginBottom: '4px',
            fontWeight: 400,
            letterSpacing: '-0.015em',
            lineHeight: 1.1
          }}>
            {msg.greeting}
          </div>
          <div className="serif" style={{
            fontSize: '16px',
            color: '#A8A294',
            marginBottom: '18px',
            fontWeight: 300,
            fontStyle: 'italic'
          }}>
            {msg.content}
          </div>
          <div className="mono" style={{
            fontSize: '12px',
            color: '#e15bc3',
            letterSpacing: '0.15em',
            marginBottom: '10px',
            textTransform: 'uppercase'
          }}>
            {msg.body}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '14px' }}>
            {msg.items.map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '11px 0',
                borderBottom: i < msg.items.length - 1 ? '1px solid rgba(244,239,230,0.08)' : 'none',
                animation: `slideIn 0.4s ease ${0.3 + i * 0.15}s both`
              }}>
                <div style={{ fontSize: '16px', color: '#F4EFE6', fontWeight: 400 }}>{item.label}</div>
                <div className="mono" style={{
                  fontSize: '11px',
                  color: item.meta === 'priority' ? '#E8B05C' : '#A8A294',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontWeight: item.meta === 'priority' ? 600 : 400
                }}>
                  {item.meta}
                </div>
              </div>
            ))}
          </div>
          <div className="serif" style={{ fontSize: '15px', color: '#A8A294', fontStyle: 'italic' }}>
            {msg.footer}
          </div>
        </div>
        <div className="mono" style={{ fontSize: '11px', color: '#A8A294', marginTop: '6px', paddingLeft: '8px', opacity: 0.5 }}>
          {msg.time} AM
        </div>
      </div>
    );
  }

  if (msg.type === 'voice') {
    return (
      <div className="msg-enter" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <div style={{ maxWidth: '85%' }}>
          <div style={{
            background: 'linear-gradient(135deg, #e15bc3 0%, #f38161 100%)',
            color: '#ffffff',
            borderRadius: '22px 22px 6px 22px',
            padding: '14px 16px',
            boxShadow: '0 8px 24px -8px rgba(225,91,195,0.4)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: '#0c0c0c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M8 5V19L19 12L8 5Z" fill="#e15bc3" />
                </svg>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flex: 1 }}>
                {[0.4, 0.7, 1, 0.6, 0.8, 0.5, 0.9, 0.4, 0.7, 0.5, 0.8, 0.6, 0.4, 0.7, 0.9, 0.5].map((h, i) => (
                  <div key={i} style={{
                    width: '2px',
                    height: `${h * 20}px`,
                    background: '#0c0c0c',
                    borderRadius: '1px',
                    opacity: 0.6
                  }}></div>
                ))}
              </div>
              <div className="mono chapter-num" style={{ fontSize: '13px', fontWeight: 600 }}>{msg.duration}</div>
            </div>
            <div className="serif" style={{
              fontSize: '15px',
              fontStyle: 'italic',
              lineHeight: 1.5,
              opacity: 0.85,
              borderTop: '1px solid rgba(11,18,32,0.15)',
              paddingTop: '10px'
            }}>
              &ldquo;{msg.transcript}&rdquo;
            </div>
          </div>
          <div className="mono" style={{ fontSize: '11px', color: '#A8A294', marginTop: '6px', textAlign: 'right', paddingRight: '8px', opacity: 0.5 }}>
            {msg.time} AM
          </div>
        </div>
      </div>
    );
  }

  if (msg.type === 'draft') {
    return (
      <div className="msg-enter" style={{ marginBottom: '16px' }}>
        <div style={{
          background: 'rgba(244,239,230,0.04)',
          border: '1px solid rgba(244,239,230,0.1)',
          borderRadius: '22px 22px 22px 6px',
          padding: '18px',
          maxWidth: '92%'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#e15bc3' }}></div>
            <div className="mono" style={{
              fontSize: '12px',
              color: '#e15bc3',
              letterSpacing: '0.15em',
              textTransform: 'uppercase'
            }}>
              {msg.label}
            </div>
          </div>
          <div style={{
            background: 'rgba(11,18,32,0.5)',
            borderLeft: '2px solid #e15bc3',
            padding: '14px 16px',
            borderRadius: '0 10px 10px 0'
          }}>
            <p className="serif" style={{
              fontSize: '16px',
              lineHeight: 1.6,
              color: '#F4EFE6',
              margin: 0,
              fontStyle: 'italic',
              fontWeight: 400
            }}>
              {msg.draft}
            </p>
          </div>
        </div>
        <div className="mono" style={{ fontSize: '11px', color: '#A8A294', marginTop: '6px', paddingLeft: '8px', opacity: 0.5 }}>
          {msg.time} AM
        </div>
      </div>
    );
  }

  if (msg.type === 'tap') {
    return (
      <div className="msg-enter" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <div style={{
          background: 'rgba(225,91,195,0.15)',
          border: '1px solid rgba(225,91,195,0.4)',
          borderRadius: '999px',
          padding: '9px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <svg className="checkmark-enter" width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M5 13L9 17L19 7" stroke="#e15bc3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="mono" style={{
            fontSize: '13px',
            color: '#e15bc3',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase'
          }}>
            {msg.content}
          </span>
        </div>
      </div>
    );
  }

  if (msg.type === 'confirm') {
    return (
      <div className="msg-enter" style={{ marginBottom: '16px' }}>
        <div style={{
          background: 'rgba(244,239,230,0.04)',
          border: '1px solid rgba(244,239,230,0.1)',
          borderRadius: '22px 22px 22px 6px',
          padding: '20px',
          maxWidth: '92%'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div className="checkmark-enter" style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#e15bc3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 13L9 17L19 7" stroke="#0c0c0c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="serif" style={{ fontSize: '20px', color: '#F4EFE6', fontWeight: 400 }}>
              Done.
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
            {msg.steps.map((step, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                animation: `slideIn 0.4s ease ${0.3 + i * 0.18}s both`
              }}>
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: 'rgba(225,91,195,0.15)',
                  border: '1px solid #e15bc3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13L9 17L19 7" stroke="#e15bc3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div style={{ fontSize: '15px', color: '#F4EFE6' }}>{step}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(244,239,230,0.08)' }}>
            <div className="serif" style={{ fontSize: '15px', fontStyle: 'italic', color: '#A8A294' }}>
              Ready when you are.
            </div>
          </div>
        </div>
        <div className="mono" style={{ fontSize: '11px', color: '#A8A294', marginTop: '6px', paddingLeft: '8px', opacity: 0.5 }}>
          {msg.time} AM
        </div>
      </div>
    );
  }

  return null;
}

function TypingIndicator() {
  return (
    <div className="msg-enter" style={{ display: 'flex', marginBottom: '14px' }}>
      <div style={{
        background: 'rgba(244,239,230,0.04)',
        border: '1px solid rgba(244,239,230,0.1)',
        borderRadius: '22px 22px 22px 6px',
        padding: '14px 18px'
      }}>
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <div className="typing-dot" style={{ animationDelay: '0s' }}></div>
          <div className="typing-dot" style={{ animationDelay: '0.2s' }}></div>
          <div className="typing-dot" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}

function RecordingIndicator() {
  return (
    <div className="msg-enter" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
      <div style={{
        background: 'rgba(225,91,195,0.1)',
        border: '1px solid rgba(225,91,195,0.3)',
        borderRadius: '999px',
        padding: '11px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '16px' }}>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.1}s`, height: '16px' }}></div>
          ))}
        </div>
        <span className="mono" style={{
          fontSize: '12px',
          color: '#e15bc3',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          fontWeight: 600
        }}>
          Listening
        </span>
      </div>
    </div>
  );
}
