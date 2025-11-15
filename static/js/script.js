// Quiz State
let questions = [];
let currentQuestionIndex = 0;
let answers = [];

// Category Icons
const categoryIcons = {
    'Home': 'fa-home',
    'Mobility': 'fa-car',
    'Food': 'fa-utensils',
    'Consumption': 'fa-shopping-bag'
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
});

function initializeEventListeners() {
    // Start button
    document.getElementById('startBtn').addEventListener('click', startQuiz);
    
    // Navigation buttons
    document.getElementById('nextBtn').addEventListener('click', nextQuestion);
    document.getElementById('prevBtn').addEventListener('click', previousQuestion);
    
    // Action buttons
    document.getElementById('retakeBtn').addEventListener('click', retakeQuiz);
    document.getElementById('shareBtn').addEventListener('click', shareResults);
}

async function startQuiz() {
    try {
        // Fetch questions from backend
        const response = await fetch('/get-questions');
        questions = await response.json();
        
        // Reset state
        currentQuestionIndex = 0;
        answers = [];
        
        // Switch to quiz screen
        switchScreen('quizScreen');
        
        // Display first question
        displayQuestion();
    } catch (error) {
        console.error('Error loading questions:', error);
        alert('Failed to load quiz questions. Please try again.');
    }
}

function displayQuestion() {
    const question = questions[currentQuestionIndex];
    
    // Update progress
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;
    document.getElementById('progressText').textContent = 
        `Question ${currentQuestionIndex + 1} of ${questions.length}`;
    
    // Update category badge
    const categoryBadge = document.getElementById('categoryBadge');
    const iconClass = categoryIcons[question.category];
    categoryBadge.innerHTML = `
        <i class="fas ${iconClass}"></i>
        <span>${question.category}</span>
    `;
    
    // Update question text
    document.getElementById('questionText').textContent = question.question;
    
    // Create options
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        optionDiv.textContent = option.text;
        optionDiv.dataset.index = index;
        
        // Check if this option was previously selected
        const previousAnswer = answers[currentQuestionIndex];
        if (previousAnswer && previousAnswer.optionIndex === index) {
            optionDiv.classList.add('selected');
            document.getElementById('nextBtn').disabled = false;
        }
        
        optionDiv.addEventListener('click', () => selectOption(index, option, question));
        
        optionsContainer.appendChild(optionDiv);
    });
    
    // Update navigation buttons
    document.getElementById('prevBtn').style.display = 
        currentQuestionIndex > 0 ? 'flex' : 'none';
    
    const nextBtn = document.getElementById('nextBtn');
    nextBtn.textContent = currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next';
    
    // Add animation
    optionsContainer.style.animation = 'none';
    setTimeout(() => {
        optionsContainer.style.animation = 'slideUp 0.5s ease-out';
    }, 10);
}

function selectOption(index, option, question) {
    // Remove previous selection
    document.querySelectorAll('.option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    // Add selection to clicked option
    const selectedOption = document.querySelector(`.option[data-index="${index}"]`);
    selectedOption.classList.add('selected');
    
    // Store answer
    answers[currentQuestionIndex] = {
        questionId: question.id,
        category: question.category,
        optionIndex: index,
        co2: option.co2
    };
    
    // Enable next button
    document.getElementById('nextBtn').disabled = false;
}

function nextQuestion() {
    if (!answers[currentQuestionIndex]) {
        return;
    }
    
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        document.getElementById('nextBtn').disabled = true;
        displayQuestion();
    } else {
        finishQuiz();
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
}

async function finishQuiz() {
    try {
        // Send answers to backend
        const response = await fetch('/calculate-results', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ answers })
        });
        
        const results = await response.json();
        
        // Display results
        displayResults(results);
        
        // Switch to results screen
        switchScreen('resultsScreen');
    } catch (error) {
        console.error('Error calculating results:', error);
        alert('Failed to calculate results. Please try again.');
    }
}

