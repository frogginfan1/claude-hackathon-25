from flask import Flask, render_template, request, jsonify, session
import random
import os
from anthropic import Anthropic

app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'dev-secret-key-change-in-production')

# Initialize Claude API client
anthropic_client = Anthropic(
    api_key=os.environ.get('ANTHROPIC_API_KEY', '')
)

# Store conversation history per session
conversation_history = {}

# Quiz questions database
QUESTIONS = {
    "Home": [
        {
            "id": 1,
            "question": "What is your average monthly electricity consumption?",
            "options": [
                {"text": "Less than 200 kWh", "co2": 80},
                {"text": "200-400 kWh", "co2": 200},
                {"text": "400-600 kWh", "co2": 320},
                {"text": "More than 600 kWh", "co2": 480}
            ]
        },
        {
            "id": 2,
            "question": "What type of heating do you primarily use?",
            "options": [
                {"text": "Solar/Geothermal", "co2": 50},
                {"text": "Electric heat pump", "co2": 150},
                {"text": "Natural gas", "co2": 400},
                {"text": "Oil/Coal", "co2": 600}
            ]
        },
        {
            "id": 3,
            "question": "How well insulated is your home?",
            "options": [
                {"text": "Excellent (New/Renovated)", "co2": 100},
                {"text": "Good", "co2": 200},
                {"text": "Average", "co2": 350},
                {"text": "Poor (Drafty, old windows)", "co2": 500}
            ]
        }
    ],
    "Mobility": [
        {
            "id": 4,
            "question": "How many kilometers do you travel per week?",
            "options": [
                {"text": "Less than 50 km", "co2": 100},
                {"text": "50-150 km", "co2": 250},
                {"text": "150-300 km", "co2": 450},
                {"text": "More than 300 km", "co2": 700}
            ]
        },
        {
            "id": 5,
            "question": "What is your primary mode of transportation?",
            "options": [
                {"text": "Walking/Cycling", "co2": 0},
                {"text": "Public transport", "co2": 150},
                {"text": "Electric vehicle", "co2": 200},
                {"text": "Gasoline/Diesel car", "co2": 600}
            ]
        },
        {
            "id": 6,
            "question": "How many flights do you take per year?",
            "options": [
                {"text": "None", "co2": 0},
                {"text": "1-2 short flights", "co2": 300},
                {"text": "3-5 flights", "co2": 800},
                {"text": "More than 5 or long-haul", "co2": 1500}
            ]
        }
    ],
    "Food": [
        {
            "id": 7,
            "question": "How often do you eat red meat (beef, lamb)?",
            "options": [
                {"text": "Never (Vegetarian/Vegan)", "co2": 100},
                {"text": "Once a week", "co2": 300},
                {"text": "3-4 times a week", "co2": 600},
                {"text": "Daily", "co2": 1000}
            ]
        },
        {
            "id": 8,
            "question": "What percentage of your food is locally sourced?",
            "options": [
                {"text": "More than 75%", "co2": 100},
                {"text": "50-75%", "co2": 200},
                {"text": "25-50%", "co2": 350},
                {"text": "Less than 25%", "co2": 500}
            ]
        },
        {
            "id": 9,
            "question": "How much food do you waste per week?",
            "options": [
                {"text": "Almost none (compost/reuse)", "co2": 50},
                {"text": "Small amount", "co2": 150},
                {"text": "Moderate amount", "co2": 300},
                {"text": "Significant amount", "co2": 500}
            ]
        }
    ],
    "Consumption": [
        {
            "id": 10,
            "question": "How often do you buy new clothes?",
            "options": [
                {"text": "Rarely (2nd hand only)", "co2": 50},
                {"text": "Few times a year", "co2": 150},
                {"text": "Monthly", "co2": 350},
                {"text": "Weekly", "co2": 600}
            ]
        },
        {
            "id": 11,
            "question": "How often do you buy new electronics/gadgets?",
            "options": [
                {"text": "Only when necessary", "co2": 100},
                {"text": "Every 3-4 years", "co2": 200},
                {"text": "Every 1-2 years", "co2": 400},
                {"text": "Latest models always", "co2": 700}
            ]
        },
        {
            "id": 12,
            "question": "How do you handle packaging and recycling?",
            "options": [
                {"text": "Zero-waste focused, comprehensive recycling", "co2": 50},
                {"text": "Regular recycling", "co2": 150},
                {"text": "Occasional recycling", "co2": 300},
                {"text": "Rarely recycle", "co2": 500}
            ]
        }
    ]
}

