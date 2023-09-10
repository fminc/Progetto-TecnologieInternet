document.getElementById('rankingButton').addEventListener('click', () => {
    window.location.href = '/ranking.html'; 
});

// Add an event listener to the matchmaking button
searchRoomButton.addEventListener('click', async () => {
    try {
        // Perform an asynchronous request to your server to initiate matchmaking
        const response = await fetch('/matchmaking', {
            method: 'POST',
        });

        if (response.ok) {
            // If matchmaking is successful, redirect to the game page
            window.location.href = '/game.html';
        } else {
            // Handle the case where matchmaking failed (show an alert or any other indication)
            console.error('Matchmaking failed.');
        }
    } catch (error) {
        console.error('Error during matchmaking:', error);
        alert('An error occurred during matchmaking. Please try again later.');
    }
});