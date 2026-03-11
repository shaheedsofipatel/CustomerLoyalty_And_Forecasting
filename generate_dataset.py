"""
Generate a synthetic customer dataset for the Customer Loyalty Dashboard.
"""
import os
import random
import csv

random.seed(42)

CATEGORIES = ["Electronics", "Clothing", "Groceries", "Sports", "Books", "Beauty", "Home & Kitchen"]

NUM_CUSTOMERS = 100


def generate_dataset(output_path="data/customers.csv"):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    rows = []
    for i in range(1, NUM_CUSTOMERS + 1):
        cid = f"C{i:03d}"
        age = random.randint(18, 65)
        purchase_freq = random.randint(1, 30)  # purchases per month
        avg_spending = round(random.uniform(10, 300), 2)
        total_purchases = random.randint(purchase_freq, purchase_freq * 12)
        last_purchase_days = random.randint(1, 180)  # days since last purchase
        fav_category = random.choice(CATEGORIES)

        # New product purchased is correlated with high frequency & spending
        prob = 0.3 + 0.02 * purchase_freq + 0.001 * avg_spending - 0.002 * last_purchase_days
        prob = max(0.05, min(0.95, prob))
        new_product = "Yes" if random.random() < prob else "No"

        rows.append([
            cid, age, purchase_freq, avg_spending, total_purchases,
            last_purchase_days, fav_category, new_product
        ])

    header = [
        "Customer_ID", "Age", "Purchase_Frequency", "Avg_Spending",
        "Total_Purchases", "Last_Purchase_Days", "Favorite_Category",
        "New_Product_Purchased"
    ]

    with open(output_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(rows)

    print(f"Dataset generated: {output_path} ({len(rows)} rows)")
    return output_path


if __name__ == "__main__":
    generate_dataset()
