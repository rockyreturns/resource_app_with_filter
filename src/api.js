import axios from 'axios';

const FILTERS_URL = 'filters.json';

export const readFilters = async () => {
  try {
    const response = await axios.get(FILTERS_URL);
    return response.data;
  } catch (error) {
    console.error('Error reading filters:', error);
    return [];
  }
};

export const saveFilters = async (filters) => {
  try {
    await axios.post(FILTERS_URL, filters, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error saving filters:', error);
  }
};
