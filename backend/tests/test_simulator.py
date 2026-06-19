import unittest

def simulate_math(
    t_base: float, e_base: float, f_base: float, w_base: float,
    reduce_car_km: float = 0.0,
    switch_car_to_bus_km: float = 0.0,
    switch_car_to_bike_km: float = 0.0,
    reduce_electricity_pct: float = 0.0,
    vegetarian_meals_added: int = 0,
    vegan_meals_added: int = 0,
    solar_panels_kwh: float = 0.0
) -> dict:
    """
    Duplicate of simulation math logic from coach.py for verification.
    """
    # 1. Travel savings
    t_savings = (reduce_car_km * 0.20) + (switch_car_to_bus_km * 0.15) + (switch_car_to_bike_km * 0.20)
    
    # 2. Energy savings
    e_savings = (e_base * (reduce_electricity_pct / 100.0)) + (solar_panels_kwh * 0.5)
    
    # 3. Diet savings
    f_savings = (vegetarian_meals_added * 2.0 * 4.33) + (vegan_meals_added * 2.5 * 4.33)
    
    # Projected
    t_proj = max(0.0, t_base - t_savings)
    e_proj = max(0.0, e_base - e_savings)
    f_proj = max(0.0, f_base - f_savings)
    w_proj = w_base
    
    curr_total = t_base + e_base + f_base + w_base
    proj_total = t_proj + e_proj + f_proj + w_proj
    savings = max(0.0, curr_total - proj_total)
    pct = (savings / curr_total * 100.0) if curr_total > 0 else 0.0
    
    return {
        "current": curr_total,
        "projected": proj_total,
        "savings": savings,
        "percentage": pct
    }

class TestSimulatorMath(unittest.TestCase):
    def test_simulation_default_baseline(self):
        # Baseline emissions: 240, 160, 80, 20
        res = simulate_math(240.0, 160.0, 80.0, 20.0)
        self.assertEqual(res["current"], 500.0)
        self.assertEqual(res["projected"], 500.0)
        self.assertEqual(res["savings"], 0.0)
        self.assertEqual(res["percentage"], 0.0)

    def test_transportation_savings(self):
        # Base: 240
        # Reduce car km by 100: savings = 100 * 0.20 = 20
        # Switch 100km to bus: savings = 100 * 0.15 = 15
        # Switch 100km to bike: savings = 100 * 0.20 = 20
        # Total travel savings = 55
        res = simulate_math(
            240.0, 160.0, 80.0, 20.0,
            reduce_car_km=100.0,
            switch_car_to_bus_km=100.0,
            switch_car_to_bike_km=100.0
        )
        self.assertEqual(res["current"], 500.0)
        self.assertEqual(res["projected"], 445.0)
        self.assertEqual(res["savings"], 55.0)
        self.assertEqual(res["percentage"], 11.0)

    def test_energy_savings(self):
        # Base: 160
        # Reduce electricity by 20%: savings = 160 * 0.20 = 32
        # Solar panels 100 kWh: savings = 100 * 0.5 = 50
        # Total energy savings = 82
        res = simulate_math(
            240.0, 160.0, 80.0, 20.0,
            reduce_electricity_pct=20.0,
            solar_panels_kwh=100.0
        )
        self.assertEqual(res["current"], 500.0)
        self.assertEqual(res["projected"], 418.0)
        self.assertEqual(res["savings"], 82.0)
        self.assertAlmostEqual(res["percentage"], 16.4)

    def test_food_savings(self):
        # Base: 80
        # Add 2 vegetarian meals/week: savings = 2 * 2.0 * 4.33 = 17.32
        # Add 1 vegan meal/week: savings = 1 * 2.5 * 4.33 = 10.825
        # Total diet savings = 28.145
        res = simulate_math(
            240.0, 160.0, 80.0, 20.0,
            vegetarian_meals_added=2,
            vegan_meals_added=1
        )
        self.assertEqual(res["current"], 500.0)
        self.assertAlmostEqual(res["projected"], 500.0 - 28.145, places=3)
        self.assertAlmostEqual(res["savings"], 28.145, places=3)

    def test_excessive_savings(self):
        # Ensure emissions do not drop below zero even if savings exceed base
        res = simulate_math(
            50.0, 50.0, 50.0, 10.0,
            reduce_car_km=1000.0, # travel savings 200 > base 50
            solar_panels_kwh=1000.0 # energy savings 500 > base 50
        )
        self.assertEqual(res["projected"], 60.0) # travel=0, energy=0, food=50, waste=10
        self.assertEqual(res["savings"], 100.0)

if __name__ == "__main__":
    unittest.main()
