import unittest
from app.utils.carbon_calculator import calculate_emissions, EMISSION_FACTORS

class TestCarbonCalculation(unittest.TestCase):
    def test_transportation_calculation(self):
        # Car calculation: 100km * 0.20 = 20.0 kg CO2e
        car_emissions = calculate_emissions("transportation", "car", 100.0)
        self.assertAlmostEqual(car_emissions, 20.0)

        # Bus calculation: 50km * 0.05 = 2.5 kg CO2e
        bus_emissions = calculate_emissions("transportation", "bus", 50.0)
        self.assertAlmostEqual(bus_emissions, 2.5)

        # Bicycle: 20km * 0.0 = 0.0 kg CO2e
        bike_emissions = calculate_emissions("transportation", "bicycle", 20.0)
        self.assertAlmostEqual(bike_emissions, 0.0)

    def test_energy_calculation(self):
        # Electricity calculation: 200 kWh * 0.5 = 100.0 kg CO2e
        elec_emissions = calculate_emissions("energy", "electricity", 200.0)
        self.assertAlmostEqual(elec_emissions, 100.0)

        # Solar offset (should be negative in raw calculation): 100 kWh * -0.5 = -50.0 kg CO2e
        solar_emissions = calculate_emissions("energy", "solar", 100.0)
        self.assertAlmostEqual(solar_emissions, -50.0)

    def test_food_calculation(self):
        # Non-vegetarian calculation: 10 meals * 3.0 = 30.0 kg CO2e
        non_veg = calculate_emissions("food", "non-vegetarian", 10)
        self.assertAlmostEqual(non_veg, 30.0)

        # Vegan: 5 meals * 0.5 = 2.5 kg CO2e
        vegan = calculate_emissions("food", "vegan", 5)
        self.assertAlmostEqual(vegan, 2.5)

    def test_waste_calculation(self):
        # Recycled: 10 kg * 0.1 = 1.0 kg CO2e
        recycled = calculate_emissions("waste", "recycled", 10)
        self.assertAlmostEqual(recycled, 1.0)

        # Non-recycled: 10 kg * 1.5 = 15.0 kg CO2e
        non_recycled = calculate_emissions("waste", "non-recycled", 10)
        self.assertAlmostEqual(non_recycled, 15.0)

    def test_invalid_category(self):
        invalid = calculate_emissions("invalid_category", "type", 100)
        self.assertEqual(invalid, 0.0)

if __name__ == "__main__":
    unittest.main()
