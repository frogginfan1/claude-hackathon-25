// ===================================
// Quiz Data & State
// ===================================
let questions = [];
let currentQuestionIndex = 0;
let userAnswers = [];

// Category Icons
const categoryIcons = {
    'Home': 'fa-home',
    'Mobility': 'fa-car',
    'Food': 'fa-utensils',
    'Consumption': 'fa-shopping-bag'
};

// ===================================
// Chatbot State
// ===================================
let chatSessionId = 'session_' + Date.now();
let currentResults = null;
let isChatbotOpen = false;
let currentScreenContext = 'start';
let currentQuestionContext = null;

// ===================================
// Initialization
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    initializeChatbot();
});

function initializeApp() {
    // Start quiz button
    document.getElementById('start-quiz-btn').addEventListener('click', startQuiz);
    
    // Show landing page
    showPage('landing-page');
}

// ===================================
// Page Navigation
// ===================================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    
    // Update screen context for chatbot
    if (pageId === 'landing-page') {
        currentScreenContext = 'start';
        currentQuestionContext = null;
    } else if (pageId === 'quiz-page') {
        currentScreenContext = 'quiz';
    } else if (pageId === 'results-page') {
        currentScreenContext = 'results';
        currentQuestionContext = null;
        console.log('✅ Switched to Results - Question context cleared');
    }
    
    // Update chatbot status if open
    if (isChatbotOpen) {
        updateChatbotStatus();
    }
}

// ===================================
// Quiz Logic
// ===================================
async function startQuiz() {
    try {
        // Fetch questions from backend
        const response = await fetch('/get-questions');
        questions = await response.json();
        
        // Reset state - create a fresh empty array
        currentQuestionIndex = 0;
        userAnswers = [];
        
        console.log(`🎯 Starting quiz with ${questions.length} questions`);
        console.log('Reset userAnswers to empty array');
        
        // Update total questions
        document.getElementById('total-questions').textContent = questions.length;
        
        // Switch to quiz screen
        showPage('quiz-page');
        
        // Display first question
        displayQuestion();
    } catch (error) {
        console.error('Error loading questions:', error);
        alert('Failed to load quiz questions. Please try again.');
    }
}

function displayQuestion() {
    const question = questions[currentQuestionIndex];
    
    // Update current question context for chatbot
    currentQuestionContext = {
        number: currentQuestionIndex + 1,
        total: questions.length,
        category: question.category,
        question: question.question,
        options: question.options.map(opt => opt.text)
    };
    
    console.log('✅ Question context updated:', currentQuestionContext);
    
    // Update chatbot status if it's open
    if (isChatbotOpen) {
        updateChatbotStatus();
    }
    
    // Update progress
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    document.getElementById('progress-fill').style.width = `${progress}%`;
    document.getElementById('current-question').textContent = currentQuestionIndex + 1;
    
    // Update category badge
    const iconClass = categoryIcons[question.category];
    const categoryBadge = document.getElementById('category-badge');
    categoryBadge.innerHTML = `
        <i class="fas ${iconClass}"></i>
        <span>${question.category}</span>
    `;
    
    // Update question text
    document.getElementById('question-text').textContent = question.question;
    
    // Display answers
    const answersContainer = document.getElementById('answers-container');
    answersContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'answer-option';
        button.textContent = option.text;
        
        // Check if this was previously selected
        const previousAnswer = userAnswers[currentQuestionIndex];
        if (previousAnswer && previousAnswer.optionIndex === index) {
            button.classList.add('selected');
        }
        
        button.addEventListener('click', () => selectAnswer(index, option, question));
        answersContainer.appendChild(button);
    });
}

function selectAnswer(index, option, question) {
    // Visual feedback - select the answer
    const buttons = document.querySelectorAll('.answer-option');
    buttons.forEach((btn, idx) => {
        btn.classList.remove('selected');
        if (idx === index) {
            btn.classList.add('selected');
        }
    });
    
    // Store answer with question number and text for chatbot context
    userAnswers[currentQuestionIndex] = {
        questionId: question.id,
        questionNumber: currentQuestionIndex + 1,
        questionText: question.question,
        category: question.category,
        optionIndex: index,
        selectedOption: option.text,
        co2: option.co2
    };
    
    console.log(`✅ Stored answer for Question ${currentQuestionIndex + 1}:`, userAnswers[currentQuestionIndex]);
    console.log(`Total answers stored so far: ${userAnswers.filter(a => a != null).length}`);
    
    // Auto-advance to next question after a short delay
    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            displayQuestion();
        } else {
            finishQuiz();
        }
    }, 300);
}

