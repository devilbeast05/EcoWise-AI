EMISSION_FACTORS = {
    "transportation": {
        "car": 0.20,      # kg CO2e per km
        "bus": 0.05,      # kg CO2e per km
        "train": 0.04,    # kg CO2e per km
        "metro": 0.03,    # kg CO2e per km
        "flight": 0.15,   # kg CO2e per km
        "bicycle": 0.0,   # kg CO2e per km
    },
    "energy": {
        "electricity": 0.5,  # kg CO2e per kWh
        "lpg": 1.6,          # kg CO2e per kg
        "solar": -0.5,       # kg CO2e per kWh (solar contribution offset)
    },
    "food": {
        "vegan": 0.5,           # kg CO2e per meal
        "vegetarian": 1.0,      # kg CO2e per meal
        "non-vegetarian": 3.0,  # kg CO2e per meal
    },
    "waste": {
        "recycled": 0.1,      # kg CO2e per kg
        "non-recycled": 1.5,  # kg CO2e per kg
    }
}

def calculate_emissions(category: str, activity_type: str, amount: float) -> float:
    """
    Calculate carbon emissions in kg CO2e based on category, activity type, and amount.
    """
    category_factors = EMISSION_FACTORS.get(category.lower())
    if not category_factors:
        return 0.0
    
    factor = category_factors.get(activity_type.lower(), 0.0)
    
    # Calculate emissions
    emissions = amount * factor
    
    # For solar contribution, it offsets/reduces emissions, so it can be negative
    # Otherwise, ensure emissions are not negative
    if category.lower() == "energy" and activity_type.lower() == "solar":
        return emissions # Negative offset
    
    return max(0.0, emissions)
