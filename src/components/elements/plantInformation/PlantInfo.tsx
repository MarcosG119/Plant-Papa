import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface PlantInfoProps {
  plantId: number;
}

const PlantInfo: React.FC<PlantInfoProps> = ({ plantId }) => {
  const [plantInfo, setPlantInfo] = useState<string | null>(null);

  useEffect(() => {
    const getPlantInformation = async () => {
        try {
            const response = await axios.get(`http://localhost:3000/api/plants/${plantId}`);
            const data = response.data;

            // Extracting relevant information
            const minTemperature = data.data.main_species.growth.minimum_temperature.deg_f;
            const maxTemperature = data.data.main_species.growth.minimum_temperature.deg_f;
            const minPrecipitation = data.data.main_species.growth.minimum_precipitation.mm;
            const maxPrecipitation = data.data.main_species.growth.maximum_precipitation.mm;
            const light = data.data.main_species.growth.light;
            const growthMonths = data.data.main_species.growth.growth_months;
            const bloomMonths = data.data.main_species.growth.bloom_months;
            const fruitMonths = data.data.main_species.growth.fruit_months;
            const atmosphereHumidity = data.data.main_species.growth.atmospheric_humidity;

            // Create the plant information string
            const plantInformation: string = `This plant thrives with a temperature of ${minTemperature} to ${maxTemperature} degrees Fahrenheit. It needs a precipitation level of ${minPrecipitation} to ${maxPrecipitation} cm. It prefers ${light} level light. It grows in ${growthMonths}. It blooms in ${bloomMonths} and delivers fruit in ${fruitMonths}. Its natural humidity level is ${atmosphereHumidity}.`;

            setPlantInfo(plantInformation);
        } catch (error) {
            console.error('Error fetching plant information:', error);
            // Handle errors as needed
        }
    };

    getPlantInformation();
  }, [plantId]);

  return (
    <>
      {plantInfo ? (
          <p>{plantInfo}</p>
      ) : (
        <p>Loading...</p>
      )}
    </>
  );
};


export default PlantInfo;