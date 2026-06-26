"""
Macro regime backtest: asset return analysis across historical shock scenarios.
Demonstrates numpy + pandas financial analysis per JD requirement.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

SCENARIOS = [
    {
        "name": "2022 Fed Hiking Cycle",
        "period": "2022-01-01 to 2022-12-31",
        "macro": "Aggressive Fed tightening, 425bp in 7 hikes",
        "returns": {
            "S&P 500": -0.194,
            "NASDAQ": -0.331,
            "IG Bonds": -0.151,
            "US Treasuries": -0.134,
            "Gold": -0.003,
            "Energy (XLE)": 0.590,
            "REITs": -0.252,
            "USD (DXY)": 0.150,
            "Bitcoin": -0.650,
        },
    },
    {
        "name": "COVID-19 Crash & Recovery (2020)",
        "period": "2020-01-01 to 2020-12-31",
        "macro": "Pandemic shock, max 34% drawdown, then V-shaped recovery",
        "returns": {
            "S&P 500": 0.163,
            "NASDAQ": 0.436,
            "IG Bonds": 0.092,
            "US Treasuries": 0.080,
            "Gold": 0.250,
            "Energy (XLE)": -0.372,
            "REITs": -0.050,
            "USD (DXY)": -0.068,
            "Bitcoin": 3.040,
        },
    },
    {
        "name": "2023 Debt Ceiling Crisis",
        "period": "2023-01-01 to 2023-06-30",
        "macro": "X-date risk May-June; resolved with Fiscal Responsibility Act",
        "returns": {
            "S&P 500": 0.169,
            "NASDAQ": 0.390,
            "IG Bonds": 0.025,
            "US Treasuries": 0.010,
            "Gold": 0.065,
            "Energy (XLE)": -0.092,
            "REITs": -0.012,
            "USD (DXY)": 0.005,
            "Bitcoin": 0.860,
        },
    },
    {
        "name": "2015-18 Fed Normalization",
        "period": "2015-12-01 to 2018-12-31",
        "macro": "Gradual rate hikes from 0.25% to 2.5%, 9 total increases",
        "returns": {
            "S&P 500": 0.362,
            "NASDAQ": 0.712,
            "IG Bonds": 0.060,
            "US Treasuries": 0.020,
            "Gold": 0.073,
            "Energy (XLE)": -0.052,
            "REITs": 0.121,
            "USD (DXY)": 0.038,
            "Bitcoin": 4400.00,
        },
    },
]


def build_returns_matrix() -> pd.DataFrame:
    data = {s["name"]: s["returns"] for s in SCENARIOS}
    df = pd.DataFrame(data)
    df.index.name = "Asset Class"
    return df


def analyze_regime_performance() -> pd.DataFrame:
    matrix = build_returns_matrix()

    stats = pd.DataFrame(
        {
            "Mean Return": matrix.mean(axis=1),
            "Std Dev": matrix.std(axis=1),
            "Best Scenario": matrix.idxmax(axis=1),
            "Worst Scenario": matrix.idxmin(axis=1),
            "Win Rate (>0)": (matrix > 0).sum(axis=1) / len(SCENARIOS),
        }
    )
    stats["Sharpe (approx)"] = stats["Mean Return"] / stats["Std Dev"].replace(0, np.nan)
    return stats.sort_values("Mean Return", ascending=False)


def shock_impact_analysis(portfolio_weights: dict[str, float]) -> dict:
    matrix = build_returns_matrix()
    results = {}

    for scenario_name in matrix.columns:
        scenario_returns = matrix[scenario_name]
        portfolio_return = sum(
            weight * scenario_returns.get(asset, 0)
            for asset, weight in portfolio_weights.items()
        )
        results[scenario_name] = {
            "portfolio_return": portfolio_return,
            "worst_asset": scenario_returns.idxmin(),
            "worst_return": scenario_returns.min(),
            "best_asset": scenario_returns.idxmax(),
            "best_return": scenario_returns.max(),
        }

    return results


if __name__ == "__main__":
    print("=" * 60)
    print("ASSET RETURNS ACROSS MACRO SCENARIOS")
    print("=" * 60)
    matrix = build_returns_matrix()
    print(matrix.to_string(float_format="{:.1%}".format))

    print("\n" + "=" * 60)
    print("REGIME PERFORMANCE STATISTICS")
    print("=" * 60)
    stats = analyze_regime_performance()
    print(stats.to_string(float_format="{:.2f}".format))

    sample_portfolio = {
        "S&P 500": 0.40,
        "NASDAQ": 0.20,
        "IG Bonds": 0.20,
        "US Treasuries": 0.10,
        "Gold": 0.10,
    }
    print("\n" + "=" * 60)
    print("SAMPLE PORTFOLIO SHOCK ANALYSIS (60/40 + Gold)")
    print("=" * 60)
    shock = shock_impact_analysis(sample_portfolio)
    for name, res in shock.items():
        print(f"\n{name}:")
        print(f"  Portfolio return: {res['portfolio_return']:.1%}")
        print(f"  Worst: {res['worst_asset']} ({res['worst_return']:.1%})")
        print(f"  Best:  {res['best_asset']} ({res['best_return']:.1%})")
