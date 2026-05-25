document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  // Escape HTML to prevent injection when rendering participant names/emails
  function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, function(m) { return map[m]; });
  }

  // Unregister a participant from an activity. Tries DELETE first, then POST fallback.
  async function unregisterParticipant(activityName, email) {
    try {
      const encodedActivity = encodeURIComponent(activityName);
      const encodedEmail = encodeURIComponent(email);

      // First, try DELETE on a common REST-like endpoint
      let url = `/activities/${encodedActivity}/participants?email=${encodedEmail}`;
      let response = await fetch(url, { method: 'DELETE' });

      // If DELETE isn't supported, try a POST to an unregister action
      if (!response.ok) {
        url = `/activities/${encodedActivity}/unregister?email=${encodedEmail}`;
        response = await fetch(url, { method: 'POST' });
      }

      let result = {};
      try { result = await response.json(); } catch (e) { /* ignore parse errors */ }

      if (response.ok) {
        messageDiv.textContent = result.message || 'Participant removed';
        messageDiv.className = 'success';
        messageDiv.classList.remove('hidden');
        setTimeout(() => messageDiv.classList.add('hidden'), 5000);
        // Refresh activities to reflect change
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || result.message || 'Failed to remove participant';
        messageDiv.className = 'error';
        messageDiv.classList.remove('hidden');
      }
    } catch (error) {
      console.error('Error unregistering participant:', error);
      messageDiv.textContent = 'Failed to remove participant. Please try again.';
      messageDiv.className = 'error';
      messageDiv.classList.remove('hidden');
    }
  }

  
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select to default option to avoid duplicates
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const participants = Array.isArray(details.participants) ? details.participants : [];
        const spotsLeft = details.max_participants - participants.length;

        // Build participants area using DOM nodes so we can attach delete handlers
        const participantsSection = document.createElement('div');
        participantsSection.className = 'participants-section';

        const participantsHeading = document.createElement('h5');
        participantsHeading.textContent = 'Participants';
        participantsSection.appendChild(participantsHeading);

        if (participants.length === 0) {
          const noPart = document.createElement('p');
          noPart.className = 'no-participants';
          noPart.textContent = 'No participants yet.';
          participantsSection.appendChild(noPart);
        } else {
          const ul = document.createElement('ul');
          ul.className = 'participants-list';

          const activityName = name;
          participants.forEach((p) => {
            const li = document.createElement('li');
            li.className = 'participant-item';

            const span = document.createElement('span');
            span.className = 'participant-name';
            span.textContent = p;

            const del = document.createElement('button');
            del.type = 'button';
            del.className = 'delete-participant';
            del.setAttribute('aria-label', `Remove ${p} from ${activityName}`);
            del.textContent = '✖';

            del.addEventListener('click', async () => {
              // Attempt to unregister participant
              await unregisterParticipant(activityName, p);
            });

            li.appendChild(span);
            li.appendChild(del);
            ul.appendChild(li);
          });

          participantsSection.appendChild(ul);
        }

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description || '')}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule || '')}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the newly-registered participant appears immediately
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
