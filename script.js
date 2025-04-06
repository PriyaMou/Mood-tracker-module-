document.addEventListener('DOMContentLoaded', function() {
    // Mood data
    let currentMood = {
        emoji: '',
        label: '',
        description: '',
        intensity: 5,
        additionalAnswers: {},
        date: ''
    };
    
    // Additional questions configuration
    const additionalQuestions = [
        {
            id: 'energy',
            question: "How would you describe your energy level right now?",
            options: ["Very low", "Lower than usual", "Normal", "Higher than usual", "Very high"]
        },
        {
            id: 'productivity',
            question: "How productive do you feel today?",
            options: ["Not at all", "A little", "Moderately", "Quite", "Extremely"]
        },
        {
            id: 'connection',
            question: "How connected do you feel to others right now?",
            options: ["Very isolated", "Somewhat isolated", "Neutral", "Somewhat connected", "Very connected"]
        }
    ];
    
    let moodHistory = JSON.parse(localStorage.getItem('moodHistory')) || [];
    let moodChart = null;
    let currentQuestionIndex = 0;
    
    // DOM elements
    const steps = document.querySelectorAll('.step');
    const emojiBtns = document.querySelectorAll('.emoji-btn');
    const currentMoodSpan = document.getElementById('current-mood');
    const moodQuestion = document.getElementById('mood-question');
    const intensitySlider = document.getElementById('intensity-slider');
    const intensityValue = document.getElementById('intensity-value');
    const moodDescription = document.getElementById('mood-description');
    const moodHistoryContainer = document.getElementById('mood-history');
    const fullHistoryContainer = document.getElementById('full-history');
    const questionContainer = document.getElementById('question-container');
    const viewFullHistoryBtn = document.getElementById('view-full-history');
    const backToAnalysisBtn = document.getElementById('back-to-analysis');
    
    // Initialize
    if (moodHistory.length > 0) {
        renderChart();
        renderHistory();
    }
    
    // Emoji selection
    emojiBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove selection from all buttons
            emojiBtns.forEach(b => b.classList.remove('selected'));
            
            // Add selection to clicked button
            this.classList.add('selected');
            
            // Set current mood
            currentMood.emoji = this.querySelector('.emoji').textContent;
            currentMood.label = this.getAttribute('data-mood');
        });
    });
    
    // Navigation
    document.getElementById('next1').addEventListener('click', function() {
        if (!currentMood.emoji) {
            alert('Please select how you\'re feeling first');
            return;
        }
        
        // Update question based on mood
        if (['sad', 'angry', 'anxious'].includes(currentMood.label)) {
            moodQuestion.textContent = `What's making you feel ${currentMood.label}?`;
        } else {
            moodQuestion.textContent = `What's making you feel ${currentMood.label}?`;
        }
        currentMoodSpan.textContent = currentMood.label;
        
        showStep(2);
    });
    
    document.getElementById('next2').addEventListener('click', function() {
        currentMood.description = moodDescription.value;
        showStep(3);
    });
    
    document.getElementById('next3').addEventListener('click', function() {
        currentMood.intensity = parseInt(intensitySlider.value);
        showStep(4);
        showQuestion(0); // Show first additional question
    });
    
    document.getElementById('next4').addEventListener('click', function() {
        // Save answer for current question
        const currentQuestion = additionalQuestions[currentQuestionIndex];
        const selectedOption = document.querySelector('.option-btn.selected');
        
        if (selectedOption) {
            currentMood.additionalAnswers[currentQuestion.id] = selectedOption.textContent;
        }
        
        // Move to next question or finish
        if (currentQuestionIndex < additionalQuestions.length - 1) {
            currentQuestionIndex++;
            showQuestion(currentQuestionIndex);
        } else {
            // All questions answered, proceed to analysis
            currentMood.date = new Date().toISOString();
            
            // Save to history
            moodHistory.push({...currentMood});
            localStorage.setItem('moodHistory', JSON.stringify(moodHistory));
            
            // Reset question index for next time
            currentQuestionIndex = 0;
            
            // Show analysis
            showStep(5);
            renderChart();
            renderHistory();
        }
    });
    
    // Back buttons
    document.getElementById('back1').addEventListener('click', function() {
        showStep(1);
    });
    
    document.getElementById('back2').addEventListener('click', function() {
        showStep(2);
    });
    
    document.getElementById('back3').addEventListener('click', function() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            showQuestion(currentQuestionIndex);
        } else {
            showStep(3);
        }
    });
    
    // View full history button
    viewFullHistoryBtn.addEventListener('click', function() {
        showStep(6);
        renderFullHistory();
    });
    
    // Back to analysis button
    backToAnalysisBtn.addEventListener('click', function() {
        showStep(5);
    });
    
    // Restart button
    document.getElementById('restart').addEventListener('click', resetTracker);
    
    // Intensity slider
    intensitySlider.addEventListener('input', function() {
        intensityValue.textContent = this.value;
    });
    
    // Show specific step
    function showStep(stepNumber) {
        steps.forEach((step, index) => {
            if (index === stepNumber - 1) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
        
        // Scroll to top of chatbot container
        document.querySelector('.chatbot-container').scrollIntoView({ behavior: 'smooth' });
    }
    
    // Show a specific additional question
    function showQuestion(index) {
        const question = additionalQuestions[index];
        questionContainer.innerHTML = '';
        
        const questionElement = document.createElement('h2');
        questionElement.className = 'question';
        questionElement.textContent = question.question;
        questionContainer.appendChild(questionElement);
        
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'option-grid';
        
        question.options.forEach(option => {
            const optionBtn = document.createElement('div');
            optionBtn.className = 'option-btn';
            optionBtn.textContent = option;
            
            // Select this option if it was previously selected
            if (currentMood.additionalAnswers[question.id] === option) {
                optionBtn.classList.add('selected');
            }
            
            optionBtn.addEventListener('click', function() {
                // Remove selection from all buttons in this question
                optionsContainer.querySelectorAll('.option-btn').forEach(btn => {
                    btn.classList.remove('selected');
                });
                
                // Add selection to clicked button
                this.classList.add('selected');
            });
            
            optionsContainer.appendChild(optionBtn);
        });
        
        questionContainer.appendChild(optionsContainer);
        
        // Update progress indicator
        const progress = document.createElement('div');
        progress.className = 'slider-value';
        progress.textContent = `Question ${index + 1} of ${additionalQuestions.length}`;
        questionContainer.appendChild(progress);
    }
    
    // Render chart
    function renderChart() {
        const ctx = document.getElementById('moodChart').getContext('2d');
        const last7Entries = moodHistory.slice(-7);
        
        // Prepare data
        const labels = last7Entries.map(entry => {
            const date = new Date(entry.date);
            return `${date.getDate()}/${date.getMonth() + 1}`;
        });
        
        const data = last7Entries.map(entry => entry.intensity);
        
        const backgroundColors = last7Entries.map(entry => {
            switch(entry.label) {
                case 'happy': return 'rgba(72, 187, 120, 0.7)';
                case 'sad': return 'rgba(66, 153, 225, 0.7)';
                case 'angry': return 'rgba(245, 101, 101, 0.7)';
                case 'excited': return 'rgba(246, 173, 85, 0.7)';
                case 'neutral': return 'rgba(160, 174, 192, 0.7)';
                case 'anxious': return 'rgba(159, 122, 234, 0.7)';
                default: return 'rgba(108, 99, 255, 0.7)';
            }
        });
        
        // Destroy previous chart if exists
        if (moodChart) {
            moodChart.destroy();
        }
        
        // Create new chart
        moodChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Mood Intensity',
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: '#fff',
                    borderWidth: 1,
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const entry = last7Entries[context.dataIndex];
                                const tooltip = [
                                    `Mood: ${entry.label.charAt(0).toUpperCase() + entry.label.slice(1)}`,
                                    `Intensity: ${entry.intensity}/10`,
                                    entry.description ? `Notes: ${entry.description}` : ''
                                ];
                                
                                // Add additional answers to tooltip
                                for (const [key, value] of Object.entries(entry.additionalAnswers || {})) {
                                    const question = additionalQuestions.find(q => q.id === key);
                                    if (question) {
                                        tooltip.push(`${question.question}: ${value}`);
                                    }
                                }
                                
                                return tooltip;
                            }
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    }
    
    // Render mood history (limited view)
    function renderHistory() {
        moodHistoryContainer.innerHTML = '';
        
        if (moodHistory.length === 0) {
            moodHistoryContainer.innerHTML = '<div class="no-history">No mood entries yet</div>';
            return;
        }
        
        // Show only last 5 entries (newest first)
        const recentHistory = [...moodHistory].reverse().slice(0, 5);
        renderHistoryItems(recentHistory, moodHistoryContainer);
    }
    
    // Render full history
    function renderFullHistory() {
        fullHistoryContainer.innerHTML = '';
        
        if (moodHistory.length === 0) {
            fullHistoryContainer.innerHTML = '<div class="no-history">No mood entries yet</div>';
            return;
        }
        
        // Show all entries (newest first)
        const allHistory = [...moodHistory].reverse();
        renderHistoryItems(allHistory, fullHistoryContainer);
    }
    
    // Helper function to render history items
    function renderHistoryItems(entries, container) {
        entries.forEach(entry => {
            const item = document.createElement('div');
            item.className = 'mood-item';
            
            const emojiMap = {
                'happy': '😊',
                'sad': '😞',
                'angry': '😠',
                'excited': '🤩',
                'neutral': '😐',
                'anxious': '😰'
            };
            
            const date = new Date(entry.date);
            const formattedDate = `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            
            item.innerHTML = `
                <div class="mood-emoji">${emojiMap[entry.label] || '😶'}</div>
                <div class="mood-details">
                    <div class="mood-type">${entry.label.charAt(0).toUpperCase() + entry.label.slice(1)}</div>
                    <div class="mood-date">${formattedDate}</div>
                    ${entry.description ? `<div class="mood-desc">${entry.description}</div>` : ''}
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${entry.intensity * 10}%"></div>
                    </div>
            `;
            
            // Add additional answers to history item
            const additionalAnswersDiv = document.createElement('div');
            additionalAnswersDiv.className = 'additional-answers';
            
            for (const [key, value] of Object.entries(entry.additionalAnswers || {})) {
                const question = additionalQuestions.find(q => q.id === key);
                if (question) {
                    const answerElement = document.createElement('div');
                    answerElement.className = 'mood-additional';
                    answerElement.textContent = `${question.question}: ${value}`;
                    additionalAnswersDiv.appendChild(answerElement);
                }
            }
            
            item.querySelector('.mood-details').appendChild(additionalAnswersDiv);
            container.appendChild(item);
        });
    }
    
    // Reset tracker
    function resetTracker() {
        // Reset current mood
        currentMood = {
            emoji: '',
            label: '',
            description: '',
            intensity: 5,
            additionalAnswers: {},
            date: ''
        };
        
        // Reset form
        moodDescription.value = '';
        intensitySlider.value = 5;
        intensityValue.textContent = '5';
        currentQuestionIndex = 0;
        
        // Reset selected emoji
        document.querySelectorAll('.emoji-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Go back to first step
        showStep(1);
    }
});