async function finishQuiz() {
    try {
        // Filter out any undefined/null values from userAnswers
        const validAnswers = userAnswers.filter(answer => answer != null && answer !== undefined);
        
        console.log('📊 FINAL QUIZ SUBMISSION:');
        console.log('Raw userAnswers array:', userAnswers);
        console.log('Filtered valid answers:', validAnswers);
        console.log('Original array length:', userAnswers.length, 'Valid answers:', validAnswers.length);
        console.log('Question numbers in submission:', validAnswers.map(a => a.questionNumber));
        
        // Send answers to backend
        const response = await fetch('/calculate-results', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ answers: validAnswers })
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error:', errorText);
            throw new Error(`Server returned ${response.status}`);
        }
        
        const results = await response.json();
        console.log('Results received:', results);
        
        // Store results for chatbot
        currentResults = results;
        
        // Display results
        displayResults(results);
        
        // Switch to results screen
        showPage('results-page');
        
        // Auto-open chatbot after a delay
        setTimeout(() => {
            if (!isChatbotOpen) {
                const chatbot = document.getElementById('chatbot');
                chatbot.classList.add('open');
                isChatbotOpen = true;
                
                // Add welcome message
                const diff = currentResults.total_difference;
                let message = "🎉 Results are in! ";
                if (diff > 0) {
                    message += `You're ${diff} kg above average. Let's find your easiest wins to close that gap! What questions do you have?`;
                } else if (diff < 0) {
                    message += `Nice work - you're ${Math.abs(diff)} kg below average! Want to go even further? I've got ideas! 🌱`;
                } else {
                    message += "You're right at average. Ready to level up your eco-game? Let's chat!";
                }
                
                addMessageToChat(message, 'bot');
                updateChatbotStatus();
            }
        }, 1500);
    } catch (error) {
        console.error('Error calculating results:', error);
        alert('Failed to calculate results. Please try again.');
    }
}

function displayResults(data) {
    // Update total emissions
    document.getElementById('total-co2').textContent = `${data.total_emissions.toLocaleString()} kg CO2`;
    
    // Create results breakdown
    const breakdownContainer = document.getElementById('results-breakdown');
    breakdownContainer.innerHTML = '';
    
    data.results.forEach(result => {
        const categoryDiv = createCategoryResult(result);
        breakdownContainer.appendChild(categoryDiv);
    });
}

