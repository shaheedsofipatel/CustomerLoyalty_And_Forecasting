"""
Machine Learning models for Customer Loyalty Dashboard.
- Spending Prediction (Linear Regression)
- Loyalty Score (RFM Model)
- Product Interest Prediction (Logistic Regression)
"""
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.preprocessing import StandardScaler


class SpendingPredictor:
    """Predict future customer spending using Linear Regression."""

    def __init__(self):
        self.model = LinearRegression()
        self.scaler = StandardScaler()

    def train(self, df: pd.DataFrame):
        X = df[["Purchase_Frequency", "Avg_Spending", "Last_Purchase_Days"]].values
        # Target: simulate a "next month" spending based on features
        y = (
            df["Avg_Spending"].values * 1.05
            + df["Purchase_Frequency"].values * 2
            - df["Last_Purchase_Days"].values * 0.3
            + np.random.normal(0, 5, len(df))
        )
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled, y)
        return self

    def predict(self, df: pd.DataFrame):
        X = df[["Purchase_Frequency", "Avg_Spending", "Last_Purchase_Days"]].values
        X_scaled = self.scaler.transform(X)
        predicted_next_month = self.model.predict(X_scaled)
        predicted_next_month = np.maximum(predicted_next_month, 0)

        results = []
        for idx, row in df.iterrows():
            curr = row["Avg_Spending"]
            pred_1m = round(float(predicted_next_month[idx]), 2)
            pred_3m = round(pred_1m * 2.8, 2)  # rough 3-month approximation
            results.append({
                "customer_id": row["Customer_ID"],
                "current_monthly_spend": curr,
                "predicted_next_month": pred_1m,
                "predicted_next_3_months": pred_3m,
            })
        return results


class LoyaltyScorer:
    """Calculate loyalty scores using the RFM model."""

    RECENCY_WEIGHT = 0.3
    FREQUENCY_WEIGHT = 0.4
    MONETARY_WEIGHT = 0.3

    def score(self, df: pd.DataFrame):
        # Normalize each component to 0-100 scale
        max_days = df["Last_Purchase_Days"].max() or 1
        max_freq = df["Purchase_Frequency"].max() or 1
        max_spend = df["Total_Purchases"].max() * df["Avg_Spending"].max() or 1

        results = []
        for _, row in df.iterrows():
            recency_score = 100 * (1 - row["Last_Purchase_Days"] / max_days)
            frequency_score = 100 * (row["Purchase_Frequency"] / max_freq)
            monetary_value = row["Total_Purchases"] * row["Avg_Spending"]
            monetary_score = 100 * (monetary_value / max_spend)

            loyalty = (
                self.RECENCY_WEIGHT * recency_score
                + self.FREQUENCY_WEIGHT * frequency_score
                + self.MONETARY_WEIGHT * monetary_score
            )
            loyalty = round(float(loyalty), 1)

            # Segmentation
            if loyalty >= 70:
                segment = "Highly Loyal"
            elif loyalty >= 50:
                segment = "Potential Loyal"
            elif loyalty >= 30:
                segment = "At Risk"
            else:
                segment = "New Customer"

            results.append({
                "customer_id": row["Customer_ID"],
                "recency_score": round(recency_score, 1),
                "frequency_score": round(frequency_score, 1),
                "monetary_score": round(monetary_score, 1),
                "loyalty_score": loyalty,
                "segment": segment,
            })
        return results


class ProductInterestPredictor:
    """Predict probability of purchasing a new product using Logistic Regression."""

    def __init__(self):
        self.model = LogisticRegression(max_iter=1000, random_state=42)
        self.scaler = StandardScaler()

    def train(self, df: pd.DataFrame):
        X = df[["Purchase_Frequency", "Avg_Spending", "Total_Purchases", "Last_Purchase_Days"]].values
        y = (df["New_Product_Purchased"] == "Yes").astype(int).values
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled, y)
        return self

    def predict(self, df: pd.DataFrame):
        X = df[["Purchase_Frequency", "Avg_Spending", "Total_Purchases", "Last_Purchase_Days"]].values
        X_scaled = self.scaler.transform(X)
        probs = self.model.predict_proba(X_scaled)[:, 1]

        results = []
        for idx, row in df.iterrows():
            results.append({
                "customer_id": row["Customer_ID"],
                "interest_probability": round(float(probs[idx]) * 100, 1),
                "favorite_category": row["Favorite_Category"],
            })
        return results


def generate_insights(df, spending_preds, loyalty_scores, interest_preds):
    """Generate human-readable insight strings."""
    insights = []

    # Top spenders
    sorted_spend = sorted(spending_preds, key=lambda x: x["predicted_next_month"], reverse=True)
    for c in sorted_spend[:3]:
        insights.append(
            f"Customer {c['customer_id']} has high spending potential — predicted "
            f"${c['predicted_next_month']:.0f} next month."
        )

    # High interest customers
    sorted_interest = sorted(interest_preds, key=lambda x: x["interest_probability"], reverse=True)
    for c in sorted_interest[:3]:
        insights.append(
            f"Customer {c['customer_id']} has a {c['interest_probability']:.0f}% chance "
            f"of purchasing a new {c['favorite_category']} product."
        )

    # At-risk customers
    at_risk = [c for c in loyalty_scores if c["segment"] == "At Risk"]
    for c in at_risk[:3]:
        insights.append(
            f"Customer {c['customer_id']} shows declining loyalty (score: {c['loyalty_score']}) "
            f"and may require retention offers."
        )

    # Highly loyal
    highly_loyal = [c for c in loyalty_scores if c["segment"] == "Highly Loyal"]
    insights.append(
        f"{len(highly_loyal)} customers are classified as Highly Loyal — "
        f"consider exclusive rewards programs."
    )

    return insights
