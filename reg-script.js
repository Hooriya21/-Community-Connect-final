// Registration Form Handler - CommunityConnect

document.getElementById('registrationForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get all form values
    const name = document.getElementById('userName')?.value || '';
    const address = document.getElementById('userAddress')?.value || '';
    const skillText = document.getElementById('userSkillInput')?.value || '';
    
    // Validate form
    if (!name || !address || !skillText) {
        alert('Please fill in all fields');
        return;
    }
    
    const loader = document.getElementById('loadingOverlay');
    
    // Show AI loading state
    loader.classList.remove('hidden');

    try {
        // FIXED: Changed from localhost to relative URL
        const response = await fetch('/api/analyze-skill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: skillText })
        });

        // Check if response is OK
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }

        const data = await response.json();
        
        // AI categorization result
        console.log("AI Categorization:", data);
        
        // Get AI category (with fallback)
        const aiCategory = data.labels && data.labels[0] ? data.labels[0] : 'general';
        
        // Save user data to localStorage (simulates database)
        const userData = {
            name: name,
            address: address,
            skill: skillText,
            aiCategory: aiCategory,
            points: 100, // Welcome bonus
            joinDate: new Date().toLocaleDateString(),
            exchangesCompleted: 0,
            neighborsConnected: 0
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        // Show success message with AI result
        alert(`✨ Registration successful! 
Our AI categorized your skill as: ${aiCategory.toUpperCase()}
You've received 100 kindness points!`);
        
        // Redirect to dashboard
        window.location.href = "dashboard.html";
        
    } catch (error) {
        console.error("Registration error:", error);
        
        // Save user data even if AI fails (offline mode)
        const userData = {
            name: name,
            address: address,
            skill: skillText,
            aiCategory: 'general',
            points: 100,
            joinDate: new Date().toLocaleDateString(),
            exchangesCompleted: 0,
            neighborsConnected: 0
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        // Show appropriate message
        if (error.message.includes('Failed to fetch')) {
            alert("✅ Registration successful! (Offline mode - AI analysis unavailable)\nWelcome to CommunityConnect!");
        } else {
            alert("✅ Registration successful! (AI service temporarily unavailable)\nWelcome to CommunityConnect!");
        }
        
        window.location.href = "dashboard.html";
    } finally {
        loader.classList.add('hidden');
    }
});

// Optional: Add form validation as user types
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registrationForm');
    if (form) {
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', function() {
                // Remove any error styling
                this.classList.remove('border-red-500');
            });
        });
    }
});