# Average CO2 emissions per category (kg CO2/year)
AVERAGE_EMISSIONS = {
    "Home": 2000,
    "Mobility": 2500,
    "Food": 2000,
    "Consumption": 1500
}

# Product recommendations based on category
PRODUCTS = {
    "Home": [
        {
            "name": "Smart Thermostat - Nest Learning",
            "description": "Reduces heating costs by 10-12%",
            "price": "$249",
            "link": "#",
            "image": "https://images.unsplash.com/photo-1558002038-1055907df827?w=400&h=300&fit=crop"
        },
        {
            "name": "LED Smart Bulbs (4-Pack)",
            "description": "75% less energy than traditional bulbs",
            "price": "$45",
            "link": "#",
            "image": "https://images.unsplash.com/photo-1567226475328-9d6baaf565cf?w=400&h=300&fit=crop"
        },
        {
            "name": "Window Insulation Kit",
            "description": "Reduces heat loss by up to 55%",
            "price": "$29",
            "link": "#",
            "image": "https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?w=400&h=300&fit=crop"
        }
    ],
    "Mobility": [
        {
            "name": "Electric Bike Conversion Kit",
            "description": "Transform your bike, reduce car trips",
            "price": "$599",
            "link": "#",
            "image": "https://images.unsplash.com/photo-1571333250630-f0230c320b6d?w=400&h=300&fit=crop"
        },
        {
            "name": "Public Transport Annual Pass",
            "description": "Unlimited travel, zero emissions guilt",
            "price": "$1,200/year",
            "link": "#",
            "image": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=300&fit=crop"
        },
        {
            "name": "Carbon Offset - Flight Credits",
            "description": "Offset your annual flight emissions",
            "price": "$50-200",
            "link": "#",
            "image": "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=300&fit=crop"
        }
    ],
    "Food": [
        {
            "name": "Indoor Herb Garden Kit",
            "description": "Grow your own fresh herbs year-round",
            "price": "$89",
            "link": "#",
            "image": "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400&h=300&fit=crop"
        },
        {
            "name": "Reusable Food Storage Set",
            "description": "Eliminate single-use plastic",
            "price": "$35",
            "link": "#",
            "image": "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=400&h=300&fit=crop"
        },
        {
            "name": "Compost Bin - Kitchen Counter",
            "description": "Turn food scraps into garden gold",
            "price": "$75",
            "link": "#",
            "image": "https://images.unsplash.com/photo-1572297794821-4c1cf7f7f943?w=400&h=300&fit=crop"
        }
    ],
    "Consumption": [
        {
            "name": "Reusable Shopping Bags Set",
            "description": "Durable, washable, replaces 1000s of plastic bags",
            "price": "$25",
            "link": "#",
            "image": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=300&fit=crop"
        },
        {
            "name": "Bamboo Toothbrush Set (10-Pack)",
            "description": "Biodegradable alternative to plastic",
            "price": "$18",
            "link": "#",
            "image": "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=400&h=300&fit=crop"
        },
        {
            "name": "Stainless Steel Water Bottle",
            "description": "Insulated, eliminates 156 plastic bottles/year",
            "price": "$32",
            "link": "#",
            "image": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=300&fit=crop"
        }
    ]
}

