"""
Train CatBoost model and export for Flask app
Run this script to generate model.cbm, encoders.pkl, and scalers.pkl
"""

import numpy as np
import pandas as pd
import pickle
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
import catboost as cb

# Load data
df = pd.read_csv("/Users/dickyning/Downloads/Carbon Emission.csv")

# Rename columns
df.columns = ['Body Type', 'Sex', 'Diet', 'Shower', 'Heating', 'Transport', 'Vehicle', 'Social', 'Grocery', 'Flight', 'Vehicle Distance',
              'Bag Size', 'Waste Weekly', 'TV Daily Hour', 'Clothes Monthly', 'Internet Daily', 'Energy Eff', 'Recycling', 'Cooking',
              'CarbonEmission']

# Replace NaN
df.replace(np.nan, 'None', inplace=True)

# Parse recycling and cooking
import ast
df['Recycling'] = df['Recycling'].apply(ast.literal_eval)
recycling_items = list(set(item for sublist in df['Recycling'] for item in sublist))

df['Cooking'] = df['Cooking'].apply(ast.literal_eval)
cooking_items = list(set(item for sublist in df['Cooking'] for item in sublist))

# Create binary columns
for item in recycling_items:
    df[item] = df['Recycling'].apply(lambda x: 1 if item in x else 0)

for item in cooking_items:
    df[item] = df['Cooking'].apply(lambda x: 1 if item in x else 0)

df = df.drop(columns=['Recycling', 'Cooking'])

# Define column types
cat_col = ['Body Type', 'Sex', 'Diet', 'Shower', 'Heating', 'Transport', 'Vehicle', 'Social','Flight', 'Bag Size',
           'Energy Eff', 'Plastic', 'Glass', 'Metal', 'Paper', 'Microwave', 'Oven', 'Stove', 'Airfryer', 'Grill']
num_col = ['Grocery', 'Vehicle Distance', 'Waste Weekly', 'TV Daily Hour', 'Internet Daily', 'Clothes Monthly']

# Label encoding
encoders = {}
for col in cat_col:
    encoder = LabelEncoder()
    df[col] = encoder.fit_transform(df[col])
    encoders[col] = encoder

# Standard scaling
scalers = {}
for column in num_col:
    scaler = StandardScaler()
    df[column] = scaler.fit_transform(df[[column]])
    scalers[column] = scaler

# Split data
X = df.drop('CarbonEmission', axis=1)
y = df['CarbonEmission']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
print("Training CatBoost model...")
catboost_model = cb.CatBoostRegressor(
    iterations=1000,
    learning_rate=0.1,
    depth=5,
    eval_metric='RMSE',
    cat_features=[0, 1, 2, 3, 4, 5, 6],  # Indices of categorical features
    verbose=100
)

catboost_model.fit(X_train, y_train, eval_set=(X_test, y_test), early_stopping_rounds=100)

# Save model
model_path = 'model.cbm'
catboost_model.save_model(model_path)
print(f"\n✅ Model saved to {model_path}")

# Save encoders
with open('encoders.pkl', 'wb') as f:
    pickle.dump(encoders, f)
print("✅ Encoders saved to encoders.pkl")

# Save scalers
with open('scalers.pkl', 'wb') as f:
    pickle.dump(scalers, f)
print("✅ Scalers saved to scalers.pkl")

# Save feature order for reference
feature_order = list(X.columns)
with open('feature_order.pkl', 'wb') as f:
    pickle.dump(feature_order, f)
print("✅ Feature order saved to feature_order.pkl")

print("\n🎉 All files exported successfully!")
print("\nModel performance:")
from sklearn.metrics import mean_absolute_error, r2_score
y_pred = catboost_model.predict(X_test)
print(f"MAE: {mean_absolute_error(y_test, y_pred):.2f}")
print(f"R²: {r2_score(y_test, y_pred):.4f}")

