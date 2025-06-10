document.addEventListener('DOMContentLoaded', () => {
    const joinScreen = document.getElementById('join-screen');
    const callScreen = document.getElementById('call-screen');
    const callCodeInput = document.getElementById('call-code-input');
    const joinButton = document.getElementById('join-button');
    const localVideo = document.getElementById('local-video');
    const remoteVideosContainer = document.getElementById('remote-videos');
    const toggleMicButton = document.getElementById('toggle-mic');
    const toggleCameraButton = document.getElementById('toggle-camera');
    const toggleScreenshareButton = document.getElementById('toggle-screenshare');
    const hangupButton = document.getElementById('hangup-button');

    let localStream;
    let isMicOn = true;
    let isCameraOn = true;
    let isScreensharing = false;
    let currentCallCode = '';

    // --- UI State Management ---

    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    // --- Media Access & Local Stream ---

    async function setupLocalStream() {
        try {
            // Request access to microphone and camera
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localVideo.srcObject = localStream;
            localVideo.play(); // Start playing local video

            // Initialize button states
            isMicOn = localStream.getAudioTracks().length > 0;
            isCameraOn = localStream.getVideoTracks().length > 0;
            updateControlButtons();

            console.log("Local stream obtained.");
        } catch (error) {
            console.error("Error accessing media devices:", error);
            alert("Could not access camera or microphone. Please allow permissions.");
        }
    }

    // --- Control Button Functions ---

    function updateControlButtons() {
        if (isMicOn) {
            toggleMicButton.classList.add('active');
            toggleMicButton.querySelector('img').src = "https://img.icons8.com/ios-filled/24/ffffff/microphone.png";
        } else {
            toggleMicButton.classList.remove('active');
            toggleMicButton.querySelector('img').src = "https://img.icons8.com/ios-filled/24/ffffff/mute--v1.png";
        }

        if (isCameraOn) {
            toggleCameraButton.classList.add('active');
            toggleCameraButton.querySelector('img').src = "https://img.icons8.com/ios-filled/24/ffffff/video-camera.png";
        } else {
            toggleCameraButton.classList.remove('active');
            toggleCameraButton.querySelector('img').src = "https://img.icons8.com/ios-filled/24/ffffff/no-camera.png";
        }

        // Screen share button might have a different active state or icon,
        // depending on how you implement the toggle.
        if (isScreensharing) {
             toggleScreenshareButton.classList.add('active');
             toggleScreenshareButton.querySelector('img').src = "https://img.icons8.com/ios-filled/24/ffffff/laptop-mac--v2.png"; // Screen share active icon
        } else {
             toggleScreenshareButton.classList.remove('active');
             toggleScreenshareButton.querySelector('img').src = "https://img.icons8.com/ios-filled/24/ffffff/laptop-mac--v1.png"; // Default screen share icon
        }
    }

    toggleMicButton.addEventListener('click', () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
            isMicOn = !isMicOn;
            updateControlButtons();
            console.log(`Microphone: ${isMicOn ? 'On' : 'Off'}`);
            // TODO: In a real WebRTC app, signal this change to remote peers
        }
    });

    toggleCameraButton.addEventListener('click', () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
            isCameraOn = !isCameraOn;
            updateControlButtons();
            console.log(`Camera: ${isCameraOn ? 'On' : 'Off'}`);
            // TODO: In a real WebRTC app, signal this change to remote peers
        }
    });

    toggleScreenshareButton.addEventListener('click', async () => {
        if (!isScreensharing) {
            try {
                // Request screen sharing stream
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                // Replace local video track with screen share track
                const videoTrack = screenStream.getVideoTracks()[0];
                const audioTrack = screenStream.getAudioTracks()[0]; // Optional, can share screen audio
                
                // IMPORTANT: In a real WebRTC app, you'd replace the sender's track
                // in the RTCPeerConnection to send the screen share instead of camera.
                // Example: sender.replaceTrack(videoTrack);

                // For demonstration, display screen stream on local video element
                localVideo.srcObject = screenStream;
                localVideo.play();
                
                // When screen sharing stops (e.g., user clicks browser stop button)
                videoTrack.onended = () => {
                    console.log("Screen sharing stopped by user.");
                    // Stop screen stream tracks
                    screenStream.getTracks().forEach(track => track.stop());
                    // Revert to camera stream (if camera was on)
                    setupLocalStream(); // Re-initialize local camera stream
                    isScreensharing = false;
                    updateControlButtons();
                    // TODO: In a real WebRTC app, signal screen share end
                };
                
                isScreensharing = true;
                updateControlButtons();
                console.log("Screen sharing started.");

            } catch (error) {
                console.error("Error starting screen share:", error);
                alert("Could not start screen sharing. Ensure browser permissions are granted.");
            }
        } else {
            // Stop screen sharing (assuming localVideo is currently showing screen share)
            if (localVideo.srcObject && localVideo.srcObject.getTracks) {
                localVideo.srcObject.getTracks().forEach(track => track.stop());
            }
            // Revert to camera stream (if camera was on)
            setupLocalStream(); // Re-initialize local camera stream
            isScreensharing = false;
            updateControlButtons();
            console.log("Screen sharing stopped.");
            // TODO: In a real WebRTC app, signal screen share end
        }
    });


    hangupButton.addEventListener('click', () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop()); // Stop all local tracks
        }
        localVideo.srcObject = null;
        remoteVideosContainer.innerHTML = ''; // Clear remote videos

        // TODO: In a real WebRTC app, close peer connections and signal "hangup" to server/peers

        console.log("Call ended.");
        showScreen('join-screen'); // Go back to join screen
    });

    // --- Join Call Logic ---
    joinButton.addEventListener('click', async () => {
        currentCallCode = callCodeInput.value.trim();
        if (currentCallCode) {
            console.log(`Attempting to join call with code: ${currentCallCode}`);
            showScreen('call-screen');
            await setupLocalStream();

            // --- IMPORTANT: WebRTC Signaling and Peer Connection Logic Below ---
            // This is where you would integrate your backend for actual real-time calls.
            // A typical flow involves:
            // 1. **Initialize RTCPeerConnection:**
            //    const pc = new RTCPeerConnection(config); // STUN/TURN servers go in config
            //
            // 2. **Add local stream tracks to PeerConnection:**
            //    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
            //
            // 3. **Handle ICE candidates (network discovery):**
            //    pc.onicecandidate = event => {
            //        if (event.candidate) {
            //            // Send event.candidate to the remote peer via your signaling server
            //        }
            //    };
            //
            // 4. **Handle incoming remote streams:**
            //    pc.ontrack = event => {
            //        const remoteVideo = document.createElement('video');
            //        remoteVideo.autoplay = true;
            //        remoteVideo.srcObject = event.streams[0];
            //        remoteVideosContainer.appendChild(remoteVideo);
            //        console.log("Remote stream added.");
            //    };
            //
            // 5. **Create an offer (for the initiator of the call):**
            //    const offer = await pc.createOffer();
            //    await pc.setLocalDescription(offer);
            //    // Send offer to remote peer via your signaling server
            //
            // 6. **Handle incoming offer (for the receiver of the call):**
            //    await pc.setRemoteDescription(new RTCSessionDescription(receivedOffer));
            //    const answer = await pc.createAnswer();
            //    await pc.setLocalDescription(answer);
            //    // Send answer to remote peer via your signaling server
            //
            // 7. **Handle incoming answer (for the initiator):**
            //    await pc.setRemoteDescription(new RTCSessionDescription(receivedAnswer));
            //
            // 8. **Handle incoming ICE candidates from remote peer:**
            //    await pc.addIceCandidate(new RTCIceCandidate(receivedCandidate));
            //
            // --- End of WebRTC Placeholder ---

            // You would likely have a function here like:
            // initializePeerConnection(currentCallCode, localStream);

        } else {
            alert("Please enter a call code.");
        }
    });

    // Initialize by showing the join screen
    showScreen('join-screen');
});