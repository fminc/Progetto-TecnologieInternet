const backButton = document.getElementById('backButton');
const rankingList = document.getElementById('rankingList');

backButton.addEventListener('click', () => {
    // Redirect back to the middle page when the "Back" button is clicked
    window.location.href = '/middle.html';
});

async function fetchRankingData() {
    try {
        // Fetch the ranking data from the server
        const response = await fetch('/getRanking');
        const rankingData = await response.json();

        // Clear any existing content from the ranking list
        rankingList.innerHTML = '';

        // Loop through the ranking data and add each entry to the ranking list
        rankingData.forEach((entry, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${index + 1}. ${entry.username} - ${entry.score}`;
            rankingList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error fetching ranking data:', error);
        alert('An error occurred while fetching the ranking. Please try again later.');
    }
}

// Fetch and display the ranking data when the page loads
fetchRankingData();