function createCategoryResult(result) {
    const iconClass = categoryIcons[result.category];
    const average = result.average || 0;
    
    // Calculate percentages for bar chart
    const maxValue = Math.max(result.emissions, average) * 1.2;
    const userPercent = (result.emissions / maxValue) * 100;
    const avgPercent = (average / maxValue) * 100;
    
    const div = document.createElement('div');
    div.className = 'category-result';
    
    div.innerHTML = `
        <div class="category-result-header">
            <div class="category-info">
                <div class="category-icon">
                    <i class="fas ${iconClass}"></i>
                </div>
                <h3 class="category-name">${result.category}</h3>
            </div>
            <div class="category-emissions">
                <div class="emissions-label">Your Daily Emissions</div>
                <div class="emissions-value">${result.emissions.toFixed(1)} kg CO2</div>
            </div>
        </div>
        
        <div class="comparison-bar">
            <div class="comparison-label">
                <span>You: ${result.emissions.toFixed(1)} kg</span>
                <span>Average: ${average.toFixed(1)} kg</span>
            </div>
            <div class="bar-container">
                <div class="bar-average" style="width: ${avgPercent}%"></div>
                <div class="bar-user" style="width: ${userPercent}%"></div>
            </div>
        </div>
        
        <div class="recommendations">
            <h4 class="recommendations-title">
                <i class="fas fa-lightbulb"></i> Recommendations
            </h4>
            <div class="recommendation-list">
                ${result.tips.map(tip => `
                    <div class="recommendation-item">
                        <div class="recommendation-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="recommendation-text">${tip}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="products">
            <h4 class="products-title">
                <i class="fas fa-shopping-cart"></i> Recommended Products
            </h4>
            <div class="product-grid">
                ${result.products.map(product => `
                    <a href="${product.link}" class="product-card" target="_blank" rel="noopener">
                        <div class="product-image">
                            ${product.image ? `<img src="${product.image}" alt="${product.name}" />` : `<i class="fas ${iconClass}"></i>`}
                        </div>
                        <div class="product-name">${product.name}</div>
                        <div class="product-price">${product.price}</div>
                    </a>
                `).join('')}
            </div>
        </div>
    `;
    
    return div;
}

// ===================================
// Chatbot Functionality
// ===================================
function initializeChatbot() {
    const chatToggleBtn = document.getElementById('chatToggleBtn');
    const closeChatBtn = document.getElementById('closeChatBtn');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const chatInput = document.getElementById('chatInput');
    const chatbot = document.getElementById('chatbot');
    
    // Toggle chatbot
    chatToggleBtn.addEventListener('click', () => {
        chatbot.classList.add('open');
        isChatbotOpen = true;
        chatInput.focus();
        
        console.log('Chatbot opened - Current context:', {
            screen: currentScreenContext,
            question: currentQuestionContext
        });
        
        updateChatbotStatus();
    });
    
    // Close chatbot
    closeChatBtn.addEventListener('click', () => {
        chatbot.classList.remove('open');
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
    if (suggestionsDiv && suggestionsDiv.style.display !== 'none') {
        suggestionsDiv.style.display = 'none';
    }
    
    try {
        // Prepare context data
        // Filter out null/undefined from userAnswers before sending
        const validAnswers = userAnswers ? userAnswers.filter(a => a != null) : null;
        
        const contextData = {
            message: message,
            results: currentResults,
            session_id: chatSessionId,
            screen_context: currentScreenContext,
            current_question: currentQuestionContext,
            user_answers: validAnswers
        };
        
        console.log('Sending to chatbot:', contextData);
        
        // Send message to backend
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(contextData)
        });
        
        // Check if response is OK
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Remove typing indicator
        hideTypingIndicator();
        
        if (data.success) {
            addMessageToChat(data.message, 'bot');
        } else {
            addMessageToChat(data.message || 'Sorry, I encountered an error. Please try again.', 'bot');
        }
    } catch (error) {
        console.error('Chat error:', error);
        hideTypingIndicator();
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
    
    // Clean and format the message
    let formattedMessage = message
        // Remove markdown bold/italic
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/\_\_(.+?)\_\_/g, '$1')
        .replace(/\_(.+?)\_/g, '$1');
    
    // Split into lines and convert to HTML
    const lines = formattedMessage.split('\n');
    let html = '';
    let inList = false;
    
    for (let line of lines) {
        const trimmed = line.trim();
        
        // Handle bullet points
        if (trimmed.match(/^[-•\*]\s/)) {
            if (!inList) {
                html += '<ul>';
                inList = true;
            }
            html += `<li>${trimmed.substring(1).trim()}</li>`;
        }
        // Handle numbered lists
        else if (trimmed.match(/^\d+\.\s/)) {
            if (!inList) {
                html += '<ul>';
                inList = true;
            }
            html += `<li>${trimmed.replace(/^\d+\.\s/, '')}</li>`;
        }
        // Regular paragraph
        else if (trimmed) {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            html += `<p>${trimmed}</p>`;
        }
    }
    
    // Close any open list
    if (inList) {
        html += '</ul>';
    }
    
    content.innerHTML = html;
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.style.display = 'flex';
        
        // Scroll to bottom
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.style.display = 'none';
    }
}

function updateChatbotStatus() {
    const statusEl = document.getElementById('chatbotStatus');
    if (!statusEl) return;
    
    if (currentScreenContext === 'quiz' && currentQuestionContext) {
        statusEl.textContent = `💬 Here to help with the quiz`;
    } else if (currentScreenContext === 'results') {
        statusEl.textContent = '📊 Analyzing your results';
    } else {
        statusEl.textContent = '🌱 Your sustainability guide';
    }
}
