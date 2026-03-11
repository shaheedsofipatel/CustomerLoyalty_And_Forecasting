"""
Flask backend for Customer Loyalty & Spending Forecast Dashboard.
"""
import os
import pandas as pd
from flask import Flask, jsonify, send_from_directory

from models import SpendingPredictor, LoyaltyScorer, ProductInterestPredictor, generate_insights
from generate_dataset import generate_dataset

app = Flask(__name__, static_folder="static")

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "customers.csv")

# ---------------------------------------------------------------------------
# Startup: ensure dataset exists, load data, train models
# ---------------------------------------------------------------------------
if not os.path.exists(DATA_PATH):
    generate_dataset(DATA_PATH)

df = pd.read_csv(DATA_PATH)

spending_model = SpendingPredictor().train(df)
loyalty_scorer = LoyaltyScorer()
interest_model = ProductInterestPredictor().train(df)

# Pre-compute predictions
spending_preds = spending_model.predict(df)
loyalty_scores = loyalty_scorer.score(df)
interest_preds = interest_model.predict(df)
insights = generate_insights(df, spending_preds, loyalty_scores, interest_preds)

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return send_from_directory("static", "index.html")


@app.route("/api/dataset")
def get_dataset():
    return jsonify(df.to_dict(orient="records"))


@app.route("/api/predict-spending")
def predict_spending():
    return jsonify(spending_preds)


@app.route("/api/loyalty-score")
def get_loyalty():
    return jsonify(loyalty_scores)


@app.route("/api/predict-interest")
def predict_interest():
    return jsonify(interest_preds)


@app.route("/api/insights")
def get_insights():
    return jsonify(insights)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
