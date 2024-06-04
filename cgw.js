let context;
let audioPlayer;
let source;
let lowpassFilter;
let panner;


function setupAudio() {
    audioPlayer = document.getElementById('audioID');

    audioPlayer.addEventListener('play', () => {
        if (!context) {
            context = new AudioContext();
            source = context.createMediaElementSource(audioPlayer);
            panner = context.createPanner();
            lowpassFilter = context.createBiquadFilter();

            source.connect(panner);
            panner.connect(lowpassFilter);
            lowpassFilter.connect(context.destination);

            lowpassFilter.type = 'lowpass';
            lowpassFilter.Q.value = 1;
            lowpassFilter.gain.value = 11;
            context.resume();
        }
    })
    audioPlayer.addEventListener('pause', () => {
        console.log('pause');
        context.resume();
    })
}

function initAudio() {
    setupAudio();
    const radioButton = document.getElementById('checker');
    radioButton.addEventListener('change', function() {
        if (radioButton.checked) {
            panner.disconnect();
            panner.connect(lowpassFilter);
            lowpassFilter.connect(context.destination);
        } else {
            panner.disconnect();
            panner.connect(context.destination);
        }
    });
    audioPlayer.play();
}