function displayResults(data) {
    // Update total emissions
    document.getElementById('totalEmissions').textContent = 
        data.total_emissions.toLocaleString();
    
    // Update comparison text
    const comparisonText = document.getElementById('comparisonText');
    const difference = data.total_difference;
    
    if (difference < 0) {
        comparisonText.className = 'comparison better';
        comparisonText.innerHTML = `
            <i class="fas fa-check-circle"></i>
            ${Math.abs(difference).toLocaleString()} kg below average! 🎉
        `;
    } else if (difference > 0) {
        comparisonText.className = 'comparison worse';
        comparisonText.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            ${difference.toLocaleString()} kg above average
        `;
    } else {
        comparisonText.className = 'comparison';
        comparisonText.innerHTML = `
            <i class="fas fa-equals"></i>
            Right at average
        `;
    }
    
    // Create category results
    const categoryResults = document.getElementById('categoryResults');
    categoryResults.innerHTML = '';
    
    data.results.forEach((result, index) => {
        const categoryDiv = createCategoryResult(result);
        categoryResults.appendChild(categoryDiv);
    });
}

function createCategoryResult(result) {
    const div = document.createElement('div');
    div.className = 'category-result';
    
    const iconClass = categoryIcons[result.category];
    const difference = result.difference;
    const comparisonClass = difference < 0 ? 'better' : 'worse';
    const comparisonText = difference < 0 
        ? `${Math.abs(difference)} kg below average 🌱`
        : `${difference} kg above average`;
    
    div.innerHTML = `
        <div class="category-header">
            <div class="category-title">
                <div class="category-icon">
                    <i class="fas ${iconClass}"></i>
                </div>
                <h3>${result.category}</h3>
            </div>
            <div class="category-emissions">
                <div class="emissions-number">${result.emissions.toLocaleString()}</div>
                <div class="emissions-label">kg CO₂/year</div>
                <div class="emissions-comparison ${comparisonClass}">
                    ${comparisonText}
                </div>
            </div>
        </div>
        
        <div class="tips-section">
            <h4><i class="fas fa-lightbulb"></i> Recommended Actions</h4>
            <ul class="tips-list">
                ${result.tips.map(tip => `<li>${tip}</li>`).join('')}
            </ul>
        </div>
        
        <div class="products-section">
            <h4><i class="fas fa-shopping-cart"></i> Sustainable Products</h4>
            <div class="products-grid">
                ${result.products.map(product => `
                    <div class="product-card" onclick="window.open('${product.link}', '_blank')">
                        <img src="${product.image}" alt="${product.name}" class="product-image">
                        <div class="product-info">
                            <div class="product-name">${product.name}</div>
                            <div class="product-description">${product.description}</div>
                            <div class="product-price">${product.price}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    return div;
}

function retakeQuiz() {
    switchScreen('startScreen');
    currentQuestionIndex = 0;
    answers = [];
}

function shareResults() {
    const totalEmissions = document.getElementById('totalEmissions').textContent;
    const text = `I just calculated my carbon footprint: ${totalEmissions} kg CO₂/year! Calculate yours and help save the planet! 🌍`;
    
    if (navigator.share) {
        navigator.share({
            title: 'EcoTrace - My Carbon Footprint',
            text: text,
            url: window.location.href
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(text + ' ' + window.location.href)
            .then(() => {
                alert('Results copied to clipboard!');
            })
            .catch(err => {
                console.error('Could not copy text:', err);
            });
    }
}

function switchScreen(screenId) {
    // Remove active class from all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Add active class to target screen
    document.getElementById(screenId).classList.add('active');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== CHATBOT FUNCTIONALITY =====

let chatSessionId = 'session_' + Date.now();
let currentResults = null;
let isChatbotOpen = false;

// Initialize chatbot event listeners
function initializeChatbot() {
    const chatToggleBtn = document.getElementById('chatToggleBtn');
    const closeChatBtn = document.getElementById('closeChatBtn');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const chatInput = document.getElementById('chatInput');
    const chatbot = document.getElementById('chatbot');
    
    // Toggle chatbot
    chatToggleBtn.addEventListener('click', () => {
        chatbot.classList.add('active');
        isChatbotOpen = true;
        chatInput.focus();
    });
    
    // Close chatbot
    closeChatBtn.addEventListener('click', () => {
        chatbot.classList.remove('active');
        isChatbotOpen = false;
    });
    
    // Send message on button click
    sendChatBtn.addEventListener('click', sendChatMessage);
    
    // Send message on Enter key
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });
    
    // Handle suggestion buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('suggestion-btn')) {
            const message = e.target.dataset.message;
            chatInput.value = message;
            sendChatMessage();
        }
    });
}

async function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // Clear input
    chatInput.value = '';
    
    // Add user message to chat
    addMessageToChat(message, 'user');
    
    // Show typing indicator
    showTypingIndicator();
    
    // Hide suggestions after first message
    const suggestionsDiv = document.getElementById('chatSuggestions');
    if (suggestionsDiv.style.display !== 'none') {
        suggestionsDiv.style.display = 'none';
    }
    
    try {
        // Send message to backend
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                results: currentResults,
                session_id: chatSessionId
            })
        });
        
        const data = await response.json();
        
        // Remove typing indicator
        removeTypingIndicator();
        
        if (data.success) {
            // Add bot response to chat
            addMessageToChat(data.message, 'bot');
        } else {
            // Show error message
            addMessageToChat(data.message || 'Sorry, I encountered an error. Please try again.', 'bot');
        }
    } catch (error) {
        console.error('Chat error:', error);
        removeTypingIndicator();
        addMessageToChat('Sorry, I\'m having trouble connecting. Please check your internet connection and try again.', 'bot');
    }
}

function addMessageToChat(message, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    
    if (sender === 'bot') {
        avatar.innerHTML = '<i class="fas fa-leaf"></i>';
    } else {
        avatar.innerHTML = '<i class="fas fa-user"></i>';
    }
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    // Convert markdown-like formatting to HTML
    const formattedMessage = message
        .split('\n').map(line => {
            if (line.trim().startsWith('-')) {
                return `<li>${line.trim().substring(1).trim()}</li>`;
            }
            return `<p>${line}</p>`;
        }).join('');
    
    // Wrap list items in ul tags
    let finalHTML = formattedMessage.replace(/(<li>.*<\/li>)+/g, (match) => `<ul>${match}</ul>`);
    
    // Remove empty paragraphs
    finalHTML = finalHTML.replace(/<p><\/p>/g, '');
    
    content.innerHTML = finalHTML;
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message bot-message typing-indicator-message';
    typingDiv.id = 'typingIndicator';
    
    typingDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-leaf"></i>
        </div>
        <div class="message-content">
            <div class="typing-indicator">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Store results when they're calculated for chatbot context
const originalFinishQuiz = finishQuiz;
finishQuiz = async function() {
    await originalFinishQuiz();
    
    // Open chatbot automatically after results with a welcome message
    setTimeout(() => {
        if (!isChatbotOpen) {
            document.getElementById('chatbot').classList.add('active');
            isChatbotOpen = true;
            
            // Add a contextual welcome message
            addMessageToChat(
                "I can see your results now! I'm here to help you understand your carbon footprint and answer any questions you have about reducing your emissions. What would you like to know?",
                'bot'
            );
        }
    }, 1500);
};

// Override displayResults to capture results for chatbot
const originalDisplayResults = displayResults;
displayResults = function(data) {
    currentResults = data;
    originalDisplayResults(data);
};

// Initialize chatbot when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeChatbot();
});