# Tips for reducing emissions
TIPS = {
    "Home": [
        "Switch to LED bulbs throughout your home (saves ~100 kg CO2/year)",
        "Install a smart thermostat to optimize heating/cooling",
        "Improve insulation in walls, attic, and around windows",
        "Use cold water for laundry when possible",
        "Unplug devices when not in use to eliminate phantom power drain",
        "Consider switching to renewable energy providers"
    ],
    "Mobility": [
        "Walk or bike for trips under 3 km",
        "Use public transportation whenever possible",
        "Carpool with colleagues or neighbors",
        "Combine errands into one trip to reduce total distance",
        "Consider an electric or hybrid vehicle for your next car",
        "Avoid unnecessary flights; choose trains for shorter distances"
    ],
    "Food": [
        "Reduce red meat consumption to once per week or less",
        "Buy seasonal and locally-sourced produce",
        "Plan meals to minimize food waste",
        "Start composting organic waste",
        "Choose products with minimal packaging",
        "Grow your own herbs or vegetables if possible"
    ],
    "Consumption": [
        "Buy second-hand clothes and electronics when possible",
        "Repair items instead of replacing them",
        "Choose quality products that last longer",
        "Recycle properly and learn your local recycling guidelines",
        "Avoid single-use plastics; carry reusable alternatives",
        "Support companies with strong sustainability practices"
    ]
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get-questions', methods=['GET'])
def get_questions():
    """Return randomized questions"""
    all_questions = []
    for category, questions in QUESTIONS.items():
        for q in questions:
            q_copy = q.copy()
            q_copy['category'] = category
            all_questions.append(q_copy)
    
    random.shuffle(all_questions)
    return jsonify(all_questions)

@app.route('/calculate-results', methods=['POST'])
def calculate_results():
    """Calculate CO2 emissions and provide recommendations"""
    data = request.json
    answers = data.get('answers', [])
    
    # Calculate emissions by category
    category_emissions = {
        "Home": 0,
        "Mobility": 0,
        "Food": 0,
        "Consumption": 0
    }
    
    for answer in answers:
        category = answer['category']
        co2 = answer['co2']
        category_emissions[category] += co2
    
    # Convert monthly/weekly to annual
    for category in category_emissions:
        category_emissions[category] = round(category_emissions[category] * 12)  # Approximate annual
    
    # Calculate differences from average
    differences = {}
    for category, emissions in category_emissions.items():
        diff = emissions - AVERAGE_EMISSIONS[category]
        differences[category] = {
            "emissions": emissions,
            "average": AVERAGE_EMISSIONS[category],
            "difference": diff,
            "percentage": round((diff / AVERAGE_EMISSIONS[category]) * 100)
        }
    
    # Sort categories by how far from average (worst first)
    sorted_categories = sorted(
        differences.items(),
        key=lambda x: abs(x[1]['difference']),
        reverse=True
    )
    
    # Prepare response with tips and products
    results = []
    for category, data in sorted_categories:
        results.append({
            "category": category,
            "emissions": data["emissions"],
            "average": data["average"],
            "difference": data["difference"],
            "percentage": data["percentage"],
            "tips": TIPS[category][:3],  # Top 3 tips
            "products": PRODUCTS[category]
        })
    
    total_emissions = sum(category_emissions.values())
    total_average = sum(AVERAGE_EMISSIONS.values())
    
    return jsonify({
        "results": results,
        "total_emissions": total_emissions,
        "total_average": total_average,
        "total_difference": total_emissions - total_average
    })

@app.route('/chat', methods=['POST'])
def chat():
    """Handle chatbot interactions using Claude API"""
    data = request.json
    user_message = data.get('message', '')
    user_results = data.get('results', None)
    session_id = data.get('session_id', 'default')
    screen_context = data.get('screen_context', 'unknown')
    current_question = data.get('current_question', None)
    user_answers = data.get('user_answers', None)
    
    # Debug logging
    print(f"\n=== CHAT REQUEST ===")
    print(f"Screen Context: '{screen_context}'")
    print(f"Current Question Type: {type(current_question)}")
    print(f"Current Question Value: {current_question}")
    print(f"Current Question Bool: {bool(current_question)}")
    if current_question:
        print(f"Question Details: number={current_question.get('number')}, category={current_question.get('category')}")
    print(f"User Message: {user_message}")
    print(f"Full Request Data: {data}")
    print(f"===================\n")
    
    # Initialize conversation history for this session if not exists
    if session_id not in conversation_history:
        conversation_history[session_id] = []
    
    # Build system prompt based on context - Make it engaging and concise!
    system_prompt = """You are EcoCoach 🌱 - a witty, enthusiastic sustainability expert who makes eco-living feel exciting, not overwhelming!

YOUR PERSONALITY:
- Conversational & fun (think: helpful friend, not boring textbook)
- Direct and punchy (2-3 sentences for simple q's, max 5 for complex)
- Use vivid comparisons ("That's like driving to the moon!" or "Saves enough energy to charge your phone 500 times!")
- Encouraging but honest - celebrate wins, gently nudge on big impacts
- Strategic emoji use for emphasis (but don't overdo it)

RESPONSE RULES:
1. **BE CONCISE** - Get to the point fast. No fluff.
2. **BE SPECIFIC** - Real numbers, real actions, real impact
3. **BE MEMORABLE** - Use analogies people remember
4. **BE ACTIONABLE** - Always include a "next step" when relevant
5. **BE CONTEXTUAL** - Reference what they're looking at RIGHT NOW

CONVERSATION STYLE:
❌ "Your emissions are higher than average. You should consider making changes."
✅ "Whoa! You're 500kg above average - that's like an extra round-trip flight to NYC each year. Want to tackle the biggest win first?"

❌ "Composting reduces methane emissions from landfills."
✅ "Compost turns trash into treasure! Plus it saves ~150kg CO₂/year - that's like planting 7 trees. 🌳"
"""

    # Add screen-specific context
    if screen_context == 'start':
        system_prompt += "\n\n📍 USER IS ON: Landing page (hasn't started quiz yet)\nHelp them understand what the quiz does or answer sustainability basics."
    
    elif screen_context == 'quiz':
        # Check if current_question exists and has data
        has_question = current_question and isinstance(current_question, dict) and current_question.get('question')
        
        if has_question:
            q_num = current_question.get('number', '?')
            q_total = current_question.get('total', '?')
            q_category = current_question.get('category', 'Unknown')
            q_text = current_question.get('question', 'Unknown')
            q_options = current_question.get('options', [])
            
            system_prompt += f"\n\n🚨 THE USER IS LOOKING AT THIS EXACT QUESTION 🚨"
            system_prompt += f"\n\n📍 QUESTION {q_num} of {q_total}"
            system_prompt += f"\n📂 Category: {q_category}"
            system_prompt += f"\n❓ Question: \"{q_text}\""
            system_prompt += f"\n\n📋 THEIR 4 OPTIONS:"
            for i, opt in enumerate(q_options, 1):
                system_prompt += f"\n   {i}. {opt}"
            
            system_prompt += "\n\n🎯 ABSOLUTE RULES:"
            system_prompt += f"\n1. ONLY reference Question {q_num} - DO NOT make up other question numbers"
            system_prompt += f"\n2. The question is about: \"{q_text}\" - DO NOT change the topic"
            system_prompt += f"\n3. ONLY mention these {len(q_options)} options listed above"
            system_prompt += "\n4. DO NOT ask which question they're on - you already know!"
            system_prompt += "\n5. Keep it concise: 2-3 sentences max, then list options briefly"
            system_prompt += "\n6. NO bold (**), NO headings - just plain text with line breaks and bullet points"
            
            system_prompt += "\n\n✅ GOOD Response Format:"
            system_prompt += f"\n\"Perfect! Question {q_num} is about {q_category.lower()}. Here's the impact:\n\n"
            system_prompt += "\n• Option 1: [1 sentence impact]\n"
            system_prompt += "\n• Option 2: [1 sentence impact]\n"
            system_prompt += "\n\nPick what matches your habits!\""
        else:
            system_prompt += f"\n\n📍 USER IS ON: Quiz screen BUT question context is missing or invalid"
            system_prompt += f"\nDEBUG: current_question type = {type(current_question)}, value = {current_question}"
            system_prompt += "\n\n⚠️ IMPORTANT: Include this debug info in your response:"
            system_prompt += f"\n'DEBUG: I received current_question as: {current_question} (type: {type(current_question)})'"
            system_prompt += "\nThen politely ask them to tell you which question they're looking at."
    
    elif screen_context == 'results':
        system_prompt += "\n\n📍 USER IS ON: Results page (quiz is COMPLETE)"
        system_prompt += "\nThey're viewing their full carbon footprint breakdown with all categories."
        system_prompt += "\n\n🎯 RULES FOR RESULTS PAGE:"
        system_prompt += "\n1. DO NOT reference quiz questions - the quiz is finished"
        system_prompt += "\n2. Focus on their RESULTS and actionable next steps"
        system_prompt += "\n3. Help them understand their emissions by category"
        system_prompt += "\n4. Suggest which category to tackle first (highest difference from average)"
        system_prompt += "\n5. Reference SPECIFIC tips and products shown on their results"
        system_prompt += "\n6. When asked for advice, mention actual product names and prices from their recommendations"
        system_prompt += "\n7. When asked WHY their emissions are high, reference their SPECIFIC QUIZ ANSWERS"
        system_prompt += "\n8. Be encouraging about the changes they can make"
        system_prompt += "\n\n💡 EXAMPLES:"
        system_prompt += "\n• 'Try the Smart Thermostat ($249) - it could cut your Home emissions by 10-12%!'"
        system_prompt += "\n• 'I see you have high Mobility emissions. The tips recommend carpooling or an electric vehicle.'"
        system_prompt += "\n• 'Your high Mobility score is because you answered \"Gasoline/Diesel car\" for transportation (600 kg).'"
        system_prompt += "\n• 'Your Food category is great! The compost bin ($75) could make it even better.'"

    # Add user results context if available
    if user_results:
        results_context = f"\n\n📊 USER'S CARBON FOOTPRINT:\n"
        results_context += f"Total: {user_results.get('total_emissions', 'N/A')} kg CO₂/year (Avg: {user_results.get('total_average', 'N/A')})\n"
        diff = user_results.get('total_difference', 0)
        if diff > 0:
            results_context += f"⚠️ {diff} kg ABOVE average\n"
        elif diff < 0:
            results_context += f"🎉 {abs(diff)} kg BELOW average!\n"
        
        if 'results' in user_results:
            results_context += "\nCategory Breakdown (sorted by priority):\n"
            for idx, result in enumerate(user_results['results'], 1):
                emoji = "🔴" if result['difference'] > 0 else "🟢"
                results_context += f"\n{idx}. {emoji} {result['category']}: {result['emissions']} kg (avg: {result['average']}, diff: {result['difference']:+d} kg)"
                
                # Add tips for this category
                if 'tips' in result and result['tips']:
                    results_context += f"\n   Recommended Actions for {result['category']}:"
                    for tip_idx, tip in enumerate(result['tips'], 1):
                        results_context += f"\n   • {tip}"
                
                # Add products for this category
                if 'products' in result and result['products']:
                    results_context += f"\n   Recommended Products for {result['category']}:"
                    for prod in result['products']:
                        results_context += f"\n   • {prod['name']} - {prod['price']}: {prod['description']}"
                
                results_context += "\n"
        
        results_context += "\n💡 You can reference specific tips or products when answering user questions!"
        system_prompt += results_context
    
    # Add user's quiz answers if available
    if user_answers and isinstance(user_answers, list):
        answers_context = f"\n\n📝 USER'S QUIZ ANSWERS:\n"
        answers_context += "Here are the specific choices they made:\n"
        
        # Group answers by category
        answers_by_category = {}
        for answer in user_answers:
            category = answer.get('category', 'Unknown')
            if category not in answers_by_category:
                answers_by_category[category] = []
            answers_by_category[category].append(answer)
        
        # Display answers by category
        for category in ['Home', 'Mobility', 'Food', 'Consumption']:
            if category in answers_by_category:
                answers_context += f"\n{category}:"
                for answer in answers_by_category[category]:
                    q_id = answer.get('questionId', '?')
                    co2 = answer.get('co2', 0)
                    option_idx = answer.get('optionIndex', '?')
                    
                    # Get the actual question text and option from QUESTIONS database
                    if category in QUESTIONS:
                        for q in QUESTIONS[category]:
                            if q['id'] == q_id and option_idx < len(q['options']):
                                question_text = q['question']
                                selected_option = q['options'][option_idx]['text']
                                answers_context += f"\n  • Q: \"{question_text}\""
                                answers_context += f"\n    Answered: \"{selected_option}\" (adds {co2} kg CO₂)"
        
        answers_context += "\n\n💡 Use this to explain EXACTLY which choices contributed to their emissions!"
        answers_context += "\n   Example: 'Your high Mobility score comes from choosing [specific answer]'"
        system_prompt += answers_context
    
    # Add user message to history
    conversation_history[session_id].append({
        "role": "user",
        "content": user_message
    })
    
    try:
        # Call Claude API
        response = anthropic_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=system_prompt,
            messages=conversation_history[session_id]
        )
        
        # Extract assistant's response
        assistant_message = response.content[0].text
        
        # Add assistant response to history
        conversation_history[session_id].append({
            "role": "assistant",
            "content": assistant_message
        })
        
        # Keep only last 10 messages to prevent context overflow
        if len(conversation_history[session_id]) > 10:
            conversation_history[session_id] = conversation_history[session_id][-10:]
        
        return jsonify({
            "success": True,
            "message": assistant_message,
            "session_id": session_id
        })
    
    except Exception as e:
        print(f"Error calling Claude API: {e}")
        # Fallback response if API fails
        return jsonify({
            "success": False,
            "message": "I'm having trouble connecting right now. Please make sure your ANTHROPIC_API_KEY is set correctly. In the meantime, feel free to explore your results and try the quiz again!",
            "error": str(e)
        })

@app.route('/clear-chat', methods=['POST'])
def clear_chat():
    """Clear conversation history for a session"""
    data = request.json
    session_id = data.get('session_id', 'default')
    
    if session_id in conversation_history:
        del conversation_history[session_id]
    
    return jsonify({"success": True})

@app.route('/debug-context', methods=['POST'])
def debug_context():
    """Debug endpoint to see what context is being received"""
    data = request.json
    return jsonify({
        "received": {
            "screen_context": data.get('screen_context'),
            "current_question": data.get('current_question'),
            "has_question": bool(data.get('current_question')),
            "question_type": str(type(data.get('current_question'))),
            "full_data": data
        }
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)

