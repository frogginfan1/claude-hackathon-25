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
    
    # Initialize conversation history for this session if not exists
    if session_id not in conversation_history:
        conversation_history[session_id] = []
    
    # Build system prompt based on context
    system_prompt = """You are EcoCoach, a friendly and knowledgeable sustainability assistant for the EcoTrace carbon footprint quiz application. Your role is to:

1. **Help users understand their carbon footprint results** - Explain what their emissions mean, why certain categories are high/low, and provide personalized advice
2. **Answer quiz questions** - Help users understand what each quiz question means, provide context, and help them make informed choices
3. **Provide general sustainability advice** - Answer any questions about climate change, sustainability, eco-friendly living, carbon emissions, etc.
4. **Be encouraging and positive** - Focus on achievable actions, celebrate small wins, and motivate users to make sustainable choices

Guidelines:
- Keep responses concise (2-4 sentences for simple questions, longer for complex ones)
- Use relatable examples and practical advice
- Cite specific numbers when discussing carbon emissions
- Be empathetic and non-judgmental about current habits
- Emphasize that every small action matters
- Use emojis sparingly for friendliness 🌱

If the user has quiz results available, reference their specific data when relevant."""

    # Add user results context if available
    if user_results:
        results_context = f"\n\nUser's Current Results:\n"
        results_context += f"- Total Emissions: {user_results.get('total_emissions', 'N/A')} kg CO₂/year\n"
        results_context += f"- Average Emissions: {user_results.get('total_average', 'N/A')} kg CO₂/year\n"
        if 'results' in user_results:
            results_context += "\nBreakdown by Category:\n"
            for result in user_results['results']:
                results_context += f"- {result['category']}: {result['emissions']} kg CO₂/year "
                results_context += f"({'+' if result['difference'] > 0 else ''}{result['difference']} kg vs average)\n"
        system_prompt += results_context
    
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)

