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
    document.getElementById('start-btn').addEventListener('click', startQuiz);
    
    // Retake quiz button
    document.getElementById('retake-btn').addEventListener('click', resetQuiz);
    
    // Previous question button
    document.getElementById('prev-btn').addEventListener('click', goToPreviousQuestion);
    
    // Show start screen
    showScreen('start-screen');
}

// ===================================
// Screen Navigation
// ===================================
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    
    // Update screen context for chatbot
    if (screenId === 'start-screen') {
        currentScreenContext = 'start';
        currentQuestionContext = null;
    } else if (screenId === 'quiz-screen') {
        currentScreenContext = 'quiz';
    } else if (screenId === 'results-screen') {
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
        const response = await fetch('/api/questions');
        questions = await response.json();
        
        // Reset state - create a fresh empty array
        currentQuestionIndex = 0;
        userAnswers = [];
        
        console.log(`🎯 Starting quiz with ${questions.length} questions`);
        console.log('Reset userAnswers to empty array');
        
        // Update total questions
        document.getElementById('total-questions').textContent = questions.length;
        
        // Switch to quiz screen
        showScreen('quiz-screen');
        
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
        <span id="category-name">${question.category}</span>
    `;
    
    // Update question text
    document.getElementById('question-text').textContent = question.question;
    
    // Show/hide previous button
    const prevBtn = document.getElementById('prev-btn');
    if (currentQuestionIndex === 0) {
        prevBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'inline-flex';
    }
    
    // Display answers (using options-container for bubbly UI)
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.textContent = option.text;
        
        // Check if this was previously selected
        const previousAnswer = userAnswers[currentQuestionIndex];
        if (previousAnswer && previousAnswer.optionIndex === index) {
            button.classList.add('selected');
        }
        
        button.addEventListener('click', () => selectAnswer(index, option, question));
        optionsContainer.appendChild(button);
    });
}

function selectAnswer(index, option, question) {
    // Visual feedback - select the answer
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach((btn, idx) => {
        btn.classList.remove('selected');
        if (idx === index) {
            btn.classList.add('selected');
        }
    });
    
    // Check if this is a change to a previous answer
    const previousAnswer = userAnswers[currentQuestionIndex];
    const isChangingAnswer = previousAnswer && previousAnswer.optionIndex !== index;
    
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
    
    if (isChangingAnswer) {
        console.log(`🔄 Changed answer for Question ${currentQuestionIndex + 1}:`, {
            from: previousAnswer.selectedOption,
            to: option.text
        });
    } else {
        console.log(`✅ Stored answer for Question ${currentQuestionIndex + 1}:`, userAnswers[currentQuestionIndex]);
    }
    console.log(`Total answers stored so far: ${userAnswers.filter(a => a != null).length}`);
    
    // Auto-advance to next question after a short delay
    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            displayQuestion();
        } else {
            finishQuiz();
        }
    }, 400);
}

function goToPreviousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        console.log(`⬅️ Going back to Question ${currentQuestionIndex + 1}`);
        displayQuestion();
    }
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
        
        // Prepare payload using the structure the backend expects
        const payload = {
            answers: {}
        };
        
        // Convert array to object keyed by questionId
        validAnswers.forEach(answer => {
            payload.answers[answer.questionId] = {
                category: answer.category,
                co2: answer.co2,
                text: answer.selectedOption
            };
        });
        
        console.log('Sending to backend:', payload);
        
        // Send answers to backend
        const response = await fetch('/api/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
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
        showScreen('results-screen');
        
        // Auto-open chatbot after a delay
        setTimeout(() => {
            if (!isChatbotOpen) {
                const chatbot = document.getElementById('chatbot');
                chatbot.classList.add('open');
                isChatbotOpen = true;
                
                // Add welcome message
                const totalCO2 = results.total.co2;
                const avgCO2 = results.total.average;
                const diff = totalCO2 - avgCO2;
                
                let message = "🎉 Results are in! ";
                if (diff > 0) {
                    message += `You're ${diff.toFixed(0)} kg above average. Let's find your easiest wins to close that gap! What questions do you have?`;
                } else if (diff < 0) {
                    message += `Nice work - you're ${Math.abs(diff).toFixed(0)} kg below average! Want to go even further? I've got ideas! 🌱`;
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
    document.getElementById('total-co2').textContent = data.total.co2.toLocaleString();
    document.getElementById('total-percentage').textContent = data.total.percentage;
    
    // Create results breakdown
    const categoriesContainer = document.getElementById('categories-results');
    categoriesContainer.innerHTML = '';
    
    // Display categories in priority order
    data.priority_order.forEach(categoryName => {
        const categoryData = data.categories[categoryName];
        const categoryDiv = createCategoryResult(categoryName, categoryData);
        categoriesContainer.appendChild(categoryDiv);
    });
}

function createCategoryResult(categoryName, data) {
    const iconClass = categoryIcons[categoryName];
    
    const comparisonClass = data.difference < 0 ? 'better' : 'worse';
    const comparisonText = data.difference < 0 
        ? `${Math.abs(data.difference).toFixed(0)} kg below average` 
        : `${data.difference.toFixed(0)} kg above average`;
    
    const div = document.createElement('div');
    div.className = 'category-result';
    
    div.innerHTML = `
        <div class="category-header">
            <div class="category-title-group">
                <div class="category-icon">
                    <i class="fas ${iconClass}"></i>
                </div>
                <h3>${categoryName}</h3>
            </div>
            <div class="category-co2">
                <div class="co2-value">${data.co2_annual.toLocaleString()} kg CO₂/year</div>
                <div class="co2-comparison">
                    Average: ${data.average.toLocaleString()} kg/year
                </div>
                <div class="comparison-badge ${comparisonClass}">
                    ${comparisonText}
                </div>
            </div>
        </div>
        
        <div class="tips-section">
            <h4 class="section-title">
                <i class="fas fa-lightbulb"></i>
                How to Improve
            </h4>
            <ul class="tips-list">
                ${data.tips.map(tip => `<li class="tip-item">${tip}</li>`).join('')}
            </ul>
        </div>
        
        <div class="products-section">
            <h4 class="section-title">
                <i class="fas fa-shopping-cart"></i>
                Recommended Products
            </h4>
            <div class="products-grid">
                ${data.products.map(product => `
                    <div class="product-card">
                        <div class="product-name">${product.name}</div>
                        <div class="product-description">${product.description}</div>
                        <div class="product-impact">${product.impact}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    return div;
}

function resetQuiz() {
    // Reset all state
    questions = [];
    currentQuestionIndex = 0;
    userAnswers = [];
    currentResults = null;
    currentQuestionContext = null;
    
    // Clear chat session
    chatSessionId = 'session_' + Date.now();
    const chatMessages = document.getElementById('chatMessages');
    
    // Clear all messages except the welcome message
    chatMessages.innerHTML = `
        <div class="chat-message bot-message">
            <div class="message-avatar">
                <i class="fas fa-leaf"></i>
            </div>
            <div class="message-content">
                <p>Hey! I'm EcoCoach 🌱 Your sustainability sidekick!</p>
                <p>I can help you:</p>
                <ul>
                    <li>💡 Decode quiz questions as you go</li>
                    <li>📊 Make sense of your results</li>
                    <li>🎯 Find your easiest climate wins</li>
                    <li>🌍 Answer any eco questions</li>
                </ul>
                <p>What's on your mind?</p>
            </div>
        </div>
    `;
    
    // Show suggestions again
    const suggestionsDiv = document.getElementById('chatSuggestions');
    if (suggestionsDiv) {
        suggestionsDiv.style.display = 'flex';
    }
    
    // Go back to start screen
    showScreen('start-screen');
    
    console.log('Quiz reset complete');
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
